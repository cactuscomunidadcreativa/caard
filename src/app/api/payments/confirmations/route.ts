/**
 * CAARD - API de Confirmación de Pagos
 * GET: Listar confirmaciones de pago
 * POST: Registrar nueva confirmación de pago
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación
const createPaymentConfirmationSchema = z.object({
  paymentType: z.enum(["PAYMENT_ORDER", "INSTALLMENT", "FEE"]),
  paymentOrderId: z.string().optional(),
  installmentId: z.string().optional(),
  payerName: z.string().min(1),
  payerRuc: z.string().optional(),
  payerEmail: z.string().email().optional(),
  expectedAmountCents: z.number().int().positive(),
  receivedAmountCents: z.number().int().positive(),
  currency: z.string().default("PEN"),
  paymentMethod: z.enum(["TRANSFERENCIA", "DEPOSITO", "ONLINE", "CHEQUE"]),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  transactionDate: z.string().datetime(),
  transactionRef: z.string().optional(),
  voucherUrl: z.string().url().optional(),
  igvIncluded: z.boolean().default(false),
  detractionApplied: z.boolean().default(false),
  detractionAmountCents: z.number().int().default(0),
  detractionConstancia: z.string().optional(),
});

// GET - Listar confirmaciones de pago
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentOrderId = searchParams.get("paymentOrderId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (session.user.centerId) {
      where.centerId = session.user.centerId;
    }

    if (paymentOrderId) where.paymentOrderId = paymentOrderId;
    if (status) where.status = status;

    const [confirmations, total] = await Promise.all([
      prisma.paymentConfirmation.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentConfirmation.count({ where }),
    ]);

    return NextResponse.json({
      data: confirmations.map((conf) => ({
        id: conf.id,
        paymentType: conf.paymentType,
        paymentOrderId: conf.paymentOrderId,
        installmentId: conf.installmentId,
        payerName: conf.payerName,
        payerRuc: conf.payerRuc,
        expectedAmount: conf.expectedAmountCents / 100,
        receivedAmount: conf.receivedAmountCents / 100,
        difference: conf.differenceCents / 100,
        differenceType: conf.differenceType,
        currency: conf.currency,
        paymentMethod: conf.paymentMethod,
        bankName: conf.bankName,
        transactionDate: conf.transactionDate,
        transactionRef: conf.transactionRef,
        voucherUrl: conf.voucherUrl,
        voucherVerified: conf.voucherVerified,
        igvIncluded: conf.igvIncluded,
        detractionApplied: conf.detractionApplied,
        detractionAmount: conf.detractionAmountCents / 100,
        status: conf.status,
        registeredAt: conf.registeredAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payment confirmations:", error);
    return NextResponse.json(
      { error: "Error al obtener confirmaciones" },
      { status: 500 }
    );
  }
}

// POST - Registrar nueva confirmación de pago
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createPaymentConfirmationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Calcular diferencia
    const differenceCents = data.receivedAmountCents - data.expectedAmountCents;
    let differenceType: string | null = null;
    if (differenceCents === 0) {
      differenceType = "EXACT";
    } else if (differenceCents > 0) {
      differenceType = "OVERPAYMENT";
    } else {
      differenceType = "UNDERPAYMENT";
    }

    // Verificar que existe la orden de pago si se especifica
    let caseCode: string | undefined;
    if (data.paymentOrderId) {
      const paymentOrder = await prisma.paymentOrder.findUnique({
        where: { id: data.paymentOrderId },
        include: { case: { select: { code: true } } },
      });

      if (!paymentOrder) {
        return NextResponse.json(
          { error: "Orden de pago no encontrada" },
          { status: 404 }
        );
      }

      caseCode = paymentOrder.case.code;
    }

    // Crear la confirmación
    const confirmation = await prisma.paymentConfirmation.create({
      data: {
        centerId: session.user.centerId || "",
        paymentType: data.paymentType,
        paymentOrderId: data.paymentOrderId,
        installmentId: data.installmentId,
        payerName: data.payerName,
        payerRuc: data.payerRuc,
        payerEmail: data.payerEmail,
        expectedAmountCents: data.expectedAmountCents,
        receivedAmountCents: data.receivedAmountCents,
        currency: data.currency,
        differenceType,
        differenceCents: Math.abs(differenceCents),
        paymentMethod: data.paymentMethod,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        transactionDate: new Date(data.transactionDate),
        transactionRef: data.transactionRef,
        voucherUrl: data.voucherUrl,
        igvIncluded: data.igvIncluded,
        detractionApplied: data.detractionApplied,
        detractionAmountCents: data.detractionAmountCents,
        detractionConstancia: data.detractionConstancia,
        status: "PENDING_VERIFICATION",
        registeredById: session.user.id,
      },
    });

    // Si el monto coincide y hay orden de pago, actualizar automáticamente
    if (differenceType === "EXACT" && data.paymentOrderId) {
      await prisma.paymentOrder.update({
        where: { id: data.paymentOrderId },
        data: {
          status: "PAID",
          paidAt: new Date(data.transactionDate),
        },
      });

      // Si es un fraccionamiento, actualizar la cuota
      if (data.installmentId) {
        await prisma.paymentInstallment.update({
          where: { id: data.installmentId },
          data: {
            status: "PAID",
            paidAt: new Date(data.transactionDate),
            voucherUrl: data.voucherUrl,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Confirmación de pago registrada",
      data: {
        id: confirmation.id,
        payerName: confirmation.payerName,
        expectedAmount: data.expectedAmountCents / 100,
        receivedAmount: data.receivedAmountCents / 100,
        differenceType,
        difference: Math.abs(differenceCents) / 100,
        status: confirmation.status,
        caseCode,
      },
    });
  } catch (error) {
    console.error("Error creating payment confirmation:", error);
    return NextResponse.json(
      { error: "Error al registrar confirmación" },
      { status: 500 }
    );
  }
}
