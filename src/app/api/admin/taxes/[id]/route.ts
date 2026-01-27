/**
 * CAARD - API de Configuración de Impuestos (Individual)
 * GET: Obtener configuración específica
 * PUT: Actualizar configuración
 * DELETE: Desactivar configuración
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTaxConfigSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  rate: z.number().min(0).max(1).optional(),
  minimumAmountCents: z.number().int().optional(),
  appliesTo: z.array(z.string()).optional(),
  detractionAccountNumber: z.string().optional(),
  detractionBankCode: z.string().optional(),
  legalBasis: z.string().optional(),
  sunatCode: z.string().optional(),
  isActive: z.boolean().optional(),
  effectiveUntil: z.string().datetime().optional().nullable(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Obtener configuración específica
export async function GET(request: NextRequest, { params }: Props) {
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

    const { id } = await params;

    const taxConfig = await prisma.taxConfiguration.findUnique({
      where: { id },
    });

    if (!taxConfig) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: taxConfig.id,
        taxType: taxConfig.taxType,
        code: taxConfig.code,
        name: taxConfig.name,
        description: taxConfig.description,
        rate: taxConfig.rate,
        ratePercentage: (taxConfig.rate * 100).toFixed(2) + "%",
        minimumAmount: taxConfig.minimumAmountCents
          ? taxConfig.minimumAmountCents / 100
          : null,
        minimumAmountCents: taxConfig.minimumAmountCents,
        currency: taxConfig.currency,
        appliesTo: taxConfig.appliesTo,
        detractionAccountNumber: taxConfig.detractionAccountNumber,
        detractionBankCode: taxConfig.detractionBankCode,
        legalBasis: taxConfig.legalBasis,
        sunatCode: taxConfig.sunatCode,
        isActive: taxConfig.isActive,
        effectiveFrom: taxConfig.effectiveFrom,
        effectiveUntil: taxConfig.effectiveUntil,
        createdAt: taxConfig.createdAt,
        updatedAt: taxConfig.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching tax configuration:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateTaxConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.taxConfiguration.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    const data = validation.data;
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.minimumAmountCents !== undefined) updateData.minimumAmountCents = data.minimumAmountCents;
    if (data.appliesTo !== undefined) updateData.appliesTo = data.appliesTo;
    if (data.detractionAccountNumber !== undefined) updateData.detractionAccountNumber = data.detractionAccountNumber;
    if (data.detractionBankCode !== undefined) updateData.detractionBankCode = data.detractionBankCode;
    if (data.legalBasis !== undefined) updateData.legalBasis = data.legalBasis;
    if (data.sunatCode !== undefined) updateData.sunatCode = data.sunatCode;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.effectiveUntil !== undefined) {
      updateData.effectiveUntil = data.effectiveUntil ? new Date(data.effectiveUntil) : null;
    }

    const updated = await prisma.taxConfiguration.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Configuración actualizada",
      data: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        rate: updated.rate,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating tax configuration:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar configuración (no eliminar)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.taxConfiguration.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    // No eliminamos, solo desactivamos
    await prisma.taxConfiguration.update({
      where: { id },
      data: {
        isActive: false,
        effectiveUntil: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuración desactivada",
    });
  } catch (error) {
    console.error("Error deactivating tax configuration:", error);
    return NextResponse.json(
      { error: "Error al desactivar configuración" },
      { status: 500 }
    );
  }
}
