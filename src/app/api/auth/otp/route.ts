/**
 * CAARD - API de OTP
 * POST: Generar nuevo código OTP
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/otp/service";
import { OtpType, OtpChannel } from "@prisma/client";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting para OTP
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`otp:${ip}`, RATE_LIMITS.otp);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intente de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, type = "LOGIN", channel } = body;

    // Para login, el usuario puede no estar autenticado
    if (type === "LOGIN") {
      if (!email) {
        return NextResponse.json(
          { error: "Email requerido" },
          { status: 400 }
        );
      }

      // Normalizar email (lowercase + trim)
      const normalizedEmail = email.toLowerCase().trim();

      // Buscar usuario case-insensitive
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          name: true,
          twoFactorEnabled: true,
          twoFactorChannel: true,
          isActive: true,
        },
      });

      if (!user) {
        user = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: "insensitive" } },
          select: {
            id: true,
            email: true,
            name: true,
            twoFactorEnabled: true,
            twoFactorChannel: true,
            isActive: true,
          },
        });
      }

      if (!user) {
        return NextResponse.json(
          {
            error: "No encontramos una cuenta con ese correo. Contacta a CAARD en info@caardpe.com para solicitar acceso.",
            code: "USER_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            error: "Tu cuenta está desactivada. Contacta a CAARD en info@caardpe.com.",
            code: "USER_INACTIVE",
          },
          { status: 403 }
        );
      }

      // Generar OTP
      const result = await generateOtp({
        userId: user.id,
        type: OtpType.LOGIN,
        channel: (channel as OtpChannel) || (user.twoFactorChannel as OtpChannel) || OtpChannel.EMAIL,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Código de verificación enviado",
        expiresAt: result.expiresAt,
      });
    }

    // Para otros tipos de OTP, el usuario debe estar autenticado
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const result = await generateOtp({
      userId: session.user.id,
      type: type as OtpType,
      channel: channel as OtpChannel,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código de verificación enviado",
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    return NextResponse.json(
      { error: "Error al generar código de verificación" },
      { status: 500 }
    );
  }
}
