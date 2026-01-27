/**
 * CAARD - Tipos del Sistema de Reglas
 * ====================================
 * Definiciones de tipos para el motor de reglas, workflows y validaciones
 */

import type {
  CaseState,
  PaymentConcept,
  ArbitratorStatus,
  NotificationEvent,
  AuditAction,
  EtapaProcesal,
} from "./constants";

// =============================================================================
// TIPOS DE ARBITRAJE
// =============================================================================

/**
 * Tipo de arbitraje según jurisdicción
 */
export type ArbitrationType = "NACIONAL" | "INTERNACIONAL";

/**
 * Modalidad del tribunal
 */
export type TribunalMode = "SOLE_ARBITRATOR" | "TRIBUNAL_3";

/**
 * Tipo de procedimiento
 */
export type ProcedureType = "REGULAR" | "EMERGENCY";

// =============================================================================
// REGLAS DE PAGO
// =============================================================================

/**
 * Orden de pago generada por el sistema
 */
export interface PaymentOrder {
  id: string;
  caseId: string;
  concept: PaymentConcept;
  description: string;

  /** Monto en céntimos */
  amountCents: number;
  currency: "PEN" | "USD";

  /** Incluye IGV */
  includesIGV: boolean;
  igvAmountCents?: number;

  /** Fechas */
  issuedAt: Date;
  dueAt: Date;

  /** Estado */
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";

  /** Pago asociado */
  paymentId?: string;
  paidAt?: Date;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Resultado del cálculo de tasa
 */
export interface FeeCalculation {
  baseFee: number;
  igv: number;
  totalFee: number;
  currency: "PEN" | "USD";
  concept: PaymentConcept;
  description: string;
}

/**
 * Resultado del cálculo de devolución
 */
export interface RefundCalculation {
  originalAmount: number;
  refundPercentage: number;
  refundAmount: number;
  retainedAmount: number;
  currency: "PEN" | "USD";
  stage: EtapaProcesal;
  stageName: string;
}

// =============================================================================
// REGLAS DE PLAZOS
// =============================================================================

/**
 * Definición de un plazo procesal
 */
export interface DeadlineDefinition {
  id: string;
  caseId: string;
  type: DeadlineType;
  title: string;
  description?: string;

  /** Fecha de inicio (desde cuando se cuenta) */
  startsAt: Date;
  /** Cantidad de días hábiles */
  businessDays: number;
  /** Fecha de vencimiento calculada */
  dueAt: Date;

  /** Zona horaria */
  timezone: string;

  /** Estado */
  status: "ACTIVE" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  completedAt?: Date;

  /** Consecuencias del vencimiento */
  onOverdue: DeadlineAction;

  /** Notificaciones configuradas */
  reminders: DeadlineReminder[];
}

/**
 * Tipos de plazo
 */
export type DeadlineType =
  | "PAYMENT"
  | "CONTESTACION"
  | "RECONVENCION"
  | "CONTESTACION_RECONVENCION"
  | "ALEGATOS"
  | "RECUSACION_ABSOLUCION"
  | "DESIGNACION_ARBITRO"
  | "SUBSANACION"
  | "EMERGENCY_VERIFICATION"
  | "EMERGENCY_PAYMENT"
  | "EMERGENCY_DESIGNATION"
  | "EMERGENCY_RESOLUTION"
  | "EMERGENCY_PRINCIPAL_REQUEST"
  | "CUSTOM";

/**
 * Acción a ejecutar cuando vence un plazo
 */
export interface DeadlineAction {
  type: "SUSPEND" | "ARCHIVE" | "NOTIFY" | "ESCALATE" | "AUTO_REJECT" | "EXPIRE_EMERGENCY";
  /** Notificar a estos roles */
  notifyRoles?: string[];
  /** Cambiar estado del caso a */
  changeStateTo?: CaseState;
  /** Mensaje personalizado */
  message?: string;
}

/**
 * Recordatorio de plazo
 */
export interface DeadlineReminder {
  /** Días antes del vencimiento */
  daysBefore: number;
  /** Canales de notificación */
  channels: ("EMAIL" | "SMS" | "IN_APP")[];
  /** Ya fue enviado */
  sentAt?: Date;
}

// =============================================================================
// MOTOR DE ESTADOS
// =============================================================================

/**
 * Contexto para evaluar transición de estado
 */
export interface StateTransitionContext {
  caseId: string;
  currentState: CaseState;
  targetState: CaseState;
  triggeredBy: "USER" | "SYSTEM" | "CRON";
  userId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Resultado de validación de transición
 */
export interface TransitionValidation {
  isAllowed: boolean;
  errors: string[];
  warnings: string[];
  requiredActions?: RequiredAction[];
}

/**
 * Acción requerida antes de permitir transición
 */
export interface RequiredAction {
  type: "PAYMENT" | "DOCUMENT" | "APPROVAL" | "NOTIFICATION";
  description: string;
  blocking: boolean;
}

/**
 * Evento de cambio de estado
 */
export interface StateChangeEvent {
  caseId: string;
  previousState: CaseState;
  newState: CaseState;
  changedAt: Date;
  changedBy: string;
  triggeredBy: "USER" | "SYSTEM" | "CRON";
  reason?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// ARBITRAJE DE EMERGENCIA
// =============================================================================

/**
 * Solicitud de arbitraje de emergencia
 */
export interface EmergencyRequest {
  id?: string;
  centerId?: string;
  caseId?: string; // Puede no tener caso aún

  /** Información del solicitante */
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;

  /** Descripción de la emergencia */
  title: string;
  description: string;
  urgencyJustification: string;

  /** Medidas solicitadas */
  requestedMeasures: string;

  /** Estado del flujo de emergencia */
  status: EmergencyStatus;

  /** Fechas del flujo */
  requestedAt: Date;
  verificationDueAt: Date;
  paymentDueAt?: Date;
  designationDueAt?: Date;
  resolutionDueAt?: Date;
  principalRequestDueAt?: Date;

  /** Verificación */
  verificationCompletedAt?: Date;
  verificationById?: string;
  verificationNotes?: string;
  missingRequirements?: string[];

  /** Árbitro de emergencia */
  emergencyArbitratorId?: string;
  arbitratorDesignatedAt?: Date;
  arbitratorDesignatedById?: string;
  arbitratorAcceptedAt?: Date;
  arbitratorRejectedAt?: Date;
  arbitratorRejectionReason?: string;

  /** Resolución */
  resolution?: string;
  resolvedAt?: Date;

  /** Pago */
  paymentOrderId?: string;
  paymentConfirmedAt?: Date;

  /** Caso principal generado */
  mainCaseId?: string;
  mainCaseSubmittedAt?: Date;

  /** Caducidad */
  expiredAt?: Date;
  expirationReason?: string;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Estados del arbitraje de emergencia
 */
export type EmergencyStatus =
  | "REQUESTED"           // Solicitud recibida
  | "PENDING_VERIFICATION" // En verificación formal
  | "VERIFICATION_FAILED"  // Falló verificación
  | "PENDING_PAYMENT"      // Esperando pago
  | "PAYMENT_OVERDUE"      // Pago vencido
  | "PENDING_DESIGNATION"  // Esperando designación de árbitro
  | "DESIGNATION_OVERDUE"  // Designación vencida (alerta al Consejo)
  | "PENDING_ACCEPTANCE"   // Árbitro designado, esperando aceptación
  | "IN_PROCESS"           // Árbitro aceptó, en proceso de resolución
  | "RESOLVED"             // Medida de emergencia resuelta
  | "PENDING_MAIN_CASE"    // Esperando presentación de caso principal
  | "COMPLETED"            // Caso principal presentado
  | "EXPIRED"              // Caducó por no presentar caso principal
  | "ARCHIVED";            // Archivado por cualquier causa

/**
 * Verificación formal de solicitud de emergencia
 */
export interface EmergencyVerification {
  requestId: string;
  verifiedAt: Date;
  verifiedBy: string;

  /** Resultado */
  isComplete: boolean;
  missingRequirements?: string[];
  observations?: string;

  /** Si requiere subsanación */
  requiresAmendment: boolean;
  amendmentDeadline?: Date;
}

// =============================================================================
// ÁRBITROS Y RECUSACIONES
// =============================================================================

/**
 * Registro de árbitro
 */
export interface ArbitratorRecord {
  id: string;
  userId: string;
  status: ArbitratorStatus;

  /** Información profesional */
  barNumber?: string;
  barAssociation?: string;
  specializations: string[];

  /** Fechas */
  applicationDate: Date;
  approvalDate?: Date;
  suspensionDate?: Date;
  sanctionDate?: Date;

  /** Historial */
  casesAssigned: number;
  casesCompleted: number;
  recusationsReceived: number;
  sanctionsReceived: number;

  /** Documentos */
  ethicsDeclarationDocId?: string;
  cvDocId?: string;
}

/**
 * Solicitud de recusación
 */
export interface RecusationRequest {
  id: string;
  caseId: string;
  arbitratorId: string;

  /** Solicitante */
  requesterId: string;
  requesterRole: "CLAIMANT" | "RESPONDENT";

  /** Motivo */
  reason: string;
  supportingDocuments: string[];

  /** Estado */
  status: RecusationStatus;

  /** Fechas */
  filedAt: Date;
  transferredAt?: Date; // Traslado automático
  responseDueAt?: Date; // 5 días hábiles
  arbitratorResponseAt?: Date;
  resolvedAt?: Date;

  /** Respuestas */
  arbitratorResponse?: string;
  otherPartyResponse?: string;

  /** Resolución del Consejo */
  councilDecision?: "ACCEPTED" | "REJECTED";
  councilResolution?: string;
  resolvedBy?: string;
}

/**
 * Estados de recusación
 */
export type RecusationStatus =
  | "FILED"
  | "TRANSFERRED"
  | "PENDING_RESPONSE"
  | "RESPONSE_RECEIVED"
  | "PENDING_COUNCIL_DECISION"
  | "ACCEPTED"
  | "REJECTED";

/**
 * Sanción a árbitro
 */
export interface ArbitratorSanction {
  id: string;
  arbitratorId: string;

  type: "WARNING" | "SUSPENSION" | "REMOVAL";
  reason: string;
  resolutionNumber?: string;

  /** Duración (para suspensión) */
  startDate: Date;
  endDate?: Date;

  /** Impacto automático */
  blocksNewAssignments: boolean;
  removesFromActiveCases: boolean;

  issuedAt: Date;
  issuedBy: string;
}

// =============================================================================
// NOTIFICACIONES
// =============================================================================

/**
 * Notificación a enviar
 */
export interface NotificationPayload {
  event: NotificationEvent;
  caseId?: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;

  /** Canales */
  channels: ("EMAIL" | "SMS" | "IN_APP")[];

  /** Contenido */
  subject?: string;
  body: string;
  templateKey?: string;
  templateData?: Record<string, unknown>;

  /** Prioridad */
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

  /** Programación */
  scheduledFor?: Date;
}

/**
 * Registro de notificación enviada
 */
export interface NotificationRecord {
  id: string;
  event: NotificationEvent;
  caseId?: string;
  recipientId?: string;

  channel: "EMAIL" | "SMS" | "IN_APP";
  status: "QUEUED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";

  subject?: string;
  body: string;

  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;

  providerMessageId?: string;
  providerResponse?: Record<string, unknown>;
}

// =============================================================================
// AUDITORÍA
// =============================================================================

/**
 * Entrada de auditoría
 */
export interface AuditEntry {
  id: string;
  action: AuditAction;
  entity: string;
  entityId?: string;

  userId?: string;
  userRole?: string;

  caseId?: string;
  centerId?: string;

  /** Datos del cambio */
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;

  /** Información de la solicitud */
  ip?: string;
  userAgent?: string;

  createdAt: Date;
}

// =============================================================================
// REGLAS DEL SISTEMA
// =============================================================================

/**
 * Definición de una regla del sistema
 */
export interface SystemRule {
  id: string;
  code: string;
  name: string;
  description: string;

  /** Cuándo se evalúa */
  trigger: RuleTrigger;

  /** Condiciones */
  conditions: RuleCondition[];

  /** Acciones a ejecutar si se cumplen las condiciones */
  actions: RuleAction[];

  /** Configuración */
  isActive: boolean;
  priority: number;

  /** Auditoría */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Disparador de regla
 */
export interface RuleTrigger {
  type: "EVENT" | "CRON" | "STATE_CHANGE" | "DEADLINE";
  event?: NotificationEvent;
  cronExpression?: string;
  fromState?: CaseState;
  toState?: CaseState;
  deadlineType?: DeadlineType;
}

/**
 * Condición de regla
 */
export interface RuleCondition {
  field: string;
  operator: "EQ" | "NEQ" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "NOT_IN" | "CONTAINS" | "EXISTS";
  value: unknown;
}

/**
 * Acción de regla
 */
export interface RuleAction {
  type: "CHANGE_STATE" | "CREATE_DEADLINE" | "SEND_NOTIFICATION" | "BLOCK_CASE" | "CREATE_PAYMENT_ORDER" | "ESCALATE" | "LOG";
  params: Record<string, unknown>;
}

// =============================================================================
// CONTEXTO DE EJECUCIÓN
// =============================================================================

/**
 * Contexto para ejecución de reglas
 */
export interface RuleExecutionContext {
  caseId?: string;
  case?: {
    id: string;
    code: string;
    status: CaseState;
    arbitrationType: ArbitrationType;
    procedureType: ProcedureType;
    currentStage?: EtapaProcesal;
    createdAt: Date;
    [key: string]: unknown;
  };

  triggeredBy: "USER" | "SYSTEM" | "CRON";
  userId?: string;
  userRole?: string;

  event?: NotificationEvent;
  eventData?: Record<string, unknown>;

  timestamp: Date;
}

/**
 * Resultado de ejecución de reglas
 */
export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  executed: boolean;
  conditionsMet: boolean;
  actionsExecuted: string[];
  errors: string[];
  executedAt: Date;
}
