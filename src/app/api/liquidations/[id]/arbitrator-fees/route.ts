/**
 * CAARD - API de Honorarios de Árbitros en Liquidación
 * GET: Listar honorarios de árbitros
 * POST: Agregar honorario de árbitro
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createArbitratorFeeSchema = z.object({
  arbitratorName: z.string().min(1),
  arbitratorId: z.string().optional(),
  netAmountCents: z.number().int().positive(),
  retentionRate: z.number().min(0).max(1).default(0.08), // 8% por defecto
});

const updateArbitratorFeeSchema = z.object({
  dteStatus: z.enum(["PENDING", "PARTIAL", "PAID", "PENDING_CREDIT", "INVOICE_ISSUED", "RECEIPT_ISSUED"]).optional(),
  dtePaidAt: z.string().datetime().optional().nullable(),
  dteReceiptNumber: z.string().optional().nullable(),
  dteReceiptDate: z.string().datetime().optional().nullable(),
  ddoStatus: z.enum(["PENDING", "PARTIAL", "PAID", "PENDING_CREDIT", "INVOICE_ISSUED", "RECEIPT_ISSUED"]).optional(),
  ddoPaidAt: z.string().datetime().optional().nullable(),
  ddoReceiptNumber: z.string().optional().nullable(),
  ddoReceiptDate: z.string().datetime().optional().nullable(),
  subrogationDte: z.boolean().optional(),
  subrogationDdo: z.boolean().optional(),
  subrogationDate: z.string().datetime().optional().nullable(),
  subrogationReceiptNumber: z.string().optional().nullable(),
  subrogationReceiptDate: z.string().datetime().optional().nullable(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Listar honorarios de árbitros
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: liquidationId } = await params;

    const fees = await prisma.liquidationArbitratorFee.findMany({
      where: { liquidationId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: fees });
  } catch (error) {
    console.error("Error fetching arbitrator fees:", error);
    return NextResponse.json(
      { error: "Error al obtener honorarios" },
      { status: 500 }
    );
  }
}

// POST - Agregar honorario de árbitro
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
    const validation = createArbitratorFeeSchema.safeParse(body);

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

    // Calcular retención y monto bruto
    const retentionCents = Math.round(data.netAmountCents * data.retentionRate);
    const grossAmountCents = data.netAmountCents + retentionCents;

    const fee = await prisma.liquidationArbitratorFee.create({
      data: {
        liquidationId,
        arbitratorName: data.arbitratorName,
        arbitratorId: data.arbitratorId,
        netAmountCents: data.netAmountCents,
        retentionRate: data.retentionRate,
        retentionCents,
        grossAmountCents,
        dteStatus: "PENDING",
        ddoStatus: "PENDING",
      },
    });

    // Actualizar totales de la liquidación
    await updateLiquidationTotals(liquidationId);

    return NextResponse.json({
      success: true,
      message: "Honorario de árbitro agregado",
      data: fee,
    });
  } catch (error) {
    console.error("Error creating arbitrator fee:", error);
    return NextResponse.json(
      { error: "Error al agregar honorario" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar honorario de árbitro (para pagos)
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
    const feeId = searchParams.get("feeId");

    if (!feeId) {
      return NextResponse.json(
        { error: "Se requiere feeId" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateArbitratorFeeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.liquidationArbitratorFee.findFirst({
      where: { id: feeId, liquidationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Honorario no encontrado" },
        { status: 404 }
      );
    }

    const data = validation.data;
    const updateData: any = {};

    // DTE
    if (data.dteStatus !== undefined) updateData.dteStatus = data.dteStatus;
    if (data.dtePaidAt !== undefined) updateData.dtePaidAt = data.dtePaidAt ? new Date(data.dtePaidAt) : null;
    if (data.dteReceiptNumber !== undefined) updateData.dteReceiptNumber = data.dteReceiptNumber;
    if (data.dteReceiptDate !== undefined) updateData.dteReceiptDate = data.dteReceiptDate ? new Date(data.dteReceiptDate) : null;

    // DDO
    if (data.ddoStatus !== undefined) updateData.ddoStatus = data.ddoStatus;
    if (data.ddoPaidAt !== undefined) updateData.ddoPaidAt = data.ddoPaidAt ? new Date(data.ddoPaidAt) : null;
    if (data.ddoReceiptNumber !== undefined) updateData.ddoReceiptNumber = data.ddoReceiptNumber;
    if (data.ddoReceiptDate !== undefined) updateData.ddoReceiptDate = data.ddoReceiptDate ? new Date(data.ddoReceiptDate) : null;

    // Subrogación
    if (data.subrogationDte !== undefined) updateData.subrogationDte = data.subrogationDte;
    if (data.subrogationDdo !== undefined) updateData.subrogationDdo = data.subrogationDdo;
    if (data.subrogationDate !== undefined) updateData.subrogationDate = data.subrogationDate ? new Date(data.subrogationDate) : null;
    if (data.subrogationReceiptNumber !== undefined) updateData.subrogationReceiptNumber = data.subrogationReceiptNumber;
    if (data.subrogationReceiptDate !== undefined) updateData.subrogationReceiptDate = data.subrogationReceiptDate ? new Date(data.subrogationReceiptDate) : null;

    const updated = await prisma.liquidationArbitratorFee.update({
      where: { id: feeId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Honorario actualizado",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating arbitrator fee:", error);
    return NextResponse.json(
      { error: "Error al actualizar honorario" },
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
    (sum, fee) => sum + fee.grossAmountCents * 2, // DTE + DDO
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
