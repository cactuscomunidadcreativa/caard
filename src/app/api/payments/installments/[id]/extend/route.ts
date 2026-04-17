/**
 * POST /api/payments/installments/[id]/extend
 * Prorroga el plan de fraccionamiento: agrega N días a las cuotas pendientes
 * (o a una cuota específica si se pasa installmentId).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const daysToAdd = Number(body?.days || 30);
    const installmentId: string | undefined = body?.installmentId;
    const reason: string = body?.reason || "Prórroga otorgada";

    if (!daysToAdd || daysToAdd < 1 || daysToAdd > 365) {
      return NextResponse.json({ error: "Días inválidos (1-365)" }, { status: 400 });
    }

    const plan = await prisma.paymentInstallmentPlan.findUnique({
      where: { id },
      include: { installments: true },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // Cuotas a prorrogar: una específica o todas las pendientes/vencidas
    const target = plan.installments.filter((i) => {
      if (installmentId) return i.id === installmentId;
      return i.status === "PENDING" || i.status === "OVERDUE";
    });

    if (target.length === 0) {
      return NextResponse.json(
        { error: "No hay cuotas pendientes para prorrogar" },
        { status: 400 }
      );
    }

    // Aplicar prórroga: sumar daysToAdd a dueAt
    await prisma.$transaction(
      target.map((inst) =>
        prisma.paymentInstallment.update({
          where: { id: inst.id },
          data: {
            dueAt: new Date(new Date(inst.dueAt).getTime() + daysToAdd * 86400000),
            // Si estaba vencida, volver a pendiente
            ...(inst.status === "OVERDUE" ? { status: "PENDING" as const } : {}),
          },
        })
      )
    );

    // Guardar en reviewNotes del plan para auditoría simple
    const prevNotes = plan.reviewNotes || "";
    const newEntry = `[${new Date().toISOString()}] Prórroga ${daysToAdd}d (${target.length} cuota${target.length > 1 ? "s" : ""}): ${reason}`;
    await prisma.paymentInstallmentPlan.update({
      where: { id },
      data: {
        reviewNotes: prevNotes ? `${prevNotes}\n${newEntry}` : newEntry,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "PaymentInstallmentPlan",
        entityId: id,
        userId: session.user.id,
        caseId: plan.caseId,
        meta: {
          operation: "EXTEND",
          daysAdded: daysToAdd,
          installmentsAffected: target.length,
          installmentId: installmentId || null,
          reason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      daysAdded: daysToAdd,
      installmentsAffected: target.length,
    });
  } catch (e: any) {
    console.error("extend installment error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al prorrogar" },
      { status: 500 }
    );
  }
}
