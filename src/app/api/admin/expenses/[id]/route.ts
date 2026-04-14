/**
 * GET/PATCH/DELETE /api/admin/expenses/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        case: { select: { id: true, code: true } },
        registeredBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
      },
    });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const data: any = {};

    const fields = ["category", "concept", "description", "vendorName", "vendorRuc",
      "currency", "voucherType", "voucherNumber", "voucherUrl", "paymentMethod", "paymentRef"];
    for (const f of fields) if (body[f] !== undefined) data[f] = body[f];
    if (body.amountCents !== undefined) {
      data.amountCents = Math.round(Number(body.amountCents));
      data.igvCents = Math.round(Number(body.igvCents || 0));
      data.totalCents = data.amountCents + data.igvCents;
    }
    if (body.voucherDate) data.voucherDate = new Date(body.voucherDate);
    if (body.status) {
      data.status = body.status;
      if (body.status === "APPROVED") { data.approvedById = session.user.id; data.approvedAt = new Date(); }
      if (body.status === "PAID") { data.paidAt = new Date(); }
      if (body.status === "DRAFT") { data.approvedById = null; data.approvedAt = null; data.paidAt = null; }
    }

    const updated = await prisma.expense.update({ where: { id }, data });
    return NextResponse.json({ success: true, expense: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
