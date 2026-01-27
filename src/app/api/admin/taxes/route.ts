/**
 * CAARD - API de Configuración de Impuestos
 * GET: Listar configuraciones de impuestos
 * POST: Crear nueva configuración
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación
const createTaxConfigSchema = z.object({
  taxType: z.enum(["IGV", "DETRACCION", "RETENCION_4TA", "RETENCION_IGV", "IR"]),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  rate: z.number().min(0).max(1), // 0.18 para 18%
  minimumAmountCents: z.number().int().optional(),
  currency: z.string().default("PEN"),
  appliesTo: z.array(z.string()).default([]),
  detractionAccountNumber: z.string().optional(),
  detractionBankCode: z.string().optional(),
  legalBasis: z.string().optional(),
  sunatCode: z.string().optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional(),
});

// GET - Listar configuraciones de impuestos
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo admins pueden ver configuración de impuestos
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taxType = searchParams.get("taxType");
    const isActive = searchParams.get("isActive");

    // Construir filtros
    const where: any = {};

    if (session.user.centerId) {
      where.centerId = session.user.centerId;
    }

    if (taxType) {
      where.taxType = taxType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const taxConfigs = await prisma.taxConfiguration.findMany({
      where,
      orderBy: [
        { taxType: "asc" },
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      data: taxConfigs.map((config) => ({
        id: config.id,
        taxType: config.taxType,
        code: config.code,
        name: config.name,
        description: config.description,
        rate: config.rate,
        ratePercentage: (config.rate * 100).toFixed(2) + "%",
        minimumAmount: config.minimumAmountCents
          ? config.minimumAmountCents / 100
          : null,
        currency: config.currency,
        appliesTo: config.appliesTo,
        detractionAccountNumber: config.detractionAccountNumber,
        legalBasis: config.legalBasis,
        sunatCode: config.sunatCode,
        isActive: config.isActive,
        effectiveFrom: config.effectiveFrom,
        effectiveUntil: config.effectiveUntil,
        createdAt: config.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching tax configurations:", error);
    return NextResponse.json(
      { error: "Error al obtener configuraciones" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva configuración de impuesto
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo SUPER_ADMIN y ADMIN pueden crear
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createTaxConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que no exista ya un código igual para este centro
    const existing = await prisma.taxConfiguration.findUnique({
      where: {
        centerId_code: {
          centerId: session.user.centerId || "",
          code: data.code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una configuración con este código" },
        { status: 400 }
      );
    }

    const taxConfig = await prisma.taxConfiguration.create({
      data: {
        centerId: session.user.centerId || "",
        taxType: data.taxType,
        code: data.code,
        name: data.name,
        description: data.description,
        rate: data.rate,
        minimumAmountCents: data.minimumAmountCents,
        currency: data.currency,
        appliesTo: data.appliesTo,
        detractionAccountNumber: data.detractionAccountNumber,
        detractionBankCode: data.detractionBankCode,
        legalBasis: data.legalBasis,
        sunatCode: data.sunatCode,
        isActive: data.isActive,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveUntil: data.effectiveUntil ? new Date(data.effectiveUntil) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuración de impuesto creada",
      data: {
        id: taxConfig.id,
        code: taxConfig.code,
        name: taxConfig.name,
        taxType: taxConfig.taxType,
        rate: taxConfig.rate,
      },
    });
  } catch (error) {
    console.error("Error creating tax configuration:", error);
    return NextResponse.json(
      { error: "Error al crear configuración" },
      { status: 500 }
    );
  }
}
