/**
 * CAARD - Flujo de Arbitraje de Emergencia
 * ==========================================
 * Implementa el régimen especial de arbitraje de emergencia con plazos
 * extremadamente breves y estrictos.
 *
 * PLAZOS CRÍTICOS (todos en días hábiles):
 * - Verificación formal: máximo 1 día
 * - Subsanación y pago: máximo 1 día
 * - Designación de árbitro por el Consejo: máximo 4 días
 * - Resolución del árbitro: hasta 4 días
 * - Presentación de solicitud principal: 15 días (o caduca)
 */

import {
  PLAZOS_EMERGENCIA,
  NOTIFICATION_EVENTS,
  SYSTEM_MESSAGES,
} from "./constants";

import type {
  EmergencyRequest,
  EmergencyStatus,
  EmergencyVerification,
  ArbitrationType,
  NotificationPayload,
} from "./types";

import { addBusinessDays, isDeadlineOverdue, formatDeadlineInfo } from "./business-days";
import { calculateEmergencyFee, createPaymentOrder } from "./payment-engine";

// =============================================================================
// CREACIÓN DE SOLICITUD DE EMERGENCIA
// =============================================================================

/**
 * Crea una nueva solicitud de arbitraje de emergencia
 */
export function createEmergencyRequest(
  centerId: string,
  requesterId: string,
  requesterInfo: {
    name: string;
    email: string;
    phone?: string;
  },
  emergencyDetails: {
    title: string;
    description: string;
    urgencyJustification: string;
    requestedMeasures: string;
  },
  requestedAt: Date = new Date()
): Omit<EmergencyRequest, "id"> {
  // Calcular fecha límite de verificación (1 día hábil)
  const verificationDueAt = addBusinessDays(requestedAt, PLAZOS_EMERGENCIA.VERIFICACION_FORMAL);

  return {
    centerId,
    requesterId,
    requesterName: requesterInfo.name,
    requesterEmail: requesterInfo.email,
    requesterPhone: requesterInfo.phone,
    ...emergencyDetails,
    status: "REQUESTED",
    requestedAt,
    verificationDueAt,
    // Las demás fechas se calculan según avanza el flujo
  };
}

// =============================================================================
// VERIFICACIÓN FORMAL
// =============================================================================

/**
 * Requisitos mínimos para solicitud de emergencia
 */
export const EMERGENCY_REQUIREMENTS = [
  {
    code: "TITLE",
    name: "Título descriptivo",
    description: "Título claro que identifique la solicitud",
  },
  {
    code: "DESCRIPTION",
    name: "Descripción de hechos",
    description: "Descripción detallada de los hechos que generan la emergencia",
  },
  {
    code: "URGENCY",
    name: "Justificación de urgencia",
    description: "Explicación de por qué se requiere tratamiento de emergencia",
  },
  {
    code: "MEASURES",
    name: "Medidas solicitadas",
    description: "Especificación clara de las medidas de emergencia requeridas",
  },
  {
    code: "CONTACT",
    name: "Datos de contacto",
    description: "Email y teléfono para notificaciones urgentes",
  },
] as const;

/**
 * Verifica los requisitos formales de una solicitud de emergencia
 */
export function verifyEmergencyRequest(
  request: EmergencyRequest,
  verifiedBy: string,
  verifiedAt: Date = new Date()
): EmergencyVerification {
  const missingRequirements: string[] = [];

  // Verificar requisitos
  if (!request.title || request.title.trim().length < 10) {
    missingRequirements.push("TITLE: Título muy corto o vacío");
  }

  if (!request.description || request.description.trim().length < 50) {
    missingRequirements.push("DESCRIPTION: Descripción insuficiente");
  }

  if (!request.urgencyJustification || request.urgencyJustification.trim().length < 30) {
    missingRequirements.push("URGENCY: Falta justificación de urgencia");
  }

  if (!request.requestedMeasures || request.requestedMeasures.trim().length < 20) {
    missingRequirements.push("MEASURES: Medidas solicitadas no especificadas");
  }

  if (!request.requesterEmail) {
    missingRequirements.push("CONTACT: Falta email de contacto");
  }

  const isComplete = missingRequirements.length === 0;

  return {
    requestId: request.id!,
    verifiedAt,
    verifiedBy,
    isComplete,
    missingRequirements: isComplete ? undefined : missingRequirements,
    observations: isComplete
      ? "Solicitud de emergencia verificada. Cumple con todos los requisitos formales."
      : `Solicitud incompleta. Se requiere subsanación de: ${missingRequirements.join(", ")}`,
    requiresAmendment: !isComplete,
    amendmentDeadline: !isComplete
      ? addBusinessDays(verifiedAt, PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO)
      : undefined,
  };
}

// =============================================================================
// TRANSICIONES DE ESTADO
// =============================================================================

/**
 * Transiciones permitidas en el flujo de emergencia
 */
export const EMERGENCY_TRANSITIONS: Record<EmergencyStatus, EmergencyStatus[]> = {
  REQUESTED: ["PENDING_VERIFICATION"],
  PENDING_VERIFICATION: ["PENDING_PAYMENT", "VERIFICATION_FAILED"],
  VERIFICATION_FAILED: ["PENDING_VERIFICATION", "ARCHIVED"],
  PENDING_PAYMENT: ["PENDING_DESIGNATION", "PAYMENT_OVERDUE"],
  PAYMENT_OVERDUE: ["ARCHIVED"],
  PENDING_DESIGNATION: ["PENDING_ACCEPTANCE", "DESIGNATION_OVERDUE"],
  DESIGNATION_OVERDUE: ["PENDING_ACCEPTANCE"],
  PENDING_ACCEPTANCE: ["IN_PROCESS", "PENDING_DESIGNATION"],
  IN_PROCESS: ["RESOLVED"],
  RESOLVED: ["PENDING_MAIN_CASE"],
  PENDING_MAIN_CASE: ["COMPLETED", "EXPIRED"],
  COMPLETED: [],
  EXPIRED: ["ARCHIVED"],
  ARCHIVED: [],
};

/**
 * Valida si una transición de estado de emergencia es permitida
 */
export function canTransitionEmergency(
  from: EmergencyStatus,
  to: EmergencyStatus
): boolean {
  return EMERGENCY_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// CÁLCULO DE FECHAS LÍMITE
// =============================================================================

/**
 * Calcula todas las fechas límite del flujo de emergencia
 */
export function calculateEmergencyDeadlines(
  requestedAt: Date
): {
  verificationDue: Date;
  paymentDue: Date;
  designationDue: Date;
  resolutionDue: Date;
  principalRequestDue: Date;
} {
  // Todas las fechas se calculan secuencialmente en el peor caso
  const verificationDue = addBusinessDays(requestedAt, PLAZOS_EMERGENCIA.VERIFICACION_FORMAL);
  const paymentDue = addBusinessDays(verificationDue, PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO);
  const designationDue = addBusinessDays(paymentDue, PLAZOS_EMERGENCIA.DESIGNACION_ARBITRO);
  const resolutionDue = addBusinessDays(designationDue, PLAZOS_EMERGENCIA.RESOLUCION_ARBITRO);
  const principalRequestDue = addBusinessDays(resolutionDue, PLAZOS_EMERGENCIA.SOLICITUD_PRINCIPAL);

  return {
    verificationDue,
    paymentDue,
    designationDue,
    resolutionDue,
    principalRequestDue,
  };
}

/**
 * Actualiza las fechas límite de una solicitud de emergencia según su estado actual
 */
export function updateEmergencyDeadlines(
  request: EmergencyRequest,
  currentDate: Date = new Date()
): Partial<EmergencyRequest> {
  const updates: Partial<EmergencyRequest> = {};

  switch (request.status) {
    case "PENDING_VERIFICATION":
      // Ya tiene verificationDueAt desde la creación
      break;

    case "PENDING_PAYMENT":
      // Calcular fecha límite de pago desde la verificación
      if (request.verificationCompletedAt && !request.paymentDueAt) {
        updates.paymentDueAt = addBusinessDays(
          request.verificationCompletedAt,
          PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO
        );
      }
      break;

    case "PENDING_DESIGNATION":
      // Calcular fecha límite de designación desde el pago
      if (request.paymentConfirmedAt && !request.designationDueAt) {
        updates.designationDueAt = addBusinessDays(
          request.paymentConfirmedAt,
          PLAZOS_EMERGENCIA.DESIGNACION_ARBITRO
        );
      }
      break;

    case "IN_PROCESS":
      // Calcular fecha límite de resolución desde la aceptación del árbitro
      if (request.arbitratorAcceptedAt && !request.resolutionDueAt) {
        updates.resolutionDueAt = addBusinessDays(
          request.arbitratorAcceptedAt,
          PLAZOS_EMERGENCIA.RESOLUCION_ARBITRO
        );
      }
      break;

    case "RESOLVED":
    case "PENDING_MAIN_CASE":
      // Calcular fecha límite para presentar solicitud principal
      if (request.resolvedAt && !request.principalRequestDueAt) {
        updates.principalRequestDueAt = addBusinessDays(
          request.resolvedAt,
          PLAZOS_EMERGENCIA.SOLICITUD_PRINCIPAL
        );
      }
      break;
  }

  return updates;
}

// =============================================================================
// VERIFICACIÓN DE VENCIMIENTOS
// =============================================================================

/**
 * Resultado de verificación de vencimientos de emergencia
 */
export interface EmergencyDeadlineCheck {
  isOverdue: boolean;
  overdueType?: string;
  daysOverdue?: number;
  nextDeadline?: Date;
  nextDeadlineType?: string;
  suggestedAction?: {
    newStatus: EmergencyStatus;
    reason: string;
    notification: NotificationPayload;
  };
}

/**
 * Verifica si algún plazo de la solicitud de emergencia está vencido
 */
export function checkEmergencyDeadlines(
  request: EmergencyRequest,
  currentDate: Date = new Date()
): EmergencyDeadlineCheck {
  // Verificar según el estado actual
  switch (request.status) {
    case "REQUESTED":
    case "PENDING_VERIFICATION":
      if (request.verificationDueAt && isDeadlineOverdue(request.verificationDueAt, currentDate)) {
        return {
          isOverdue: true,
          overdueType: "VERIFICATION",
          daysOverdue: Math.ceil(
            (currentDate.getTime() - request.verificationDueAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
          suggestedAction: {
            newStatus: "VERIFICATION_FAILED",
            reason: "Plazo de verificación formal excedido",
            notification: {
              event: NOTIFICATION_EVENTS.EMERGENCY_VERIFICATION_PENDING,
              recipientId: request.requesterId,
              recipientEmail: request.requesterEmail,
              channels: ["EMAIL", "SMS"],
              body: "URGENTE: La verificación de su solicitud de emergencia está pendiente y el plazo ha vencido.",
              priority: "CRITICAL",
            },
          },
        };
      }
      return {
        isOverdue: false,
        nextDeadline: request.verificationDueAt,
        nextDeadlineType: "VERIFICATION",
      };

    case "VERIFICATION_FAILED":
      // Verificar plazo de subsanación
      if (request.verificationCompletedAt) {
        const amendmentDeadline = addBusinessDays(
          request.verificationCompletedAt,
          PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO
        );
        if (isDeadlineOverdue(amendmentDeadline, currentDate)) {
          return {
            isOverdue: true,
            overdueType: "AMENDMENT",
            suggestedAction: {
              newStatus: "ARCHIVED",
              reason: "No se subsanaron las observaciones en el plazo establecido",
              notification: {
                event: NOTIFICATION_EVENTS.EMERGENCY_EXPIRED,
                recipientId: request.requesterId,
                recipientEmail: request.requesterEmail,
                channels: ["EMAIL", "SMS"],
                body: "Su solicitud de emergencia ha sido archivada por no subsanar las observaciones en el plazo establecido.",
                priority: "CRITICAL",
              },
            },
          };
        }
      }
      break;

    case "PENDING_PAYMENT":
      if (request.paymentDueAt && isDeadlineOverdue(request.paymentDueAt, currentDate)) {
        return {
          isOverdue: true,
          overdueType: "PAYMENT",
          suggestedAction: {
            newStatus: "PAYMENT_OVERDUE",
            reason: "Pago de tasa de emergencia no realizado en el plazo establecido",
            notification: {
              event: NOTIFICATION_EVENTS.PAYMENT_OVERDUE,
              recipientId: request.requesterId,
              recipientEmail: request.requesterEmail,
              channels: ["EMAIL", "SMS"],
              body: "URGENTE: El plazo para el pago de la tasa de emergencia ha vencido. La solicitud será archivada.",
              priority: "CRITICAL",
            },
          },
        };
      }
      return {
        isOverdue: false,
        nextDeadline: request.paymentDueAt,
        nextDeadlineType: "PAYMENT",
      };

    case "PAYMENT_OVERDUE":
      return {
        isOverdue: true,
        overdueType: "PAYMENT",
        suggestedAction: {
          newStatus: "ARCHIVED",
          reason: "Solicitud archivada por falta de pago",
          notification: {
            event: NOTIFICATION_EVENTS.EMERGENCY_EXPIRED,
            recipientId: request.requesterId,
            recipientEmail: request.requesterEmail,
            channels: ["EMAIL"],
            body: "Su solicitud de emergencia ha sido archivada por falta de pago.",
            priority: "HIGH",
          },
        },
      };

    case "PENDING_DESIGNATION":
    case "DESIGNATION_OVERDUE":
      if (request.designationDueAt && isDeadlineOverdue(request.designationDueAt, currentDate)) {
        // Este vencimiento genera ALERTA AL CONSEJO, no archiva
        return {
          isOverdue: true,
          overdueType: "DESIGNATION",
          daysOverdue: Math.ceil(
            (currentDate.getTime() - request.designationDueAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
          suggestedAction: {
            newStatus: "DESIGNATION_OVERDUE",
            reason: "Plazo de designación de árbitro excedido - Alerta al Consejo",
            notification: {
              event: NOTIFICATION_EVENTS.EMERGENCY_ARBITRATOR_DESIGNATED,
              channels: ["EMAIL", "SMS"],
              body: `ALERTA CRÍTICA: El plazo para designar árbitro de emergencia en la solicitud ha vencido. Requiere acción inmediata del Consejo Superior.`,
              priority: "CRITICAL",
            },
          },
        };
      }
      return {
        isOverdue: false,
        nextDeadline: request.designationDueAt,
        nextDeadlineType: "DESIGNATION",
      };

    case "IN_PROCESS":
      if (request.resolutionDueAt && isDeadlineOverdue(request.resolutionDueAt, currentDate)) {
        // Alerta al árbitro
        return {
          isOverdue: true,
          overdueType: "RESOLUTION",
          daysOverdue: Math.ceil(
            (currentDate.getTime() - request.resolutionDueAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      }
      return {
        isOverdue: false,
        nextDeadline: request.resolutionDueAt,
        nextDeadlineType: "RESOLUTION",
      };

    case "RESOLVED":
    case "PENDING_MAIN_CASE":
      if (request.principalRequestDueAt && isDeadlineOverdue(request.principalRequestDueAt, currentDate)) {
        return {
          isOverdue: true,
          overdueType: "PRINCIPAL_REQUEST",
          suggestedAction: {
            newStatus: "EXPIRED",
            reason: SYSTEM_MESSAGES.EMERGENCY_EXPIRED,
            notification: {
              event: NOTIFICATION_EVENTS.EMERGENCY_EXPIRED,
              recipientId: request.requesterId,
              recipientEmail: request.requesterEmail,
              channels: ["EMAIL", "SMS"],
              body: "La medida de emergencia ha caducado por no presentar la solicitud arbitral principal en el plazo de 15 días hábiles.",
              priority: "CRITICAL",
            },
          },
        };
      }
      return {
        isOverdue: false,
        nextDeadline: request.principalRequestDueAt,
        nextDeadlineType: "PRINCIPAL_REQUEST",
      };
  }

  return { isOverdue: false };
}

// =============================================================================
// GENERACIÓN DE ORDEN DE PAGO DE EMERGENCIA
// =============================================================================

/**
 * Genera la orden de pago para una solicitud de emergencia
 */
export function generateEmergencyPaymentOrder(
  requestId: string,
  arbitrationType: ArbitrationType,
  verificationCompletedAt: Date
) {
  const feeCalculation = calculateEmergencyFee(arbitrationType);

  return createPaymentOrder(
    requestId, // Usamos requestId como referencia temporal
    feeCalculation,
    PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO,
    verificationCompletedAt,
    { type: "EMERGENCY_REQUEST", requestId }
  );
}

// =============================================================================
// RESUMEN Y REPORTES
// =============================================================================

/**
 * Genera un resumen del estado de una solicitud de emergencia
 */
export function generateEmergencySummary(
  request: EmergencyRequest
): {
  status: string;
  statusLabel: string;
  currentPhase: string;
  nextAction: string;
  deadlines: Array<{
    type: string;
    date: Date | undefined;
    status: "PENDING" | "COMPLETED" | "OVERDUE";
    info: ReturnType<typeof formatDeadlineInfo> | null;
  }>;
  criticalAlerts: string[];
} {
  const statusLabels: Record<EmergencyStatus, string> = {
    REQUESTED: "Solicitud Recibida",
    PENDING_VERIFICATION: "En Verificación Formal",
    VERIFICATION_FAILED: "Observada - Requiere Subsanación",
    PENDING_PAYMENT: "Pendiente de Pago",
    PAYMENT_OVERDUE: "Pago Vencido",
    PENDING_DESIGNATION: "Pendiente Designación de Árbitro",
    DESIGNATION_OVERDUE: "Designación Vencida - ALERTA",
    PENDING_ACCEPTANCE: "Esperando Aceptación del Árbitro",
    IN_PROCESS: "En Resolución",
    RESOLVED: "Medida Resuelta",
    PENDING_MAIN_CASE: "Pendiente Solicitud Principal",
    COMPLETED: "Completado",
    EXPIRED: "Caducado",
    ARCHIVED: "Archivado",
  };

  const check = checkEmergencyDeadlines(request);
  const criticalAlerts: string[] = [];

  if (check.isOverdue) {
    criticalAlerts.push(`VENCIDO: ${check.overdueType} (${check.daysOverdue} días)`);
  }

  // Construir lista de plazos
  const deadlines = [
    {
      type: "Verificación Formal",
      date: request.verificationDueAt,
      status: request.verificationCompletedAt
        ? ("COMPLETED" as const)
        : check.overdueType === "VERIFICATION"
          ? ("OVERDUE" as const)
          : ("PENDING" as const),
      info: request.verificationDueAt
        ? formatDeadlineInfo(request.requestedAt, PLAZOS_EMERGENCIA.VERIFICACION_FORMAL)
        : null,
    },
    {
      type: "Pago de Tasa",
      date: request.paymentDueAt,
      status: request.paymentConfirmedAt
        ? ("COMPLETED" as const)
        : check.overdueType === "PAYMENT"
          ? ("OVERDUE" as const)
          : ("PENDING" as const),
      info: request.paymentDueAt && request.verificationCompletedAt
        ? formatDeadlineInfo(request.verificationCompletedAt, PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO)
        : null,
    },
    {
      type: "Designación de Árbitro",
      date: request.designationDueAt,
      status: request.arbitratorDesignatedAt
        ? ("COMPLETED" as const)
        : check.overdueType === "DESIGNATION"
          ? ("OVERDUE" as const)
          : ("PENDING" as const),
      info: request.designationDueAt && request.paymentConfirmedAt
        ? formatDeadlineInfo(request.paymentConfirmedAt, PLAZOS_EMERGENCIA.DESIGNACION_ARBITRO)
        : null,
    },
    {
      type: "Resolución",
      date: request.resolutionDueAt,
      status: request.resolvedAt
        ? ("COMPLETED" as const)
        : check.overdueType === "RESOLUTION"
          ? ("OVERDUE" as const)
          : ("PENDING" as const),
      info: request.resolutionDueAt && request.arbitratorAcceptedAt
        ? formatDeadlineInfo(request.arbitratorAcceptedAt, PLAZOS_EMERGENCIA.RESOLUCION_ARBITRO)
        : null,
    },
    {
      type: "Solicitud Principal",
      date: request.principalRequestDueAt,
      status: request.mainCaseSubmittedAt
        ? ("COMPLETED" as const)
        : check.overdueType === "PRINCIPAL_REQUEST"
          ? ("OVERDUE" as const)
          : ("PENDING" as const),
      info: request.principalRequestDueAt && request.resolvedAt
        ? formatDeadlineInfo(request.resolvedAt, PLAZOS_EMERGENCIA.SOLICITUD_PRINCIPAL)
        : null,
    },
  ];

  // Determinar siguiente acción
  let nextAction = "Ninguna acción pendiente";
  switch (request.status) {
    case "REQUESTED":
    case "PENDING_VERIFICATION":
      nextAction = "Completar verificación formal";
      break;
    case "VERIFICATION_FAILED":
      nextAction = "Esperar subsanación del solicitante";
      break;
    case "PENDING_PAYMENT":
      nextAction = "Esperar confirmación de pago";
      break;
    case "PENDING_DESIGNATION":
    case "DESIGNATION_OVERDUE":
      nextAction = "Consejo debe designar árbitro de emergencia";
      break;
    case "PENDING_ACCEPTANCE":
      nextAction = "Esperar aceptación del árbitro designado";
      break;
    case "IN_PROCESS":
      nextAction = "Árbitro debe emitir resolución";
      break;
    case "RESOLVED":
    case "PENDING_MAIN_CASE":
      nextAction = "Solicitante debe presentar solicitud arbitral principal";
      break;
  }

  return {
    status: request.status,
    statusLabel: statusLabels[request.status],
    currentPhase: statusLabels[request.status],
    nextAction,
    deadlines,
    criticalAlerts,
  };
}
