/**
 * CAARD - API de Pagos Libres
 * GET: Listar pagos libres del usuario
 * POST: Crear pago libre (vinculado opcionalmente a un caso)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

const createFreePaymentSchema = z.object({
  caseId: z.string().optional(),
  concept: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  amountCents: z.number().int().positive(),
  currency: z.enum(["PEN", "USD"]).default("PEN"),
  culqiToken: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const isAdmin = ADMIN_ROLES.includes(session.user.role || "");

    const where: any = {};
    if (!isAdmin) {
      where.userId = session.user.id;
    }
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.freePayment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.freePayment.count({ where }),
    ]);

    return NextResponse.json({
      items: payments,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching free payments:", error);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`free-payment:${ip}`, RATE_LIMITS.payment);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espere un momento." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createFreePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Calcular impuestos
    const taxConfigs = await prisma.commerceTaxConfig.findMany({
      where: { centerId: center.id, isActive: true, appliesToServices: true },
    });

    let igv = 0;
    let detraccion = 0;
    let percepcion = 0;

    for (const tax of taxConfigs) {
      if (tax.thresholdCents && data.amountCents < tax.thresholdCents) continue;
      const amount = Math.round(data.amountCents * tax.rate);
      if (tax.type === "IGV") igv += amount;
      if (tax.type === "DETRACCION") detraccion += amount;
      if (tax.type === "PERCEPCION") percepcion += amount;
    }

    const totalCents = data.amountCents + igv + percepcion;

    const payment = await prisma.freePayment.create({
      data: {
        centerId: center.id,
        userId: session.user.id,
        caseId: data.caseId,
        concept: data.concept,
        description: data.description,
        amountCents: data.amountCents,
        currency: data.currency,
        taxBreakdown: {
          subtotal: data.amountCents,
          igv,
          detraccion,
          percepcion,
          total: totalCents,
        },
        status: "PENDING",
      },
    });

    // Procesar con Culqi si hay token
    if (data.culqiToken) {
      try {
        const { createCharge, isCulqiConfigured } = await import("@/lib/culqi/client");

        if (isCulqiConfigured()) {
          const chargeResult = await createCharge({
            amount: totalCents,
            currency: data.currency as "PEN" | "USD",
            email: session.user.email || "",
            sourceId: data.culqiToken,
            description: `Pago libre: ${data.concept}`,
            metadata: {
              payment_id: payment.id,
              case_id: data.caseId || "",
              concept: data.concept,
              user_id: session.user.id,
            },
          });

          if (chargeResult.success && chargeResult.charge) {
            await prisma.freePayment.update({
              where: { id: payment.id },
              data: {
                status: "PAID",
                paymentProvider: "CULQI",
                culqiChargeId: chargeResult.charge.id,
                paidAt: new Date(),
              },
            });

            return NextResponse.json({
              success: true,
              payment: { ...payment, status: "PAID" },
              chargeId: chargeResult.charge.id,
            });
          }
        }
      } catch (err) {
        console.error("Culqi error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      payment,
      taxBreakdown: { subtotal: data.amountCents, igv, detraccion, percepcion, total: totalCents },
    });
  } catch (error) {
    console.error("Error creating free payment:", error);
    return NextResponse.json(
      { error: "Error al crear pago" },
      { status: 500 }
    );
  }
}
