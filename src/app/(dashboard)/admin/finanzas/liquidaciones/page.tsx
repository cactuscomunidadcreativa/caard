/**
 * CAARD - Página de Listado de Liquidaciones
 * Vista administrativa para gestionar todas las liquidaciones de casos
 */

import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LiquidacionesClient } from "./liquidaciones-client";

export const metadata: Metadata = {
  title: "Liquidaciones | Finanzas | CAARD",
  description: "Gestión de liquidaciones de casos arbitrales",
};

async function getLiquidaciones() {
  const liquidaciones = await prisma.caseLiquidation.findMany({
    include: {
      case: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
        },
      },
      arbitratorFees: {
        select: {
          id: true,
          arbitratorName: true,
          grossAmountCents: true,
          dteStatus: true,
          ddoStatus: true,
        },
      },
      adminPayments: {
        select: {
          id: true,
          concept: true,
          totalCents: true,
          paidAt: true,
        },
      },
      installmentPlan: {
        select: {
          id: true,
          numberOfInstallments: true,
          installments: {
            select: {
              status: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return liquidaciones.map((liq) => ({
    id: liq.id,
    caseId: liq.caseId,
    caseCode: liq.case.code,
    caseTitle: liq.case.title,
    caseStatus: liq.case.status,
    claimantName: liq.claimantName,
    respondentName: liq.respondentName,
    totalArbitratorFeesCents: liq.totalArbitratorFeesCents,
    totalAdminFeesCents: liq.totalAdminFeesCents,
    processStatus: liq.processStatus,
    arbitratorFeesCount: liq.arbitratorFees.length,
    adminPaymentsCount: liq.adminPayments.length,
    hasInstallmentPlan: !!liq.installmentPlan,
    installmentProgress: liq.installmentPlan
      ? `${liq.installmentPlan.installments.filter(i => i.status === "PAID").length}/${liq.installmentPlan.numberOfInstallments}`
      : null,
    createdAt: liq.createdAt.toISOString(),
    awardDate: liq.awardDate?.toISOString() || null,
  }));
}

export default async function LiquidacionesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(userRole)) {
    redirect("/dashboard");
  }

  const liquidaciones = await getLiquidaciones();

  return <LiquidacionesClient liquidaciones={liquidaciones} />;
}
