/**
 * DELETE /api/payments/installments/[id]
 * Eliminar un plan de fraccionamiento (solo admin/secretaria).
 * - Borra el plan y en cascada todas sus cuotas (según schema).
 * - Si el plan estaba ACTIVE con cuotas pagadas, requiere ?force=true
 *   para confirmar (evita borrar accidentalmente pagos ya realizados).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Sin permisos para eliminar fraccionamientos" },
        { status: 403 }
      );
    }

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
