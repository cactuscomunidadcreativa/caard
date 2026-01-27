/**
 * CAARD - API de Configuración de Integraciones
 * GET /api/integrations/config - Obtener configuraciones guardadas
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Por ahora retornamos configuración vacía
    // En producción, esto vendría de una tabla de configuración
    return NextResponse.json({
      email: {
        smtpHost: process.env.SMTP_HOST || "",
        smtpPort: process.env.SMTP_PORT || "587",
        smtpUser: process.env.SMTP_USER || "",
        smtpFrom: process.env.SMTP_FROM || "",
        smtpFromName: process.env.SMTP_FROM_NAME || "CAARD",
      },
      ai: {
        openai: {
          enabled: !!process.env.OPENAI_API_KEY,
          apiKey: process.env.OPENAI_API_KEY ? "••••••••" : "",
          orgId: process.env.OPENAI_ORG_ID || "",
          defaultModel: "gpt-4-turbo",
        },
        anthropic: {
          enabled: !!process.env.ANTHROPIC_API_KEY,
          apiKey: process.env.ANTHROPIC_API_KEY ? "••••••••" : "",
          defaultModel: "claude-3-sonnet",
        },
        google: {
          enabled: !!process.env.GOOGLE_AI_API_KEY,
          apiKey: process.env.GOOGLE_AI_API_KEY ? "••••••••" : "",
          defaultModel: "gemini-pro",
        },
        azure: {
          enabled: !!process.env.AZURE_OPENAI_API_KEY,
          apiKey: process.env.AZURE_OPENAI_API_KEY ? "••••••••" : "",
          endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
          defaultModel: "gpt-4",
        },
      },
    });
  } catch (error) {
    console.error("Error getting config:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}
