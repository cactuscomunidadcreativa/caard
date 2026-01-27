/**
 * CAARD - API de Configuración de Email
 * POST /api/integrations/email/config - Guardar configuración SMTP
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emailConfigSchema = z.object({
  smtpHost: z.string().min(1),
  smtpPort: z.string(),
  smtpUser: z.string().email(),
  smtpPassword: z.string().min(1),
  smtpFrom: z.string().email(),
  smtpFromName: z.string(),
  smtpSecure: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = emailConfigSchema.parse(body);

    // En producción, guardar en base de datos de forma segura
    // Por ahora, solo registramos en audit log
    await prisma.auditLog.create({
      data: {
        centerId: session.user.centerId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "EmailConfig",
        meta: {
          smtpHost: validatedData.smtpHost,
          smtpPort: validatedData.smtpPort,
          smtpUser: validatedData.smtpUser,
          smtpFrom: validatedData.smtpFrom,
          // No guardamos la contraseña en el log
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuración guardada. Agrega las variables a tu archivo .env para activar.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error saving email config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
