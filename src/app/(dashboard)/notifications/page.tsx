/**
 * CAARD - Página de Notificaciones
 * Muestra notificaciones según rol:
 * - SUPER_ADMIN, ADMIN, SECRETARIA: Todas las notificaciones del sistema
 * - Otros roles: Solo sus notificaciones personales
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notificaciones | CAARD",
  description: "Centro de notificaciones del sistema de arbitraje",
};

// Roles con acceso a todas las notificaciones
const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];

async function getNotificationsData(userId: string, userRole: Role, centerId?: string) {
  const isFullAccess = FULL_ACCESS_ROLES.includes(userRole);

  // Filtros base
  let whereClause: any = {};

  if (!isFullAccess) {
    // Solo sus notificaciones
    whereClause.userId = userId;
  } else if (centerId) {
    // Notificaciones de casos del centro
    whereClause.case = { centerId };
  }

  // Obtener notificaciones
  const notifications = await prisma.notificationQueue.findMany({
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
    take: 100,
  });

  // Estadísticas
  const stats = await prisma.notificationQueue.groupBy({
    by: ["status"],
    where: whereClause,
    _count: true,
  });

  const statsMap = stats.reduce(
    (acc, s) => ({ ...acc, [s.status]: s._count }),
    { QUEUED: 0, SENDING: 0, SENT: 0, FAILED: 0, CANCELLED: 0 }
  );

  // Obtener plazos próximos a vencer (para el usuario)
  let upcomingDeadlines: any[] = [];

  if (!isFullAccess) {
    // Obtener casos donde participa el usuario
    const userCases = await prisma.caseMember.findMany({
      where: { userId },
      select: { caseId: true },
    });

    const lawyerCases = await prisma.caseLawyer.findMany({
      where: { lawyerId: userId, isActive: true },
      select: { caseId: true },
    });

    const caseIds = [
      ...new Set([
        ...userCases.map((c) => c.caseId),
        ...lawyerCases.map((c) => c.caseId),
      ]),
    ];

    if (caseIds.length > 0) {
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);

      upcomingDeadlines = await prisma.caseDeadline.findMany({
        where: {
          caseId: { in: caseIds },
          isCompleted: false,
          dueAt: {
            gte: now,
            lte: in7Days,
          },
        },
        include: {
          case: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
        },
        orderBy: { dueAt: "asc" },
        take: 10,
      });
    }
  } else {
    // Admin ve todos los plazos próximos
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const caseFilter = centerId ? { centerId } : {};

    upcomingDeadlines = await prisma.caseDeadline.findMany({
      where: {
        case: caseFilter,
        isCompleted: false,
        dueAt: {
          gte: now,
          lte: in7Days,
        },
      },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: { dueAt: "asc" },
      take: 20,
    });
  }

  // Obtener audiencias próximas
  let upcomingHearings: any[] = [];
  const now = new Date();
  const in14Days = new Date();
  in14Days.setDate(in14Days.getDate() + 14);

  if (!isFullAccess) {
    const userCases = await prisma.caseMember.findMany({
      where: { userId },
      select: { caseId: true },
    });

    const caseIds = userCases.map((c) => c.caseId);

    if (caseIds.length > 0) {
      upcomingHearings = await prisma.caseHearing.findMany({
        where: {
          caseId: { in: caseIds },
          hearingAt: {
            gte: now,
            lte: in14Days,
          },
        },
        include: {
          case: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
        },
        orderBy: { hearingAt: "asc" },
        take: 10,
      });
    }
  } else {
    const caseFilter = centerId ? { centerId } : {};

    upcomingHearings = await prisma.caseHearing.findMany({
      where: {
        case: caseFilter,
        hearingAt: {
          gte: now,
          lte: in14Days,
        },
      },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: { hearingAt: "asc" },
      take: 20,
    });
  }

  return {
    notifications,
    stats: statsMap,
    upcomingDeadlines,
    upcomingHearings,
    userRole,
  };
}

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getNotificationsData(
    session.user.id,
    session.user.role as Role,
    session.user.centerId || undefined
  );

  return (
    <NotificationsClient
      notifications={data.notifications}
      stats={data.stats}
      upcomingDeadlines={data.upcomingDeadlines}
      upcomingHearings={data.upcomingHearings}
      userRole={data.userRole}
    />
  );
}
