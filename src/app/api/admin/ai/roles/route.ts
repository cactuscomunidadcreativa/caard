/**
 * CAARD - API de Configuración de IA por Rol
 * GET: Listar configuraciones
 * POST: Crear configuración
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const createRoleModelSchema = z.object({
  role: z.nativeEnum(Role),
  modelId: z.string().min(1, "El modelo es requerido"),
  assistantId: z.string().optional().nullable(),
  customSystemPrompt: z.string().optional().nullable(),
  maxTokensPerRequest: z.number().int().min(1).optional().nullable(),
  maxRequestsPerDay: z.number().int().min(1).optional().nullable(),
  maxTokensPerDay: z.number().int().min(1).optional().nullable(),
  maxTokensPerMonth: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
});

// GET /api/admin/ai/roles
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
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== null) where.isActive = isActive === "true";

    const roleModels = await prisma.aIRoleModel.findMany({
      where,
      orderBy: [{ role: "asc" }, { priority: "desc" }],
      include: {
        model: true,
        assistant: true,
      },
    });

    return NextResponse.json(roleModels);
  } catch (error) {
    console.error("Error al listar configuraciones de rol:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/ai/roles
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
    const validatedData = createRoleModelSchema.parse(body);

    // Verificar que el modelo existe
    const model = await prisma.aIModel.findUnique({
      where: { id: validatedData.modelId },
    });

    if (!model) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 400 });
    }

    // Verificar que el asistente existe (si se proporciona)
    if (validatedData.assistantId) {
      const assistant = await prisma.aIAssistant.findUnique({
        where: { id: validatedData.assistantId },
      });

      if (!assistant) {
        return NextResponse.json({ error: "Asistente no encontrado" }, { status: 400 });
      }
    }

    const roleModel = await prisma.aIRoleModel.create({
      data: validatedData,
      include: {
        model: true,
        assistant: true,
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "AIRoleModel",
        entityId: roleModel.id,
        meta: { role: roleModel.role, modelId: roleModel.modelId },
      },
    });

    return NextResponse.json(roleModel, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al crear configuración de rol:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
