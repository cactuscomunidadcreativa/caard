/**
 * DELETE /api/payments/installments/[id]
 * Eliminar un plan de fraccionamiento (solo admin/secretaria).
 * - Borra el plan y en cascada todas sus cuotas (según schema).
 * - Si el plan estaba ACTIVE con cuotas pagadas, requiere ?force=true
 *   para confirmar (evita borrar accidentalmente pagos ya realizados).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/payments/installments/[id]
 * Edita un plan de fraccionamiento existente. Si hay cuotas pagadas,
 * solo se permite editar campos descriptivos (reason, notas). Si todas
 * están pendientes, se pueden regenerar las cuotas con nuevos montos
 * y fechas.
 */
export async function PATCH(request: NextRequest, { params }: Props) {
  let session;
  try {
    session = await requireAuthWithPermission(PERMISSIONS.INSTALLMENTS_UPDATE);
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    throw e;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      reason,
      reviewNotes,
      numberOfInstallments,
      totalAmountCents,
      firstDueDate,
      status,
    } = body || {};

    const plan = await prisma.paymentInstallmentPlan.findUnique({
      where: { id },
      include: {
        installments: { select: { id: true, status: true } },
      },
    });
    if (!plan) {
      return NextResponse.json(
        { error: "Fraccionamiento no encontrado" },
        { status: 404 }
      );
    }

    const paidCount = plan.installments.filter((i) => i.status === "PAID").length;
    const wantsScheduleChange =
      (typeof numberOfInstallments === "number" && numberOfInstallments !== plan.numberOfInstallments) ||
      (typeof totalAmountCents === "number" && totalAmountCents !== plan.totalAmountCents) ||
      (firstDueDate && new Date(firstDueDate).toISOString() !== plan.firstDueDate.toISOString());

    if (wantsScheduleChange && paidCount > 0) {
      return NextResponse.json(
        {
          error: `Este fraccionamiento tiene ${paidCount} cuota${paidCount === 1 ? "" : "s"} pagada${paidCount === 1 ? "" : "s"}. Solo podés editar la razón / notas, no el cronograma.`,
          paidCount,
        },
        { status: 409 }
      );
    }

    const data: any = {};
    if (typeof reason === "string") data.reason = reason;
    if (typeof reviewNotes === "string") data.reviewNotes = reviewNotes;
    if (status && ["PENDING", "APPROVED", "ACTIVE", "REJECTED", "COMPLETED", "DEFAULTED", "CANCELLED"].includes(status)) {
      data.status = status;
    }

    if (wantsScheduleChange) {
      const newNumber = typeof numberOfInstallments === "number"
        ? numberOfInstallments
        : plan.numberOfInstallments;
      const newTotal = typeof totalAmountCents === "number"
        ? totalAmountCents
        : plan.totalAmountCents;
      const newFirst = firstDueDate ? new Date(firstDueDate) : plan.firstDueDate;

      if (newNumber < 2 || newNumber > 24) {
        return NextResponse.json(
          { error: "El número de cuotas debe estar entre 2 y 24" },
          { status: 400 }
        );
      }
      if (newTotal <= 0) {
        return NextResponse.json(
          { error: "El monto total debe ser mayor a cero" },
          { status: 400 }
        );
      }

      const installmentAmount = Math.ceil(newTotal / newNumber);

      data.numberOfInstallments = newNumber;
      data.totalAmountCents = newTotal;
      data.installmentAmountCents = installmentAmount;
      data.firstDueDate = newFirst;

      // Borrar cuotas viejas (todas PENDING en este punto) y generar nuevas
      await prisma.paymentInstallment.deleteMany({
        where: { planId: id, status: "PENDING" },
      });

      const newInstallments = Array.from({ length: newNumber }).map((_, i) => {
        const due = new Date(newFirst);
        due.setMonth(due.getMonth() + i);
        return {
          planId: id,
          installmentNumber: i + 1,
          amountCents: installmentAmount,
          dueAt: due,
          status: "PENDING" as const,
        };
      });
      await prisma.paymentInstallment.createMany({ data: newInstallments });
    }

    const updated = await prisma.paymentInstallmentPlan.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "PaymentInstallmentPlan",
        entityId: id,
        userId: session.user.id,
        caseId: plan.caseId,
        meta: {
          changed: Object.keys(data),
          scheduleRegenerated: wantsScheduleChange,
          previousStatus: plan.status,
          newStatus: data.status || plan.status,
        },
      },
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (e: any) {
    console.error("Error updating installment plan:", e);
    return NextResponse.json(
      { error: e?.message || "Error al actualizar fraccionamiento" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  let session;
  try {
    session = await requireAuthWithPermission(PERMISSIONS.INSTALLMENTS_DELETE);
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    throw e;
  }
  try {

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const plan = await prisma.paymentInstallmentPlan.findUnique({
      where: { id },
      include: {
        installments: { select: { id: true, status: true } },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Fraccionamiento no encontrado" },
        { status: 404 }
      );
    }

    const paidCount = plan.installments.filter((i) => i.status === "PAID").length;
    if (paidCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `Este fraccionamiento tiene ${paidCount} cuota${
            paidCount === 1 ? "" : "s"
          } pagada${paidCount === 1 ? "" : "s"}. Usa force=true para eliminarlo igual.`,
          paidCount,
          requiresForce: true,
        },
        { status: 409 }
      );
    }

    // Eliminar: las cuotas se borran en cascada (onDelete: Cascade en schema)
    await prisma.paymentInstallmentPlan.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "PaymentInstallmentPlan",
        entityId: id,
        userId: session.user.id,
        caseId: plan.caseId,
        meta: {
          operation: "DELETE_INSTALLMENT_PLAN",
          numberOfInstallments: plan.numberOfInstallments,
          totalAmountCents: plan.totalAmountCents,
          status: plan.status,
          paidInstallmentsDeleted: paidCount,
          forced: force,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error deleting installment plan:", e);
    return NextResponse.json(
      { error: e?.message || "Error al eliminar fraccionamiento" },
      { status: 500 }
    );
  }
}
