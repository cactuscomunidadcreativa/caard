/**
 * CAARD - API de Pago Individual
 * GET /api/payments/[id] - Obtener pago
 * PATCH /api/payments/[id] - Actualizar estado de pago
 * DELETE /api/payments/[id] - Eliminar pago (solo admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, PaymentStatus } from "@prisma/client";
import { z } from "zod";

// Roles con acceso total
const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

// Schema para actualizar pago
const updatePaymentSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  concept: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  amountCents: z.number().int().positive().optional(),
  dueAt: z.string().datetime().optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role as Role;
    const isFullAccess = FULL_ACCESS_ROLES.includes(userRole);

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
            claimantName: true,
            respondentName: true,
            centerId: true,
          },
        },
        voucherDocument: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Verificar acceso si no es admin
    if (!isFullAccess) {
      const isMember = await prisma.caseMember.findFirst({
        where: { caseId: payment.caseId, userId },
      });

      const isLawyer = await prisma.caseLawyer.findFirst({
        where: { caseId: payment.caseId, lawyerId: userId, isActive: true },
      });

      if (!isMember && !isLawyer) {
        return NextResponse.json(
          { error: "Sin acceso a este pago" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Error al obtener pago" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    // Solo admins pueden modificar pagos
    if (!FULL_ACCESS_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para modificar pagos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updatePaymentSchema.parse(body);

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        case: {
          select: { centerId: true },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;

      // Si se confirma, registrar fecha de pago
      if (validatedData.status === "CONFIRMED" && !existingPayment.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    if (validatedData.concept !== undefined) {
      updateData.concept = validatedData.concept;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    if (validatedData.amountCents !== undefined) {
      updateData.amountCents = validatedData.amountCents;
    }

    if (validatedData.dueAt !== undefined) {
      updateData.dueAt = validatedData.dueAt
        ? new Date(validatedData.dueAt)
        : null;
    }

    if (validatedData.paidAt !== undefined) {
      updateData.paidAt = validatedData.paidAt
        ? new Date(validatedData.paidAt)
        : null;
    }

    const payment = await prisma.payment.update({
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

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: existingPayment.case.centerId,
        caseId: existingPayment.caseId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "Payment",
        entityId: payment.id,
        meta: {
          changes: validatedData,
          previousStatus: existingPayment.status,
          newStatus: payment.status,
        },
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Error al actualizar pago" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    // Solo SUPER_ADMIN y ADMIN pueden eliminar pagos
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para eliminar pagos" },
        { status: 403 }
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        case: {
          select: { centerId: true },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // No permitir eliminar pagos confirmados
    if (existingPayment.status === "CONFIRMED") {
      return NextResponse.json(
        { error: "No se puede eliminar un pago confirmado" },
        { status: 400 }
      );
    }

    await prisma.payment.delete({ where: { id } });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: existingPayment.case.centerId,
        caseId: existingPayment.caseId,
        userId: session.user.id,
        action: "DELETE",
        entity: "Payment",
        entityId: id,
        meta: {
          concept: existingPayment.concept,
          amount: existingPayment.amountCents,
          status: existingPayment.status,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Error al eliminar pago" },
      { status: 500 }
    );
  }
}
