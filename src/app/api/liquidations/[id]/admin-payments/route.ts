/**
 * CAARD - API de Gastos Administrativos en Liquidación
 * GET: Listar gastos administrativos
 * POST: Agregar gasto administrativo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAdminPaymentSchema = z.object({
  concept: z.string().min(1),
  description: z.string().optional(),
  baseAmountCents: z.number().int().positive(),
  igvRate: z.number().min(0).max(1).default(0.18), // 18% IGV por defecto
  payer: z.enum(["DTE", "DDO", "BOTH"]).default("DTE"),
});

const updateAdminPaymentSchema = z.object({
  status: z.enum(["PENDING", "PARTIAL", "PAID", "PENDING_CREDIT", "INVOICE_ISSUED", "RECEIPT_ISSUED"]).optional(),
  paidAt: z.string().datetime().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  invoiceDate: z.string().datetime().optional().nullable(),
  subrogation: z.boolean().optional(),
  subrogationBy: z.enum(["DTE", "DDO"]).optional().nullable(),
  subrogationDate: z.string().datetime().optional().nullable(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Listar gastos administrativos
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: liquidationId } = await params;

    const payments = await prisma.liquidationAdminPayment.findMany({
      where: { liquidationId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: payments });
  } catch (error) {
    console.error("Error fetching admin payments:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos administrativos" },
      { status: 500 }
    );
  }
}

// POST - Agregar gasto administrativo
export async function POST(request: NextRequest, { params }: Props) {
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

    const { id: liquidationId } = await params;
    const body = await request.json();
    const validation = createAdminPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verificar que la liquidación existe
    const liquidation = await prisma.caseLiquidation.findUnique({
      where: { id: liquidationId },
    });

    if (!liquidation) {
      return NextResponse.json(
        { error: "Liquidación no encontrada" },
        { status: 404 }
      );
    }

    const data = validation.data;

    // Calcular IGV y total
    const igvCents = Math.round(data.baseAmountCents * data.igvRate);
    const totalCents = data.baseAmountCents + igvCents;

    const payment = await prisma.liquidationAdminPayment.create({
      data: {
        liquidationId,
        concept: data.concept,
        description: data.description,
        baseAmountCents: data.baseAmountCents,
        igvRate: data.igvRate,
        igvCents,
        totalCents,
        payer: data.payer,
        status: "PENDING",
      },
    });

    // Actualizar totales de la liquidación
    await updateLiquidationTotals(liquidationId);

    return NextResponse.json({
      success: true,
      message: "Gasto administrativo agregado",
      data: payment,
    });
  } catch (error) {
    console.error("Error creating admin payment:", error);
    return NextResponse.json(
      { error: "Error al agregar gasto administrativo" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar gasto administrativo
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

    const { id: liquidationId } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Se requiere paymentId" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateAdminPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.liquidationAdminPayment.findFirst({
      where: { id: paymentId, liquidationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Gasto administrativo no encontrado" },
        { status: 404 }
      );
    }

    const data = validation.data;
    const updateData: any = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt ? new Date(data.paidAt) : null;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.invoiceDate !== undefined) updateData.invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : null;
    if (data.subrogation !== undefined) updateData.subrogation = data.subrogation;
    if (data.subrogationBy !== undefined) updateData.subrogationBy = data.subrogationBy;
    if (data.subrogationDate !== undefined) updateData.subrogationDate = data.subrogationDate ? new Date(data.subrogationDate) : null;

    const updated = await prisma.liquidationAdminPayment.update({
      where: { id: paymentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Gasto administrativo actualizado",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating admin payment:", error);
    return NextResponse.json(
      { error: "Error al actualizar gasto administrativo" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar gasto administrativo
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id: liquidationId } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Se requiere paymentId" },
        { status: 400 }
      );
    }

    const existing = await prisma.liquidationAdminPayment.findFirst({
      where: { id: paymentId, liquidationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Gasto administrativo no encontrado" },
        { status: 404 }
      );
    }

    if (existing.status === "PAID") {
      return NextResponse.json(
        { error: "No se puede eliminar un gasto ya pagado" },
        { status: 400 }
      );
    }

    await prisma.liquidationAdminPayment.delete({
      where: { id: paymentId },
    });

    // Actualizar totales
    await updateLiquidationTotals(liquidationId);

    return NextResponse.json({
      success: true,
      message: "Gasto administrativo eliminado",
    });
  } catch (error) {
    console.error("Error deleting admin payment:", error);
    return NextResponse.json(
      { error: "Error al eliminar gasto administrativo" },
      { status: 500 }
    );
  }
}

// Función para actualizar los totales de la liquidación
async function updateLiquidationTotals(liquidationId: string) {
  const [arbitratorFees, adminPayments, liquidation] = await Promise.all([
    prisma.liquidationArbitratorFee.findMany({ where: { liquidationId } }),
    prisma.liquidationAdminPayment.findMany({ where: { liquidationId } }),
    prisma.caseLiquidation.findUnique({ where: { id: liquidationId } }),
  ]);

  if (!liquidation) return;

  const totalArbitratorFeesCents = arbitratorFees.reduce(
    (sum, fee) => sum + fee.grossAmountCents * 2,
    0
  );

  const totalAdminFeesCents = adminPayments.reduce(
    (sum, payment) => sum + payment.totalCents,
    0
  );

  const totalIgvCents =
    liquidation.presentationFeeIgvCents +
    adminPayments.reduce((sum, payment) => sum + payment.igvCents, 0);

  const grandTotalCents =
    liquidation.presentationFeeCents +
    liquidation.presentationFeeIgvCents +
    totalArbitratorFeesCents +
    totalAdminFeesCents;

  await prisma.caseLiquidation.update({
    where: { id: liquidationId },
    data: {
      totalArbitratorFeesCents,
      totalAdminFeesCents,
      totalIgvCents,
      grandTotalCents,
    },
  });
}
