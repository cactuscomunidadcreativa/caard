/**
 * CAARD - Administración de Pagos
 * Panel para gestionar órdenes de pago y ver historial
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentsPageClient } from "./client";

export default async function PaymentsAdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar que sea admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN" && user?.role !== "SECRETARIA") {
    redirect("/dashboard");
  }

  // Obtener órdenes de pago recientes
  const paymentOrders = await prisma.paymentOrder.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      case: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  });

  // Traer planes de fraccionamiento asociados para marcar las órdenes
  const orderIds = paymentOrders.map((o) => o.id);
  const installmentPlans = orderIds.length
    ? await prisma.paymentInstallmentPlan.findMany({
        where: { paymentOrderId: { in: orderIds } },
        select: {
          id: true,
          paymentOrderId: true,
          numberOfInstallments: true,
          status: true,
          installments: {
            select: { id: true, installmentNumber: true, status: true, amountCents: true, dueAt: true, paidAt: true },
            orderBy: { installmentNumber: "asc" },
          },
        },
      })
    : [];
  const planByOrderId: Record<string, typeof installmentPlans[number] | undefined> = {};
  for (const p of installmentPlans) planByOrderId[p.paymentOrderId] = p;

  // Obtener pagos confirmados recientes
  const payments = await prisma.payment.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      case: {
        select: {
          id: true,
          code: true,
        },
      },
    },
  });

  // Estadísticas
  const stats = await Promise.all([
    prisma.paymentOrder.count({ where: { status: "PENDING" } }),
    prisma.paymentOrder.count({ where: { status: "PAID" } }),
    prisma.payment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amountCents: true },
    }),
    prisma.payment.count({
      where: {
        status: "CONFIRMED",
        createdAt: {
          gte: new Date(new Date().setDate(1)), // Primer día del mes
        },
      },
    }),
  ]);

  const formattedStats = {
    pendingOrders: stats[0],
    paidOrders: stats[1],
    totalCollected: stats[2]._sum.amountCents || 0,
    paymentsThisMonth: stats[3],
  };

  return (
    <PaymentsPageClient
      paymentOrders={paymentOrders.map((po) => {
        const plan = planByOrderId[po.id];
        return {
          id: po.id,
          concept: po.concept,
          description: po.description,
          totalCents: po.totalCents,
          currency: po.currency,
          status: po.status,
          dueDate: po.dueAt?.toISOString() || null,
          paidAt: po.paidAt?.toISOString() || null,
          createdAt: po.createdAt.toISOString(),
          caseCode: po.case?.code || null,
          caseId: po.case?.id || null,
          createdByName: null,
          createdByEmail: null,
          installmentPlan: plan
            ? {
                id: plan.id,
                status: plan.status,
                numberOfInstallments: plan.numberOfInstallments,
                paidInstallments: plan.installments.filter((i) => i.status === "PAID").length,
                installments: plan.installments.map((i) => ({
                  id: i.id,
                  number: i.installmentNumber,
                  status: i.status,
                  amountCents: i.amountCents,
                  dueAt: i.dueAt.toISOString(),
                  paidAt: i.paidAt ? i.paidAt.toISOString() : null,
                })),
              }
            : null,
        };
      })}
      payments={payments.map((p) => ({
        id: p.id,
        provider: p.provider,
        status: p.status,
        currency: p.currency,
        amountCents: p.amountCents,
        concept: p.concept,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        caseCode: p.case?.code || null,
        culqiChargeId: p.culqiChargeId || null,
      }))}
      stats={formattedStats}
    />
  );
}

export const metadata = {
  title: "Administración de Pagos - CAARD",
  description: "Gestión de órdenes de pago y historial de transacciones",
};
