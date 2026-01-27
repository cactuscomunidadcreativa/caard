/**
 * CAARD - Gestión de Pagos a Árbitros (Admin)
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArbitratorPaymentsClient } from "./arbitrator-payments-client";

export const metadata: Metadata = {
  title: "Pagos a Árbitros | Admin | CAARD",
  description: "Gestión de pagos y honorarios a árbitros con retenciones",
};

async function getArbitratorPayments(centerId: string) {
  const payments = await prisma.arbitratorPayment.findMany({
    where: { centerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Obtener información adicional
  const caseIds = [...new Set(payments.map((p) => p.caseId))];
  const arbitratorUserIds = [...new Set(payments.map((p) => p.arbitratorUserId))];

  const [cases, users] = await Promise.all([
    prisma.case.findMany({
      where: { id: { in: caseIds } },
      select: { id: true, code: true, title: true },
    }),
    prisma.user.findMany({
      where: { id: { in: arbitratorUserIds } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return payments.map((payment) => ({
    ...payment,
    case: cases.find((c) => c.id === payment.caseId),
    arbitratorUser: users.find((u) => u.id === payment.arbitratorUserId),
  }));
}

async function getArbitrators(centerId: string) {
  return prisma.arbitratorRegistry.findMany({
    where: {
      centerId,
      status: "ACTIVE",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

async function getCases(centerId: string) {
  return prisma.case.findMany({
    where: {
      centerId,
      status: { in: ["IN_PROCESS", "ADMITTED"] },
    },
    select: {
      id: true,
      code: true,
      title: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function ArbitratorPaymentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const [payments, arbitrators, cases] = await Promise.all([
    getArbitratorPayments(session.user.centerId || ""),
    getArbitrators(session.user.centerId || ""),
    getCases(session.user.centerId || ""),
  ]);

  return (
    <ArbitratorPaymentsClient
      payments={payments}
      arbitrators={arbitrators}
      cases={cases}
    />
  );
}
