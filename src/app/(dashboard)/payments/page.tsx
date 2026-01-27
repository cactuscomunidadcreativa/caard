/**
 * CAARD - Página de Pagos
 * Vista según rol:
 * - SUPER_ADMIN, ADMIN, CENTER_STAFF, SECRETARIA: Todos los pagos
 * - ARBITRO: Pagos de honorarios que le corresponden
 * - ABOGADO, DEMANDANTE, DEMANDADO: Pagos que deben realizar
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { PaymentsClient } from "./payments-client";

export const metadata: Metadata = {
  title: "Pagos | CAARD",
  description: "Gestión de pagos y cobros del sistema de arbitraje",
};

// Roles con acceso total a pagos
const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

async function getPaymentsData(userId: string, userRole: Role, centerId?: string) {
  const isFullAccess = FULL_ACCESS_ROLES.includes(userRole);

  // Base filter por centro
  let caseFilter: any = {};
  if (centerId) {
    caseFilter.centerId = centerId;
  }

  // Si no tiene acceso total, filtrar por casos donde participa
  if (!isFullAccess) {
    // Obtener IDs de casos donde el usuario participa
    const userCases = await prisma.caseMember.findMany({
      where: { userId },
      select: { caseId: true },
    });

    // Para abogados, también obtener casos donde representa
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

    if (caseIds.length === 0) {
      return { payments: [], stats: getEmptyStats(), userRole };
    }

    caseFilter.id = { in: caseIds };
  }

  // Obtener pagos
  const payments = await prisma.payment.findMany({
    where: {
      case: caseFilter,
    },
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
      voucherDocument: {
        select: {
          id: true,
          originalFileName: true,
          driveWebViewLink: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Calcular estadísticas
  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    required: payments.filter((p) => p.status === "REQUIRED").length,
    confirmed: payments.filter((p) => p.status === "CONFIRMED").length,
    overdue: payments.filter((p) => p.status === "OVERDUE").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
    totalAmountPending: payments
      .filter((p) => ["PENDING", "REQUIRED", "OVERDUE"].includes(p.status))
      .reduce((sum, p) => sum + p.amountCents, 0),
    totalAmountConfirmed: payments
      .filter((p) => p.status === "CONFIRMED")
      .reduce((sum, p) => sum + p.amountCents, 0),
  };

  return { payments, stats, userRole };
}

function getEmptyStats() {
  return {
    total: 0,
    pending: 0,
    required: 0,
    confirmed: 0,
    overdue: 0,
    failed: 0,
    totalAmountPending: 0,
    totalAmountConfirmed: 0,
  };
}

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getPaymentsData(
    session.user.id,
    session.user.role as Role,
    session.user.centerId || undefined
  );

  return (
    <PaymentsClient
      payments={data.payments}
      stats={data.stats}
      userRole={data.userRole}
    />
  );
}
