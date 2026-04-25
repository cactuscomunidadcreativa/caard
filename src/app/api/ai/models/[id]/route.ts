/**
 * CAARD - API de Modelo de IA por ID
 * GET: Obtener un modelo
 * PUT: Actualizar un modelo
 * DELETE: Eliminar un modelo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AIProvider } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const providers = ["OPENAI", "ANTHROPIC", "GOOGLE", "AZURE_OPENAI", "CUSTOM"] as const;

const updateModelSchema = z.object({
  provider: z.enum(providers).optional(),
  modelId: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  inputCostPer1k: z.number().min(0).optional(),
  outputCostPer1k: z.number().min(0).optional(),
  maxTokens: z.number().min(1).optional(),
  maxContextWindow: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  supportsVision: z.boolean().optional(),
  supportsFunctions: z.boolean().optional(),
  supportsStreaming: z.boolean().optional(),
});

// GET - Obtener un modelo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    const model = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roleAssignments: true,
            usageLogs: true,
          },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (error) {
    console.error("Error fetching model:", error);
    return NextResponse.json({ error: "Error al obtener modelo" }, { status: 500 });
  }
}

// PUT - Actualizar un modelo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasPermission(session.user as any, "ai.admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.aIModel.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateModelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar unicidad de provider+modelId si se cambia
    if (data.provider || data.modelId) {
      const newProvider = data.provider || existing.provider;
      const newModelId = data.modelId || existing.modelId;

      const duplicate = await prisma.aIModel.findFirst({
        where: {
          provider: newProvider as AIProvider,
          modelId: newModelId,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe un modelo con este provider y modelId" },
          { status: 400 }
        );
      }
    }

    // Si se marca como default, quitar el default de otros
    if (data.isDefault === true) {
      await prisma.aIModel.updateMany({
        where: {
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const model = await prisma.aIModel.update({
      where: { id },
      data: {
        ...(data.provider && { provider: data.provider as AIProvider }),
        ...(data.modelId && { modelId: data.modelId }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.inputCostPer1k !== undefined && { inputCostPer1k: data.inputCostPer1k }),
        ...(data.outputCostPer1k !== undefined && { outputCostPer1k: data.outputCostPer1k }),
        ...(data.maxTokens !== undefined && { maxTokens: data.maxTokens }),
        ...(data.maxContextWindow !== undefined && { maxContextWindow: data.maxContextWindow }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.supportsVision !== undefined && { supportsVision: data.supportsVision }),
        ...(data.supportsFunctions !== undefined && { supportsFunctions: data.supportsFunctions }),
        ...(data.supportsStreaming !== undefined && { supportsStreaming: data.supportsStreaming }),
      },
    });

    return NextResponse.json(model);
  } catch (error) {
    console.error("Error updating model:", error);
    return NextResponse.json({ error: "Error al actualizar modelo" }, { status: 500 });
  }
}

// DELETE - Eliminar un modelo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasPermission(session.user as any, "ai.admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roleAssignments: true,
            usageLogs: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 404 });
    }

    // Verificar si está en uso
    if (existing._count.roleAssignments > 0) {
      const { searchParams } = new URL(request.url);
      const force = searchParams.get("force") === "true";

      if (!force) {
        return NextResponse.json(
          {
            error: "El modelo tiene asignaciones de roles",
            roleAssignments: existing._count.roleAssignments,
            message: "Usa ?force=true para eliminar de todos modos"
          },
          { status: 400 }
        );
      }

      // Eliminar asignaciones primero
      await prisma.aIRoleModel.deleteMany({
        where: { modelId: id },
      });
    }

    // Eliminar modelo
    await prisma.aIModel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json({ error: "Error al eliminar modelo" }, { status: 500 });
  }
}
