/**
 * CAARD - API de Cuota de Usuario Individual
 * GET: Obtener cuota de usuario
 * PUT: Actualizar cuota de usuario
 * DELETE: Eliminar cuota personalizada
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userQuotaSchema = z.object({
  maxRequestsPerDay: z.number().int().min(0).optional().nullable(),
  maxTokensPerDay: z.number().int().min(0).optional().nullable(),
  maxTokensPerMonth: z.number().int().min(0).optional().nullable(),
  maxCostPerMonth: z.number().int().min(0).optional().nullable(),
  bonusTokens: z.number().int().min(0).default(0),
  bonusTokensExpireAt: z.string().datetime().optional().nullable(),
  isBlocked: z.boolean().default(false),
  blockedReason: z.string().optional().nullable(),
  blockedUntil: z.string().datetime().optional().nullable(),
});

// GET /api/admin/ai/quotas/users/[userId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        aiQuota: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Calcular uso actual
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayUsage, monthUsage] = await Promise.all([
      prisma.aIUsageLog.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfDay },
        },
        _sum: {
          totalTokens: true,
          cost: true,
        },
        _count: true,
      }),
      prisma.aIUsageLog.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          totalTokens: true,
          cost: true,
        },
      }),
    ]);

    return NextResponse.json({
      user,
      usage: {
        today: {
          requests: todayUsage._count,
          tokens: todayUsage._sum.totalTokens || 0,
          cost: todayUsage._sum.cost || 0,
        },
        month: {
          tokens: monthUsage._sum.totalTokens || 0,
          cost: monthUsage._sum.cost || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener cuota de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/ai/quotas/users/[userId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

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
    const validatedData = userQuotaSchema.parse(body);

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Convertir fechas
    const data: any = { ...validatedData };
    if (data.bonusTokensExpireAt) {
      data.bonusTokensExpireAt = new Date(data.bonusTokensExpireAt);
    }
    if (data.blockedUntil) {
      data.blockedUntil = new Date(data.blockedUntil);
    }

    // Upsert la cuota
    const quota = await prisma.aIUserQuota.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "AIUserQuota",
        entityId: quota.id,
        meta: { targetUserId: userId, ...validatedData },
      },
    });

    return NextResponse.json(quota);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al actualizar cuota de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/ai/quotas/users/[userId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

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

    await prisma.aIUserQuota.deleteMany({
      where: { userId },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "AIUserQuota",
        entityId: userId,
        meta: { targetUserId: userId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar cuota de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
