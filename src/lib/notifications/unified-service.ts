/**
 * CAARD - Servicio Unificado de Notificaciones
 * Centraliza el envío por Email, SMS y WhatsApp
 * Integrado con sistema de plantillas personalizables por centro
 */

import { prisma } from "@/lib/prisma";
import { sendEmail, sendCaseNotification as sendCaseEmail, sendWelcomeEmail } from "@/lib/email/service";
import { sendSms, sendCaseNotificationSms, sendReminderSms, sendOtpSms } from "@/lib/sms/service";
import { sendWhatsApp, sendCaseNotificationWhatsApp, sendReminderWhatsApp, sendOtpWhatsApp } from "@/lib/whatsapp/service";
import { getRenderedTemplate, TemplateType, TemplateVariables } from "./template-service";

// Canales de notificación
export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP";

// Tipos de notificación
export type NotificationType =
  | "OTP"
  | "WELCOME"
  | "CASE_ACTION"
  | "DEADLINE_REMINDER"
  | "HEARING_REMINDER"
  | "PAYMENT_REMINDER"
  | "DOCUMENT_NOTIFICATION"
  | "GENERAL";

// Preferencias del usuario
interface UserNotificationPrefs {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

// Parámetros de notificación
export interface NotificationParams {
  userId?: string;
  email?: string;
  phone?: string;
  type: NotificationType;
  priority?: "low" | "normal" | "high" | "urgent";
  channels?: NotificationChannel[];
  data: {
    subject?: string;
    title?: string;
    message: string;
    htmlMessage?: string;
    caseNumber?: string;
    caseName?: string;
    action?: string;
    dueDate?: Date;
    link?: string;
    attachments?: { filename: string; url: string }[];
    [key: string]: any;
  };
}

// Resultado de envío
export interface NotificationResult {
  success: boolean;
  channels: {
    channel: NotificationChannel;
    success: boolean;
    messageId?: string;
    error?: string;
  }[];
}

/**
 * Obtiene las preferencias de notificación del usuario
 */
async function getUserPreferences(userId: string): Promise<UserNotificationPrefs> {
  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (prefs) {
      return {
        email: prefs.emailEnabled,
        sms: prefs.smsEnabled,
        whatsapp: prefs.whatsappEnabled,
        push: prefs.pushEnabled,
      };
    }
  } catch (error) {
    console.error("Error getting user preferences:", error);
  }

  // Preferencias por defecto
  return {
    email: true,
    sms: false,
    whatsapp: true,
    push: true,
  };
}

/**
 * Obtiene los datos de contacto del usuario
 */
async function getUserContact(userId: string): Promise<{ email?: string; phone?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    return {
      email: user?.email || undefined,
      phone: user?.phone || undefined,
    };
  } catch (error) {
    console.error("Error getting user contact:", error);
    return {};
  }
}

/**
 * Determina los canales a usar basándose en tipo, prioridad y preferencias
 */
function determineChannels(
  type: NotificationType,
  priority: string,
  prefs: UserNotificationPrefs,
  requestedChannels?: NotificationChannel[]
): NotificationChannel[] {
  // Si se especifican canales, respetar esas preferencias
  if (requestedChannels && requestedChannels.length > 0) {
    return requestedChannels.filter((ch) => {
      if (ch === "EMAIL") return prefs.email;
      if (ch === "SMS") return prefs.sms;
      if (ch === "WHATSAPP") return prefs.whatsapp;
      return true;
    });
  }

  const channels: NotificationChannel[] = [];

  // OTP siempre usa canales rápidos
  if (type === "OTP") {
    if (prefs.whatsapp) channels.push("WHATSAPP");
    if (prefs.sms) channels.push("SMS");
    if (channels.length === 0 && prefs.email) channels.push("EMAIL");
    return channels;
  }

  // Prioridad urgente/alta usa todos los canales disponibles
  if (priority === "urgent" || priority === "high") {
    if (prefs.email) channels.push("EMAIL");
    if (prefs.whatsapp) channels.push("WHATSAPP");
    if (prefs.sms) channels.push("SMS");
    return channels;
  }

  // Notificaciones normales preferiblemente por email y WhatsApp
  if (prefs.email) channels.push("EMAIL");
  if (prefs.whatsapp) channels.push("WHATSAPP");

  // Si no hay canales disponibles, intentar SMS
  if (channels.length === 0 && prefs.sms) {
    channels.push("SMS");
  }

  return channels;
}

/**
 * Envía una notificación por múltiples canales
 */
export async function sendNotification(params: NotificationParams): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    channels: [],
  };

  try {
    // Obtener contacto del usuario
    let email = params.email;
    let phone = params.phone;

    if (params.userId) {
      const contact = await getUserContact(params.userId);
      email = email || contact.email;
      phone = phone || contact.phone;
    }

    // Obtener preferencias del usuario
    const prefs = params.userId
      ? await getUserPreferences(params.userId)
      : { email: true, sms: true, whatsapp: true, push: true };

    // Determinar canales
    const channels = determineChannels(
      params.type,
      params.priority || "normal",
      prefs,
      params.channels
    );

    // Enviar por cada canal
    for (const channel of channels) {
      const channelResult = {
        channel,
        success: false,
        messageId: undefined as string | undefined,
        error: undefined as string | undefined,
      };

      try {
        switch (channel) {
          case "EMAIL":
            if (email) {
              const emailResult = await sendEmail({
                to: email,
                subject: params.data.subject || params.data.title || "Notificación CAARD",
                html: params.data.htmlMessage || `<p>${params.data.message}</p>`,
                text: params.data.message,
              });
              channelResult.success = emailResult.success;
              channelResult.messageId = emailResult.messageId;
              channelResult.error = emailResult.error;
            } else {
              channelResult.error = "No email address available";
            }
            break;

          case "SMS":
            if (phone) {
              const smsResult = await sendSms({
                to: phone,
                message: params.data.message.substring(0, 160),
              });
              channelResult.success = smsResult.success;
              channelResult.messageId = smsResult.messageId;
              channelResult.error = smsResult.error;
            } else {
              channelResult.error = "No phone number available";
            }
            break;

          case "WHATSAPP":
            if (phone) {
              const waResult = await sendWhatsApp({
                to: phone,
                message: params.data.message,
              });
              channelResult.success = waResult.success;
              channelResult.messageId = waResult.messageId;
              channelResult.error = waResult.error;
            } else {
              channelResult.error = "No phone number available";
            }
            break;

          case "IN_APP":
            // Crear notificación en la base de datos
            if (params.userId) {
              await prisma.notification.create({
                data: {
                  userId: params.userId,
                  type: mapNotificationType(params.type),
                  title: params.data.title || params.data.subject || "Notificación",
                  message: params.data.message,
                  metadata: params.data,
                  isRead: false,
                },
              });
              channelResult.success = true;
            } else {
              channelResult.error = "User ID required for in-app notifications";
            }
            break;

          default:
            channelResult.error = `Channel ${channel} not implemented`;
        }
      } catch (error) {
        channelResult.error = error instanceof Error ? error.message : "Unknown error";
      }

      result.channels.push(channelResult);
    }

    // Éxito si al menos un canal funcionó
    result.success = result.channels.some((ch) => ch.success);

    // Log el resultado
    console.log("Notification sent:", {
      type: params.type,
      channels: result.channels.map((ch) => `${ch.channel}:${ch.success ? "OK" : "FAILED"}`),
    });

    return result;
  } catch (error) {
    console.error("Error sending notification:", error);
    result.channels.push({
      channel: "EMAIL",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return result;
  }
}

/**
 * Mapea tipo de notificación al enum de la BD
 */
function mapNotificationType(type: NotificationType): string {
  const mapping: Record<NotificationType, string> = {
    OTP: "GENERAL",
    WELCOME: "GENERAL",
    CASE_ACTION: "CASE_UPDATE",
    DEADLINE_REMINDER: "DEADLINE",
    HEARING_REMINDER: "HEARING",
    PAYMENT_REMINDER: "PAYMENT",
    DOCUMENT_NOTIFICATION: "DOCUMENT",
    GENERAL: "GENERAL",
  };
  return mapping[type] || "GENERAL";
}

/**
 * Envía código OTP por todos los canales disponibles
 */
export async function sendOtpNotification(params: {
  userId?: string;
  email?: string;
  phone?: string;
  code: string;
  expiresInMinutes?: number;
}): Promise<NotificationResult> {
  const expiry = params.expiresInMinutes || 5;

  return sendNotification({
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    type: "OTP",
    priority: "urgent",
    data: {
      subject: "CAARD - Código de verificación",
      title: "Código de Verificación",
      message: `Su código de verificación es: ${params.code}. Válido por ${expiry} minutos.`,
      code: params.code,
      expiresInMinutes: expiry,
    },
  });
}

/**
 * Notifica acción en caso a todas las partes relevantes
 */
export async function notifyCaseAction(params: {
  caseId: string;
  caseNumber: string;
  caseName: string;
  action: string;
  description: string;
  actionBy?: string;
  dueDate?: Date;
  priority?: "normal" | "urgent";
  excludeUserIds?: string[];
  notifyRoles?: string[];
}): Promise<{ notified: number; failed: number }> {
  let notified = 0;
  let failed = 0;

  try {
    // Obtener miembros del caso
    const caseMembers = await prisma.caseMember.findMany({
      where: {
        caseId: params.caseId,
        ...(params.notifyRoles && params.notifyRoles.length > 0
          ? { role: { in: params.notifyRoles as any } }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Filtrar usuarios excluidos y asegurar que tienen usuario vinculado
    const usersToNotify = caseMembers
      .filter((m) => m.userId && m.user && !params.excludeUserIds?.includes(m.userId))
      .map((m) => m.user!);

    // Enviar notificación a cada usuario
    for (const user of usersToNotify) {
      const result = await sendNotification({
        userId: user.id,
        email: user.email,
        phone: user.phone || undefined,
        type: "CASE_ACTION",
        priority: params.priority || "normal",
        channels: ["EMAIL", "WHATSAPP", "IN_APP"],
        data: {
          subject: `[${params.caseNumber}] ${params.action}`,
          title: params.action,
          message: params.description,
          caseNumber: params.caseNumber,
          caseName: params.caseName,
          action: params.action,
          actionBy: params.actionBy,
          dueDate: params.dueDate,
          link: `/cases/${params.caseId}`,
        },
      });

      if (result.success) {
        notified++;
      } else {
        failed++;
      }
    }

    return { notified, failed };
  } catch (error) {
    console.error("Error notifying case action:", error);
    return { notified, failed: failed + 1 };
  }
}

/**
 * Envía recordatorio de plazo
 */
export async function sendDeadlineReminder(params: {
  userId: string;
  email?: string;
  phone?: string;
  caseNumber: string;
  caseName: string;
  deadlineTitle: string;
  dueDate: Date;
  daysRemaining: number;
}): Promise<NotificationResult> {
  const priority = params.daysRemaining <= 1 ? "urgent" : params.daysRemaining <= 3 ? "high" : "normal";

  return sendNotification({
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    type: "DEADLINE_REMINDER",
    priority,
    channels: ["EMAIL", "WHATSAPP", "IN_APP"],
    data: {
      subject: `[${params.caseNumber}] Recordatorio: ${params.deadlineTitle}`,
      title: `Recordatorio de Plazo`,
      message: `Plazo "${params.deadlineTitle}" vence ${params.daysRemaining === 0 ? "HOY" : `en ${params.daysRemaining} día(s)`} - ${params.caseName}`,
      caseNumber: params.caseNumber,
      caseName: params.caseName,
      deadlineTitle: params.deadlineTitle,
      dueDate: params.dueDate,
      daysRemaining: params.daysRemaining,
    },
  });
}

/**
 * Encola una notificación para envío posterior
 */
export async function queueNotification(params: {
  userId?: string;
  caseId?: string;
  email?: string;
  phone?: string;
  channel: NotificationChannel;
  eventType?: string;
  subject?: string;
  body: string;
  scheduledAt?: Date;
}): Promise<string> {
  const notification = await prisma.notificationQueue.create({
    data: {
      userId: params.userId,
      caseId: params.caseId,
      toEmail: params.email,
      toPhoneE164: params.phone,
      channel: params.channel,
      eventType: (params.eventType || "GENERAL") as any,
      subject: params.subject,
      body: params.body,
      status: "QUEUED",
      scheduledAt: params.scheduledAt,
    },
  });

  return notification.id;
}

/**
 * Procesa todas las colas de notificación
 */
export async function processAllQueues(limit = 50): Promise<{
  email: { processed: number; failed: number };
  sms: { processed: number; failed: number };
  whatsapp: { processed: number; failed: number };
}> {
  const { processNotificationQueue: processEmail } = await import("@/lib/email/service");
  const { processSmsQueue } = await import("@/lib/sms/service");
  const { processWhatsAppQueue } = await import("@/lib/whatsapp/service");

  const [emailResult, smsResult, whatsappResult] = await Promise.all([
    processEmail(limit),
    processSmsQueue(limit),
    processWhatsAppQueue(limit),
  ]);

  return {
    email: { processed: emailResult.processed, failed: emailResult.failed },
    sms: { processed: smsResult.processed, failed: smsResult.failed },
    whatsapp: { processed: whatsappResult.processed, failed: whatsappResult.failed },
  };
}

/**
 * Envía notificación usando plantillas del centro
 * Esta función busca la plantilla apropiada y la renderiza con las variables
 */
export async function sendTemplatedNotification(params: {
  userId?: string;
  email?: string;
  phone?: string;
  templateType: TemplateType;
  templateCode?: string;
  centerId?: string | null;
  variables: TemplateVariables;
  priority?: "low" | "normal" | "high" | "urgent";
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    channels: [],
  };

  try {
    // Obtener plantilla renderizada
    const template = await getRenderedTemplate(
      params.templateType,
      params.variables,
      params.centerId,
      params.templateCode
    );

    if (!template) {
      console.error("No template found for type:", params.templateType);
      return {
        success: false,
        channels: [{
          channel: "EMAIL",
          success: false,
          error: "No se encontró plantilla para este tipo de notificación",
        }],
      };
    }

    // Obtener contacto del usuario si es necesario
    let email = params.email;
    let phone = params.phone;

    if (params.userId) {
      const contact = await getUserContact(params.userId);
      email = email || contact.email;
      phone = phone || contact.phone;
    }

    // Obtener preferencias del usuario
    const prefs = params.userId
      ? await getUserPreferences(params.userId)
      : { email: true, sms: true, whatsapp: true, push: true };

    // Mapear tipo de plantilla a tipo de notificación
    const notificationType = mapTemplateTypeToNotificationType(params.templateType);

    // Determinar canales
    const channels = determineChannels(
      notificationType,
      params.priority || "normal",
      prefs,
      params.channels
    );

    // Enviar por cada canal
    for (const channel of channels) {
      const channelResult = {
        channel,
        success: false,
        messageId: undefined as string | undefined,
        error: undefined as string | undefined,
      };

      try {
        switch (channel) {
          case "EMAIL":
            if (email && template.emailSubject) {
              const emailResult = await sendEmail({
                to: email,
                subject: template.emailSubject,
                html: template.emailHtmlBody || `<pre style="white-space: pre-wrap; font-family: sans-serif;">${template.emailBody}</pre>`,
                text: template.emailBody || "",
              });
              channelResult.success = emailResult.success;
              channelResult.messageId = emailResult.messageId;
              channelResult.error = emailResult.error;
            } else {
              channelResult.error = email ? "No email template content" : "No email address available";
            }
            break;

          case "SMS":
            if (phone && template.smsBody) {
              const smsResult = await sendSms({
                to: phone,
                message: template.smsBody.substring(0, 160),
              });
              channelResult.success = smsResult.success;
              channelResult.messageId = smsResult.messageId;
              channelResult.error = smsResult.error;
            } else {
              channelResult.error = phone ? "No SMS template content" : "No phone number available";
            }
            break;

          case "WHATSAPP":
            if (phone && template.whatsappBody) {
              const waResult = await sendWhatsApp({
                to: phone,
                message: template.whatsappBody,
              });
              channelResult.success = waResult.success;
              channelResult.messageId = waResult.messageId;
              channelResult.error = waResult.error;
            } else {
              channelResult.error = phone ? "No WhatsApp template content" : "No phone number available";
            }
            break;

          case "IN_APP":
            if (params.userId) {
              await prisma.notification.create({
                data: {
                  userId: params.userId,
                  type: mapNotificationType(notificationType),
                  title: template.emailSubject || "Notificación",
                  message: template.emailBody || template.smsBody || "Nueva notificación",
                  metadata: params.variables,
                  isRead: false,
                },
              });
              channelResult.success = true;
            } else {
              channelResult.error = "User ID required for in-app notifications";
            }
            break;

          default:
            channelResult.error = `Channel ${channel} not implemented`;
        }
      } catch (error) {
        channelResult.error = error instanceof Error ? error.message : "Unknown error";
      }

      result.channels.push(channelResult);
    }

    // Éxito si al menos un canal funcionó
    result.success = result.channels.some((ch) => ch.success);

    console.log("Templated notification sent:", {
      type: params.templateType,
      channels: result.channels.map((ch) => `${ch.channel}:${ch.success ? "OK" : "FAILED"}`),
    });

    return result;
  } catch (error) {
    console.error("Error sending templated notification:", error);
    result.channels.push({
      channel: "EMAIL",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return result;
  }
}

/**
 * Mapea tipo de plantilla a tipo de notificación
 */
function mapTemplateTypeToNotificationType(templateType: TemplateType): NotificationType {
  const mapping: Record<TemplateType, NotificationType> = {
    TRASLADO: "DOCUMENT_NOTIFICATION",
    NOTIFICACION_ADMISION: "CASE_ACTION",
    NOTIFICACION_RECHAZO: "CASE_ACTION",
    NOTIFICACION_AUDIENCIA: "HEARING_REMINDER",
    NOTIFICACION_LAUDO: "CASE_ACTION",
    RECORDATORIO_PLAZO: "DEADLINE_REMINDER",
    REQUERIMIENTO_PAGO: "PAYMENT_REMINDER",
    DESIGNACION_ARBITRO: "CASE_ACTION",
    SUSPENSION_CASO: "CASE_ACTION",
    CIERRE_CASO: "CASE_ACTION",
    OTP: "OTP",
    WELCOME: "WELCOME",
    GENERAL: "GENERAL",
  };
  return mapping[templateType] || "GENERAL";
}

/**
 * Envía notificación de traslado usando plantilla del centro
 */
export async function sendTrasladoNotification(params: {
  caseId: string;
  caseNumber: string;
  caseName: string;
  claimantName: string;
  respondentName: string;
  respondentEmail: string;
  respondentPhone?: string;
  documentName?: string;
  centerId?: string;
}): Promise<NotificationResult> {
  // Obtener datos del centro
  let centerName = "CAARD";
  let secretaryName = "Secretaría Arbitral";

  if (params.centerId) {
    const center = await prisma.center.findUnique({
      where: { id: params.centerId },
      select: { name: true },
    });
    if (center) {
      centerName = center.name;
    }
  }

  return sendTemplatedNotification({
    email: params.respondentEmail,
    phone: params.respondentPhone,
    templateType: "TRASLADO",
    templateCode: "TRASLADO_DEMANDA",
    centerId: params.centerId,
    priority: "high",
    channels: ["EMAIL", "WHATSAPP", "SMS"],
    variables: {
      caseNumber: params.caseNumber,
      caseName: params.caseName,
      claimantName: params.claimantName,
      respondentName: params.respondentName,
      partyName: params.respondentName,
      documentName: params.documentName || "Solicitud de Arbitraje",
      centerName,
      secretaryName,
    },
  });
}

/**
 * Envía notificación de audiencia usando plantilla del centro
 */
export async function sendAudienciaNotification(params: {
  userId: string;
  email?: string;
  phone?: string;
  caseNumber: string;
  caseName: string;
  partyName: string;
  hearingDate: string;
  hearingTime: string;
  hearingLocation: string;
  centerId?: string;
}): Promise<NotificationResult> {
  let centerName = "CAARD";
  let secretaryName = "Secretaría Arbitral";

  if (params.centerId) {
    const center = await prisma.center.findUnique({
      where: { id: params.centerId },
      select: { name: true },
    });
    if (center) {
      centerName = center.name;
    }
  }

  return sendTemplatedNotification({
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    templateType: "NOTIFICACION_AUDIENCIA",
    templateCode: "CITACION_AUDIENCIA",
    centerId: params.centerId,
    priority: "high",
    channels: ["EMAIL", "WHATSAPP", "IN_APP"],
    variables: {
      caseNumber: params.caseNumber,
      caseName: params.caseName,
      partyName: params.partyName,
      hearingDate: params.hearingDate,
      hearingTime: params.hearingTime,
      hearingLocation: params.hearingLocation,
      centerName,
      secretaryName,
    },
  });
}

/**
 * Envía recordatorio de plazo usando plantilla del centro
 */
export async function sendDeadlineReminderTemplated(params: {
  userId: string;
  email?: string;
  phone?: string;
  caseNumber: string;
  caseName: string;
  partyName: string;
  documentName: string;
  deadlineDate: string;
  daysRemaining: number;
  centerId?: string;
}): Promise<NotificationResult> {
  let centerName = "CAARD";
  let secretaryName = "Secretaría Arbitral";

  if (params.centerId) {
    const center = await prisma.center.findUnique({
      where: { id: params.centerId },
      select: { name: true },
    });
    if (center) {
      centerName = center.name;
    }
  }

  const priority = params.daysRemaining <= 1 ? "urgent" : params.daysRemaining <= 3 ? "high" : "normal";

  return sendTemplatedNotification({
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    templateType: "RECORDATORIO_PLAZO",
    templateCode: "RECORDATORIO_PLAZO",
    centerId: params.centerId,
    priority,
    channels: ["EMAIL", "WHATSAPP", "IN_APP"],
    variables: {
      caseNumber: params.caseNumber,
      caseName: params.caseName,
      partyName: params.partyName,
      documentName: params.documentName,
      deadlineDate: params.deadlineDate,
      daysRemaining: params.daysRemaining,
      centerName,
      secretaryName,
    },
  });
}

/**
 * Envía requerimiento de pago usando plantilla del centro
 */
export async function sendPaymentReminderTemplated(params: {
  userId: string;
  email?: string;
  phone?: string;
  caseNumber: string;
  caseName: string;
  partyName: string;
  amount: string;
  paymentConcept: string;
  deadlineDate: string;
  centerId?: string;
}): Promise<NotificationResult> {
  let centerName = "CAARD";
  let secretaryName = "Secretaría Arbitral";

  if (params.centerId) {
    const center = await prisma.center.findUnique({
      where: { id: params.centerId },
      select: { name: true },
    });
    if (center) {
      centerName = center.name;
    }
  }

  return sendTemplatedNotification({
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    templateType: "REQUERIMIENTO_PAGO",
    templateCode: "REQUERIMIENTO_PAGO",
    centerId: params.centerId,
    priority: "high",
    channels: ["EMAIL", "WHATSAPP", "IN_APP"],
    variables: {
      caseNumber: params.caseNumber,
      caseName: params.caseName,
      partyName: params.partyName,
      amount: params.amount,
      paymentConcept: params.paymentConcept,
      deadlineDate: params.deadlineDate,
      centerName,
      secretaryName,
    },
  });
}
