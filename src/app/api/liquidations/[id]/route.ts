/**
 * CAARD - API de Liquidación (Individual)
 * GET: Obtener liquidación
 * PUT: Actualizar liquidación
 * DELETE: Eliminar liquidación
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateLiquidationSchema = z.object({
  claimantName: z.string().min(1).optional(),
  respondentName: z.string().min(1).optional(),
  presentationFeeCents: z.number().int().optional(),
  presentationFeeIgvCents: z.number().int().optional(),
  presentationFeePaidAt: z.string().datetime().optional().nullable(),
  presentationFeeInvoiceDate: z.string().datetime().optional().nullable(),
  processStatus: z.enum(["EN_PROCESO", "LAUDADO", "CONCLUIDO"]).optional(),
  awardDate: z.string().datetime().optional().nullable(),
  status: z.enum(["DRAFT", "PENDING_PAYMENT", "PARTIAL_PAID", "PAID", "CANCELLED"]).optional(),
  notes: z.string().optional().nullable(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Obtener liquidación completa
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const liquidation = await prisma.caseLiquidation.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            claimantName: true,
            respondentName: true,
            members: {
              where: {
                role: { in: ["ARBITRO"] },
              },
              select: {
                id: true,
                displayName: true,
                userId: true,
              },
            },
          },
        },
        arbitratorFees: {
          orderBy: { createdAt: "asc" },
        },
        adminPayments: {
          orderBy: { createdAt: "asc" },
        },
        installmentPlan: {
          include: {
            installments: {
              orderBy: { installmentNumber: "asc" },
            },
          },
        },
      },
    });

    if (!liquidation) {
      return NextResponse.json(
        { error: "Liquidación no encontrada" },
        { status: 404 }
      );
    }

    // Calcular totales
    const totalArbitratorFees = liquidation.arbitratorFees.reduce(
      (sum, fee) => sum + fee.grossAmountCents * 2, // DTE + DDO
      0
    );

    const totalAdminPayments = liquidation.adminPayments.reduce(
      (sum, payment) => sum + payment.totalCents,
      0
    );

    const grandTotal =
      liquidation.presentationFeeCents +
      liquidation.presentationFeeIgvCents +
      totalArbitratorFees +
      totalAdminPayments;

    return NextResponse.json({
      data: {
        ...liquidation,
        calculatedTotals: {
          totalArbitratorFeesCents: totalArbitratorFees,
          totalAdminPaymentsCents: totalAdminPayments,
          grandTotalCents: grandTotal,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching liquidation:", error);
    return NextResponse.json(
      { error: "Error al obtener liquidación" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar liquidación
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateLiquidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.caseLiquidation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Liquidación no encontrada" },
        { status: 404 }
      );
    }

    const data = validation.data;
    const updateData: any = {};

    if (data.claimantName !== undefined) updateData.claimantName = data.claimantName;
    if (data.respondentName !== undefined) updateData.respondentName = data.respondentName;
    if (data.presentationFeeCents !== undefined) updateData.presentationFeeCents = data.presentationFeeCents;
    if (data.presentationFeeIgvCents !== undefined) updateData.presentationFeeIgvCents = data.presentationFeeIgvCents;
    if (data.presentationFeePaidAt !== undefined) {
      updateData.presentationFeePaidAt = data.presentationFeePaidAt ? new Date(data.presentationFeePaidAt) : null;
    }
    if (data.presentationFeeInvoiceDate !== undefined) {
      updateData.presentationFeeInvoiceDate = data.presentationFeeInvoiceDate ? new Date(data.presentationFeeInvoiceDate) : null;
    }
    if (data.processStatus !== undefined) updateData.processStatus = data.processStatus;
    if (data.awardDate !== undefined) {
      updateData.awardDate = data.awardDate ? new Date(data.awardDate) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.caseLiquidation.update({
      where: { id },
      data: updateData,
      include: {
        case: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Liquidación actualizada",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating liquidation:", error);
    return NextResponse.json(
      { error: "Error al actualizar liquidación" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar liquidación (solo borrador)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.caseLiquidation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Liquidación no encontrada" },
        { status: 404 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar liquidaciones en borrador" },
        { status: 400 }
      );
    }

    await prisma.caseLiquidation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Liquidación eliminada",
    });
  } catch (error) {
    console.error("Error deleting liquidation:", error);
    return NextResponse.json(
      { error: "Error al eliminar liquidación" },
      { status: 500 }
    );
  }
}
