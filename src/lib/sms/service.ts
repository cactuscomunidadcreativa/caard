/**
 * CAARD - Servicio de SMS
 * Integración con Twilio para envío de mensajes SMS
 */

import { prisma } from "@/lib/prisma";

// Configuración de SMS
interface SmsConfig {
  provider: "twilio" | "aws-sns" | "custom";
  accountSid: string;
  authToken: string;
  fromNumber: string;
  enabled: boolean;
}

// Cache de configuración
let cachedConfig: SmsConfig | null = null;

/**
 * Obtiene la configuración de SMS desde la base de datos
 */
async function getSmsConfig(): Promise<SmsConfig | null> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: "sms.",
        },
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    if (!settingsMap["sms.accountSid"] || !settingsMap["sms.authToken"]) {
      console.warn("SMS configuration not found");
      return null;
    }

    cachedConfig = {
      provider: (settingsMap["sms.provider"] as SmsConfig["provider"]) || "twilio",
      accountSid: settingsMap["sms.accountSid"],
      authToken: settingsMap["sms.authToken"],
      fromNumber: settingsMap["sms.fromNumber"] || "",
      enabled: settingsMap["sms.enabled"] === "true",
    };

    return cachedConfig;
  } catch (error) {
    console.error("Error getting SMS config:", error);
    return null;
  }
}

/**
 * Invalida el cache de configuración
 */
export function invalidateSmsCache() {
  cachedConfig = null;
}

// Interfaz para envío de SMS
export interface SendSmsParams {
  to: string;
  message: string;
  type?: "OTP" | "NOTIFICATION" | "REMINDER" | "ALERT";
}

/**
 * Formatea el número de teléfono al formato E.164
 */
function formatPhoneNumber(phone: string, countryCode = "+51"): string {
  // Remover espacios y caracteres especiales
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Si empieza con 0, removerlo
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Si no tiene código de país, agregarlo
  if (!cleaned.startsWith("+")) {
    cleaned = countryCode + cleaned;
  }

  return cleaned;
}

/**
 * Envía un SMS usando Twilio
 */
async function sendViaTwilio(
  config: SmsConfig,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", config.fromNumber);
    formData.append("Body", message);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Twilio error: ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("Error sending SMS via Twilio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Envía un SMS
 */
export async function sendSms(params: SendSmsParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const config = await getSmsConfig();
    if (!config) {
      return { success: false, error: "SMS not configured" };
    }

    if (!config.enabled) {
      console.log("SMS is disabled, skipping:", params.to);
      return { success: false, error: "SMS is disabled" };
    }

    const formattedPhone = formatPhoneNumber(params.to);

    // Validar longitud del mensaje
    if (params.message.length > 160) {
      console.warn("SMS message exceeds 160 characters, will be split");
    }

    switch (config.provider) {
      case "twilio":
        return sendViaTwilio(config, formattedPhone, params.message);
      // Agregar otros proveedores según sea necesario
      default:
        return sendViaTwilio(config, formattedPhone, params.message);
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Envía código OTP por SMS
 */
export async function sendOtpSms(params: {
  to: string;
  code: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  const expiry = params.expiresInMinutes || 5;
  const message = `CAARD - Su codigo de verificacion es: ${params.code}. Valido por ${expiry} minutos. No comparta este codigo.`;

  return sendSms({
    to: params.to,
    message,
    type: "OTP",
  });
}

/**
 * Envía notificación de caso por SMS
 */
export async function sendCaseNotificationSms(params: {
  to: string;
  caseNumber: string;
  action: string;
  shortDescription?: string;
}): Promise<{ success: boolean; error?: string }> {
  let message = `CAARD [${params.caseNumber}]: ${params.action}`;

  if (params.shortDescription) {
    message += `. ${params.shortDescription}`;
  }

  // Truncar si es muy largo
  if (message.length > 160) {
    message = message.substring(0, 157) + "...";
  }

  return sendSms({
    to: params.to,
    message,
    type: "NOTIFICATION",
  });
}

/**
 * Envía recordatorio por SMS
 */
export async function sendReminderSms(params: {
  to: string;
  reminderType: "deadline" | "hearing" | "payment";
  details: string;
  dueDate?: Date;
}): Promise<{ success: boolean; error?: string }> {
  const typeLabels = {
    deadline: "Plazo",
    hearing: "Audiencia",
    payment: "Pago",
  };

  let message = `CAARD - Recordatorio ${typeLabels[params.reminderType]}: ${params.details}`;

  if (params.dueDate) {
    const dateStr = params.dueDate.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    message += ` Fecha: ${dateStr}`;
  }

  if (message.length > 160) {
    message = message.substring(0, 157) + "...";
  }

  return sendSms({
    to: params.to,
    message,
    type: "REMINDER",
  });
}

/**
 * Procesa la cola de SMS pendientes
 */
export async function processSmsQueue(limit = 50): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const pending = await prisma.notificationQueue.findMany({
      where: {
        status: "QUEUED",
        channel: "SMS",
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } },
        ],
      },
      take: limit,
      orderBy: [
        { createdAt: "asc" },
      ],
    });

    for (const notification of pending) {
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: { status: "SENDING" },
      });

      try {
        if (!notification.toPhoneE164) {
          throw new Error("Phone number missing");
        }

        const sendResult = await sendSms({
          to: notification.toPhoneE164,
          message: notification.body || "",
        });

        if (sendResult.success) {
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              providerMessageId: sendResult.messageId,
            },
          });
          result.processed++;
        } else {
          throw new Error(sendResult.error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: "FAILED",
            errorMessage: errorMsg,
          },
        });
        result.failed++;
        result.errors.push(`SMS ${notification.id}: ${errorMsg}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Error processing SMS queue:", error);
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return result;
  }
}
