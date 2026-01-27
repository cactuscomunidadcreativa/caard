/**
 * CAARD - Página de Liquidación de Gastos Arbitrales
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LiquidationClient } from "./liquidation-client";

export const metadata: Metadata = {
  title: "Liquidación de Gastos | CAARD",
  description: "Liquidación de gastos arbitrales del expediente",
};

interface Props {
  params: Promise<{ id: string }>;
}

async function getCaseWithLiquidation(caseId: string) {
  const caso = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      arbitrationType: true,
      members: {
        where: { role: { in: ["ARBITRO", "DEMANDANTE", "DEMANDADO"] } },
      },
      liquidations: {
        include: {
          arbitratorFees: {
            orderBy: { createdAt: "asc" },
          },
          adminPayments: {
            orderBy: { createdAt: "asc" },
          },
          installmentPlan: {
            include: {
              installments: {
                orderBy: { installmentNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return caso;
}

export default async function LiquidationPage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id: caseId } = await params;

  const caso = await getCaseWithLiquidation(caseId);

  if (!caso) {
    redirect("/cases");
  }

  // Obtener la liquidación existente o null
  // Serializar las fechas para el cliente
  const rawLiquidation = caso.liquidations[0] || null;
  const liquidation = rawLiquidation ? {
    ...rawLiquidation,
    createdAt: rawLiquidation.createdAt?.toISOString() || null,
    updatedAt: rawLiquidation.updatedAt?.toISOString() || null,
    presentationFeePaidAt: rawLiquidation.presentationFeePaidAt?.toISOString() || null,
    presentationFeeInvoiceDate: rawLiquidation.presentationFeeInvoiceDate?.toISOString() || null,
    awardDate: rawLiquidation.awardDate?.toISOString() || null,
    arbitratorFees: rawLiquidation.arbitratorFees.map((fee) => ({
      ...fee,
      createdAt: fee.createdAt?.toISOString() || null,
      updatedAt: fee.updatedAt?.toISOString() || null,
      dtePaidAt: fee.dtePaidAt?.toISOString() || null,
      dteReceiptDate: fee.dteReceiptDate?.toISOString() || null,
      ddoPaidAt: fee.ddoPaidAt?.toISOString() || null,
      ddoReceiptDate: fee.ddoReceiptDate?.toISOString() || null,
      subrogationDate: fee.subrogationDate?.toISOString() || null,
      subrogationReceiptDate: fee.subrogationReceiptDate?.toISOString() || null,
    })),
    adminPayments: rawLiquidation.adminPayments.map((payment) => ({
      ...payment,
      createdAt: payment.createdAt?.toISOString() || null,
      updatedAt: payment.updatedAt?.toISOString() || null,
      paidAt: payment.paidAt?.toISOString() || null,
      invoiceDate: payment.invoiceDate?.toISOString() || null,
    })),
    installmentPlan: rawLiquidation.installmentPlan ? {
      ...rawLiquidation.installmentPlan,
      createdAt: rawLiquidation.installmentPlan.createdAt?.toISOString() || null,
      approvalDate: rawLiquidation.installmentPlan.approvalDate?.toISOString() || null,
      installments: rawLiquidation.installmentPlan.installments.map((inst) => ({
        ...inst,
        createdAt: inst.createdAt?.toISOString() || null,
        updatedAt: inst.updatedAt?.toISOString() || null,
        dueAt: inst.dueAt?.toISOString() || null,
        paidAt: inst.paidAt?.toISOString() || null,
      })),
    } : null,
  } : null;

  // Obtener árbitros del caso
  const arbitrators = caso.members
    .filter((m) => m.role === "ARBITRO")
    .map((m) => ({
      id: m.id,
      name: m.displayName || "Árbitro",
      userId: m.userId,
    }));

  return (
    <LiquidationClient
      caso={{
        id: caso.id,
        code: caso.code,
        title: caso.title,
        claimantName: caso.claimantName,
        respondentName: caso.respondentName,
        status: caso.status,
      }}
      liquidation={liquidation}
      arbitrators={arbitrators}
    />
  );
}
