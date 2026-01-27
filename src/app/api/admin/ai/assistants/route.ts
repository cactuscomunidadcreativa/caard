/**
 * CAARD - API de Asistentes de IA
 * GET: Listar asistentes
 * POST: Crear asistente
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAssistantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  systemPrompt: z.string().min(1, "El prompt del sistema es requerido"),
  welcomeMessage: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).default(2048),
  allowedContexts: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

// GET /api/admin/ai/assistants
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
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (isActive !== null) where.isActive = isActive === "true";

    const assistants = await prisma.aIAssistant.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            roleAssignments: true,
            conversations: true,
          },
        },
      },
    });

    return NextResponse.json(assistants);
  } catch (error) {
    console.error("Error al listar asistentes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/ai/assistants
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
    const validatedData = createAssistantSchema.parse(body);

    // Verificar que el slug sea único
    const existingSlug = await prisma.aIAssistant.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Ya existe un asistente con ese slug" },
        { status: 400 }
      );
    }

    const assistant = await prisma.aIAssistant.create({
      data: validatedData,
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "AIAssistant",
        entityId: assistant.id,
        meta: { name: assistant.name, slug: assistant.slug },
      },
    });

    return NextResponse.json(assistant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al crear asistente:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
