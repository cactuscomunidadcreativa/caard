/**
 * CAARD - API de Verificación OTP
 * POST: Verificar código OTP
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOtp } from "@/lib/otp/service";
import { OtpType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, type = "LOGIN" } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Código requerido" },
        { status: 400 }
      );
    }

    // Para login, el usuario puede no estar autenticado
    if (type === "LOGIN") {
      if (!email) {
        return NextResponse.json(
          { error: "Email requerido" },
          { status: 400 }
        );
      }

      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Código incorrecto" },
          { status: 400 }
        );
      }

      const result = await validateOtp({
        userId: user.id,
        code,
        type: OtpType.LOGIN,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error,
            remainingAttempts: result.remainingAttempts,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Código verificado correctamente",
        // El frontend debe proceder con el login
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

    const result = await validateOtp({
      userId: session.user.id,
      code,
      type: type as OtpType,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código verificado correctamente",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Error al verificar código" },
      { status: 500 }
    );
  }
}
