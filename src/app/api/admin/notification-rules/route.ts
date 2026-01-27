/**
 * CAARD - API de Reglas de Notificación
 * GET /api/admin/notification-rules - Listar reglas
 * POST /api/admin/notification-rules - Crear regla
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, NotificationChannel, NotificationEventType } from "@prisma/client";
import { z } from "zod";

// Roles con acceso
const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

// Schema para crear regla
const createNotificationRuleSchema = z.object({
  arbitrationTypeId: z.string().min(1),
  eventType: z.nativeEnum(NotificationEventType),
  channel: z.nativeEnum(NotificationChannel),
  targetRoles: z.array(z.nativeEnum(Role)).min(1),
  templateKey: z.string().min(1),
  subjectTemplate: z.string().optional().nullable(),
  bodyTemplate: z.string().optional().nullable(),
  ruleConfig: z.any().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const arbitrationTypeId = searchParams.get("arbitrationTypeId");

    const whereClause: any = {};
    if (arbitrationTypeId) {
      whereClause.arbitrationTypeId = arbitrationTypeId;
    }

    const rules = await prisma.notificationRule.findMany({
      where: whereClause,
      include: {
        arbitrationType: {
          select: {
            id: true,
            code: true,
            name: true,
            centerId: true,
          },
        },
      },
      orderBy: [{ eventType: "asc" }, { channel: "asc" }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Error fetching notification rules:", error);
    return NextResponse.json(
      { error: "Error al obtener reglas de notificación" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userCenterId = session.user.centerId;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para crear reglas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createNotificationRuleSchema.parse(body);

    // Verificar que el tipo de arbitraje existe
    const arbitrationType = await prisma.arbitrationType.findUnique({
      where: { id: validatedData.arbitrationTypeId },
    });

    if (!arbitrationType) {
      return NextResponse.json(
        { error: "Tipo de arbitraje no encontrado" },
        { status: 404 }
      );
    }

    // Si no es SUPER_ADMIN, verificar que pertenece a su centro
    if (userRole !== "SUPER_ADMIN" && arbitrationType.centerId !== userCenterId) {
      return NextResponse.json(
        { error: "Sin acceso a este tipo de arbitraje" },
        { status: 403 }
      );
    }

    // Verificar que no exista una regla duplicada
    const existingRule = await prisma.notificationRule.findFirst({
      where: {
        arbitrationTypeId: validatedData.arbitrationTypeId,
        eventType: validatedData.eventType,
        channel: validatedData.channel,
      },
    });

    if (existingRule) {
      return NextResponse.json(
        { error: "Ya existe una regla para este evento y canal" },
        { status: 400 }
      );
    }

    const rule = await prisma.notificationRule.create({
      data: {
        arbitrationTypeId: validatedData.arbitrationTypeId,
        eventType: validatedData.eventType,
        channel: validatedData.channel,
        targetRoles: validatedData.targetRoles,
        templateKey: validatedData.templateKey,
        subjectTemplate: validatedData.subjectTemplate,
        bodyTemplate: validatedData.bodyTemplate,
        ruleConfig: validatedData.ruleConfig,
        isActive: validatedData.isActive,
      },
      include: {
        arbitrationType: {
          select: {
            id: true,
            code: true,
            name: true,
            centerId: true,
          },
        },
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: arbitrationType.centerId,
        userId: session.user.id,
        action: "CREATE",
        entity: "NotificationRule",
        entityId: rule.id,
        meta: {
          eventType: rule.eventType,
          channel: rule.channel,
          arbitrationTypeId: arbitrationType.id,
        },
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating notification rule:", error);
    return NextResponse.json(
      { error: "Error al crear regla de notificación" },
      { status: 500 }
    );
  }
}
