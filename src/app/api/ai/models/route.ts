/**
 * CAARD - API de Modelos de IA
 * GET: Lista todos los modelos
 * POST: Crea un nuevo modelo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AIProvider } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const providers = ["OPENAI", "ANTHROPIC", "GOOGLE", "AZURE_OPENAI", "CUSTOM"] as const;

const createModelSchema = z.object({
  provider: z.enum(providers),
  modelId: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  inputCostPer1k: z.number().min(0).default(0),
  outputCostPer1k: z.number().min(0).default(0),
  maxTokens: z.number().min(1).default(4096),
  maxContextWindow: z.number().min(1).default(128000),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  supportsVision: z.boolean().default(false),
  supportsFunctions: z.boolean().default(true),
  supportsStreaming: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const provider = searchParams.get("provider");

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    if (provider) {
      where.provider = provider;
    }

    const models = await prisma.aIModel.findMany({
      where,
      orderBy: [{ provider: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            roleAssignments: true,
            usageLogs: true,
          },
        },
      },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json({ error: "Error al obtener modelos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasPermission(session.user as any, "ai.admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createModelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que no exista un modelo con el mismo provider y modelId
    const existing = await prisma.aIModel.findFirst({
      where: {
        provider: data.provider as AIProvider,
        modelId: data.modelId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un modelo con este provider y modelId" },
        { status: 400 }
      );
    }

    // Si se marca como default, quitar el default de otros
    if (data.isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await prisma.aIModel.create({
      data: {
        provider: data.provider as AIProvider,
        modelId: data.modelId,
        name: data.name,
        description: data.description,
        inputCostPer1k: data.inputCostPer1k,
        outputCostPer1k: data.outputCostPer1k,
        maxTokens: data.maxTokens,
        maxContextWindow: data.maxContextWindow,
        isActive: data.isActive,
        isDefault: data.isDefault,
        supportsVision: data.supportsVision,
        supportsFunctions: data.supportsFunctions,
        supportsStreaming: data.supportsStreaming,
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Error creating model:", error);
    return NextResponse.json({ error: "Error al crear modelo" }, { status: 500 });
  }
}
