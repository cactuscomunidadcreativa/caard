/**
 * CAARD - Sistema de Overrides Administrativos
 * ==============================================
 * El SUPER_ADMIN tiene capacidad de modificar cualquier aspecto del sistema
 * cuando sea estrictamente necesario.
 *
 * PRINCIPIO: El sistema es estricto por defecto, pero el administrador
 * máximo puede intervenir en casos excepcionales, siempre dejando
 * registro completo de la intervención.
 *
 * TODA INTERVENCIÓN QUEDA AUDITADA Y NO PUEDE OCULTARSE.
 */

import { AUDIT_ACTIONS, CASE_STATES, type CaseState } from "./constants";
import type { AuditEntry } from "./types";

// =============================================================================
// TIPOS DE OVERRIDE
// =============================================================================

/**
 * Tipos de acciones que el SUPER_ADMIN puede ejecutar
 */
export const ADMIN_OVERRIDE_ACTIONS = {
  // Estados y flujo
  FORCE_STATE_CHANGE: "FORCE_STATE_CHANGE",
  BYPASS_PAYMENT_BLOCK: "BYPASS_PAYMENT_BLOCK",
  REACTIVATE_ARCHIVED: "REACTIVATE_ARCHIVED",
  EXTEND_DEADLINE: "EXTEND_DEADLINE",
  CANCEL_DEADLINE: "CANCEL_DEADLINE",

  // Pagos
  MANUAL_PAYMENT_CONFIRMATION: "MANUAL_PAYMENT_CONFIRMATION",
  CANCEL_PAYMENT_ORDER: "CANCEL_PAYMENT_ORDER",
  FORCE_REFUND: "FORCE_REFUND",
  ADJUST_FEE: "ADJUST_FEE",

  // Documentos
  VOID_DOCUMENT: "VOID_DOCUMENT",
  RESTORE_DOCUMENT: "RESTORE_DOCUMENT",

  // Árbitros
  FORCE_ARBITRATOR_DESIGNATION: "FORCE_ARBITRATOR_DESIGNATION",
  REMOVE_ARBITRATOR: "REMOVE_ARBITRATOR",
  LIFT_ARBITRATOR_SANCTION: "LIFT_ARBITRATOR_SANCTION",

  // Emergencia
  EXTEND_EMERGENCY_DEADLINE: "EXTEND_EMERGENCY_DEADLINE",
  REACTIVATE_EXPIRED_EMERGENCY: "REACTIVATE_EXPIRED_EMERGENCY",

  // Sistema
  MODIFY_SYSTEM_RULE: "MODIFY_SYSTEM_RULE",
  DISABLE_SYSTEM_RULE: "DISABLE_SYSTEM_RULE",
  BULK_UPDATE: "BULK_UPDATE",

  // Migración
  IMPORT_CASE: "IMPORT_CASE",
  IMPORT_PAYMENT: "IMPORT_PAYMENT",
  IMPORT_DOCUMENT: "IMPORT_DOCUMENT",
  BULK_IMPORT: "BULK_IMPORT",
} as const;

export type AdminOverrideAction = typeof ADMIN_OVERRIDE_ACTIONS[keyof typeof ADMIN_OVERRIDE_ACTIONS];

/**
 * Solicitud de override administrativo
 */
export interface AdminOverrideRequest {
  action: AdminOverrideAction;
  targetEntityType: "CASE" | "PAYMENT" | "DOCUMENT" | "DEADLINE" | "ARBITRATOR" | "EMERGENCY" | "RULE" | "SYSTEM";
  targetEntityId?: string;

  /** Motivo de la intervención (OBLIGATORIO) */
  reason: string;

  /** Datos específicos de la acción */
  params: Record<string, unknown>;

  /** Usuario que solicita (debe ser SUPER_ADMIN) */
  requestedBy: string;

  /** Fecha de solicitud */
  requestedAt: Date;
}

/**
 * Resultado de override administrativo
 */
export interface AdminOverrideResult {
  success: boolean;
  action: AdminOverrideAction;
  targetEntityType: string;
  targetEntityId?: string;

  /** Valores antes del cambio */
  previousValues?: Record<string, unknown>;

  /** Valores después del cambio */
  newValues?: Record<string, unknown>;

  /** Errores si hubo */
  errors: string[];

  /** Advertencias */
  warnings: string[];

  /** ID del registro de auditoría */
  auditLogId: string;

  /** Timestamp */
  executedAt: Date;
}

// =============================================================================
// VALIDACIONES DE OVERRIDE
// =============================================================================

/**
 * Valida que el usuario tenga permisos para ejecutar override
 */
export function canExecuteOverride(
  userRole: string,
  action: AdminOverrideAction
): { allowed: boolean; reason?: string } {
  // Solo SUPER_ADMIN puede ejecutar overrides
  if (userRole !== "SUPER_ADMIN") {
    return {
      allowed: false,
      reason: "Solo el Super Administrador puede ejecutar esta acción",
    };
  }

  return { allowed: true };
}

/**
 * Valida los parámetros de un override específico
 */
export function validateOverrideParams(
  action: AdminOverrideAction,
  params: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (action) {
    case ADMIN_OVERRIDE_ACTIONS.FORCE_STATE_CHANGE:
      if (!params.newState) {
        errors.push("Debe especificar el nuevo estado");
      }
      if (!Object.values(CASE_STATES).includes(params.newState as CaseState)) {
        errors.push(`Estado "${params.newState}" no es válido`);
      }
      break;

    case ADMIN_OVERRIDE_ACTIONS.EXTEND_DEADLINE:
      if (!params.additionalDays || typeof params.additionalDays !== "number") {
        errors.push("Debe especificar los días adicionales");
      }
      if (params.additionalDays && (params.additionalDays as number) > 30) {
        errors.push("No se puede extender más de 30 días");
      }
      break;

    case ADMIN_OVERRIDE_ACTIONS.MANUAL_PAYMENT_CONFIRMATION:
      if (!params.paymentReference) {
        errors.push("Debe proporcionar referencia del pago");
      }
      if (!params.confirmationMethod) {
        errors.push("Debe indicar el método de confirmación");
      }
      break;

    case ADMIN_OVERRIDE_ACTIONS.ADJUST_FEE:
      if (params.newAmount === undefined || typeof params.newAmount !== "number") {
        errors.push("Debe especificar el nuevo monto");
      }
      if (!params.adjustmentReason) {
        errors.push("Debe especificar el motivo del ajuste");
      }
      break;

    case ADMIN_OVERRIDE_ACTIONS.IMPORT_CASE:
      if (!params.externalCode) {
        errors.push("Debe proporcionar el código externo del expediente");
      }
      if (!params.importData) {
        errors.push("Debe proporcionar los datos a importar");
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// EJECUCIÓN DE OVERRIDES
// =============================================================================

/**
 * Prepara un override para ejecución
 * Retorna el comando a ejecutar y los datos de auditoría
 */
export function prepareOverride(
  request: AdminOverrideRequest
): {
  canExecute: boolean;
  errors: string[];
  warnings: string[];
  auditEntry: Omit<AuditEntry, "id" | "createdAt">;
  confirmation: string;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar que tenga motivo
  if (!request.reason || request.reason.trim().length < 20) {
    errors.push("El motivo debe tener al menos 20 caracteres explicando la razón de la intervención");
  }

  // Validar parámetros específicos
  const paramValidation = validateOverrideParams(request.action, request.params);
  errors.push(...paramValidation.errors);

  // Generar advertencias según el tipo de acción
  switch (request.action) {
    case ADMIN_OVERRIDE_ACTIONS.FORCE_STATE_CHANGE:
      warnings.push("Esta acción saltará todas las validaciones de transición de estado");
      warnings.push("El cambio quedará registrado como intervención manual");
      break;

    case ADMIN_OVERRIDE_ACTIONS.BYPASS_PAYMENT_BLOCK:
      warnings.push("Esta acción permitirá avanzar sin el pago requerido");
      warnings.push("Esto podría generar inconsistencias contables");
      break;

    case ADMIN_OVERRIDE_ACTIONS.REACTIVATE_ARCHIVED:
      warnings.push("Reactivar un expediente archivado es una acción excepcional");
      warnings.push("Deberá revisar que todos los plazos se recalculen correctamente");
      break;

    case ADMIN_OVERRIDE_ACTIONS.BULK_IMPORT:
      warnings.push("La importación masiva debe validarse previamente");
      warnings.push("Se recomienda hacer backup antes de proceder");
      break;
  }

  // Preparar entrada de auditoría
  const auditEntry: Omit<AuditEntry, "id" | "createdAt"> = {
    action: AUDIT_ACTIONS.SYSTEM_RULE_TRIGGER,
    entity: `ADMIN_OVERRIDE_${request.action}`,
    entityId: request.targetEntityId,
    userId: request.requestedBy,
    metadata: {
      overrideAction: request.action,
      targetEntityType: request.targetEntityType,
      params: request.params,
      reason: request.reason,
      timestamp: request.requestedAt.toISOString(),
    },
  };

  // Generar texto de confirmación
  const confirmation = generateOverrideConfirmation(request);

  return {
    canExecute: errors.length === 0,
    errors,
    warnings,
    auditEntry,
    confirmation,
  };
}

/**
 * Genera el texto de confirmación para un override
 */
function generateOverrideConfirmation(request: AdminOverrideRequest): string {
  const lines = [
    "═".repeat(60),
    "CONFIRMACIÓN DE INTERVENCIÓN ADMINISTRATIVA",
    "═".repeat(60),
    "",
    `Acción: ${request.action}`,
    `Entidad: ${request.targetEntityType}`,
    `ID: ${request.targetEntityId || "N/A"}`,
    "",
    "Parámetros:",
    ...Object.entries(request.params).map(([k, v]) => `  - ${k}: ${JSON.stringify(v)}`),
    "",
    "Motivo:",
    `  ${request.reason}`,
    "",
    "─".repeat(60),
    "IMPORTANTE:",
    "- Esta acción quedará registrada permanentemente",
    "- No podrá ocultarse ni eliminarse del historial",
    "- Será visible en auditorías y reportes",
    "═".repeat(60),
  ];

  return lines.join("\n");
}

// =============================================================================
// REGISTRO DE INTERVENCIONES
// =============================================================================

/**
 * Estructura de reporte de intervención administrativa
 */
export interface AdminInterventionReport {
  id: string;
  action: AdminOverrideAction;
  executedBy: string;
  executedAt: Date;

  targetEntityType: string;
  targetEntityId?: string;

  reason: string;

  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;

  wasSuccessful: boolean;
  errorMessage?: string;
}

/**
 * Genera un resumen de intervenciones para auditoría
 */
export function generateInterventionsReport(
  interventions: AdminInterventionReport[]
): string {
  const lines = [
    "REPORTE DE INTERVENCIONES ADMINISTRATIVAS",
    "═".repeat(60),
    `Total de intervenciones: ${interventions.length}`,
    "",
  ];

  // Agrupar por tipo
  const byAction = new Map<string, AdminInterventionReport[]>();
  for (const intervention of interventions) {
    const existing = byAction.get(intervention.action) || [];
    existing.push(intervention);
    byAction.set(intervention.action, existing);
  }

  lines.push("Por tipo de acción:");
  for (const [action, items] of byAction.entries()) {
    lines.push(`  ${action}: ${items.length}`);
  }

  lines.push("");
  lines.push("Detalle:");
  lines.push("─".repeat(60));

  for (const intervention of interventions) {
    lines.push(`[${intervention.executedAt.toISOString()}] ${intervention.action}`);
    lines.push(`  Ejecutado por: ${intervention.executedBy}`);
    lines.push(`  Entidad: ${intervention.targetEntityType} (${intervention.targetEntityId || "N/A"})`);
    lines.push(`  Motivo: ${intervention.reason.substring(0, 100)}...`);
    lines.push(`  Resultado: ${intervention.wasSuccessful ? "EXITOSO" : "FALLIDO"}`);
    lines.push("");
  }

  return lines.join("\n");
}

// =============================================================================
// UTILIDADES DE MIGRACIÓN
// =============================================================================

/**
 * Estructura para importación de expediente
 */
export interface CaseImportData {
  externalCode: string;
  title: string;
  status: CaseState;

  claimant: {
    name: string;
    email: string;
    document?: string;
  };

  respondent: {
    name: string;
    email: string;
    document?: string;
  };

  arbitrationType: string;
  scope: "NACIONAL" | "INTERNACIONAL";

  submittedAt?: Date;
  admittedAt?: Date;

  // Historial de pagos
  payments?: Array<{
    concept: string;
    amount: number;
    currency: string;
    status: string;
    paidAt?: Date;
  }>;

  // Documentos (URLs o referencias)
  documents?: Array<{
    name: string;
    type: string;
    url?: string;
    uploadedAt?: Date;
  }>;

  // Notas de migración
  migrationNotes?: string;
}

/**
 * Valida datos de importación de expediente
 */
export function validateCaseImport(
  data: CaseImportData
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones obligatorias
  if (!data.externalCode) errors.push("Falta código externo");
  if (!data.title) errors.push("Falta título");
  if (!data.claimant?.name) errors.push("Falta nombre del demandante");
  if (!data.respondent?.name) errors.push("Falta nombre del demandado");
  if (!data.arbitrationType) errors.push("Falta tipo de arbitraje");

  // Validar estado
  if (data.status && !Object.values(CASE_STATES).includes(data.status)) {
    errors.push(`Estado "${data.status}" no es válido`);
  }

  // Advertencias
  if (!data.claimant?.email) {
    warnings.push("Demandante sin email - no recibirá notificaciones");
  }
  if (!data.respondent?.email) {
    warnings.push("Demandado sin email - no recibirá notificaciones");
  }
  if (!data.payments || data.payments.length === 0) {
    warnings.push("Sin historial de pagos");
  }
  if (!data.documents || data.documents.length === 0) {
    warnings.push("Sin documentos asociados");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Estructura para importación masiva
 */
export interface BulkImportConfig {
  source: "CSV" | "JSON" | "API" | "DATABASE";
  dryRun: boolean;

  /** Si hay conflicto de código, qué hacer */
  onConflict: "SKIP" | "UPDATE" | "ERROR";

  /** Mapeo de campos si es necesario */
  fieldMapping?: Record<string, string>;

  /** Filtros de importación */
  filters?: {
    fromDate?: Date;
    toDate?: Date;
    statuses?: CaseState[];
    types?: string[];
  };
}

/**
 * Resultado de importación masiva
 */
export interface BulkImportResult {
  totalRecords: number;
  imported: number;
  skipped: number;
  errors: number;

  details: Array<{
    externalCode: string;
    status: "IMPORTED" | "SKIPPED" | "ERROR";
    newId?: string;
    errorMessage?: string;
  }>;

  executionTime: number;
  timestamp: Date;
}

/**
 * Genera reporte de importación
 */
export function generateImportReport(result: BulkImportResult): string {
  const lines = [
    "REPORTE DE IMPORTACIÓN",
    "═".repeat(60),
    `Fecha: ${result.timestamp.toISOString()}`,
    `Tiempo de ejecución: ${result.executionTime}ms`,
    "",
    "Resumen:",
    `  Total registros: ${result.totalRecords}`,
    `  Importados: ${result.imported}`,
    `  Omitidos: ${result.skipped}`,
    `  Errores: ${result.errors}`,
    "",
  ];

  if (result.errors > 0) {
    lines.push("Errores encontrados:");
    const errored = result.details.filter(d => d.status === "ERROR");
    for (const error of errored.slice(0, 10)) {
      lines.push(`  - ${error.externalCode}: ${error.errorMessage}`);
    }
    if (errored.length > 10) {
      lines.push(`  ... y ${errored.length - 10} errores más`);
    }
  }

  return lines.join("\n");
}
