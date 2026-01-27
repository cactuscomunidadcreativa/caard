/**
 * CAARD - API de Notificaciones
 * GET /api/notifications - Listar notificaciones según rol
 * POST /api/notifications - Crear notificación (sistema/admin)
 * PATCH /api/notifications/mark-read - Marcar notificaciones como leídas
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, NotificationChannel, NotificationEventType, NotificationStatus } from "@prisma/client";
import { z } from "zod";

// Roles con acceso total
const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];

// Schema para crear notificación
const createNotificationSchema = z.object({
  caseId: z.string().optional(),
  userId: z.string().optional(),
  channel: z.nativeEnum(NotificationChannel),
  eventType: z.nativeEnum(NotificationEventType),
  toEmail: z.string().email().optional(),
  toPhoneE164: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role as Role;
    const centerId = session.user.centerId;
    const isFullAccess = FULL_ACCESS_ROLES.includes(userRole);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as NotificationStatus | null;
    const channel = searchParams.get("channel") as NotificationChannel | null;
    const eventType = searchParams.get("eventType") as NotificationEventType | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construir where clause base
    const whereClause: any = {};

    // Si no tiene acceso total, solo ver sus notificaciones
    if (!isFullAccess) {
      whereClause.userId = userId;
    } else if (centerId) {
      // Admin ve notificaciones del centro
      whereClause.OR = [
        { userId: userId },
        {
          case: {
            centerId: centerId,
          },
        },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (channel) {
      whereClause.channel = channel;
    }

    if (eventType) {
      whereClause.eventType = eventType;
    }

    const [notifications, total] = await Promise.all([
      prisma.notificationQueue.findMany({
        where: whereClause,
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
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notificationQueue.count({ where: whereClause }),
    ]);

    // Estadísticas
    const stats = await prisma.notificationQueue.groupBy({
      by: ["status"],
      where: isFullAccess && centerId
        ? { case: { centerId } }
        : { userId },
      _count: true,
    });

    const channelStats = await prisma.notificationQueue.groupBy({
      by: ["channel"],
      where: isFullAccess && centerId
        ? { case: { centerId } }
        : { userId },
      _count: true,
    });

    return NextResponse.json({
      notifications,
      total,
      stats: {
        byStatus: stats.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count }),
          {}
        ),
        byChannel: channelStats.reduce(
          (acc, s) => ({ ...acc, [s.channel]: s._count }),
          {}
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
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

    // Solo admins pueden crear notificaciones manualmente
    if (!FULL_ACCESS_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para crear notificaciones" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // Si hay caseId, verificar que existe
    if (validatedData.caseId) {
      const caseRecord = await prisma.case.findUnique({
        where: { id: validatedData.caseId },
      });
      if (!caseRecord) {
        return NextResponse.json(
          { error: "Expediente no encontrado" },
          { status: 404 }
        );
      }
    }

    // Si hay userId, verificar que existe
    if (validatedData.userId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });
      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }
    }

    const notification = await prisma.notificationQueue.create({
      data: {
        caseId: validatedData.caseId,
        userId: validatedData.userId,
        channel: validatedData.channel,
        eventType: validatedData.eventType,
        status: "QUEUED",
        toEmail: validatedData.toEmail,
        toPhoneE164: validatedData.toPhoneE164,
        subject: validatedData.subject,
        body: validatedData.body,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : null,
      },
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

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Error al crear notificación" },
      { status: 500 }
    );
  }
}
