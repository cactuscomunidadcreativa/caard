/**
 * CAARD - API de Notificación Individual
 * GET /api/notifications/[id] - Obtener notificación
 * PATCH /api/notifications/[id] - Actualizar estado de notificación
 * DELETE /api/notifications/[id] - Eliminar notificación (solo admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, NotificationStatus } from "@prisma/client";
import { z } from "zod";

// Roles con acceso total
const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];

// Schema para actualizar notificación
const updateNotificationSchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role as Role;
    const isFullAccess = FULL_ACCESS_ROLES.includes(userRole);

    const notification = await prisma.notificationQueue.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
            claimantName: true,
            respondentName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso si no es admin
    if (!isFullAccess && notification.userId !== userId) {
      return NextResponse.json(
        { error: "Sin acceso a esta notificación" },
        { status: 403 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: "Error al obtener notificación" },
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

    const userId = session.user.id;
    const userRole = session.user.role as Role;
    const isFullAccess = FULL_ACCESS_ROLES.includes(userRole);

    const existingNotification = await prisma.notificationQueue.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso si no es admin
    if (!isFullAccess && existingNotification.userId !== userId) {
      return NextResponse.json(
        { error: "Sin acceso a esta notificación" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateNotificationSchema.parse(body);

    const updateData: any = {};

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;

      // Si se marca como enviada, registrar fecha
      if (validatedData.status === "SENT" && !existingNotification.sentAt) {
        updateData.sentAt = new Date();
      }
    }

    const notification = await prisma.notificationQueue.update({
      where: { id },
      data: updateData,
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Error al actualizar notificación" },
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

    // Solo SUPER_ADMIN y ADMIN pueden eliminar notificaciones
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para eliminar notificaciones" },
        { status: 403 }
      );
    }

    const existingNotification = await prisma.notificationQueue.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // No permitir eliminar notificaciones ya enviadas
    if (existingNotification.status === "SENT") {
      return NextResponse.json(
        { error: "No se puede eliminar una notificación ya enviada" },
        { status: 400 }
      );
    }

    await prisma.notificationQueue.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Error al eliminar notificación" },
      { status: 500 }
    );
  }
}
