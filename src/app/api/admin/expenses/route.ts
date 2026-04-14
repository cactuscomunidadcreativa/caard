/**
 * GET /api/admin/expenses - Listar gastos con filtros
 * POST /api/admin/expenses - Crear gasto
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (category && category !== "all") where.category = category;
    if (status && status !== "all") where.status = status;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          case: { select: { id: true, code: true } },
          registeredBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      items: expenses.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        voucherDate: e.voucherDate?.toISOString() || null,
        approvedAt: e.approvedAt?.toISOString() || null,
        paidAt: e.paidAt?.toISOString() || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const center = await prisma.center.findFirst();
    if (!center) return NextResponse.json({ error: "No center" }, { status: 500 });

    const amountCents = Math.round(Number(body.amountCents || 0));
    const igvCents = Math.round(Number(body.igvCents || 0));

    const expense = await prisma.expense.create({
      data: {
        centerId: center.id,
        caseId: body.caseId || null,
        category: body.category,
        concept: body.concept,
        description: body.description || null,
        vendorName: body.vendorName || null,
        vendorRuc: body.vendorRuc || null,
        amountCents,
        igvCents,
        totalCents: amountCents + igvCents,
        currency: body.currency || "PEN",
        voucherType: body.voucherType || null,
        voucherNumber: body.voucherNumber || null,
        voucherDate: body.voucherDate ? new Date(body.voucherDate) : null,
        voucherUrl: body.voucherUrl || null,
        status: "DRAFT",
        paymentMethod: body.paymentMethod || null,
        registeredById: session.user.id,
      },
    });

    return NextResponse.json({ id: expense.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
