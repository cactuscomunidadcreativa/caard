/**
 * CAARD - API de Modelos de IA
 * GET: Listar modelos
 * POST: Crear modelo
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AIProvider } from "@prisma/client";

const createModelSchema = z.object({
  provider: z.nativeEnum(AIProvider),
  modelId: z.string().min(1, "El ID del modelo es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  inputCostPer1k: z.number().int().min(0).default(0),
  outputCostPer1k: z.number().int().min(0).default(0),
  maxTokens: z.number().int().min(1).default(4096),
  maxContextWindow: z.number().int().min(1).default(128000),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  supportsVision: z.boolean().default(false),
  supportsFunctions: z.boolean().default(true),
  supportsStreaming: z.boolean().default(true),
});

// GET /api/admin/ai/models - Listar modelos
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (provider) where.provider = provider;
    if (isActive !== null) where.isActive = isActive === "true";

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
    console.error("Error al listar modelos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/ai/models - Crear modelo
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createModelSchema.parse(body);

    // Si es default, quitar el default de otros modelos
    if (validatedData.isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await prisma.aIModel.create({
      data: validatedData,
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "AIModel",
        entityId: model.id,
        meta: { modelId: model.modelId, provider: model.provider },
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al crear modelo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
