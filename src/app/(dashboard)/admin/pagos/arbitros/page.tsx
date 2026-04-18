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
  // 1. Registros dedicados ArbitratorPayment
  const payments = await prisma.arbitratorPayment.findMany({
    where: { centerId },
    orderBy: { createdAt: "desc" },
    take: 100,
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

  const dedicated = payments.map((payment) => ({
    ...payment,
    __source: "ArbitratorPayment" as const,
    case: cases.find((c) => c.id === payment.caseId),
    arbitratorUser: users.find((u) => u.id === payment.arbitratorUserId),
  }));

  // 2. PaymentOrders donde payeeType=ARBITRO (ordenes de pago directas a árbitros)
  const orders = await prisma.paymentOrder.findMany({
    where: {
      payeeType: "ARBITRO",
      case: { centerId },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      case: { select: { id: true, code: true, title: true } },
    },
  });

  const asArbitratorPayments = orders.map((o: any) => ({
    __source: "PaymentOrder" as const,
    id: o.id,
    centerId,
    caseId: o.caseId,
    arbitratorUserId: null,
    concept: o.concept,
    description: o.description,
    grossAmountCents: o.totalCents,
    netAmountCents: o.totalCents,
    retentionCents: 0,
    igvCents: o.igvCents || 0,
    status: o.status,
    dueAt: o.dueAt,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    case: o.case,
    arbitratorUser: {
      id: null,
      name: o.payeeName,
      email: o.payeeEmail,
    },
    orderNumber: o.orderNumber,
  }));

  // Combinar y ordenar por fecha
  return [...dedicated, ...asArbitratorPayments].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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
      status: {
        in: [
          "IN_PROCESS",
          "ADMITTED",
          "SUBMITTED",
          "UNDER_REVIEW",
          "AWAITING_PAYMENT",
        ],
      },
    },
    select: {
      id: true,
      code: true,
      title: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
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
      payments={payments as any}
      arbitrators={arbitrators}
      cases={cases}
    />
  );
}
