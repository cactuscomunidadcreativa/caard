/**
 * CAARD - Motor de Estados y Transiciones
 * =========================================
 * Controla todas las transiciones de estado de los expedientes.
 * Ningún cambio de estado puede ocurrir fuera de este motor.
 *
 * PRINCIPIO: El sistema no confía en la memoria humana, ni en procesos manuales,
 * ni en la discrecionalidad operativa fuera de lo previsto en los reglamentos.
 */

import {
  CASE_STATES,
  STATE_TRANSITIONS,
  BLOCKED_STATES,
  SYSTEM_MESSAGES,
  type CaseState,
} from "./constants";

import type {
  StateTransitionContext,
  TransitionValidation,
  RequiredAction,
  StateChangeEvent,
} from "./types";

// =============================================================================
// VALIDACIÓN DE TRANSICIONES
// =============================================================================

/**
 * Valida si una transición de estado es permitida
 */
export function validateTransition(
  context: StateTransitionContext
): TransitionValidation {
  const { currentState, targetState } = context;
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredActions: RequiredAction[] = [];

  // 1. Verificar que la transición esté definida
  const allowedTransitions = STATE_TRANSITIONS[currentState as CaseState];
  if (!allowedTransitions) {
    errors.push(`Estado actual "${currentState}" no tiene transiciones definidas.`);
    return { isAllowed: false, errors, warnings, requiredActions };
  }

  // 2. Verificar que el estado destino esté permitido
  if (!allowedTransitions.includes(targetState as CaseState)) {
    errors.push(
      `Transición de "${currentState}" a "${targetState}" no está permitida. ` +
      `Transiciones válidas: ${allowedTransitions.join(", ")}`
    );
    return { isAllowed: false, errors, warnings, requiredActions };
  }

  // 3. Validaciones específicas según el estado destino
  const specificValidation = validateSpecificTransition(context);
  errors.push(...specificValidation.errors);
  warnings.push(...specificValidation.warnings);
  requiredActions.push(...(specificValidation.requiredActions || []));

  return {
    isAllowed: errors.length === 0,
    errors,
    warnings,
    requiredActions,
  };
}

/**
 * Validaciones específicas según el tipo de transición
 */
function validateSpecificTransition(
  context: StateTransitionContext
): TransitionValidation {
  const { currentState, targetState, metadata } = context;
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredActions: RequiredAction[] = [];

  // Transición a ADMITTED requiere pago confirmado
  if (targetState === CASE_STATES.ADMITTED) {
    const paymentConfirmed = metadata?.paymentConfirmed;
    if (!paymentConfirmed) {
      errors.push(SYSTEM_MESSAGES.PAYMENT_REQUIRED);
      requiredActions.push({
        type: "PAYMENT",
        description: "Confirmar pago de tasa de presentación",
        blocking: true,
      });
    }
  }

  // Transición a IN_PROCESS requiere que no haya pagos pendientes
  if (targetState === CASE_STATES.IN_PROCESS) {
    const hasPendingPayments = metadata?.hasPendingPayments;
    if (hasPendingPayments) {
      errors.push("Existen pagos pendientes que deben completarse antes de continuar.");
      requiredActions.push({
        type: "PAYMENT",
        description: "Completar pagos pendientes",
        blocking: true,
      });
    }
  }

  // Transición a REJECTED requiere motivo
  if (targetState === CASE_STATES.REJECTED) {
    const rejectionReason = metadata?.reason;
    if (!rejectionReason || String(rejectionReason).trim().length < 10) {
      errors.push("Debe proporcionar un motivo detallado para el rechazo.");
    }
  }

  // Transición a SUSPENDED se registra automáticamente
  if (targetState === CASE_STATES.SUSPENDED) {
    warnings.push("El expediente será suspendido y no se podrán realizar actuaciones procesales.");
  }

  // Transición de SUSPENDED a IN_PROCESS requiere resolución del bloqueo
  if (currentState === CASE_STATES.SUSPENDED && targetState === CASE_STATES.IN_PROCESS) {
    const blockResolved = metadata?.blockResolved;
    if (!blockResolved) {
      errors.push("La causa de la suspensión debe ser resuelta antes de reactivar el expediente.");
    }
  }

  // Transición a CLOSED requiere verificaciones
  if (targetState === CASE_STATES.CLOSED) {
    const hasAward = metadata?.hasAward;
    if (!hasAward) {
      warnings.push("Se está cerrando el expediente sin laudo emitido.");
    }
  }

  return { isAllowed: errors.length === 0, errors, warnings, requiredActions };
}

// =============================================================================
// EJECUCIÓN DE TRANSICIONES
// =============================================================================

/**
 * Ejecuta una transición de estado si es válida
 * Retorna el evento de cambio de estado o null si falló
 */
export async function executeTransition(
  context: StateTransitionContext,
  onValidated?: (validation: TransitionValidation) => Promise<boolean>
): Promise<StateChangeEvent | null> {
  // Validar transición
  const validation = validateTransition(context);

  // Si hay callback de validación, permitir decisión
  if (onValidated) {
    const proceed = await onValidated(validation);
    if (!proceed) {
      return null;
    }
  }

  // Si no es permitida, retornar null
  if (!validation.isAllowed) {
    return null;
  }

  // Crear evento de cambio
  const event: StateChangeEvent = {
    caseId: context.caseId,
    previousState: context.currentState,
    newState: context.targetState,
    changedAt: new Date(),
    changedBy: context.userId || "SYSTEM",
    triggeredBy: context.triggeredBy,
    reason: context.reason,
    metadata: context.metadata,
  };

  return event;
}

// =============================================================================
// UTILIDADES DE ESTADO
// =============================================================================

/**
 * Verifica si un estado permite actuaciones procesales
 */
export function isStateBlocked(state: CaseState): boolean {
  return BLOCKED_STATES.includes(state);
}

/**
 * Obtiene las transiciones permitidas desde un estado
 */
export function getAllowedTransitions(currentState: CaseState): CaseState[] {
  return STATE_TRANSITIONS[currentState] || [];
}

/**
 * Verifica si se puede transicionar de un estado a otro
 */
export function canTransition(from: CaseState, to: CaseState): boolean {
  const allowed = STATE_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Obtiene el mensaje de error para un estado bloqueado
 */
export function getBlockedStateMessage(state: CaseState): string {
  switch (state) {
    case CASE_STATES.DRAFT:
      return "El expediente está en borrador y no ha sido presentado.";
    case CASE_STATES.AWAITING_PAYMENT:
      return SYSTEM_MESSAGES.PAYMENT_REQUIRED;
    case CASE_STATES.PAYMENT_OVERDUE:
      return SYSTEM_MESSAGES.PAYMENT_OVERDUE;
    case CASE_STATES.SUSPENDED:
      return SYSTEM_MESSAGES.CASE_SUSPENDED;
    case CASE_STATES.REJECTED:
      return "El expediente ha sido rechazado.";
    case CASE_STATES.CLOSED:
      return "El expediente está cerrado.";
    case CASE_STATES.ARCHIVED:
      return "El expediente está archivado.";
    case CASE_STATES.EMERGENCY_EXPIRED:
      return SYSTEM_MESSAGES.EMERGENCY_EXPIRED;
    default:
      return SYSTEM_MESSAGES.CASE_BLOCKED;
  }
}

// =============================================================================
// TRANSICIONES AUTOMÁTICAS (POR EVENTOS DEL SISTEMA)
// =============================================================================

/**
 * Define las transiciones que el sistema ejecuta automáticamente
 */
export const AUTOMATIC_TRANSITIONS: Record<string, {
  fromState: CaseState;
  toState: CaseState;
  trigger: string;
  condition?: string;
}> = {
  // Cuando vence el plazo de pago
  PAYMENT_OVERDUE: {
    fromState: CASE_STATES.AWAITING_PAYMENT,
    toState: CASE_STATES.PAYMENT_OVERDUE,
    trigger: "DEADLINE_PAYMENT_OVERDUE",
  },

  // Cuando se supera el tiempo máximo en PAYMENT_OVERDUE
  AUTO_SUSPEND_PAYMENT: {
    fromState: CASE_STATES.PAYMENT_OVERDUE,
    toState: CASE_STATES.SUSPENDED,
    trigger: "PAYMENT_OVERDUE_EXCEEDED",
    condition: "daysOverdue > 5",
  },

  // Cuando se confirma el pago
  PAYMENT_CONFIRMED: {
    fromState: CASE_STATES.AWAITING_PAYMENT,
    toState: CASE_STATES.IN_PROCESS,
    trigger: "PAYMENT_CONFIRMED",
  },

  // Reactivación tras pago desde PAYMENT_OVERDUE
  PAYMENT_LATE_CONFIRMED: {
    fromState: CASE_STATES.PAYMENT_OVERDUE,
    toState: CASE_STATES.IN_PROCESS,
    trigger: "PAYMENT_CONFIRMED",
  },

  // Emergencia: caducidad por no presentar caso principal
  EMERGENCY_EXPIRED: {
    fromState: CASE_STATES.EMERGENCY_RESOLVED,
    toState: CASE_STATES.EMERGENCY_EXPIRED,
    trigger: "EMERGENCY_PRINCIPAL_DEADLINE_EXCEEDED",
  },
};

/**
 * Determina si hay una transición automática para un trigger dado
 */
export function getAutomaticTransition(
  trigger: string,
  currentState: CaseState
): { toState: CaseState; condition?: string } | null {
  for (const key of Object.keys(AUTOMATIC_TRANSITIONS)) {
    const transition = AUTOMATIC_TRANSITIONS[key];
    if (transition.trigger === trigger && transition.fromState === currentState) {
      return {
        toState: transition.toState,
        condition: transition.condition,
      };
    }
  }
  return null;
}

// =============================================================================
// HISTORIAL DE ESTADOS
// =============================================================================

/**
 * Estructura para persistir el historial de estados
 */
export interface StateHistoryEntry {
  id: string;
  caseId: string;
  previousState: CaseState | null;
  newState: CaseState;
  changedAt: Date;
  changedBy: string;
  triggeredBy: "USER" | "SYSTEM" | "CRON";
  reason?: string;
  ruleTriggered?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Crea una entrada de historial desde un evento de cambio
 */
export function createHistoryEntry(
  event: StateChangeEvent,
  additionalData?: { ruleTriggered?: string }
): Omit<StateHistoryEntry, "id"> {
  return {
    caseId: event.caseId,
    previousState: event.previousState,
    newState: event.newState,
    changedAt: event.changedAt,
    changedBy: event.changedBy,
    triggeredBy: event.triggeredBy,
    reason: event.reason,
    ruleTriggered: additionalData?.ruleTriggered,
    metadata: event.metadata,
  };
}

// =============================================================================
// VALIDACIONES DE CONTEXTO
// =============================================================================

/**
 * Tipo de validador de contexto
 */
export type ContextValidator = (
  context: StateTransitionContext
) => Promise<{ valid: boolean; errors: string[] }>;

/**
 * Registro de validadores por transición
 */
const contextValidators: Map<string, ContextValidator[]> = new Map();

/**
 * Registra un validador para una transición específica
 */
export function registerContextValidator(
  fromState: CaseState,
  toState: CaseState,
  validator: ContextValidator
): void {
  const key = `${fromState}->${toState}`;
  const existing = contextValidators.get(key) || [];
  existing.push(validator);
  contextValidators.set(key, existing);
}

/**
 * Ejecuta todos los validadores de contexto para una transición
 */
export async function runContextValidators(
  context: StateTransitionContext
): Promise<{ valid: boolean; errors: string[] }> {
  const key = `${context.currentState}->${context.targetState}`;
  const validators = contextValidators.get(key) || [];

  const allErrors: string[] = [];

  for (const validator of validators) {
    const result = await validator(context);
    if (!result.valid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

// =============================================================================
// HOOKS DE TRANSICIÓN
// =============================================================================

export type TransitionHook = (event: StateChangeEvent) => Promise<void>;

const beforeTransitionHooks: TransitionHook[] = [];
const afterTransitionHooks: TransitionHook[] = [];

/**
 * Registra un hook que se ejecuta antes de la transición
 */
export function onBeforeTransition(hook: TransitionHook): void {
  beforeTransitionHooks.push(hook);
}

/**
 * Registra un hook que se ejecuta después de la transición
 */
export function onAfterTransition(hook: TransitionHook): void {
  afterTransitionHooks.push(hook);
}

/**
 * Ejecuta los hooks de antes de la transición
 */
export async function runBeforeTransitionHooks(event: StateChangeEvent): Promise<void> {
  for (const hook of beforeTransitionHooks) {
    await hook(event);
  }
}

/**
 * Ejecuta los hooks de después de la transición
 */
export async function runAfterTransitionHooks(event: StateChangeEvent): Promise<void> {
  for (const hook of afterTransitionHooks) {
    await hook(event);
  }
}
