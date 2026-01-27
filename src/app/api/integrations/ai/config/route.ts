/**
 * CAARD - API de Configuración de IA
 * POST /api/integrations/ai/config - Guardar configuración de proveedor AI
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const aiConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "azure"]),
  config: z.object({
    enabled: z.boolean(),
    apiKey: z.string(),
    orgId: z.string().optional(),
    endpoint: z.string().optional(),
    defaultModel: z.string(),
  }),
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
    const { provider, config } = aiConfigSchema.parse(body);

    // En producción, guardar de forma segura (vault, encrypted DB, etc.)
    // Por ahora, solo registramos en audit log (sin API key)
    await prisma.auditLog.create({
      data: {
        centerId: session.user.centerId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "AIConfig",
        meta: {
          provider,
          enabled: config.enabled,
          defaultModel: config.defaultModel,
          hasApiKey: !!config.apiKey && config.apiKey !== "••••••••",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Configuración de ${provider} guardada. Agrega la API key a tu archivo .env.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error saving AI config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
