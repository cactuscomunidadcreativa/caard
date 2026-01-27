/**
 * CAARD - Servicio de WhatsApp
 * Integración con WhatsApp Business API (via Twilio o Meta)
 */

import { prisma } from "@/lib/prisma";

// Configuración de WhatsApp
interface WhatsAppConfig {
  provider: "twilio" | "meta" | "custom";
  accountSid?: string; // Twilio
  authToken?: string; // Twilio
  phoneNumberId?: string; // Meta
  accessToken?: string; // Meta
  fromNumber: string;
  enabled: boolean;
}

// Cache de configuración
let cachedConfig: WhatsAppConfig | null = null;

/**
 * Obtiene la configuración de WhatsApp desde la base de datos
 */
async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: "whatsapp.",
        },
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const provider = (settingsMap["whatsapp.provider"] || "twilio") as WhatsAppConfig["provider"];

    // Validar según proveedor
    if (provider === "twilio") {
      if (!settingsMap["whatsapp.accountSid"] || !settingsMap["whatsapp.authToken"]) {
        console.warn("WhatsApp Twilio configuration not found");
        return null;
      }
    } else if (provider === "meta") {
      if (!settingsMap["whatsapp.phoneNumberId"] || !settingsMap["whatsapp.accessToken"]) {
        console.warn("WhatsApp Meta configuration not found");
        return null;
      }
    }

    cachedConfig = {
      provider,
      accountSid: settingsMap["whatsapp.accountSid"],
      authToken: settingsMap["whatsapp.authToken"],
      phoneNumberId: settingsMap["whatsapp.phoneNumberId"],
      accessToken: settingsMap["whatsapp.accessToken"],
      fromNumber: settingsMap["whatsapp.fromNumber"] || "",
      enabled: settingsMap["whatsapp.enabled"] === "true",
    };

    return cachedConfig;
  } catch (error) {
    console.error("Error getting WhatsApp config:", error);
    return null;
  }
}

/**
 * Invalida el cache de configuración
 */
export function invalidateWhatsAppCache() {
  cachedConfig = null;
}

// Tipos de mensaje
export type WhatsAppMessageType = "text" | "template" | "document" | "image";

// Interfaz para envío de WhatsApp
export interface SendWhatsAppParams {
  to: string;
  message?: string;
  messageType?: WhatsAppMessageType;
  templateName?: string;
  templateParams?: string[];
  mediaUrl?: string;
  caption?: string;
}

/**
 * Formatea el número de teléfono para WhatsApp
 */
function formatWhatsAppNumber(phone: string, countryCode = "51"): string {
  // Remover espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-\(\)\.+]/g, "");

  // Remover ceros iniciales
  while (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Agregar código de país si no está
  if (!cleaned.startsWith(countryCode)) {
    cleaned = countryCode + cleaned;
  }

  return cleaned;
}

/**
 * Envía mensaje vía Twilio WhatsApp
 */
async function sendViaTwilio(
  config: WhatsAppConfig,
  to: string,
  message: string,
  mediaUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("To", `whatsapp:+${to}`);
    formData.append("From", `whatsapp:${config.fromNumber}`);
    formData.append("Body", message);

    if (mediaUrl) {
      formData.append("MediaUrl", mediaUrl);
    }

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
        error: data.message || `Twilio WhatsApp error: ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("Error sending WhatsApp via Twilio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Envía mensaje vía Meta WhatsApp Business API
 */
async function sendViaMeta(
  config: WhatsAppConfig,
  to: string,
  message: string,
  templateName?: string,
  templateParams?: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;

    let payload: any;

    if (templateName) {
      // Usar template predefinido
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es" },
          components: templateParams
            ? [
                {
                  type: "body",
                  parameters: templateParams.map((p) => ({
                    type: "text",
                    text: p,
                  })),
                },
              ]
            : [],
        },
      };
    } else {
      // Mensaje de texto simple
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: message },
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `Meta WhatsApp error: ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("Error sending WhatsApp via Meta:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Envía un mensaje de WhatsApp
 */
export async function sendWhatsApp(params: SendWhatsAppParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const config = await getWhatsAppConfig();
    if (!config) {
      return { success: false, error: "WhatsApp not configured" };
    }

    if (!config.enabled) {
      console.log("WhatsApp is disabled, skipping:", params.to);
      return { success: false, error: "WhatsApp is disabled" };
    }

    const formattedPhone = formatWhatsAppNumber(params.to);

    switch (config.provider) {
      case "twilio":
        return sendViaTwilio(
          config,
          formattedPhone,
          params.message || "",
          params.mediaUrl
        );
      case "meta":
        return sendViaMeta(
          config,
          formattedPhone,
          params.message || "",
          params.templateName,
          params.templateParams
        );
      default:
        return sendViaTwilio(
          config,
          formattedPhone,
          params.message || "",
          params.mediaUrl
        );
    }
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Envía código OTP por WhatsApp
 */
export async function sendOtpWhatsApp(params: {
  to: string;
  code: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  const expiry = params.expiresInMinutes || 5;
  const message = `*CAARD - Código de Verificación*\n\nSu código es: *${params.code}*\n\nVálido por ${expiry} minutos.\n\n_No comparta este código con nadie._`;

  return sendWhatsApp({
    to: params.to,
    message,
  });
}

/**
 * Envía notificación de caso por WhatsApp
 */
export async function sendCaseNotificationWhatsApp(params: {
  to: string;
  caseNumber: string;
  caseName: string;
  action: string;
  description: string;
  link?: string;
  priority?: "normal" | "urgent";
}): Promise<{ success: boolean; error?: string }> {
  const priorityEmoji = params.priority === "urgent" ? "🔴" : "📋";

  let message = `${priorityEmoji} *CAARD - Notificación*\n\n`;
  message += `*Expediente:* ${params.caseNumber}\n`;
  message += `*Asunto:* ${params.caseName}\n\n`;
  message += `*${params.action}*\n`;
  message += params.description;

  if (params.link) {
    message += `\n\n👉 Ver más: ${params.link}`;
  }

  return sendWhatsApp({
    to: params.to,
    message,
  });
}

/**
 * Envía recordatorio por WhatsApp
 */
export async function sendReminderWhatsApp(params: {
  to: string;
  reminderType: "deadline" | "hearing" | "payment";
  title: string;
  details: string;
  dueDate?: Date;
  caseNumber?: string;
}): Promise<{ success: boolean; error?: string }> {
  const typeEmojis = {
    deadline: "⏰",
    hearing: "📅",
    payment: "💳",
  };

  const typeLabels = {
    deadline: "Plazo",
    hearing: "Audiencia",
    payment: "Pago",
  };

  let message = `${typeEmojis[params.reminderType]} *CAARD - Recordatorio de ${typeLabels[params.reminderType]}*\n\n`;

  if (params.caseNumber) {
    message += `*Expediente:* ${params.caseNumber}\n`;
  }

  message += `*${params.title}*\n`;
  message += params.details;

  if (params.dueDate) {
    const dateStr = params.dueDate.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    message += `\n\n📆 *Fecha:* ${dateStr}`;
  }

  return sendWhatsApp({
    to: params.to,
    message,
  });
}

/**
 * Envía documento por WhatsApp (PDF, etc.)
 */
export async function sendDocumentWhatsApp(params: {
  to: string;
  documentUrl: string;
  caption?: string;
  filename?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendWhatsApp({
    to: params.to,
    message: params.caption || "",
    messageType: "document",
    mediaUrl: params.documentUrl,
  });
}

/**
 * Procesa la cola de WhatsApp pendientes
 */
export async function processWhatsAppQueue(limit = 50): Promise<{
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
        channel: "WHATSAPP",
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

        const sendResult = await sendWhatsApp({
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
        result.errors.push(`WhatsApp ${notification.id}: ${errorMsg}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Error processing WhatsApp queue:", error);
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return result;
  }
}
