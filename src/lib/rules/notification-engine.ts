/**
 * CAARD - Motor de Notificaciones
 * ================================
 * Gestiona todas las notificaciones automáticas del sistema.
 *
 * REGLA TRANSVERSAL:
 * Todo acto procesal relevante genera notificación obligatoria.
 * Las notificaciones se realizan por:
 * - Correo electrónico (siempre)
 * - SMS en eventos críticos
 *
 * Todas las notificaciones quedan:
 * - Registradas
 * - Fechadas
 * - Auditadas
 * - Vinculadas al expediente
 */

import {
  NOTIFICATION_EVENTS,
  CRITICAL_NOTIFICATION_EVENTS,
  RECORDATORIOS,
  type NotificationEvent,
} from "./constants";

import type {
  NotificationPayload,
  NotificationRecord,
} from "./types";

// =============================================================================
// CONFIGURACIÓN DE TEMPLATES
// =============================================================================

/**
 * Templates de notificación por evento
 */
export const NOTIFICATION_TEMPLATES: Record<NotificationEvent, {
  subject: string;
  bodyTemplate: string;
  channels: ("EMAIL" | "SMS" | "IN_APP")[];
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
}> = {
  // Solicitud / Admisión
  [NOTIFICATION_EVENTS.CASE_SUBMITTED]: {
    subject: "Solicitud Arbitral Recibida - {{caseCode}}",
    bodyTemplate: `
Estimado/a {{recipientName}},

Hemos recibido su solicitud arbitral con el código {{caseCode}}.

Título: {{caseTitle}}
Fecha de presentación: {{submittedAt}}

Su solicitud será revisada por la Secretaría General. Le notificaremos el resultado de la evaluación a la brevedad.

IMPORTANTE: Para que su solicitud pueda ser admitida, debe completar el pago de la tasa de presentación.

Monto a pagar: {{paymentAmount}}
Fecha límite: {{paymentDueDate}}

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.CASE_OBSERVED]: {
    subject: "Observaciones a su Solicitud - {{caseCode}}",
    bodyTemplate: `
Estimado/a {{recipientName}},

Su solicitud arbitral {{caseCode}} ha sido revisada y presenta las siguientes observaciones:

{{observations}}

Por favor, subsane las observaciones indicadas para continuar con el proceso de admisión.

Plazo para subsanar: {{deadlineDate}}

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.CASE_ADMITTED]: {
    subject: "Solicitud Admitida - {{caseCode}}",
    bodyTemplate: `
Estimado/a {{recipientName}},

Nos es grato comunicarle que su solicitud arbitral {{caseCode}} ha sido ADMITIDA.

Fecha de admisión: {{admittedAt}}
Tipo de arbitraje: {{arbitrationType}}

A partir de este momento, el expediente se encuentra en proceso y se le notificarán las siguientes actuaciones procesales.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.CASE_REJECTED]: {
    subject: "Solicitud Rechazada - {{caseCode}}",
    bodyTemplate: `
Estimado/a {{recipientName}},

Lamentamos informarle que su solicitud arbitral {{caseCode}} ha sido RECHAZADA.

Motivo: {{rejectionReason}}

Si considera que el rechazo no corresponde, puede presentar una nueva solicitud subsanando los motivos indicados.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  // Documentos
  [NOTIFICATION_EVENTS.DOCUMENT_UPLOADED]: {
    subject: "Nuevo Documento - {{caseCode}}",
    bodyTemplate: `
Se ha cargado un nuevo documento en el expediente {{caseCode}}.

Documento: {{documentName}}
Tipo: {{documentType}}
Cargado por: {{uploadedBy}}
Fecha: {{uploadedAt}}

Puede acceder al documento desde el sistema.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "LOW",
  },

  [NOTIFICATION_EVENTS.DOCUMENT_REPLACED]: {
    subject: "Documento Actualizado - {{caseCode}}",
    bodyTemplate: `
Un documento ha sido reemplazado en el expediente {{caseCode}}.

Documento: {{documentName}}
Versión anterior: {{previousVersion}}
Nueva versión: {{newVersion}}
Actualizado por: {{updatedBy}}

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "LOW",
  },

  // Plazos
  [NOTIFICATION_EVENTS.DEADLINE_CREATED]: {
    subject: "Nuevo Plazo - {{caseCode}}",
    bodyTemplate: `
Se ha establecido un nuevo plazo en el expediente {{caseCode}}.

Plazo: {{deadlineTitle}}
Descripción: {{deadlineDescription}}
Fecha límite: {{dueDate}}
Días hábiles: {{businessDays}}

Por favor, tome las acciones necesarias dentro del plazo establecido.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.DEADLINE_REMINDER]: {
    subject: "Recordatorio de Plazo - {{caseCode}}",
    bodyTemplate: `
Le recordamos que tiene un plazo próximo a vencer en el expediente {{caseCode}}.

Plazo: {{deadlineTitle}}
Fecha límite: {{dueDate}}
Días restantes: {{daysRemaining}}

Por favor, tome las acciones necesarias.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.DEADLINE_URGENT]: {
    subject: "⚠️ URGENTE: Plazo por Vencer - {{caseCode}}",
    bodyTemplate: `
ATENCIÓN: Tiene un plazo a punto de vencer.

Expediente: {{caseCode}}
Plazo: {{deadlineTitle}}
Fecha límite: {{dueDate}}
Días restantes: {{daysRemaining}}

Este es un recordatorio urgente. Por favor, tome acción inmediata.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.DEADLINE_OVERDUE]: {
    subject: "⛔ PLAZO VENCIDO - {{caseCode}}",
    bodyTemplate: `
IMPORTANTE: El siguiente plazo ha vencido.

Expediente: {{caseCode}}
Plazo: {{deadlineTitle}}
Fecha de vencimiento: {{dueDate}}
Días de retraso: {{daysOverdue}}

Por favor, contacte a la Secretaría para conocer las consecuencias y posibles acciones.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  // Audiencias
  [NOTIFICATION_EVENTS.HEARING_SCHEDULED]: {
    subject: "Audiencia Programada - {{caseCode}}",
    bodyTemplate: `
Se ha programado una audiencia para el expediente {{caseCode}}.

Audiencia: {{hearingTitle}}
Fecha y hora: {{hearingDateTime}}
Lugar/Modalidad: {{hearingLocation}}

{{#if hearingUrl}}
Enlace de videoconferencia: {{hearingUrl}}
{{/if}}

Por favor, confirme su asistencia.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.HEARING_UPDATED]: {
    subject: "Audiencia Modificada - {{caseCode}}",
    bodyTemplate: `
La audiencia del expediente {{caseCode}} ha sido modificada.

Audiencia: {{hearingTitle}}
Nueva fecha y hora: {{hearingDateTime}}
Lugar/Modalidad: {{hearingLocation}}

{{#if changes}}
Cambios realizados: {{changes}}
{{/if}}

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.HEARING_REMINDER]: {
    subject: "Recordatorio de Audiencia - {{caseCode}}",
    bodyTemplate: `
Le recordamos que tiene una audiencia programada próximamente.

Expediente: {{caseCode}}
Audiencia: {{hearingTitle}}
Fecha y hora: {{hearingDateTime}}
Lugar/Modalidad: {{hearingLocation}}

{{#if hearingUrl}}
Enlace: {{hearingUrl}}
{{/if}}

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.HEARING_CANCELLED]: {
    subject: "Audiencia Cancelada - {{caseCode}}",
    bodyTemplate: `
La siguiente audiencia ha sido cancelada.

Expediente: {{caseCode}}
Audiencia: {{hearingTitle}}
Fecha original: {{hearingDateTime}}

Motivo: {{cancellationReason}}

Se le notificará cuando se reprograme.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  // Pagos
  [NOTIFICATION_EVENTS.PAYMENT_ORDER_ISSUED]: {
    subject: "Orden de Pago Emitida - {{caseCode}}",
    bodyTemplate: `
Se ha emitido una orden de pago para el expediente {{caseCode}}.

Concepto: {{paymentConcept}}
Monto: {{paymentAmount}}
Fecha límite de pago: {{paymentDueDate}}

IMPORTANTE: El expediente no podrá avanzar hasta completar este pago.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.PAYMENT_REMINDER]: {
    subject: "Recordatorio de Pago - {{caseCode}}",
    bodyTemplate: `
Le recordamos que tiene un pago pendiente.

Expediente: {{caseCode}}
Concepto: {{paymentConcept}}
Monto: {{paymentAmount}}
Fecha límite: {{paymentDueDate}}
Días restantes: {{daysRemaining}}

Por favor, realice el pago a la brevedad.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.PAYMENT_URGENT]: {
    subject: "⚠️ URGENTE: Pago por Vencer - {{caseCode}}",
    bodyTemplate: `
ATENCIÓN: El plazo de pago está por vencer.

Expediente: {{caseCode}}
Concepto: {{paymentConcept}}
Monto: {{paymentAmount}}
Fecha límite: {{paymentDueDate}}

Si no realiza el pago, el expediente será SUSPENDIDO automáticamente.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  [NOTIFICATION_EVENTS.PAYMENT_RECEIVED]: {
    subject: "Pago Recibido - {{caseCode}}",
    bodyTemplate: `
Hemos recibido su pago para el expediente {{caseCode}}.

Concepto: {{paymentConcept}}
Monto: {{paymentAmount}}
Fecha de pago: {{paidAt}}
Referencia: {{paymentReference}}

El expediente puede continuar con su trámite normal.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.PAYMENT_OVERDUE]: {
    subject: "⛔ PAGO VENCIDO - Expediente Suspendido - {{caseCode}}",
    bodyTemplate: `
IMPORTANTE: El plazo de pago ha vencido.

Expediente: {{caseCode}}
Concepto: {{paymentConcept}}
Monto: {{paymentAmount}}
Fecha de vencimiento: {{paymentDueDate}}

El expediente ha sido SUSPENDIDO automáticamente.
No se podrán realizar actuaciones procesales hasta regularizar el pago.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  [NOTIFICATION_EVENTS.PAYMENT_REFUND_PROCESSED]: {
    subject: "Devolución Procesada - {{caseCode}}",
    bodyTemplate: `
Se ha procesado una devolución de honorarios.

Expediente: {{caseCode}}
Etapa de terminación: {{stage}}
Monto original: {{originalAmount}}
Porcentaje de devolución: {{refundPercentage}}%
Monto a devolver: {{refundAmount}}

La devolución será procesada en los próximos días hábiles.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  // Árbitros
  [NOTIFICATION_EVENTS.ARBITRATOR_DESIGNATED]: {
    subject: "Árbitro Designado - {{caseCode}}",
    bodyTemplate: `
Se ha designado árbitro para el expediente {{caseCode}}.

Árbitro: {{arbitratorName}}
Especialidad: {{arbitratorSpecialty}}

El árbitro designado cuenta con un plazo para aceptar o rechazar el cargo.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.ARBITRATOR_ACCEPTED]: {
    subject: "Árbitro Aceptó el Cargo - {{caseCode}}",
    bodyTemplate: `
El árbitro designado ha ACEPTADO el cargo en el expediente {{caseCode}}.

Árbitro: {{arbitratorName}}
Fecha de aceptación: {{acceptedAt}}

El proceso arbitral puede continuar.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.ARBITRATOR_REJECTED]: {
    subject: "Árbitro Rechazó el Cargo - {{caseCode}}",
    bodyTemplate: `
El árbitro designado ha rechazado el cargo en el expediente {{caseCode}}.

Árbitro: {{arbitratorName}}
Motivo: {{rejectionReason}}

Se procederá a designar un nuevo árbitro.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.ARBITRATOR_RECUSATION_FILED]: {
    subject: "Recusación Presentada - {{caseCode}}",
    bodyTemplate: `
Se ha presentado una recusación contra el árbitro en el expediente {{caseCode}}.

Árbitro recusado: {{arbitratorName}}
Solicitante: {{requesterName}}
Motivo: {{recusationReason}}

Se ha corrido traslado a las partes. Plazo para absolver: 5 días hábiles.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.ARBITRATOR_RECUSATION_RESOLVED]: {
    subject: "Recusación Resuelta - {{caseCode}}",
    bodyTemplate: `
El Consejo Superior ha resuelto la recusación en el expediente {{caseCode}}.

Decisión: {{decision}}
Resolución: {{resolution}}

{{#if newArbitrator}}
Nuevo árbitro designado: {{newArbitrator}}
{{/if}}

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.ARBITRATOR_SANCTIONED]: {
    subject: "Sanción a Árbitro",
    bodyTemplate: `
Se ha impuesto una sanción al árbitro {{arbitratorName}}.

Tipo de sanción: {{sanctionType}}
Motivo: {{sanctionReason}}
Vigencia: {{sanctionPeriod}}

Esta sanción afecta la disponibilidad del árbitro para nuevas designaciones.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL"],
    priority: "HIGH",
  },

  // Emergencia
  [NOTIFICATION_EVENTS.EMERGENCY_REQUEST_RECEIVED]: {
    subject: "🚨 Solicitud de Emergencia Recibida",
    bodyTemplate: `
Se ha recibido una solicitud de ARBITRAJE DE EMERGENCIA.

Solicitante: {{requesterName}}
Título: {{emergencyTitle}}

Esta solicitud requiere atención INMEDIATA.
Plazo para verificación formal: 1 día hábil

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  [NOTIFICATION_EVENTS.EMERGENCY_VERIFICATION_PENDING]: {
    subject: "🚨 Verificación de Emergencia Pendiente",
    bodyTemplate: `
ALERTA: La verificación formal de la solicitud de emergencia está pendiente.

Solicitante: {{requesterName}}
Fecha límite de verificación: {{verificationDueDate}}

Este plazo es de 1 día hábil y no puede excederse.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS"],
    priority: "CRITICAL",
  },

  [NOTIFICATION_EVENTS.EMERGENCY_ARBITRATOR_DESIGNATED]: {
    subject: "🚨 Árbitro de Emergencia Designado",
    bodyTemplate: `
Se ha designado árbitro de emergencia.

Solicitud: {{emergencyTitle}}
Árbitro designado: {{arbitratorName}}
Plazo para resolución: 4 días hábiles

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  [NOTIFICATION_EVENTS.EMERGENCY_RESOLVED]: {
    subject: "🚨 Medida de Emergencia Resuelta",
    bodyTemplate: `
El árbitro de emergencia ha emitido su resolución.

Solicitud: {{emergencyTitle}}
Resolución: {{resolution}}
Fecha: {{resolvedAt}}

IMPORTANTE: Tiene 15 días hábiles para presentar la solicitud arbitral principal.
Fecha límite: {{principalRequestDueDate}}

Si no presenta la solicitud principal, la medida de emergencia CADUCARÁ.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  [NOTIFICATION_EVENTS.EMERGENCY_EXPIRED]: {
    subject: "⛔ Medida de Emergencia CADUCADA",
    bodyTemplate: `
La medida de emergencia ha CADUCADO.

Solicitud: {{emergencyTitle}}
Motivo: No se presentó la solicitud arbitral principal en el plazo de 15 días hábiles.

La medida de emergencia ya no tiene efecto.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  // Suspensión / Cierre
  [NOTIFICATION_EVENTS.CASE_SUSPENDED]: {
    subject: "⛔ Expediente Suspendido - {{caseCode}}",
    bodyTemplate: `
El expediente {{caseCode}} ha sido SUSPENDIDO.

Motivo: {{suspensionReason}}
Fecha: {{suspendedAt}}

No se podrán realizar actuaciones procesales hasta que se levante la suspensión.

Para reactivar el expediente, contacte a la Secretaría General.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "SMS", "IN_APP"],
    priority: "CRITICAL",
  },

  [NOTIFICATION_EVENTS.CASE_REACTIVATED]: {
    subject: "✅ Expediente Reactivado - {{caseCode}}",
    bodyTemplate: `
El expediente {{caseCode}} ha sido REACTIVADO.

Motivo: {{reactivationReason}}
Fecha: {{reactivatedAt}}

El proceso arbitral puede continuar normalmente.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },

  [NOTIFICATION_EVENTS.CASE_CLOSED]: {
    subject: "Expediente Cerrado - {{caseCode}}",
    bodyTemplate: `
El expediente {{caseCode}} ha sido CERRADO.

Motivo: {{closureReason}}
Fecha de cierre: {{closedAt}}

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "NORMAL",
  },

  [NOTIFICATION_EVENTS.AWARD_ISSUED]: {
    subject: "Laudo Emitido - {{caseCode}}",
    bodyTemplate: `
Se ha emitido el LAUDO en el expediente {{caseCode}}.

Fecha de emisión: {{issuedAt}}

El laudo se encuentra disponible en el sistema para su consulta.

Atentamente,
Centro de Arbitraje CAARD
    `,
    channels: ["EMAIL", "IN_APP"],
    priority: "HIGH",
  },
};

// =============================================================================
// FUNCIONES DE CREACIÓN DE NOTIFICACIONES
// =============================================================================

/**
 * Crea una notificación a partir de un evento y datos
 */
export function createNotification(
  event: NotificationEvent,
  data: Record<string, unknown>,
  recipientInfo: {
    id?: string;
    email?: string;
    phone?: string;
  },
  scheduledFor?: Date
): NotificationPayload {
  const template = NOTIFICATION_TEMPLATES[event];

  if (!template) {
    throw new Error(`No existe template para el evento: ${event}`);
  }

  // Determinar canales
  let channels = [...template.channels];

  // Si es evento crítico, asegurar SMS si hay teléfono
  if (CRITICAL_NOTIFICATION_EVENTS.includes(event) && recipientInfo.phone) {
    if (!channels.includes("SMS")) {
      channels.push("SMS");
    }
  }

  // Renderizar subject y body con los datos
  const subject = renderTemplate(template.subject, data);
  const body = renderTemplate(template.bodyTemplate, data);

  return {
    event,
    recipientId: recipientInfo.id,
    recipientEmail: recipientInfo.email,
    recipientPhone: recipientInfo.phone,
    channels,
    subject,
    body,
    templateKey: event,
    templateData: data,
    priority: template.priority,
    scheduledFor,
  };
}

/**
 * Renderiza un template con datos
 * (Implementación simple - en producción usar Handlebars o similar)
 */
function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;

  // Reemplazar variables simples {{variable}}
  const simpleVarRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(simpleVarRegex, (_, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : "";
  });

  // Manejar condicionales simples {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (_, key, content) => {
    return data[key] ? content : "";
  });

  return result.trim();
}

// =============================================================================
// FUNCIONES DE PROGRAMACIÓN DE RECORDATORIOS
// =============================================================================

/**
 * Genera las notificaciones de recordatorio para un plazo
 */
export function scheduleDeadlineReminders(
  event: NotificationEvent,
  dueDate: Date,
  caseId: string,
  data: Record<string, unknown>,
  recipientInfo: {
    id?: string;
    email?: string;
    phone?: string;
  }
): NotificationPayload[] {
  const reminders: NotificationPayload[] = [];
  const now = new Date();

  // Recordatorio 3 días antes
  const reminder3Days = new Date(dueDate);
  reminder3Days.setDate(reminder3Days.getDate() - RECORDATORIOS.PRIMER_AVISO);
  if (reminder3Days > now) {
    reminders.push(createNotification(
      NOTIFICATION_EVENTS.DEADLINE_REMINDER,
      { ...data, daysRemaining: RECORDATORIOS.PRIMER_AVISO, caseId },
      recipientInfo,
      reminder3Days
    ));
  }

  // Recordatorio 1 día antes (urgente)
  const reminder1Day = new Date(dueDate);
  reminder1Day.setDate(reminder1Day.getDate() - RECORDATORIOS.SEGUNDO_AVISO);
  if (reminder1Day > now) {
    reminders.push(createNotification(
      NOTIFICATION_EVENTS.DEADLINE_URGENT,
      { ...data, daysRemaining: RECORDATORIOS.SEGUNDO_AVISO, caseId },
      recipientInfo,
      reminder1Day
    ));
  }

  return reminders;
}

/**
 * Genera las notificaciones de recordatorio para un pago
 */
export function schedulePaymentReminders(
  dueDate: Date,
  caseId: string,
  paymentData: Record<string, unknown>,
  recipientInfo: {
    id?: string;
    email?: string;
    phone?: string;
  }
): NotificationPayload[] {
  const reminders: NotificationPayload[] = [];
  const now = new Date();

  // Recordatorio 3 días antes
  const reminder3Days = new Date(dueDate);
  reminder3Days.setDate(reminder3Days.getDate() - RECORDATORIOS.PRIMER_AVISO);
  if (reminder3Days > now) {
    reminders.push(createNotification(
      NOTIFICATION_EVENTS.PAYMENT_REMINDER,
      { ...paymentData, daysRemaining: RECORDATORIOS.PRIMER_AVISO, caseId },
      recipientInfo,
      reminder3Days
    ));
  }

  // Recordatorio 1 día antes (urgente)
  const reminder1Day = new Date(dueDate);
  reminder1Day.setDate(reminder1Day.getDate() - RECORDATORIOS.SEGUNDO_AVISO);
  if (reminder1Day > now) {
    reminders.push(createNotification(
      NOTIFICATION_EVENTS.PAYMENT_URGENT,
      { ...paymentData, daysRemaining: RECORDATORIOS.SEGUNDO_AVISO, caseId },
      recipientInfo,
      reminder1Day
    ));
  }

  return reminders;
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Verifica si un evento es crítico y requiere SMS
 */
export function isCriticalEvent(event: NotificationEvent): boolean {
  return CRITICAL_NOTIFICATION_EVENTS.includes(event);
}

/**
 * Obtiene la configuración de un template
 */
export function getTemplateConfig(event: NotificationEvent) {
  return NOTIFICATION_TEMPLATES[event];
}

/**
 * Lista todos los eventos de notificación disponibles
 */
export function listNotificationEvents(): Array<{
  event: NotificationEvent;
  subject: string;
  priority: string;
  isCritical: boolean;
}> {
  return Object.entries(NOTIFICATION_TEMPLATES).map(([event, config]) => ({
    event: event as NotificationEvent,
    subject: config.subject,
    priority: config.priority,
    isCritical: CRITICAL_NOTIFICATION_EVENTS.includes(event as NotificationEvent),
  }));
}
