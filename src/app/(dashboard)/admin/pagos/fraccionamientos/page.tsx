/**
 * CAARD - Gestión de Fraccionamientos (Admin)
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FraccionamientosClient } from "./fraccionamientos-client";

export const metadata: Metadata = {
  title: "Fraccionamientos | Admin | CAARD",
  description: "Gestión de solicitudes de fraccionamiento de pagos",
};

async function getInstallmentPlans() {
  const plans = await prisma.paymentInstallmentPlan.findMany({
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
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      installments: {
        orderBy: { installmentNumber: "asc" },
      },
    },
    orderBy: [
      { status: "asc" }, // Pendientes primero
      { createdAt: "desc" },
    ],
  });

  return plans;
}

async function getPendingPaymentOrders() {
  // Get payment orders that don't have an active installment plan
  const existingPlanOrderIds = await prisma.paymentInstallmentPlan.findMany({
    where: {
      status: {
        in: ["PENDING", "APPROVED", "ACTIVE"],
      },
    },
    select: { paymentOrderId: true },
  });

  const orderIdsWithPlans = existingPlanOrderIds.map((p) => p.paymentOrderId);

  const orders = await prisma.paymentOrder.findMany({
    where: {
      status: "PENDING",
      id: {
        notIn: orderIdsWithPlans,
      },
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
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Limit to avoid too much data
  });

  return orders;
}

async function getSettings() {
  const setting = await prisma.setting.findFirst({
    where: { key: "installments.allowPartyRequests" },
  });
  return setting?.value === "true";
}

export default async function FraccionamientosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const [plans, pendingPaymentOrders, allowPartyRequests] = await Promise.all([
    getInstallmentPlans(),
    getPendingPaymentOrders(),
    getSettings(),
  ]);

  return (
    <FraccionamientosClient
      plans={plans}
      pendingPaymentOrders={pendingPaymentOrders}
      allowPartyRequests={allowPartyRequests}
    />
  );
}
