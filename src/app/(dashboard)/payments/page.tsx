/**
 * CAARD - Página de Pagos
 * Lee de PaymentOrder (fuente de verdad) + Payment (legacy)
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

const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

function safeSerialize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(safeSerialize);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = safeSerialize(value);
    }
    return result;
  }
  return obj;
}

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isFullAccess = FULL_ACCESS_ROLES.includes(session.user.role as Role);
  let caseFilter: any = {};

  if (session.user.centerId) caseFilter.centerId = session.user.centerId;

  if (!isFullAccess) {
    const userCases = await prisma.caseMember.findMany({
      where: { userId: session.user.id },
      select: { caseId: true },
    });
    const lawyerCases = await prisma.caseLawyer.findMany({
      where: { lawyerId: session.user.id, isActive: true },
      select: { caseId: true },
    });
    const caseIds = [...new Set([...userCases.map(c => c.caseId), ...lawyerCases.map(c => c.caseId)])];
    if (caseIds.length === 0) {
      return <PaymentsClient payments={[]} stats={{ total: 0, pending: 0, required: 0, confirmed: 0, overdue: 0, failed: 0, totalAmountPending: 0, totalAmountConfirmed: 0 }} userRole={session.user.role as Role} />;
    }
    caseFilter.id = { in: caseIds };
  }

  // Read from PaymentOrder (source of truth)
  const orders = await prisma.paymentOrder.findMany({
    where: { case: caseFilter },
    include: {
      case: { select: { id: true, code: true, title: true } },
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  const payments = orders.map(o => ({
    id: o.id,
    caseId: o.caseId,
    provider: "MANUAL_VOUCHER",
    status: o.status === "PAID" ? "CONFIRMED" : o.status,
    currency: o.currency,
    amountCents: o.totalCents, // Use total (with IGV) as displayed amount
    concept: o.concept,
    description: o.description,
    dueAt: o.dueAt,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
    case: {
      id: o.case.id,
      code: o.case.code,
      title: o.case.title,
      claimantName: null,
      respondentName: null,
    },
    voucherDocument: null,
    // Extra fields
    orderNumber: o.orderNumber,
    igvCents: o.igvCents,
    baseCents: o.amountCents,
  }));

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === "PENDING").length,
    required: 0,
    confirmed: payments.filter(p => p.status === "CONFIRMED").length,
    overdue: payments.filter(p => p.status === "OVERDUE").length,
    failed: 0,
    totalAmountPending: payments.filter(p => ["PENDING", "OVERDUE"].includes(p.status)).reduce((s, p) => s + p.amountCents, 0),
    totalAmountConfirmed: payments.filter(p => p.status === "CONFIRMED").reduce((s, p) => s + p.amountCents, 0),
  };

  return <PaymentsClient payments={payments as any} stats={stats} userRole={session.user.role as Role} />;
}
