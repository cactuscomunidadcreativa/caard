/**
 * CAARD - API de Configuración de Fraccionamientos
 * GET: Obtener configuración
 * PUT: Actualizar configuración
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener configuración de fraccionamientos
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const setting = await prisma.setting.findFirst({
      where: { key: "installments.allowPartyRequests" },
    });

    return NextResponse.json({
      allowPartyRequests: setting?.value === "true",
    });
  } catch (error) {
    console.error("Error fetching installment settings:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de fraccionamientos
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Only admins can change settings
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Sin permisos para cambiar configuración" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { allowPartyRequests } = body;

    if (typeof allowPartyRequests !== "boolean") {
      return NextResponse.json(
        { error: "Valor inválido para allowPartyRequests" },
        { status: 400 }
      );
    }

    // Upsert the setting
    await prisma.setting.upsert({
      where: { key: "installments.allowPartyRequests" },
      update: { value: allowPartyRequests.toString() },
      create: {
        key: "installments.allowPartyRequests",
        value: allowPartyRequests.toString(),
        description: "Permite que las partes soliciten fraccionamientos de pago",
      },
    });

    return NextResponse.json({
      success: true,
      allowPartyRequests,
    });
  } catch (error) {
    console.error("Error updating installment settings:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
