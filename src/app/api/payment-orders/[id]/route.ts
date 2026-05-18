/**
 * API: Orden de Pago Individual
 * ==============================
 * Operaciones sobre una orden de pago específica
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema para actualizar orden de pago.
// Aceptamos null en fechas porque el cliente envía null para limpiar el campo
// (ej. cuando el status pasa de PAID a PENDING). Sin esto, Zod rechaza el
// payload y la UI veía 400/500 al editar.
const updatePaymentOrderSchema = z.object({
  status: z
    .enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"])
    .optional(),
  concept: z
    .enum([
      "TASA_PRESENTACION",
      "GASTOS_ADMINISTRATIVOS",
      "HONORARIOS_ARBITRO_UNICO",
      "HONORARIOS_TRIBUNAL",
      "TASA_EMERGENCIA",
      "GASTOS_RECONVENCION",
      "RELIQUIDACION",
      "OTROS",
    ])
    .optional(),
  description: z.string().optional(),
  currency: z.string().min(3).max(3).optional(),
  amountCents: z.number().int().nonnegative().optional(),
  igvCents: z.number().int().min(0).optional(),
  totalCents: z.number().int().nonnegative().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
  blocksCase: z.boolean().optional(),
  paymentId: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
  refundReason: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener orden de pago por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            centerId: true,
            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Orden de pago no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "FINANZAS"].includes(
      user.role
    );
    const isCaseMember = paymentOrder.case.members.some(
      (m) => m.userId === session.user.id
    );

    if (!isAdmin && !isCaseMember) {
      return NextResponse.json(
        { error: "No tiene acceso a esta orden de pago" },
        { status: 403 }
      );
    }

    return NextResponse.json(paymentOrder);
  } catch (error) {
    console.error("Error fetching payment order:", error);
    return NextResponse.json(
      { error: "Error al obtener orden de pago" },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar orden de pago
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Solo roles administrativos pueden actualizar
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "FINANZAS"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para actualizar órdenes de pago" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePaymentOrderSchema.parse(body);

    // Obtener orden actual
    const currentOrder = await prisma.paymentOrder.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            centerId: true,
            isBlocked: true,
            blockReason: true,
          },
        },
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Orden de pago no encontrada" },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;

      // Si se marca como pagado
      if (validatedData.status === "PAID") {
        updateData.paidAt = validatedData.paidAt
          ? new Date(validatedData.paidAt)
          : new Date();
      }

      // Si se marca como reembolsado
      if (validatedData.status === "REFUNDED") {
        updateData.refundedAt = new Date();
        if (validatedData.refundAmount) {
          updateData.refundAmount = validatedData.refundAmount;
        }
        if (validatedData.refundReason) {
          updateData.refundReason = validatedData.refundReason;
        }
      }
    }

    if (validatedData.concept !== undefined) {
      updateData.concept = validatedData.concept;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    if (validatedData.currency !== undefined) {
      updateData.currency = validatedData.currency;
    }

    if (validatedData.amountCents !== undefined) {
      updateData.amountCents = validatedData.amountCents;
      const igv = validatedData.igvCents ?? currentOrder.igvCents;
      updateData.totalCents = validatedData.amountCents + igv;
    }

    if (validatedData.igvCents !== undefined) {
      updateData.igvCents = validatedData.igvCents;
      const amount = validatedData.amountCents ?? currentOrder.amountCents;
      updateData.totalCents = amount + validatedData.igvCents;
    }

    // Cliente puede mandar totalCents calculado; lo respetamos si los otros
    // dos no se enviaron (modo "override manual").
    if (
      validatedData.totalCents !== undefined &&
      validatedData.amountCents === undefined &&
      validatedData.igvCents === undefined
    ) {
      updateData.totalCents = validatedData.totalCents;
    }

    if (validatedData.dueAt !== undefined) {
      updateData.dueAt = validatedData.dueAt ? new Date(validatedData.dueAt) : null;
    }

    // paidAt explícito (independiente de status). Permite limpiar fecha
    // de pago si el status sigue siendo PAID o si se baja a PENDING.
    if (
      validatedData.paidAt !== undefined &&
      validatedData.status !== "PAID"
    ) {
      updateData.paidAt = validatedData.paidAt ? new Date(validatedData.paidAt) : null;
    }

    if (validatedData.blocksCase !== undefined) {
      updateData.blocksCase = validatedData.blocksCase;
    }

    if (validatedData.paymentId !== undefined) {
      updateData.paymentId = validatedData.paymentId;
    }

    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata;
    }

    // Actualizar orden
    const updatedOrder = await prisma.paymentOrder.update({
      where: { id },
      data: updateData,
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    // Si el pago se confirma y bloqueaba el caso, desbloquear
    if (
      validatedData.status === "PAID" &&
      currentOrder.blocksCase &&
      currentOrder.case.isBlocked
    ) {
      // Verificar si hay otras órdenes pendientes
      const pendingOrders = await prisma.paymentOrder.count({
        where: {
          caseId: currentOrder.caseId,
          id: { not: id },
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          blocksCase: true,
        },
      });

      if (pendingOrders === 0) {
        await prisma.case.update({
          where: { id: currentOrder.caseId },
          data: {
            isBlocked: false,
            blockReason: null,
            status: "IN_PROCESS",
          },
        });
      }
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        centerId: currentOrder.case.centerId,
        caseId: currentOrder.caseId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "PaymentOrder",
        entityId: id,
        meta: {
          previousStatus: currentOrder.status,
          newStatus: validatedData.status,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating payment order:", error);
    return NextResponse.json(
      { error: "Error al actualizar orden de pago" },
      { status: 500 }
    );
  }
}

// DELETE: Cancelar orden de pago
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // SUPER_ADMIN, ADMIN, SECRETARIA, CENTER_STAFF pueden cancelar
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "FINANZAS"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para cancelar órdenes de pago" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "Cancelado por administrador";

    const order = await prisma.paymentOrder.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            centerId: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden de pago no encontrada" },
        { status: 404 }
      );
    }

    // No se puede cancelar si ya está pagada
    if (order.status === "PAID") {
      return NextResponse.json(
        { error: "No se puede cancelar una orden ya pagada. Use reembolso." },
        { status: 400 }
      );
    }

    // Marcar como cancelada (no eliminar para mantener historial)
    const cancelledOrder = await prisma.paymentOrder.update({
      where: { id },
      data: {
        status: "CANCELLED",
        metadata: {
          ...(order.metadata as object || {}),
          cancelledAt: new Date().toISOString(),
          cancelledBy: session.user.id,
          cancellationReason: reason,
        },
      },
    });

    // Si era la única orden que bloqueaba, desbloquear el caso
    if (order.blocksCase) {
      const pendingOrders = await prisma.paymentOrder.count({
        where: {
          caseId: order.caseId,
          id: { not: id },
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          blocksCase: true,
        },
      });

      if (pendingOrders === 0) {
        await prisma.case.update({
          where: { id: order.caseId },
          data: {
            isBlocked: false,
            blockReason: null,
          },
        });
      }
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        centerId: order.case.centerId,
        caseId: order.caseId,
        userId: session.user.id,
        action: "DELETE",
        entity: "PaymentOrder",
        entityId: id,
        meta: {
          orderNumber: order.orderNumber,
          reason,
        },
      },
    });

    return NextResponse.json({
      message: "Orden de pago cancelada",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Error cancelling payment order:", error);
    return NextResponse.json(
      { error: "Error al cancelar orden de pago" },
      { status: 500 }
    );
  }
}
