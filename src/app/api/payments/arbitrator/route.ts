/**
 * CAARD - API de Pagos a Árbitros
 * GET: Listar pagos a árbitros
 * POST: Crear nuevo pago a árbitro (con cálculo de retenciones)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación
const createArbitratorPaymentSchema = z.object({
  caseId: z.string().min(1),
  arbitratorId: z.string().min(1),
  concept: z.string().min(1),
  description: z.string().optional(),
  grossAmountCents: z.number().int().positive(),
  currency: z.string().default("PEN"),
  taxpayerType: z.enum(["PERSONA_NATURAL", "PERSONA_JURIDICA", "NO_DOMICILIADO"]),
  arbitratorRuc: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

// Constantes de impuestos peruanos (valores por defecto)
const TAX_RATES = {
  IGV: 0.18,                    // 18% IGV
  RETENCION_4TA: 0.08,          // 8% retención 4ta categoría
  RETENCION_4TA_MIN: 150000,    // S/. 1,500 mínimo para retención (en céntimos)
  DETRACCION: 0.12,             // 12% detracción
  DETRACCION_MIN: 70000,        // S/. 700 mínimo para detracción (en céntimos)
};

// Función para calcular impuestos según normativa peruana
async function calculateTaxes(
  grossAmountCents: number,
  taxpayerType: string,
  centerId: string
) {
  // Obtener configuraciones de impuestos activas
  const taxConfigs = await prisma.taxConfiguration.findMany({
    where: {
      centerId,
      isActive: true,
    },
  });

  const getRate = (taxType: string, defaultRate: number): number => {
    const config = taxConfigs.find((c) => c.taxType === taxType);
    return config ? config.rate : defaultRate;
  };

  const getMinimum = (taxType: string, defaultMin: number): number => {
    const config = taxConfigs.find((c) => c.taxType === taxType);
    return config?.minimumAmountCents ?? defaultMin;
  };

  let igvCents = 0;
  let igvRate = 0;
  let retencion4taCents = 0;
  let retencion4taRate = 0;
  let retencion4taApplied = false;
  let detractionCents = 0;
  let detractionRate = 0;
  let detractionApplied = false;

  if (taxpayerType === "PERSONA_NATURAL") {
    // Persona natural: NO aplica IGV (renta de 4ta categoría)
    // SÍ aplica retención 4ta categoría si el monto > S/. 1,500

    const retencionMinCents = getMinimum("RETENCION_4TA", TAX_RATES.RETENCION_4TA_MIN);

    if (grossAmountCents > retencionMinCents) {
      retencion4taRate = getRate("RETENCION_4TA", TAX_RATES.RETENCION_4TA);
      retencion4taCents = Math.round(grossAmountCents * retencion4taRate);
      retencion4taApplied = true;
    }
  } else if (taxpayerType === "PERSONA_JURIDICA") {
    // Persona jurídica: Puede aplicar IGV si emite factura
    // Nota: Los servicios de arbitraje pueden estar exonerados de IGV
    // Aquí asumimos que emite factura con IGV incluido

    igvRate = getRate("IGV", TAX_RATES.IGV);
    // El IGV está incluido en el monto bruto (base imponible + IGV)
    // Base imponible = Monto bruto / 1.18
    // IGV = Monto bruto - Base imponible
    const baseImponible = Math.round(grossAmountCents / (1 + igvRate));
    igvCents = grossAmountCents - baseImponible;

    // También puede aplicar detracción si el monto > S/. 700
    const detractionMinCents = getMinimum("DETRACCION", TAX_RATES.DETRACCION_MIN);

    if (grossAmountCents > detractionMinCents) {
      detractionRate = getRate("DETRACCION", TAX_RATES.DETRACCION);
      detractionCents = Math.round(grossAmountCents * detractionRate);
      detractionApplied = true;
    }
  } else if (taxpayerType === "NO_DOMICILIADO") {
    // No domiciliado: Aplican otras reglas (retención 30% IR)
    // Simplificado aquí - se debería configurar específicamente
    retencion4taRate = 0.30; // 30% retención IR no domiciliados
    retencion4taCents = Math.round(grossAmountCents * retencion4taRate);
    retencion4taApplied = true;
  }

  const totalDeductionsCents = retencion4taCents + detractionCents;
  const netPaymentCents = grossAmountCents - totalDeductionsCents;

  return {
    igvCents,
    igvRate,
    retencion4taCents,
    retencion4taRate,
    retencion4taApplied,
    detractionCents,
    detractionRate,
    detractionApplied,
    totalDeductionsCents,
    netPaymentCents,
  };
}

// GET - Listar pagos a árbitros
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const arbitratorId = searchParams.get("arbitratorId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (session.user.centerId) {
      where.centerId = session.user.centerId;
    }

    if (caseId) where.caseId = caseId;
    if (arbitratorId) where.arbitratorId = arbitratorId;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.arbitratorPayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.arbitratorPayment.count({ where }),
    ]);

    // Obtener información de casos y árbitros
    const caseIds = [...new Set(payments.map((p) => p.caseId))];
    const arbitratorIds = [...new Set(payments.map((p) => p.arbitratorId))];

    const [cases, arbitrators] = await Promise.all([
      prisma.case.findMany({
        where: { id: { in: caseIds } },
        select: { id: true, code: true, title: true },
      }),
      prisma.arbitratorRegistry.findMany({
        where: { id: { in: arbitratorIds } },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const casesMap = new Map(cases.map((c) => [c.id, c]));
    const arbitratorsMap = new Map(arbitrators.map((a) => [a.id, a]));

    return NextResponse.json({
      data: payments.map((payment) => ({
        id: payment.id,
        case: casesMap.get(payment.caseId),
        arbitrator: arbitratorsMap.get(payment.arbitratorId),
        concept: payment.concept,
        description: payment.description,
        taxpayerType: payment.taxpayerType,
        arbitratorRuc: payment.arbitratorRuc,
        grossAmount: payment.grossAmountCents / 100,
        igv: payment.igvCents / 100,
        retencion4ta: payment.retencion4taCents / 100,
        retencion4taApplied: payment.retencion4taApplied,
        detraction: payment.detractionCents / 100,
        detractionApplied: payment.detractionApplied,
        totalDeductions: payment.totalDeductionsCents / 100,
        netPayment: payment.netPaymentCents / 100,
        currency: payment.currency,
        status: payment.status,
        issuedAt: payment.issuedAt,
        dueAt: payment.dueAt,
        paidAt: payment.paidAt,
        reciboHonorariosNumber: payment.reciboHonorariosNumber,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching arbitrator payments:", error);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo pago a árbitro
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createArbitratorPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que existe el caso
    const caso = await prisma.case.findUnique({
      where: { id: data.caseId },
      select: { id: true, code: true, centerId: true },
    });

    if (!caso) {
      return NextResponse.json(
        { error: "Caso no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que existe el árbitro
    const arbitrator = await prisma.arbitratorRegistry.findUnique({
      where: { id: data.arbitratorId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!arbitrator) {
      return NextResponse.json(
        { error: "Árbitro no encontrado" },
        { status: 404 }
      );
    }

    // Calcular impuestos
    const taxes = await calculateTaxes(
      data.grossAmountCents,
      data.taxpayerType,
      caso.centerId
    );

    // Crear el pago
    const payment = await prisma.arbitratorPayment.create({
      data: {
        centerId: caso.centerId,
        caseId: data.caseId,
        arbitratorId: data.arbitratorId,
        arbitratorUserId: arbitrator.userId,
        concept: data.concept,
        description: data.description,
        taxpayerType: data.taxpayerType,
        arbitratorRuc: data.arbitratorRuc,
        grossAmountCents: data.grossAmountCents,
        currency: data.currency,
        igvCents: taxes.igvCents,
        igvRate: taxes.igvRate,
        retencion4taCents: taxes.retencion4taCents,
        retencion4taRate: taxes.retencion4taRate,
        retencion4taApplied: taxes.retencion4taApplied,
        detractionCents: taxes.detractionCents,
        detractionRate: taxes.detractionRate,
        detractionApplied: taxes.detractionApplied,
        totalDeductionsCents: taxes.totalDeductionsCents,
        netPaymentCents: taxes.netPaymentCents,
        status: "PENDING",
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        createdById: session.user.id,
      },
    });

    // Notificar al árbitro
    await prisma.notification.create({
      data: {
        userId: arbitrator.userId,
        type: "PAYMENT",
        title: "Nuevo pago registrado",
        message: `Se ha registrado un pago de S/. ${(payment.netPaymentCents / 100).toFixed(2)} para el caso ${caso.code}.`,
        metadata: {
          paymentId: payment.id,
          caseId: data.caseId,
          caseCode: caso.code,
        },
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pago a árbitro creado exitosamente",
      data: {
        id: payment.id,
        concept: payment.concept,
        arbitrator: arbitrator.user?.name,
        grossAmount: payment.grossAmountCents / 100,
        taxes: {
          igv: taxes.igvCents / 100,
          retencion4ta: taxes.retencion4taCents / 100,
          detraction: taxes.detractionCents / 100,
          totalDeductions: taxes.totalDeductionsCents / 100,
        },
        netPayment: payment.netPaymentCents / 100,
        currency: payment.currency,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Error creating arbitrator payment:", error);
    return NextResponse.json(
      { error: "Error al crear pago" },
      { status: 500 }
    );
  }
}
