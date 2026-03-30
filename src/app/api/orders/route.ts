/**
 * CAARD - API de Órdenes
 * GET: Listar órdenes del usuario o todas (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const page = parseInt(searchParams.get("page") || "1");

    const isAdmin = ADMIN_ROLES.includes(session.user.role || "");

    const where: any = {};
    if (!isAdmin) {
      where.userId = session.user.id;
    }
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.storeOrder.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.storeOrder.count({ where }),
    ]);

    return NextResponse.json({
      items: orders,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}
