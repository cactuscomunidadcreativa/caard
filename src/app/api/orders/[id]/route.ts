/**
 * CAARD - API de Orden Individual
 * GET: Detalle de orden
 * PUT: Actualizar estado (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"];

const updateOrderSchema = z.object({
  status: z
    .enum([
      "PENDING_PAYMENT",
      "ORDER_PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "ORDER_CANCELLED",
      "ORDER_REFUNDED",
    ])
    .optional(),
  trackingNumber: z.string().max(100).optional(),
  adminNotes: z.string().max(1000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = ADMIN_ROLES.includes(session.user.role || "");

    const order = await prisma.storeOrder.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        enrollments: { select: { id: true, courseId: true, status: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Solo admin o el dueño de la orden
    if (!isAdmin && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Error al obtener orden" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const order = await prisma.storeOrder.update({
      where: { id },
      data: {
        ...(data.status && {
          status: data.status,
          ...(data.status === "SHIPPED" && { shippedAt: new Date() }),
          ...(data.status === "DELIVERED" && { deliveredAt: new Date() }),
        }),
        ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
      },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}
