/**
 * CAARD - API de Cuotas de IA
 * GET: Obtener cuotas del sistema y usuarios
 * POST: Actualizar cuotas del sistema
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const systemQuotaSchema = z.object({
  maxTotalRequestsPerDay: z.number().int().min(0).optional().nullable(),
  maxTotalTokensPerDay: z.number().int().min(0).optional().nullable(),
  maxTotalCostPerDay: z.number().int().min(0).optional().nullable(),
  maxTotalTokensPerMonth: z.number().int().min(0).optional().nullable(),
  maxTotalCostPerMonth: z.number().int().min(0).optional().nullable(),
  alertAtPercentage: z.number().int().min(0).max(100).default(80),
  alertEmail: z.string().email().optional().nullable(),
});

// GET /api/admin/ai/quotas
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "system" | "users"

    if (type === "system" || !type) {
      // Obtener cuota del sistema
      let systemQuota = await prisma.aISystemQuota.findFirst({
        where: { isActive: true },
      });

      // Crear una por defecto si no existe
      if (!systemQuota) {
        systemQuota = await prisma.aISystemQuota.create({
          data: { isActive: true },
        });
      }

      return NextResponse.json({ systemQuota });
    }

    if (type === "users") {
      // Obtener cuotas de usuarios
      const userQuotas = await prisma.aIUserQuota.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { user: { name: "asc" } },
      });

      return NextResponse.json({ userQuotas });
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error al obtener cuotas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/ai/quotas - Actualizar cuota del sistema
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = systemQuotaSchema.parse(body);

    // Buscar o crear la cuota del sistema
    let systemQuota = await prisma.aISystemQuota.findFirst({
      where: { isActive: true },
    });

    if (systemQuota) {
      systemQuota = await prisma.aISystemQuota.update({
        where: { id: systemQuota.id },
        data: validatedData,
      });
    } else {
      systemQuota = await prisma.aISystemQuota.create({
        data: { ...validatedData, isActive: true },
      });
    }

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "AISystemQuota",
        entityId: systemQuota.id,
        meta: validatedData,
      },
    });

    return NextResponse.json(systemQuota);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al actualizar cuota del sistema:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
