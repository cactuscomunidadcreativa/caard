/**
 * CAARD - API de Liquidación de Gastos Arbitrales
 * GET: Listar liquidaciones
 * POST: Crear nueva liquidación
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación para crear liquidación
const createLiquidationSchema = z.object({
  caseId: z.string().min(1),
  claimantName: z.string().min(1),
  respondentName: z.string().min(1),
  presentationFeeCents: z.number().int().default(0),
  presentationFeeIgvCents: z.number().int().default(0),
  notes: z.string().optional(),
});

/**
 * Genera el número de liquidación
 * Formato: LIQ-001-2025-ARB/CAARD
 */
async function generateLiquidationNumber(caseCode: string): Promise<string> {
  const year = new Date().getFullYear();

  // Extraer el centro del código del caso (ej: 001-2025-ARB/CAARD -> CAARD)
  const centerCode = caseCode.split("/")[1] || "CAARD";

  // Obtener el último número de liquidación del año
  const lastLiquidation = await prisma.caseLiquidation.findFirst({
    where: {
      liquidationNumber: { contains: `-${year}-` },
    },
    orderBy: { createdAt: "desc" },
  });

  let sequence = 1;
  if (lastLiquidation) {
    const match = lastLiquidation.liquidationNumber.match(/^LIQ-(\d+)-/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `LIQ-${sequence.toString().padStart(3, "0")}-${year}-ARB/${centerCode}`;
}

// GET - Listar liquidaciones
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

    const where: any = {};

    if (caseId) {
      where.caseId = caseId;
    }

    if (status) {
      where.status = status;
    }

    const [liquidations, total] = await Promise.all([
      prisma.caseLiquidation.findMany({
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
          arbitratorFees: true,
          adminPayments: true,
          installmentPlan: {
            include: {
              installments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.caseLiquidation.count({ where }),
    ]);

    return NextResponse.json({
      data: liquidations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching liquidations:", error);
    return NextResponse.json(
      { error: "Error al obtener liquidaciones" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva liquidación
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo roles administrativos pueden crear liquidaciones
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createLiquidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que el caso existe
    const caso = await prisma.case.findUnique({
      where: { id: data.caseId },
      select: { id: true, code: true, status: true },
    });

    if (!caso) {
      return NextResponse.json(
        { error: "Caso no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no existe ya una liquidación para este caso
    const existingLiquidation = await prisma.caseLiquidation.findFirst({
      where: { caseId: data.caseId },
    });

    if (existingLiquidation) {
      return NextResponse.json(
        { error: "Ya existe una liquidación para este caso" },
        { status: 400 }
      );
    }

    // Generar número de liquidación
    const liquidationNumber = await generateLiquidationNumber(caso.code);

    // Crear la liquidación
    const liquidation = await prisma.caseLiquidation.create({
      data: {
        caseId: data.caseId,
        liquidationNumber,
        claimantName: data.claimantName,
        respondentName: data.respondentName,
        presentationFeeCents: data.presentationFeeCents,
        presentationFeeIgvCents: data.presentationFeeIgvCents,
        status: "DRAFT",
        createdById: session.user.id,
        notes: data.notes,
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

    return NextResponse.json({
      success: true,
      message: "Liquidación creada exitosamente",
      data: liquidation,
    });
  } catch (error) {
    console.error("Error creating liquidation:", error);
    return NextResponse.json(
      { error: "Error al crear liquidación" },
      { status: 500 }
    );
  }
}
