/**
 * CAARD - API de Uso y Estadísticas de IA
 * GET: Obtener estadísticas de uso
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/ai/usage
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
    const period = searchParams.get("period") || "month"; // "day" | "week" | "month" | "year"
    const userId = searchParams.get("userId");
    const modelId = searchParams.get("modelId");

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const where: any = {
      createdAt: { gte: startDate },
    };

    if (userId) where.userId = userId;
    if (modelId) where.modelId = modelId;

    // Estadísticas generales
    const [totalStats, byModel, byUser, byDay, recentLogs] = await Promise.all([
      // Total
      prisma.aIUsageLog.aggregate({
        where,
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          cost: true,
        },
        _count: true,
        _avg: {
          latencyMs: true,
        },
      }),

      // Por modelo
      prisma.aIUsageLog.groupBy({
        by: ["modelId"],
        where,
        _sum: {
          totalTokens: true,
          cost: true,
        },
        _count: true,
      }),

      // Por usuario (top 10)
      prisma.aIUsageLog.groupBy({
        by: ["userId"],
        where: { ...where, userId: { not: null } },
        _sum: {
          totalTokens: true,
          cost: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            totalTokens: "desc",
          },
        },
        take: 10,
      }),

      // Por día (últimos 30 días)
      prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          SUM("totalTokens") as tokens,
          SUM("cost") as cost,
          COUNT(*)::int as requests
        FROM "AIUsageLog"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `,

      // Logs recientes
      prisma.aIUsageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          model: {
            select: { id: true, name: true, provider: true },
          },
        },
      }),
    ]);

    // Obtener detalles de modelos para el groupBy
    const modelIds = byModel.map((m) => m.modelId).filter(Boolean) as string[];
    const models = await prisma.aIModel.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, name: true, provider: true },
    });

    const modelMap = new Map(models.map((m) => [m.id, m]));

    // Obtener detalles de usuarios para el groupBy
    const userIds = byUser.map((u) => u.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return NextResponse.json({
      period,
      startDate,
      summary: {
        totalRequests: totalStats._count,
        totalTokens: totalStats._sum.totalTokens || 0,
        promptTokens: totalStats._sum.promptTokens || 0,
        completionTokens: totalStats._sum.completionTokens || 0,
        totalCost: totalStats._sum.cost || 0,
        avgLatencyMs: Math.round(totalStats._avg.latencyMs || 0),
      },
      byModel: byModel.map((m) => ({
        model: modelMap.get(m.modelId || "") || { id: m.modelId, name: "Desconocido" },
        tokens: m._sum.totalTokens || 0,
        cost: m._sum.cost || 0,
        requests: m._count,
      })),
      byUser: byUser.map((u) => ({
        user: userMap.get(u.userId || "") || { id: u.userId, name: "Desconocido" },
        tokens: u._sum.totalTokens || 0,
        cost: u._sum.cost || 0,
        requests: u._count,
      })),
      byDay,
      recentLogs,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de uso:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
