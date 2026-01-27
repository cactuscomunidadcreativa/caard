/**
 * CAARD - Página de Confirmaciones de Pago
 * Vista administrativa para verificar y confirmar pagos pendientes
 */

import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ConfirmacionesClient } from "./confirmaciones-client";

export const metadata: Metadata = {
  title: "Confirmaciones de Pago | Finanzas | CAARD",
  description: "Verificacion y confirmacion de pagos pendientes",
};

async function getPendingPayments() {
  // Obtener confirmaciones de pago pendientes de revision
  const confirmations = await prisma.paymentConfirmation.findMany({
    where: {
      status: {
        in: ["PENDING_VERIFICATION", "PENDING", "IN_REVIEW"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Obtener los PaymentOrders relacionados si existen
  const paymentOrderIds = confirmations
    .filter((c) => c.paymentOrderId)
    .map((c) => c.paymentOrderId!);

  const paymentOrders = paymentOrderIds.length > 0
    ? await prisma.paymentOrder.findMany({
        where: {
          id: { in: paymentOrderIds },
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
      })
    : [];

  const paymentOrderMap = new Map(paymentOrders.map((po) => [po.id, po]));

  // Obtener usuarios que registraron
  const userIds = confirmations
    .filter((c) => c.registeredById)
    .map((c) => c.registeredById!);

  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  return confirmations.map((conf) => {
    const paymentOrder = conf.paymentOrderId
      ? paymentOrderMap.get(conf.paymentOrderId)
      : null;
    const registeredBy = conf.registeredById
      ? userMap.get(conf.registeredById)
      : null;

    return {
      id: conf.id,
      paymentType: conf.paymentType,
      paymentOrderId: conf.paymentOrderId,
      caseId: paymentOrder?.case?.id || null,
      caseCode: paymentOrder?.case?.code || "N/A",
      caseTitle: paymentOrder?.case?.title || "Sin caso asignado",
      concept: paymentOrder?.concept || conf.paymentType,
      expectedAmountCents: conf.expectedAmountCents,
      receivedAmountCents: conf.receivedAmountCents,
      payerName: conf.payerName,
      transactionRef: conf.transactionRef,
      bankName: conf.bankName,
      transactionDate: conf.transactionDate?.toISOString() || null,
      voucherUrl: conf.voucherUrl,
      notes: conf.verificationNotes,
      status: conf.status,
      registeredBy: registeredBy
        ? {
            id: registeredBy.id,
            name: registeredBy.name,
            email: registeredBy.email,
          }
        : {
            id: "unknown",
            name: "Desconocido",
            email: null,
          },
      createdAt: conf.createdAt.toISOString(),
    };
  });
}

export default async function ConfirmacionesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(userRole)) {
    redirect("/dashboard");
  }

  const pendingPayments = await getPendingPayments();

  return <ConfirmacionesClient payments={pendingPayments} />;
}
