/**
 * POST /api/payment-orders/[id]/mark-paid
 * Marca una orden de pago como pagada.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const { id } = await params;
    const po = await prisma.paymentOrder.findUnique({ where: { id } });
    if (!po) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    await prisma.paymentOrder.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        caseId: po.caseId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "PaymentOrder",
        entityId: id,
        meta: { action: "MARK_PAID", previousStatus: po.status },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
