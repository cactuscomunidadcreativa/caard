/**
 * CAARD - API de Verificación de Email
 * GET: Obtener estado de verificación
 * POST: Enviar código de verificación
 * PUT: Verificar código y confirmar email
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOtp, validateOtp } from "@/lib/otp/service";
import { OtpType, OtpChannel } from "@prisma/client";

// GET - Obtener estado de verificación de email
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      isVerified: !!user.emailVerified,
      verifiedAt: user.emailVerified,
    });
  } catch (error) {
    console.error("Error getting email verification status:", error);
    return NextResponse.json(
      { error: "Error al obtener estado de verificación" },
      { status: 500 }
    );
  }
}

// POST - Enviar código de verificación al email
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar si el email ya está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "El email ya está verificado", isVerified: true },
        { status: 400 }
      );
    }

    // Generar y enviar OTP por email
    const otpResult = await generateOtp({
      userId: session.user.id,
      type: OtpType.EMAIL_VERIFICATION,
      channel: OtpChannel.EMAIL,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Se ha enviado un código de verificación a su email",
      email: user.email,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      { error: "Error al enviar email de verificación" },
      { status: 500 }
    );
  }
}

// PUT - Verificar código y confirmar email
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Código requerido" },
        { status: 400 }
      );
    }

    // Validar el OTP
    const verifyResult = await validateOtp({
      userId: session.user.id,
      code,
      type: OtpType.EMAIL_VERIFICATION,
    });

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          error: verifyResult.error,
          remainingAttempts: verifyResult.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Marcar el email como verificado
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email verificado correctamente",
      verifiedAt: new Date(),
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Error al verificar email" },
      { status: 500 }
    );
  }
}
