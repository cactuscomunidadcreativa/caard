/**
 * CAARD - API de Modelo de IA Individual
 * GET: Obtener modelo
 * PATCH: Actualizar modelo
 * DELETE: Eliminar modelo
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AIProvider } from "@prisma/client";

const updateModelSchema = z.object({
  provider: z.nativeEnum(AIProvider).optional(),
  modelId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  inputCostPer1k: z.number().int().min(0).optional(),
  outputCostPer1k: z.number().int().min(0).optional(),
  maxTokens: z.number().int().min(1).optional(),
  maxContextWindow: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  supportsVision: z.boolean().optional(),
  supportsFunctions: z.boolean().optional(),
  supportsStreaming: z.boolean().optional(),
});

// GET /api/admin/ai/models/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

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

    const model = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        roleAssignments: {
          include: {
            assistant: true,
          },
        },
        _count: {
          select: {
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
    console.error("Error al obtener modelo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/admin/ai/models/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

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
    const validatedData = updateModelSchema.parse(body);

    // Si se pone como default, quitar default de otros
    if (validatedData.isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const model = await prisma.aIModel.update({
      where: { id },
      data: validatedData,
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "AIModel",
        entityId: id,
        meta: { updatedFields: Object.keys(validatedData) },
      },
    });

    return NextResponse.json(model);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al actualizar modelo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/ai/models/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

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

    const model = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { roleAssignments: true, usageLogs: true },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 404 });
    }

    // No permitir eliminar si tiene asignaciones activas
    if (model._count.roleAssignments > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un modelo con asignaciones de rol activas" },
        { status: 400 }
      );
    }

    await prisma.aIModel.delete({ where: { id } });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "AIModel",
        entityId: id,
        meta: { modelId: model.modelId, provider: model.provider },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar modelo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
