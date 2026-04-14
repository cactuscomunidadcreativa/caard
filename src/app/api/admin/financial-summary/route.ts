/**
 * GET /api/admin/financial-summary - Resumen financiero consolidado
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Ingresos: PaymentOrders PAID
    const ingresos = await prisma.paymentOrder.findMany({
      where: { status: "PAID" },
      select: { totalCents: true, concept: true, paidAt: true, issuedAt: true, createdAt: true },
    });

    // Egresos: Expenses PAID
    const egresos = await prisma.expense.findMany({
      where: { status: "PAID" },
      select: { totalCents: true, category: true, paidAt: true, createdAt: true },
    });

    // Totales
    const totalIngresos = ingresos.reduce((s, i) => s + i.totalCents, 0);
    const totalEgresos = egresos.reduce((s, e) => s + e.totalCents, 0);
    const balance = totalIngresos - totalEgresos;

    // Por mes (últimos 12 meses)
    const monthly: Record<string, { ingresos: number; egresos: number }> = {};
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthly[key] = { ingresos: 0, egresos: 0 };
    }
    for (const i of ingresos) {
      const d = i.paidAt || i.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthly[key]) monthly[key].ingresos += i.totalCents;
    }
    for (const e of egresos) {
      const d = e.paidAt || e.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthly[key]) monthly[key].egresos += e.totalCents;
    }

    // Por concepto (ingresos)
    const byConcepto: Record<string, number> = {};
    for (const i of ingresos) {
      byConcepto[i.concept] = (byConcepto[i.concept] || 0) + i.totalCents;
    }

    // Por categoría (egresos)
    const byCategoria: Record<string, number> = {};
    for (const e of egresos) {
      byCategoria[e.category] = (byCategoria[e.category] || 0) + e.totalCents;
    }

    // Pendientes
    const pendingIngresos = await prisma.paymentOrder.aggregate({
      where: { status: "PENDING" },
      _sum: { totalCents: true },
      _count: true,
    });
    const pendingEgresos = await prisma.expense.aggregate({
      where: { status: { in: ["DRAFT", "APPROVED"] } },
      _sum: { totalCents: true },
      _count: true,
    });

    return NextResponse.json({
      totals: {
        ingresos: totalIngresos,
        egresos: totalEgresos,
        balance,
        pendingIngresos: pendingIngresos._sum.totalCents || 0,
        pendingIngresosCount: pendingIngresos._count,
        pendingEgresos: pendingEgresos._sum.totalCents || 0,
        pendingEgresosCount: pendingEgresos._count,
      },
      monthly: Object.entries(monthly)
        .map(([month, data]) => ({ month, ...data, balance: data.ingresos - data.egresos }))
        .reverse(),
      byConcepto: Object.entries(byConcepto).map(([concept, total]) => ({ concept, total })).sort((a, b) => b.total - a.total),
      byCategoria: Object.entries(byCategoria).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
