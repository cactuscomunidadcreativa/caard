/**
 * CAARD - Constantes del Sistema de Reglas
 * =========================================
 * Basado en la Matriz Maestra de Reglas de Control del Sistema CAARD
 *
 * PRINCIPIO RECTOR:
 * Todo evento normativo genera una regla del sistema;
 * toda regla del sistema genera una acción automática;
 * toda acción queda registrada y auditada.
 */

// =============================================================================
// TASAS Y ARANCELES
// =============================================================================

/**
 * Tasas para arbitraje NACIONAL (en céntimos)
 * Moneda: PEN (Soles peruanos)
 */
export const TASAS_NACIONAL = {
  /** Tasa de presentación: S/ 500 + IGV */
  PRESENTACION: 50000, // 500.00 en céntimos
  /** IGV aplicable (18%) */
  IGV_RATE: 0.18,
  /** Tasa de presentación con IGV: S/ 590 */
  PRESENTACION_CON_IGV: 59000,
  /** Tasa de árbitro de emergencia: S/ 1,800 + IGV */
  ARBITRO_EMERGENCIA: 180000,
  /** Tasa de árbitro de emergencia con IGV: S/ 2,124 */
  ARBITRO_EMERGENCIA_CON_IGV: 212400,
  /** Moneda */
  CURRENCY: "PEN" as const,
} as const;

/**
 * Tasas para arbitraje INTERNACIONAL (en céntimos)
 * Moneda: USD (Dólares americanos)
 */
export const TASAS_INTERNACIONAL = {
  /** Tasa de presentación: USD 400 */
  PRESENTACION: 40000, // 400.00 en céntimos
  /** Tasa de árbitro de emergencia: USD 1,500 */
  ARBITRO_EMERGENCIA: 150000,
  /** Moneda */
  CURRENCY: "USD" as const,
  /** IGV no aplica en internacional */
  IGV_RATE: 0,
} as const;

// =============================================================================
// PLAZOS DEL SISTEMA (en días hábiles)
// =============================================================================

/**
 * Plazos para procedimiento REGULAR
 */
export const PLAZOS_REGULAR = {
  /** Plazo para pago de tasas después de emisión de orden */
  PAGO_GASTOS_ADMINISTRATIVOS: 10,
  /** Plazo para pago de honorarios arbitrales */
  PAGO_HONORARIOS: 10,
  /** Plazo para contestación de demanda */
  CONTESTACION_DEMANDA: 20,
  /** Plazo para reconvención */
  RECONVENCION: 20,
  /** Plazo para contestación de reconvención */
  CONTESTACION_RECONVENCION: 20,
  /** Plazo para presentar alegatos */
  ALEGATOS: 15,
  /** Plazo para absolución de recusación */
  ABSOLVER_RECUSACION: 5,
  /** Plazo para designación de árbitro por las partes */
  DESIGNACION_ARBITRO_PARTES: 15,
} as const;

/**
 * Plazos para ARBITRAJE DE EMERGENCIA (críticos - en días hábiles)
 */
export const PLAZOS_EMERGENCIA = {
  /** Verificación formal de requisitos: máximo 1 día hábil */
  VERIFICACION_FORMAL: 1,
  /** Subsanación y pago: máximo 1 día hábil */
  SUBSANACION_Y_PAGO: 1,
  /** Designación de árbitro de emergencia por el Consejo: máximo 4 días hábiles */
  DESIGNACION_ARBITRO: 4,
  /** Resolución por árbitro de emergencia: hasta 4 días hábiles */
  RESOLUCION_ARBITRO: 4,
  /** Presentación de solicitud principal tras medida de emergencia: 15 días hábiles */
  SOLICITUD_PRINCIPAL: 15,
} as const;

/**
 * Configuración de recordatorios (días antes del vencimiento)
 */
export const RECORDATORIOS = {
  /** Primer recordatorio */
  PRIMER_AVISO: 3,
  /** Segundo recordatorio (urgente) */
  SEGUNDO_AVISO: 1,
  /** Aviso el mismo día del vencimiento */
  DIA_VENCIMIENTO: 0,
} as const;

// =============================================================================
// ESTADOS DEL EXPEDIENTE Y TRANSICIONES
// =============================================================================

/**
 * Estados del expediente según el flujo procesal
 */
export const CASE_STATES = {
  // Estados iniciales
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",

  // Estados de revisión
  UNDER_REVIEW: "UNDER_REVIEW",
  OBSERVED: "OBSERVED",

  // Estados de admisión
  ADMITTED: "ADMITTED",
  REJECTED: "REJECTED",

  // Estados de proceso
  IN_PROCESS: "IN_PROCESS",
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  PAYMENT_OVERDUE: "PAYMENT_OVERDUE",
  SUSPENDED: "SUSPENDED",

  // Estados de emergencia
  EMERGENCY_REQUESTED: "EMERGENCY_REQUESTED",
  EMERGENCY_IN_PROCESS: "EMERGENCY_IN_PROCESS",
  EMERGENCY_RESOLVED: "EMERGENCY_RESOLVED",
  EMERGENCY_EXPIRED: "EMERGENCY_EXPIRED",

  // Estados finales
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED",
} as const;

export type CaseState = typeof CASE_STATES[keyof typeof CASE_STATES];

/**
 * Transiciones de estado permitidas
 * Define qué estados pueden transicionar a qué otros estados
 */
export const STATE_TRANSITIONS: Record<CaseState, CaseState[]> = {
  [CASE_STATES.DRAFT]: [CASE_STATES.SUBMITTED],
  [CASE_STATES.SUBMITTED]: [CASE_STATES.UNDER_REVIEW, CASE_STATES.OBSERVED, CASE_STATES.REJECTED],
  [CASE_STATES.UNDER_REVIEW]: [CASE_STATES.ADMITTED, CASE_STATES.OBSERVED, CASE_STATES.REJECTED],
  [CASE_STATES.OBSERVED]: [CASE_STATES.UNDER_REVIEW, CASE_STATES.REJECTED],
  [CASE_STATES.ADMITTED]: [CASE_STATES.IN_PROCESS, CASE_STATES.AWAITING_PAYMENT],
  [CASE_STATES.REJECTED]: [CASE_STATES.ARCHIVED],
  [CASE_STATES.IN_PROCESS]: [CASE_STATES.AWAITING_PAYMENT, CASE_STATES.SUSPENDED, CASE_STATES.CLOSED],
  [CASE_STATES.AWAITING_PAYMENT]: [CASE_STATES.IN_PROCESS, CASE_STATES.PAYMENT_OVERDUE, CASE_STATES.SUSPENDED],
  [CASE_STATES.PAYMENT_OVERDUE]: [CASE_STATES.SUSPENDED, CASE_STATES.IN_PROCESS],
  [CASE_STATES.SUSPENDED]: [CASE_STATES.IN_PROCESS, CASE_STATES.CLOSED],
  [CASE_STATES.EMERGENCY_REQUESTED]: [CASE_STATES.EMERGENCY_IN_PROCESS, CASE_STATES.ARCHIVED],
  [CASE_STATES.EMERGENCY_IN_PROCESS]: [CASE_STATES.EMERGENCY_RESOLVED, CASE_STATES.EMERGENCY_EXPIRED],
  [CASE_STATES.EMERGENCY_RESOLVED]: [CASE_STATES.EMERGENCY_EXPIRED, CASE_STATES.SUBMITTED],
  [CASE_STATES.EMERGENCY_EXPIRED]: [CASE_STATES.ARCHIVED],
  [CASE_STATES.CLOSED]: [CASE_STATES.ARCHIVED],
  [CASE_STATES.ARCHIVED]: [],
};

/**
 * Estados que bloquean actuaciones procesales
 */
export const BLOCKED_STATES: CaseState[] = [
  CASE_STATES.DRAFT,
  CASE_STATES.AWAITING_PAYMENT,
  CASE_STATES.PAYMENT_OVERDUE,
  CASE_STATES.SUSPENDED,
  CASE_STATES.REJECTED,
  CASE_STATES.CLOSED,
  CASE_STATES.ARCHIVED,
  CASE_STATES.EMERGENCY_EXPIRED,
];

// =============================================================================
// ETAPAS PROCESALES Y DEVOLUCIONES
// =============================================================================

/**
 * Etapas procesales del arbitraje
 * Cada etapa tiene un código, nombre y porcentaje de devolución de honorarios
 */
export const ETAPAS_PROCESALES = {
  DEMANDA: {
    code: "DEMANDA",
    name: "Etapa de Demanda",
    order: 1,
    /** Devolución del 96% */
    refundPercentage: 96,
  },
  CONTESTACION: {
    code: "CONTESTACION",
    name: "Etapa de Contestación",
    order: 2,
    /** Devolución del 93% */
    refundPercentage: 93,
  },
  RECONVENCION: {
    code: "RECONVENCION",
    name: "Etapa de Reconvención",
    order: 3,
    /** Devolución del 90% */
    refundPercentage: 90,
  },
  PROBATORIA: {
    code: "PROBATORIA",
    name: "Etapa Probatoria",
    order: 4,
    /** Devolución del 55% */
    refundPercentage: 55,
  },
  AUDIENCIA_PRUEBAS: {
    code: "AUDIENCIA_PRUEBAS",
    name: "Audiencia de Pruebas",
    order: 5,
    /** Devolución del 40% */
    refundPercentage: 40,
  },
  INFORMES_ORALES: {
    code: "INFORMES_ORALES",
    name: "Informes Orales",
    order: 6,
    /** Devolución del 25% */
    refundPercentage: 25,
  },
  LAUDO: {
    code: "LAUDO",
    name: "Laudo",
    order: 7,
    /** Sin devolución */
    refundPercentage: 0,
  },
} as const;

export type EtapaProcesal = keyof typeof ETAPAS_PROCESALES;

// =============================================================================
// TIPOS DE PAGO
// =============================================================================

/**
 * Conceptos de pago en el sistema
 */
export const PAYMENT_CONCEPTS = {
  /** Tasa de presentación de solicitud */
  TASA_PRESENTACION: "TASA_PRESENTACION",
  /** Gastos administrativos */
  GASTOS_ADMINISTRATIVOS: "GASTOS_ADMINISTRATIVOS",
  /** Honorarios del árbitro único */
  HONORARIOS_ARBITRO_UNICO: "HONORARIOS_ARBITRO_UNICO",
  /** Honorarios del tribunal (3 árbitros) */
  HONORARIOS_TRIBUNAL: "HONORARIOS_TRIBUNAL",
  /** Tasa de árbitro de emergencia */
  TASA_EMERGENCIA: "TASA_EMERGENCIA",
  /** Gastos por reconvención */
  GASTOS_RECONVENCION: "GASTOS_RECONVENCION",
  /** Reliquidación por aumento de cuantía */
  RELIQUIDACION: "RELIQUIDACION",
  /** Otros gastos */
  OTROS: "OTROS",
} as const;

export type PaymentConcept = typeof PAYMENT_CONCEPTS[keyof typeof PAYMENT_CONCEPTS];

/**
 * Estados de orden de pago
 */
export const PAYMENT_ORDER_STATUS = {
  /** Orden emitida, pendiente de pago */
  PENDING: "PENDING",
  /** Pago parcial recibido (no habilita avance) */
  PARTIAL: "PARTIAL",
  /** Pago completo confirmado */
  PAID: "PAID",
  /** Plazo vencido */
  OVERDUE: "OVERDUE",
  /** Orden cancelada */
  CANCELLED: "CANCELLED",
  /** Devolución procesada */
  REFUNDED: "REFUNDED",
} as const;

// =============================================================================
// ESTADOS DEL ÁRBITRO
// =============================================================================

/**
 * Estados posibles de un árbitro en el registro
 */
export const ARBITRATOR_STATUS = {
  /** Solicitud pendiente de aprobación */
  PENDING_APPROVAL: "PENDING_APPROVAL",
  /** Árbitro activo y disponible */
  ACTIVE: "ACTIVE",
  /** Temporalmente suspendido */
  SUSPENDED: "SUSPENDED",
  /** Sanción ética - inhabilitado */
  SANCTIONED: "SANCTIONED",
  /** Retirado del registro */
  RETIRED: "RETIRED",
  /** Solicitud rechazada */
  REJECTED: "REJECTED",
} as const;

export type ArbitratorStatus = typeof ARBITRATOR_STATUS[keyof typeof ARBITRATOR_STATUS];

/**
 * Estados que impiden nuevas designaciones
 */
export const ARBITRATOR_BLOCKED_STATUS: ArbitratorStatus[] = [
  ARBITRATOR_STATUS.PENDING_APPROVAL,
  ARBITRATOR_STATUS.SUSPENDED,
  ARBITRATOR_STATUS.SANCTIONED,
  ARBITRATOR_STATUS.RETIRED,
  ARBITRATOR_STATUS.REJECTED,
];

// =============================================================================
// TIPOS DE EVENTO PARA NOTIFICACIONES
// =============================================================================

/**
 * Eventos que generan notificación obligatoria
 */
export const NOTIFICATION_EVENTS = {
  // Solicitud / Admisión
  CASE_SUBMITTED: "CASE_SUBMITTED",
  CASE_OBSERVED: "CASE_OBSERVED",
  CASE_ADMITTED: "CASE_ADMITTED",
  CASE_REJECTED: "CASE_REJECTED",

  // Documentos
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_REPLACED: "DOCUMENT_REPLACED",

  // Plazos
  DEADLINE_CREATED: "DEADLINE_CREATED",
  DEADLINE_REMINDER: "DEADLINE_REMINDER",
  DEADLINE_URGENT: "DEADLINE_URGENT",
  DEADLINE_OVERDUE: "DEADLINE_OVERDUE",

  // Audiencias
  HEARING_SCHEDULED: "HEARING_SCHEDULED",
  HEARING_UPDATED: "HEARING_UPDATED",
  HEARING_REMINDER: "HEARING_REMINDER",
  HEARING_CANCELLED: "HEARING_CANCELLED",

  // Pagos
  PAYMENT_ORDER_ISSUED: "PAYMENT_ORDER_ISSUED",
  PAYMENT_REMINDER: "PAYMENT_REMINDER",
  PAYMENT_URGENT: "PAYMENT_URGENT",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_OVERDUE: "PAYMENT_OVERDUE",
  PAYMENT_REFUND_PROCESSED: "PAYMENT_REFUND_PROCESSED",

  // Árbitros
  ARBITRATOR_DESIGNATED: "ARBITRATOR_DESIGNATED",
  ARBITRATOR_ACCEPTED: "ARBITRATOR_ACCEPTED",
  ARBITRATOR_REJECTED: "ARBITRATOR_REJECTED",
  ARBITRATOR_RECUSATION_FILED: "ARBITRATOR_RECUSATION_FILED",
  ARBITRATOR_RECUSATION_RESOLVED: "ARBITRATOR_RECUSATION_RESOLVED",
  ARBITRATOR_SANCTIONED: "ARBITRATOR_SANCTIONED",

  // Emergencia
  EMERGENCY_REQUEST_RECEIVED: "EMERGENCY_REQUEST_RECEIVED",
  EMERGENCY_VERIFICATION_PENDING: "EMERGENCY_VERIFICATION_PENDING",
  EMERGENCY_ARBITRATOR_DESIGNATED: "EMERGENCY_ARBITRATOR_DESIGNATED",
  EMERGENCY_RESOLVED: "EMERGENCY_RESOLVED",
  EMERGENCY_EXPIRED: "EMERGENCY_EXPIRED",

  // Suspensión / Cierre
  CASE_SUSPENDED: "CASE_SUSPENDED",
  CASE_REACTIVATED: "CASE_REACTIVATED",
  CASE_CLOSED: "CASE_CLOSED",
  AWARD_ISSUED: "AWARD_ISSUED",
} as const;

export type NotificationEvent = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];

/**
 * Eventos críticos que requieren notificación inmediata por SMS además de email
 */
export const CRITICAL_NOTIFICATION_EVENTS: NotificationEvent[] = [
  NOTIFICATION_EVENTS.PAYMENT_URGENT,
  NOTIFICATION_EVENTS.PAYMENT_OVERDUE,
  NOTIFICATION_EVENTS.DEADLINE_URGENT,
  NOTIFICATION_EVENTS.DEADLINE_OVERDUE,
  NOTIFICATION_EVENTS.CASE_SUSPENDED,
  NOTIFICATION_EVENTS.EMERGENCY_REQUEST_RECEIVED,
  NOTIFICATION_EVENTS.EMERGENCY_VERIFICATION_PENDING,
  NOTIFICATION_EVENTS.EMERGENCY_ARBITRATOR_DESIGNATED,
  NOTIFICATION_EVENTS.EMERGENCY_EXPIRED,
];

// =============================================================================
// ACCIONES DE AUDITORÍA
// =============================================================================

/**
 * Acciones que deben quedar registradas en auditoría
 */
export const AUDIT_ACTIONS = {
  // Expedientes
  CASE_CREATE: "CASE_CREATE",
  CASE_UPDATE: "CASE_UPDATE",
  CASE_STATUS_CHANGE: "CASE_STATUS_CHANGE",
  CASE_SUSPEND: "CASE_SUSPEND",
  CASE_REACTIVATE: "CASE_REACTIVATE",
  CASE_CLOSE: "CASE_CLOSE",

  // Documentos
  DOCUMENT_UPLOAD: "DOCUMENT_UPLOAD",
  DOCUMENT_VIEW: "DOCUMENT_VIEW",
  DOCUMENT_DOWNLOAD: "DOCUMENT_DOWNLOAD",
  DOCUMENT_REPLACE: "DOCUMENT_REPLACE",
  DOCUMENT_DELETE: "DOCUMENT_DELETE",

  // Pagos
  PAYMENT_ORDER_CREATE: "PAYMENT_ORDER_CREATE",
  PAYMENT_RECEIVE: "PAYMENT_RECEIVE",
  PAYMENT_VALIDATE: "PAYMENT_VALIDATE",
  PAYMENT_REFUND: "PAYMENT_REFUND",

  // Árbitros
  ARBITRATOR_REGISTER: "ARBITRATOR_REGISTER",
  ARBITRATOR_APPROVE: "ARBITRATOR_APPROVE",
  ARBITRATOR_DESIGNATE: "ARBITRATOR_DESIGNATE",
  ARBITRATOR_ACCEPT: "ARBITRATOR_ACCEPT",
  ARBITRATOR_RECUSE: "ARBITRATOR_RECUSE",
  ARBITRATOR_SANCTION: "ARBITRATOR_SANCTION",

  // Notificaciones
  NOTIFICATION_SEND: "NOTIFICATION_SEND",
  NOTIFICATION_FAIL: "NOTIFICATION_FAIL",

  // Sistema
  SYSTEM_RULE_TRIGGER: "SYSTEM_RULE_TRIGGER",
  SYSTEM_AUTO_SUSPEND: "SYSTEM_AUTO_SUSPEND",
  SYSTEM_DEADLINE_CHECK: "SYSTEM_DEADLINE_CHECK",

  // Usuarios
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DEACTIVATE: "USER_DEACTIVATE",
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// =============================================================================
// CONFIGURACIÓN DE ZONA HORARIA
// =============================================================================

/**
 * Zona horaria por defecto del sistema (Perú)
 */
export const DEFAULT_TIMEZONE = "America/Lima";

/**
 * Días de la semana que son hábiles (lunes a viernes)
 * 0 = Domingo, 6 = Sábado
 */
export const BUSINESS_DAYS = [1, 2, 3, 4, 5];

// =============================================================================
// MENSAJES DEL SISTEMA
// =============================================================================

/**
 * Mensajes estándar del sistema para diferentes situaciones
 */
export const SYSTEM_MESSAGES = {
  PAYMENT_REQUIRED: "El expediente no puede avanzar hasta que se complete el pago de la tasa correspondiente.",
  PAYMENT_OVERDUE: "El plazo de pago ha vencido. El expediente ha sido suspendido automáticamente.",
  CASE_SUSPENDED: "El expediente se encuentra suspendido. No se pueden realizar actuaciones procesales.",
  CASE_BLOCKED: "Este expediente no admite actuaciones en su estado actual.",
  ARBITRATOR_BLOCKED: "El árbitro no está habilitado para recibir nuevas designaciones.",
  EMERGENCY_VERIFICATION_REQUIRED: "La solicitud de emergencia requiere verificación formal en un plazo máximo de 1 día hábil.",
  EMERGENCY_PAYMENT_REQUIRED: "La solicitud de emergencia no puede procesarse sin el pago de la tasa correspondiente.",
  EMERGENCY_EXPIRED: "La medida de emergencia ha caducado por no presentar la solicitud arbitral principal en el plazo establecido.",
  TRANSITION_NOT_ALLOWED: "La transición de estado solicitada no está permitida.",
} as const;
