/**
 * CAARD - Servicios de Notificación
 * Re-exporta todos los servicios de notificación
 */

// Servicio unificado
export {
  sendNotification,
  sendOtpNotification,
  notifyCaseAction,
  sendDeadlineReminder,
  queueNotification,
  processAllQueues,
  type NotificationChannel,
  type NotificationType,
  type NotificationParams,
  type NotificationResult,
} from "./unified-service";

// Email
export {
  sendEmail,
  sendWelcomeEmail,
  sendCaseNotification as sendCaseEmail,
  processNotificationQueue as processEmailQueue,
  invalidateEmailCache,
} from "@/lib/email/service";

// SMS
export {
  sendSms,
  sendOtpSms,
  sendCaseNotificationSms,
  sendReminderSms,
  processSmsQueue,
  invalidateSmsCache,
} from "@/lib/sms/service";

// WhatsApp
export {
  sendWhatsApp,
  sendOtpWhatsApp,
  sendCaseNotificationWhatsApp,
  sendReminderWhatsApp,
  sendDocumentWhatsApp,
  processWhatsAppQueue,
  invalidateWhatsAppCache,
} from "@/lib/whatsapp/service";
