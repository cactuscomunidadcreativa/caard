/**
 * CAARD - API de Configuración 2FA
 * GET: Obtener estado de 2FA
 * PUT: Habilitar/Deshabilitar 2FA
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enable2FA, disable2FA, generateOtp, validateOtp } from "@/lib/otp/service";
import { OtpType, OtpChannel } from "@prisma/client";

// GET - Obtener estado de 2FA
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorChannel: true,
        phone: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      channel: user.twoFactorChannel,
      hasPhone: !!user.phone,
      email: user.email,
      phoneLastDigits: user.phone ? `****${user.phone.slice(-4)}` : null,
    });
  } catch (error) {
    console.error("Error getting 2FA status:", error);
    return NextResponse.json(
      { error: "Error al obtener estado de 2FA" },
      { status: 500 }
    );
  }
}

// PUT - Configurar 2FA
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action, channel, code, phone } = body;

    // Actualizar teléfono si se proporciona
    if (phone) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone },
      });
    }

    // Habilitar 2FA
    if (action === "enable") {
      const selectedChannel = (channel as OtpChannel) || OtpChannel.EMAIL;

      // Primero generar OTP para verificar que el canal funciona
      if (!code) {
        // Enviar código de verificación
        const otpResult = await generateOtp({
          userId: session.user.id,
          type: OtpType.ACTION_CONFIRMATION,
          channel: selectedChannel,
        });

        if (!otpResult.success) {
          return NextResponse.json(
            { error: otpResult.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          requiresVerification: true,
          message: "Se ha enviado un código de verificación",
          expiresAt: otpResult.expiresAt,
        });
      }

      // Verificar código
      const verifyResult = await validateOtp({
        userId: session.user.id,
        code,
        type: OtpType.ACTION_CONFIRMATION,
      });

      if (!verifyResult.success) {
        return NextResponse.json(
          { error: verifyResult.error },
          { status: 400 }
        );
      }

      // Habilitar 2FA
      const enableResult = await enable2FA(session.user.id, selectedChannel);

      if (!enableResult.success) {
        return NextResponse.json(
          { error: enableResult.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        enabled: true,
        channel: selectedChannel,
        message: "Autenticación de dos factores habilitada",
      });
    }

    // Deshabilitar 2FA
    if (action === "disable") {
      // Requerir verificación con código actual
      if (!code) {
        const otpResult = await generateOtp({
          userId: session.user.id,
          type: OtpType.ACTION_CONFIRMATION,
        });

        if (!otpResult.success) {
          return NextResponse.json(
            { error: otpResult.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          requiresVerification: true,
          message: "Se ha enviado un código de verificación para confirmar",
          expiresAt: otpResult.expiresAt,
        });
      }

      // Verificar código
      const verifyResult = await validateOtp({
        userId: session.user.id,
        code,
        type: OtpType.ACTION_CONFIRMATION,
      });

      if (!verifyResult.success) {
        return NextResponse.json(
          { error: verifyResult.error },
          { status: 400 }
        );
      }

      // Deshabilitar 2FA
      const disableResult = await disable2FA(session.user.id);

      if (!disableResult.success) {
        return NextResponse.json(
          { error: disableResult.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        enabled: false,
        message: "Autenticación de dos factores deshabilitada",
      });
    }

    // Cambiar canal de 2FA
    if (action === "changeChannel") {
      const newChannel = channel as OtpChannel;

      if (!newChannel) {
        return NextResponse.json(
          { error: "Canal requerido" },
          { status: 400 }
        );
      }

      // Verificar que el canal sea válido
      if (newChannel !== OtpChannel.EMAIL) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { phone: true },
        });

        if (!user?.phone) {
          return NextResponse.json(
            { error: "Configure un número de teléfono primero" },
            { status: 400 }
          );
        }
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorChannel: newChannel },
      });

      return NextResponse.json({
        success: true,
        channel: newChannel,
        message: "Canal de verificación actualizado",
      });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error configuring 2FA:", error);
    return NextResponse.json(
      { error: "Error al configurar 2FA" },
      { status: 500 }
    );
  }
}
