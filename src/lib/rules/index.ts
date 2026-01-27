/**
 * CAARD - Sistema de Reglas
 * ==========================
 * Exportaciones centralizadas del motor de reglas del sistema.
 *
 * PRINCIPIO RECTOR:
 * Todo evento normativo genera una regla del sistema;
 * toda regla del sistema genera una acción automática;
 * toda acción queda registrada y auditada.
 */

// =============================================================================
// CONSTANTES
// =============================================================================
export {
  // Tasas y aranceles
  TASAS_NACIONAL,
  TASAS_INTERNACIONAL,

  // Plazos
  PLAZOS_REGULAR,
  PLAZOS_EMERGENCIA,
  RECORDATORIOS,

  // Estados
  CASE_STATES,
  STATE_TRANSITIONS,
  BLOCKED_STATES,

  // Etapas procesales
  ETAPAS_PROCESALES,

  // Pagos
  PAYMENT_CONCEPTS,
  PAYMENT_ORDER_STATUS,

  // Árbitros
  ARBITRATOR_STATUS,
  ARBITRATOR_BLOCKED_STATUS,

  // Notificaciones
  NOTIFICATION_EVENTS,
  CRITICAL_NOTIFICATION_EVENTS,

  // Auditoría
  AUDIT_ACTIONS,

  // Configuración
  DEFAULT_TIMEZONE,
  BUSINESS_DAYS,

  // Mensajes
  SYSTEM_MESSAGES,

  // Types from constants
  type CaseState,
  type PaymentConcept,
  type ArbitratorStatus,
  type NotificationEvent,
  type AuditAction,
  type EtapaProcesal,
} from "./constants";

// =============================================================================
// TIPOS
// =============================================================================
export type {
  // Arbitraje
  ArbitrationType,
  TribunalMode,
  ProcedureType,

  // Pagos
  PaymentOrder,
  FeeCalculation,
  RefundCalculation,

  // Plazos
  DeadlineDefinition,
  DeadlineType,
  DeadlineAction,
  DeadlineReminder,

  // Estados
  StateTransitionContext,
  TransitionValidation,
  RequiredAction,
  StateChangeEvent,

  // Emergencia
  EmergencyRequest,
  EmergencyStatus,
  EmergencyVerification,

  // Árbitros
  ArbitratorRecord,
  RecusationRequest,
  RecusationStatus,
  ArbitratorSanction,

  // Notificaciones
  NotificationPayload,
  NotificationRecord,

  // Auditoría
  AuditEntry,

  // Reglas
  SystemRule,
  RuleTrigger,
  RuleCondition,
  RuleAction,
  RuleExecutionContext,
  RuleExecutionResult,
} from "./types";

// =============================================================================
// DÍAS HÁBILES
// =============================================================================
export {
  // Funciones principales
  isBusinessDay,
  isHoliday,
  isWeekday,
  addBusinessDays,
  subtractBusinessDays,
  countBusinessDays,

  // Cálculo de plazos
  calculateDeadline,
  isDeadlineOverdue,
  daysUntilDeadline,
  getDeadlineEndTime,

  // Utilidades
  getNextBusinessDay,
  getPreviousBusinessDay,
  getHolidaysForYear,

  // Formateo
  formatDeadlineInfo,
  generateDeadlineCalendar,
} from "./business-days";

// =============================================================================
// MOTOR DE ESTADOS
// =============================================================================
export {
  // Validación
  validateTransition,
  isStateBlocked,
  getAllowedTransitions,
  canTransition,
  getBlockedStateMessage,

  // Ejecución
  executeTransition,
  getAutomaticTransition,
  AUTOMATIC_TRANSITIONS,

  // Historial
  createHistoryEntry,
  type StateHistoryEntry,

  // Validadores de contexto
  registerContextValidator,
  runContextValidators,
  type ContextValidator,

  // Hooks
  onBeforeTransition,
  onAfterTransition,
  runBeforeTransitionHooks,
  runAfterTransitionHooks,
  type TransitionHook,
} from "./state-machine";

// =============================================================================
// MOTOR DE PAGOS
// =============================================================================
export {
  // Cálculo de tasas
  calculatePresentationFee,
  calculateEmergencyFee,
  calculateFee,

  // Órdenes de pago
  createPresentationPaymentOrder,
  createEmergencyPaymentOrder,
  createPaymentOrder,

  // Verificación
  verifyPaymentOrder,
  canCaseProceed,
  type PaymentVerificationResult,

  // Devoluciones
  calculateRefund,
  getRefundTable,
  formatRefundTable,

  // Reliquidaciones
  calculateReliquidation,

  // Utilidades
  formatCurrency,
  generatePaymentOrderSummary,
} from "./payment-engine";

// =============================================================================
// ARBITRAJE DE EMERGENCIA
// =============================================================================
export {
  // Creación
  createEmergencyRequest,

  // Verificación
  verifyEmergencyRequest,
  EMERGENCY_REQUIREMENTS,

  // Transiciones
  EMERGENCY_TRANSITIONS,
  canTransitionEmergency,

  // Plazos
  calculateEmergencyDeadlines,
  updateEmergencyDeadlines,
  checkEmergencyDeadlines,
  type EmergencyDeadlineCheck,

  // Pagos
  generateEmergencyPaymentOrder,

  // Reportes
  generateEmergencySummary,
} from "./emergency-workflow";

// =============================================================================
// NOTIFICACIONES
// =============================================================================
export {
  // Templates
  NOTIFICATION_TEMPLATES,

  // Creación
  createNotification,

  // Recordatorios
  scheduleDeadlineReminders,
  schedulePaymentReminders,

  // Utilidades
  isCriticalEvent,
  getTemplateConfig,
  listNotificationEvents,
} from "./notification-engine";

// =============================================================================
// OVERRIDES ADMINISTRATIVOS Y MIGRACIÓN
// =============================================================================
export {
  // Tipos de override
  ADMIN_OVERRIDE_ACTIONS,
  type AdminOverrideAction,
  type AdminOverrideRequest,
  type AdminOverrideResult,

  // Validación
  canExecuteOverride,
  validateOverrideParams,

  // Ejecución
  prepareOverride,

  // Reportes
  type AdminInterventionReport,
  generateInterventionsReport,

  // Migración
  type CaseImportData,
  validateCaseImport,
  type BulkImportConfig,
  type BulkImportResult,
  generateImportReport,
} from "./admin-overrides";
