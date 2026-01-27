/**
 * CAARD - API de Prueba de IA
 * POST /api/integrations/ai/test - Probar conexión con proveedor AI
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const testAISchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "azure"]),
  config: z.object({
    enabled: z.boolean(),
    apiKey: z.string().min(1),
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
    const { provider, config } = testAISchema.parse(body);

    // Usar API key del config o del env si es placeholder
    let apiKey = config.apiKey;
    if (apiKey === "••••••••") {
      switch (provider) {
        case "openai":
          apiKey = process.env.OPENAI_API_KEY || "";
          break;
        case "anthropic":
          apiKey = process.env.ANTHROPIC_API_KEY || "";
          break;
        case "google":
          apiKey = process.env.GOOGLE_AI_API_KEY || "";
          break;
        case "azure":
          apiKey = process.env.AZURE_OPENAI_API_KEY || "";
          break;
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "API Key no configurada",
      });
    }

    // Probar conexión según el proveedor
    let result: { success: boolean; message: string; error?: string };

    switch (provider) {
      case "openai":
        result = await testOpenAI(apiKey, config.orgId);
        break;
      case "anthropic":
        result = await testAnthropic(apiKey);
        break;
      case "google":
        result = await testGoogleAI(apiKey);
        break;
      case "azure":
        result = await testAzureOpenAI(apiKey, config.endpoint || "");
        break;
      default:
        result = { success: false, error: "Proveedor no soportado", message: "" };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing AI:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

async function testOpenAI(apiKey: string, orgId?: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (orgId) headers["OpenAI-Organization"] = orgId;

    const response = await fetch("https://api.openai.com/v1/models", {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Conexión exitosa. ${data.data?.length || 0} modelos disponibles.`,
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: "",
        error: error.error?.message || "Error de autenticación",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

async function testAnthropic(apiKey: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (response.ok) {
      return {
        success: true,
        message: "Conexión exitosa con Anthropic Claude.",
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: "",
        error: error.error?.message || "Error de autenticación",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

async function testGoogleAI(apiKey: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Conexión exitosa. ${data.models?.length || 0} modelos disponibles.`,
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: "",
        error: error.error?.message || "Error de autenticación",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

async function testAzureOpenAI(apiKey: string, endpoint: string): Promise<{ success: boolean; message: string; error?: string }> {
  if (!endpoint) {
    return {
      success: false,
      message: "",
      error: "Endpoint de Azure no configurado",
    };
  }

  try {
    const response = await fetch(`${endpoint}/openai/models?api-version=2023-05-15`, {
      headers: {
        "api-key": apiKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Conexión exitosa. ${data.data?.length || 0} modelos disponibles.`,
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: "",
        error: error.error?.message || "Error de autenticación",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}
