/**
 * CAARD - API de Asistentes de IA
 * GET: Lista todos los asistentes
 * POST: Crea un nuevo asistente
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAssistantSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  systemPrompt: z.string().min(1).max(10000),
  welcomeMessage: z.string().max(1000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(128000).default(2048),
  allowedContexts: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  // Nuevo: modelo asignado
  defaultModelId: z.string().optional(),
  // Nuevo: roles permitidos
  allowedRoles: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo SUPER_ADMIN y ADMIN pueden ver asistentes
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("stats") === "true";

    const assistants = await prisma.aIAssistant.findMany({
      orderBy: { name: "asc" },
      include: {
        ...(includeStats && {
          _count: {
            select: {
              roleAssignments: true,
              conversations: true,
            },
          },
        }),
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

    return NextResponse.json(assistants);
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json({ error: "Error al obtener asistentes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo SUPER_ADMIN puede crear asistentes
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createAssistantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que el slug no exista
    const existingSlug = await prisma.aIAssistant.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "El slug ya existe" },
        { status: 400 }
      );
    }

    // Crear el asistente
    const assistant = await prisma.aIAssistant.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        systemPrompt: data.systemPrompt,
        welcomeMessage: data.welcomeMessage,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        allowedContexts: data.allowedContexts,
        isActive: data.isActive,
      },
    });

    // Si se especificó un modelo por defecto y roles, crear las asignaciones
    if (data.defaultModelId && data.allowedRoles.length > 0) {
      const roleAssignments = data.allowedRoles.map((role) => ({
        role: role as any,
        modelId: data.defaultModelId!,
        assistantId: assistant.id,
        isActive: true,
      }));

      await prisma.aIRoleModel.createMany({
        data: roleAssignments,
        skipDuplicates: true,
      });
    }

    return NextResponse.json(assistant, { status: 201 });
  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json({ error: "Error al crear asistente" }, { status: 500 });
  }
}
