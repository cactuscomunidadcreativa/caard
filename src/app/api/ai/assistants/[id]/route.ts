/**
 * CAARD - API de Asistente de IA por ID
 * GET: Obtener un asistente
 * PUT: Actualizar un asistente
 * DELETE: Eliminar un asistente
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const updateAssistantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  systemPrompt: z.string().min(1).max(10000).optional(),
  welcomeMessage: z.string().max(1000).nullable().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(128000).optional(),
  allowedContexts: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  // Asignaciones de roles/modelos
  roleAssignments: z.array(z.object({
    role: z.string(),
    modelId: z.string(),
    customSystemPrompt: z.string().nullable().optional(),
    maxTokensPerRequest: z.number().nullable().optional(),
    maxRequestsPerDay: z.number().nullable().optional(),
    isActive: z.boolean().default(true),
  })).optional(),
});

// GET - Obtener un asistente
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

    const assistant = await prisma.aIAssistant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roleAssignments: true,
            conversations: true,
          },
        },
        roleAssignments: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                provider: true,
                modelId: true,
              },
            },
          },
        },
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 });
    }

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return NextResponse.json({ error: "Error al obtener asistente" }, { status: 500 });
  }
}

// PUT - Actualizar un asistente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que existe
    const existing = await prisma.aIAssistant.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateAssistantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Si se cambia el slug, verificar que no exista
    if (data.slug && data.slug !== existing.slug) {
      const existingSlug = await prisma.aIAssistant.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        return NextResponse.json(
          { error: "El slug ya existe" },
          { status: 400 }
        );
      }
    }

    // Actualizar asistente
    const assistant = await prisma.aIAssistant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.slug && { slug: data.slug }),
        ...(data.systemPrompt && { systemPrompt: data.systemPrompt }),
        ...(data.welcomeMessage !== undefined && { welcomeMessage: data.welcomeMessage }),
        ...(data.temperature !== undefined && { temperature: data.temperature }),
        ...(data.maxTokens !== undefined && { maxTokens: data.maxTokens }),
        ...(data.allowedContexts && { allowedContexts: data.allowedContexts }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Si hay asignaciones de roles, actualizarlas
    if (data.roleAssignments) {
      // Eliminar asignaciones existentes para este asistente
      await prisma.aIRoleModel.deleteMany({
        where: { assistantId: id },
      });

      // Crear nuevas asignaciones
      if (data.roleAssignments.length > 0) {
        await prisma.aIRoleModel.createMany({
          data: data.roleAssignments.map((ra) => ({
            role: ra.role as Role,
            modelId: ra.modelId,
            assistantId: id,
            customSystemPrompt: ra.customSystemPrompt,
            maxTokensPerRequest: ra.maxTokensPerRequest,
            maxRequestsPerDay: ra.maxRequestsPerDay,
            isActive: ra.isActive,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Obtener asistente actualizado con relaciones
    const updatedAssistant = await prisma.aIAssistant.findUnique({
      where: { id },
      include: {
        roleAssignments: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                provider: true,
                modelId: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedAssistant);
  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json({ error: "Error al actualizar asistente" }, { status: 500 });
  }
}

// DELETE - Eliminar un asistente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que existe
    const existing = await prisma.aIAssistant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 });
    }

    // Advertir si tiene conversaciones
    if (existing._count.conversations > 0) {
      const { searchParams } = new URL(request.url);
      const force = searchParams.get("force") === "true";

      if (!force) {
        return NextResponse.json(
          {
            error: "El asistente tiene conversaciones asociadas",
            conversations: existing._count.conversations,
            message: "Usa ?force=true para eliminar de todos modos"
          },
          { status: 400 }
        );
      }
    }

    // Eliminar asignaciones de roles primero
    await prisma.aIRoleModel.deleteMany({
      where: { assistantId: id },
    });

    // Eliminar asistente
    await prisma.aIAssistant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json({ error: "Error al eliminar asistente" }, { status: 500 });
  }
}
