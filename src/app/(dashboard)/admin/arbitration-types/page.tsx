/**
 * CAARD - Página de Administración de Tipos de Arbitraje
 * Gestión de tipos de arbitraje con reglas de notificación y plazos
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ArbitrationTypesClient } from "./arbitration-types-client";

export const metadata: Metadata = {
  title: "Tipos de Arbitraje | Admin | CAARD",
  description: "Administración de tipos de arbitraje y reglas de notificación",
};

// Roles con acceso a esta página
const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

async function getArbitrationTypesData(centerId?: string) {
  // Obtener tipos de arbitraje
  const arbitrationTypes = await prisma.arbitrationType.findMany({
    where: centerId ? { centerId } : undefined,
    include: {
      center: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      notificationRules: {
        orderBy: { eventType: "asc" },
      },
      _count: {
        select: {
          cases: true,
        },
      },
    },
    orderBy: [{ center: { code: "asc" } }, { code: "asc" }],
  });

  // Obtener centros para selector
  const centers = await prisma.center.findMany({
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  // Estadísticas
  const stats = {
    total: arbitrationTypes.length,
    active: arbitrationTypes.filter((t) => t.isActive).length,
    inactive: arbitrationTypes.filter((t) => !t.isActive).length,
    totalCases: arbitrationTypes.reduce((sum, t) => sum + t._count.cases, 0),
    totalRules: arbitrationTypes.reduce(
      (sum, t) => sum + t.notificationRules.length,
      0
    ),
  };

  return { arbitrationTypes, centers, stats };
}

export default async function ArbitrationTypesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role as Role;

  // Verificar permisos
  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/dashboard");
  }

  // Si no es SUPER_ADMIN, filtrar por su centro
  const centerId =
    userRole === "SUPER_ADMIN" ? undefined : session.user.centerId || undefined;

  const data = await getArbitrationTypesData(centerId);

  return (
    <ArbitrationTypesClient
      arbitrationTypes={data.arbitrationTypes}
      centers={data.centers}
      stats={data.stats}
      userRole={userRole}
      userCenterId={session.user.centerId || undefined}
    />
  );
}
