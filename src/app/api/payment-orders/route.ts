/**
 * API: Órdenes de Pago
 * ====================
 * Gestión de órdenes de pago del sistema de arbitraje
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  calculatePresentationFee,
  createPresentationPaymentOrder,
  addBusinessDays,
  PAYMENT_CONCEPTS,
} from "@/lib/rules";

// Schema de validación para crear orden de pago
const createPaymentOrderSchema = z.object({
  caseId: z.string(),
  concept: z.enum([
    "TASA_PRESENTACION",
    "GASTOS_ADMINISTRATIVOS",
    "HONORARIOS_ARBITRO_UNICO",
    "HONORARIOS_TRIBUNAL",
    "TASA_EMERGENCIA",
    "GASTOS_RECONVENCION",
    "RELIQUIDACION",
    "OTROS",
  ]),
  description: z.string().optional(),
  amountCents: z.number().positive().optional(),
  dueInDays: z.number().positive().default(5),
  blocksCase: z.boolean().default(true),
});

// GET: Listar órdenes de pago
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (caseId) {
      where.caseId = caseId;
    }

    if (status) {
      where.status = status;
    }

    // Filtrar por rol
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Solo SUPER_ADMIN, ADMIN, CENTER_STAFF y SECRETARIA pueden ver todas las órdenes
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(user.role)) {
      // Otros roles solo ven órdenes de sus casos
      const userCases = await prisma.caseMember.findMany({
        where: { userId: session.user.id },
        select: { caseId: true },
      });
      where.caseId = { in: userCases.map((c) => c.caseId) };
    }

    const [paymentOrders, total] = await Promise.all([
      prisma.paymentOrder.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: paymentOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payment orders:", error);
    return NextResponse.json(
      { error: "Error al obtener órdenes de pago" },
      { status: 500 }
    );
  }
}

// POST: Crear orden de pago
export async function POST(request: NextRequest) {
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

    // Solo roles administrativos pueden crear órdenes
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para crear órdenes de pago" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createPaymentOrderSchema.parse(body);

    // Verificar que el caso existe
    const caseData = await prisma.case.findUnique({
      where: { id: validatedData.caseId },
      select: {
        id: true,
        code: true,
        scope: true,
        centerId: true,
        disputeAmountCents: true,
        currency: true,
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    // Calcular monto si no se proporciona
    let amountCents = validatedData.amountCents;
    let igvCents = 0;

    if (!amountCents && validatedData.concept === "TASA_PRESENTACION") {
      const fee = calculatePresentationFee(caseData.scope === "INTERNACIONAL" ? "INTERNACIONAL" : "NACIONAL");
      amountCents = fee.baseFee;
      igvCents = fee.igv;
    } else if (!amountCents) {
      return NextResponse.json(
        { error: "Se requiere el monto para este concepto" },
        { status: 400 }
      );
    }

    // Generar número de orden
    const year = new Date().getFullYear();
    const lastOrder = await prisma.paymentOrder.findFirst({
      where: {
        orderNumber: { startsWith: `OP-${year}-` },
      },
      orderBy: { orderNumber: "desc" },
    });

    const sequence = lastOrder
      ? parseInt(lastOrder.orderNumber.split("-")[2]) + 1
      : 1;
    const orderNumber = `OP-${year}-${sequence.toString().padStart(6, "0")}`;

    // Calcular fecha de vencimiento
    const dueAt = addBusinessDays(new Date(), validatedData.dueInDays);

    // Crear orden de pago
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        caseId: validatedData.caseId,
        orderNumber,
        concept: validatedData.concept,
        description:
          validatedData.description ||
          validatedData.concept,
        amountCents,
        igvCents,
        totalCents: amountCents + igvCents,
        currency: caseData.currency,
        dueAt,
        blocksCase: validatedData.blocksCase,
        createdById: session.user.id,
      },
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

    // Si bloquea el caso, actualizar estado
    if (validatedData.blocksCase) {
      await prisma.case.update({
        where: { id: validatedData.caseId },
        data: {
          status: "AWAITING_PAYMENT",
          isBlocked: true,
          blockReason: `Pendiente de pago: ${paymentOrder.orderNumber}`,
          blockedAt: new Date(),
          blockedBy: session.user.id,
        },
      });
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        centerId: caseData.centerId,
        caseId: validatedData.caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "PaymentOrder",
        entityId: paymentOrder.id,
        meta: {
          orderNumber,
          concept: validatedData.concept,
          totalCents: amountCents + igvCents,
        },
      },
    });

    return NextResponse.json(paymentOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Error al crear orden de pago" },
      { status: 500 }
    );
  }
}
