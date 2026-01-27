/**
 * CAARD - Servicio OTP (One-Time Password)
 * Genera, valida y envía códigos OTP para autenticación de dos factores
 */

import { prisma } from "@/lib/prisma";
import { sendOtpNotification } from "@/lib/notifications/unified-service";
import { OtpType, OtpChannel } from "@prisma/client";
import crypto from "crypto";

// Configuración
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MINUTES = 1; // Mínimo tiempo entre solicitudes

export interface GenerateOtpParams {
  userId: string;
  type: OtpType;
  channel?: OtpChannel;
  ipAddress?: string;
  userAgent?: string;
}

export interface ValidateOtpParams {
  userId: string;
  code: string;
  type: OtpType;
}

export interface OtpResult {
  success: boolean;
  error?: string;
  code?: string;
  expiresAt?: Date;
  remainingAttempts?: number;
}

/**
 * Genera un código OTP aleatorio de 6 dígitos
 */
function generateOtpCode(): string {
  // Generar número aleatorio seguro
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  // Convertir a 6 dígitos
  const code = (randomNumber % 1000000).toString().padStart(OTP_LENGTH, "0");
  return code;
}

/**
 * Genera y envía un código OTP
 */
export async function generateOtp(params: GenerateOtpParams): Promise<OtpResult> {
  try {
    const { userId, type, channel, ipAddress, userAgent } = params;

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        twoFactorEnabled: true,
        twoFactorChannel: true,
      },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Determinar canal preferido
    const preferredChannel = channel ||
      (user.twoFactorChannel as OtpChannel) ||
      OtpChannel.EMAIL;

    // Verificar que el usuario tenga el canal configurado
    if (preferredChannel !== OtpChannel.EMAIL && !user.phone) {
      return {
        success: false,
        error: "No hay número de teléfono configurado para este canal"
      };
    }

    // Verificar rate limit - no enviar más de 1 OTP por minuto
    const recentOtp = await prisma.otpToken.findFirst({
      where: {
        userId,
        type,
        createdAt: {
          gte: new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil(
        (RATE_LIMIT_MINUTES * 60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000
      );
      return {
        success: false,
        error: `Por favor espere ${waitSeconds} segundos antes de solicitar otro código`,
      };
    }

    // Invalidar OTPs anteriores del mismo tipo
    await prisma.otpToken.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Marcar como usado
      },
    });

    // Generar nuevo código
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Guardar en base de datos
    await prisma.otpToken.create({
      data: {
        userId,
        code,
        type,
        channel: preferredChannel,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Enviar OTP por el canal seleccionado
    const notificationResult = await sendOtpNotification({
      userId,
      email: user.email,
      phone: user.phone || undefined,
      code,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    if (!notificationResult.success) {
      // Log el error pero no falla - el código se generó correctamente
      console.error("Error sending OTP notification:", notificationResult.channels);
    }

    return {
      success: true,
      expiresAt,
      // No devolver el código en producción (solo para debug)
      // code: process.env.NODE_ENV === "development" ? code : undefined,
    };
  } catch (error) {
    console.error("Error generating OTP:", error);
    return {
      success: false,
      error: "Error al generar código de verificación",
    };
  }
}

/**
 * Valida un código OTP
 */
export async function validateOtp(params: ValidateOtpParams): Promise<OtpResult> {
  try {
    const { userId, code, type } = params;

    // Buscar OTP válido
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        userId,
        type,
        usedAt: null, // No usado
        expiresAt: { gte: new Date() }, // No expirado
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpToken) {
      return {
        success: false,
        error: "Código expirado o inválido. Solicite uno nuevo.",
      };
    }

    // Verificar intentos
    if (otpToken.attempts >= MAX_ATTEMPTS) {
      // Marcar como usado para invalidar
      await prisma.otpToken.update({
        where: { id: otpToken.id },
        data: { usedAt: new Date() },
      });
      return {
        success: false,
        error: "Demasiados intentos fallidos. Solicite un nuevo código.",
        remainingAttempts: 0,
      };
    }

    // Verificar código
    if (otpToken.code !== code) {
      // Incrementar intentos
      await prisma.otpToken.update({
        where: { id: otpToken.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = MAX_ATTEMPTS - otpToken.attempts - 1;
      return {
        success: false,
        error: `Código incorrecto. ${remaining > 0 ? `${remaining} intento(s) restante(s).` : "Sin intentos restantes."}`,
        remainingAttempts: remaining,
      };
    }

    // Marcar como usado
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { usedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Error validating OTP:", error);
    return {
      success: false,
      error: "Error al validar código",
    };
  }
}

/**
 * Verifica si un usuario tiene 2FA habilitado
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });
  return user?.twoFactorEnabled ?? false;
}

/**
 * Habilita 2FA para un usuario
 */
export async function enable2FA(
  userId: string,
  channel: OtpChannel = OtpChannel.EMAIL
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    // Si el canal no es email, verificar que tenga teléfono
    if (channel !== OtpChannel.EMAIL && !user?.phone) {
      return {
        success: false,
        error: "Debe configurar un número de teléfono para usar SMS o WhatsApp",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorChannel: channel,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return { success: false, error: "Error al habilitar autenticación de dos factores" };
  }
}

/**
 * Deshabilita 2FA para un usuario
 */
export async function disable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorChannel: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return { success: false, error: "Error al deshabilitar autenticación de dos factores" };
  }
}

/**
 * Limpia OTPs expirados (llamar desde un cron job)
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.otpToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Más de 24 horas
      },
    },
  });

  return result.count;
}
