/**
 * CAARD - Servicio de Email
 * Centraliza el envio de emails.
 *
 * Estrategia:
 *  1. Si GOOGLE_REFRESH_TOKEN esta configurado -> Gmail API (via GoogleWorkspaceService)
 *  2. Fallback a SMTP/Nodemailer (config en BD, campo notificationSettings del Centro)
 *
 * Email de sistema por defecto: sis@caardpe.com
 */

import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getGoogleWorkspaceService } from "@/lib/google-workspace";

// ============================================================
// Tipos
// ============================================================

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

// Cache de configuracion SMTP
let cachedConfig: EmailConfig | null = null;
let cachedTransporter: nodemailer.Transporter | null = null;

// Tipos de email
export type EmailType =
  | "WELCOME"
  | "PASSWORD_RESET"
  | "CASE_NOTIFICATION"
  | "DOCUMENT_NOTIFICATION"
  | "DEADLINE_REMINDER"
  | "PAYMENT_NOTIFICATION"
  | "HEARING_REMINDER"
  | "GENERAL";

// Interfaz para envio de email
export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type?: EmailType;
  replyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

// ============================================================
// Helpers internos - SMTP (fallback)
// ============================================================

async function getEmailConfig(): Promise<EmailConfig | null> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const center = await prisma.center.findFirst({
      select: {
        notificationSettings: true,
      },
    });

    const settings = (center?.notificationSettings as any) || {};

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      console.warn("SMTP email configuration not found in database");
      return null;
    }

    cachedConfig = {
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpSecure ?? settings.smtpPort === 465,
      user: settings.smtpUser,
      password: settings.smtpPassword,
      fromEmail: settings.emailFrom || "sis@caardpe.com",
      fromName: settings.emailFromName || "CAARD - Sistema de Arbitraje",
    };

    return cachedConfig;
  } catch (error) {
    console.error("Error getting email config:", error);
    return null;
  }
}

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = await getEmailConfig();
  if (!config) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return cachedTransporter;
}

/**
 * Invalida el cache (llamar cuando cambie la configuracion)
 */
export function invalidateEmailCache() {
  cachedConfig = null;
  cachedTransporter = null;
}

// ============================================================
// Envio principal
// ============================================================

/**
 * Envia un email usando Gmail API (preferido) o SMTP (fallback)
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  // ---- Intento 1: Gmail API ----
  const workspace = getGoogleWorkspaceService();
  if (workspace.isConfigured()) {
    try {
      const result = await workspace.sendEmail({
        to: params.to,
        subject: params.subject,
        htmlBody: params.html,
        textBody: params.text,
        from: "sis@caardpe.com",
        fromName: "CAARD - Sistema de Arbitraje",
        replyTo: params.replyTo,
        attachments: params.attachments?.map((a) => ({
          filename: a.filename,
          content: typeof a.content === "string" ? Buffer.from(a.content) : a.content,
          mimeType: a.contentType || "application/octet-stream",
        })),
      });

      if (result.success) {
        console.log(`Email sent via Gmail API: ${result.messageId} to ${params.to}`);
        return { success: true, messageId: result.messageId };
      }

      // Si Gmail API falla, intentar SMTP como fallback
      console.warn("Gmail API failed, falling back to SMTP:", result.error);
    } catch (error) {
      console.warn("Gmail API error, falling back to SMTP:", error);
    }
  }

  // ---- Intento 2: SMTP / Nodemailer (fallback) ----
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      return { success: false, error: "Email not configured (no Gmail API nor SMTP)" };
    }

    const config = await getEmailConfig();
    if (!config) {
      return { success: false, error: "Email configuration not found" };
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      attachments: params.attachments,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent via SMTP: ${result.messageId} to ${params.to}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// Templates de email
// ============================================================

/**
 * Envia email de bienvenida con credenciales
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  email: string;
  tempPassword: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Administrador",
    ADMIN: "Administrador",
    CENTER_STAFF: "Personal del Centro",
    SECRETARIA: "Secretaria Arbitral",
    ARBITRO: "Arbitro",
    ABOGADO: "Abogado",
    DEMANDANTE: "Demandante",
    DEMANDADO: "Demandado",
    ESTUDIANTE: "Estudiante",
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0B2A5B 0%, #1a4a8f 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">CAARD</h1>
        <p style="color: #D66829; margin: 5px 0 0; font-size: 14px;">Centro de Arbitraje</p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #0B2A5B; margin: 0 0 20px; font-size: 24px;">
          Bienvenido/a a CAARD!
        </h2>

        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Estimado/a <strong>${params.name}</strong>,
        </p>

        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Se ha creado una cuenta para usted en el Sistema de Arbitraje CAARD con el rol de
          <strong style="color: #D66829;">${roleLabels[params.role] || params.role}</strong>.
        </p>

        <!-- Credentials Box -->
        <div style="background-color: #f8f9fa; border-left: 4px solid #D66829; padding: 20px; margin: 25px 0;">
          <h3 style="color: #0B2A5B; margin: 0 0 15px; font-size: 16px;">Sus credenciales de acceso:</h3>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Usuario (Email):</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; font-size: 14px;">${params.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Contrasena temporal:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; font-size: 14px; font-family: monospace; background-color: #fff; padding: 5px 10px; border-radius: 4px;">${params.tempPassword}</td>
            </tr>
          </table>
        </div>

        <!-- Warning -->
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>Importante:</strong> Por seguridad, le recomendamos cambiar su contrasena despues de iniciar sesion por primera vez.
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || "https://caard.pe"}/login"
             style="display: inline-block; background: linear-gradient(135deg, #D66829 0%, #c45a22 100%);
                    color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px;
                    font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(214, 104, 41, 0.3);">
            Iniciar Sesion
          </a>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
          Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #0B2A5B; padding: 25px; text-align: center;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          CAARD - Centro de Administracion de Arbitrajes
        </p>
        <p style="color: #ffffff80; font-size: 12px; margin: 0;">
          Este es un mensaje automatico enviado desde sis@caardpe.com
        </p>
        <p style="color: #ffffff60; font-size: 11px; margin: 10px 0 0;">
          &copy; ${new Date().getFullYear()} CAARD. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Bienvenido/a a CAARD

Estimado/a ${params.name},

Se ha creado una cuenta para usted en el Sistema de Arbitraje CAARD con el rol de ${roleLabels[params.role] || params.role}.

Sus credenciales de acceso:
- Usuario (Email): ${params.email}
- Contrasena temporal: ${params.tempPassword}

IMPORTANTE: Por seguridad, le recomendamos cambiar su contrasena despues de iniciar sesion por primera vez.

Para acceder al sistema, visite: ${process.env.NEXTAUTH_URL || "https://caard.pe"}/login

Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.

---
CAARD - Centro de Administracion de Arbitrajes
Este es un mensaje automatico enviado desde sis@caardpe.com
  `;

  return sendEmail({
    to: params.to,
    subject: "Bienvenido a CAARD - Sus credenciales de acceso",
    html,
    text,
    type: "WELCOME",
  });
}

/**
 * Envia notificacion de accion en caso
 */
export async function sendCaseNotification(params: {
  to: string | string[];
  caseNumber: string;
  caseName: string;
  action: string;
  actionDescription: string;
  actionBy?: string;
  dueDate?: Date;
  priority?: "normal" | "urgent";
}): Promise<{ success: boolean; error?: string }> {
  const priorityStyles = params.priority === "urgent"
    ? "background-color: #dc3545; color: #ffffff;"
    : "background-color: #D66829; color: #ffffff;";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: #0B2A5B; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CAARD</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <div style="${priorityStyles} display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
          ${params.priority === "urgent" ? "URGENTE" : "NOTIFICACION"}
        </div>

        <h2 style="color: #0B2A5B; margin: 0 0 20px;">
          ${params.action}
        </h2>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; color: #666; font-size: 14px;">Expediente:</p>
          <p style="margin: 5px 0 0; font-weight: bold; color: #333; font-size: 16px;">
            ${params.caseNumber} - ${params.caseName}
          </p>
        </div>

        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          ${params.actionDescription}
        </p>

        ${params.dueDate ? `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Fecha limite:</strong> ${params.dueDate.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        ` : ""}

        ${params.actionBy ? `
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Accion realizada por: ${params.actionBy}
        </p>
        ` : ""}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || "https://caard.pe"}/cases"
             style="display: inline-block; background: #0B2A5B; color: #ffffff;
                    text-decoration: none; padding: 12px 30px; border-radius: 5px; font-size: 14px;">
            Ver Expediente
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Este es un mensaje automatico del sistema CAARD.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: params.to,
    subject: `[${params.caseNumber}] ${params.action}`,
    html,
    type: "CASE_NOTIFICATION",
  });
}

/**
 * Procesa la cola de notificaciones pendientes
 * Llamar desde un cron job o worker
 */
export async function processNotificationQueue(limit = 50): Promise<{
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
    // Obtener notificaciones pendientes
    const pending = await prisma.notificationQueue.findMany({
      where: {
        status: "QUEUED",
        channel: "EMAIL",
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
      // Marcar como enviando
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: { status: "SENDING" },
      });

      try {
        const sendResult = await sendEmail({
          to: notification.toEmail!,
          subject: notification.subject || "Notificacion CAARD",
          html: notification.body || "",
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
        result.errors.push(`Notification ${notification.id}: ${errorMsg}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Error processing notification queue:", error);
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return result;
  }
}
