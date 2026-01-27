/**
 * CAARD - API de Regla de Notificación Individual
 * GET /api/admin/notification-rules/[id] - Obtener regla
 * PATCH /api/admin/notification-rules/[id] - Actualizar regla
 * DELETE /api/admin/notification-rules/[id] - Eliminar regla
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, NotificationChannel, NotificationEventType } from "@prisma/client";
import { z } from "zod";

// Roles con acceso
const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

// Schema para actualizar regla
const updateNotificationRuleSchema = z.object({
  eventType: z.nativeEnum(NotificationEventType).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  targetRoles: z.array(z.nativeEnum(Role)).min(1).optional(),
  templateKey: z.string().min(1).optional(),
  subjectTemplate: z.string().optional().nullable(),
  bodyTemplate: z.string().optional().nullable(),
  ruleConfig: z.any().optional().nullable(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const rule = await prisma.notificationRule.findUnique({
      where: { id },
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

    if (!rule) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso por centro
    if (userRole !== "SUPER_ADMIN" && rule.arbitrationType.centerId !== session.user.centerId) {
      return NextResponse.json(
        { error: "Sin acceso a esta regla" },
        { status: 403 }
      );
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Error fetching notification rule:", error);
    return NextResponse.json(
      { error: "Error al obtener regla" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para modificar reglas" },
        { status: 403 }
      );
    }

    const existingRule = await prisma.notificationRule.findUnique({
      where: { id },
      include: {
        arbitrationType: {
          select: {
            centerId: true,
          },
        },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso por centro
    if (userRole !== "SUPER_ADMIN" && existingRule.arbitrationType.centerId !== session.user.centerId) {
      return NextResponse.json(
        { error: "Sin acceso a esta regla" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateNotificationRuleSchema.parse(body);

    // Si cambia eventType o channel, verificar que no exista duplicado
    if (validatedData.eventType || validatedData.channel) {
      const duplicateCheck = await prisma.notificationRule.findFirst({
        where: {
          arbitrationTypeId: existingRule.arbitrationTypeId,
          eventType: validatedData.eventType || existingRule.eventType,
          channel: validatedData.channel || existingRule.channel,
          id: { not: id },
        },
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { error: "Ya existe una regla para este evento y canal" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (validatedData.eventType !== undefined) {
      updateData.eventType = validatedData.eventType;
    }
    if (validatedData.channel !== undefined) {
      updateData.channel = validatedData.channel;
    }
    if (validatedData.targetRoles !== undefined) {
      updateData.targetRoles = validatedData.targetRoles;
    }
    if (validatedData.templateKey !== undefined) {
      updateData.templateKey = validatedData.templateKey;
    }
    if (validatedData.subjectTemplate !== undefined) {
      updateData.subjectTemplate = validatedData.subjectTemplate;
    }
    if (validatedData.bodyTemplate !== undefined) {
      updateData.bodyTemplate = validatedData.bodyTemplate;
    }
    if (validatedData.ruleConfig !== undefined) {
      updateData.ruleConfig = validatedData.ruleConfig;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    const rule = await prisma.notificationRule.update({
      where: { id },
      data: updateData,
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
        centerId: existingRule.arbitrationType.centerId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "NotificationRule",
        entityId: rule.id,
        meta: {
          changes: validatedData,
        },
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating notification rule:", error);
    return NextResponse.json(
      { error: "Error al actualizar regla" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para eliminar reglas" },
        { status: 403 }
      );
    }

    const existingRule = await prisma.notificationRule.findUnique({
      where: { id },
      include: {
        arbitrationType: {
          select: {
            centerId: true,
          },
        },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso por centro
    if (userRole !== "SUPER_ADMIN" && existingRule.arbitrationType.centerId !== session.user.centerId) {
      return NextResponse.json(
        { error: "Sin acceso a esta regla" },
        { status: 403 }
      );
    }

    await prisma.notificationRule.delete({ where: { id } });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: existingRule.arbitrationType.centerId,
        userId: session.user.id,
        action: "DELETE",
        entity: "NotificationRule",
        entityId: id,
        meta: {
          eventType: existingRule.eventType,
          channel: existingRule.channel,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification rule:", error);
    return NextResponse.json(
      { error: "Error al eliminar regla" },
      { status: 500 }
    );
  }
}
