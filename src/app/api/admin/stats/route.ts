/**
 * GET /api/admin/stats - Estadísticas generales del centro
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const [
      totalCases,
      inProcess,
      closed,
      archived,
      suspended,
      totalDocs,
      totalMembers,
      totalUsers,
      totalArbitrators,
      totalPayments,
      totalDeadlines,
      activeDeadlines,
      overdueDeadlines,
    ] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { status: "IN_PROCESS" } }),
      prisma.case.count({ where: { status: "CLOSED" } }),
      prisma.case.count({ where: { status: "ARCHIVED" } }),
      prisma.case.count({ where: { status: "SUSPENDED" } }),
      prisma.caseDocument.count(),
      prisma.caseMember.count(),
      prisma.user.count(),
      prisma.arbitratorRegistry.count({ where: { status: "ACTIVE" } }),
      prisma.payment.count(),
      prisma.processDeadline.count(),
      prisma.processDeadline.count({ where: { status: "ACTIVE" } }),
      prisma.processDeadline.count({
        where: { status: "ACTIVE", dueAt: { lt: new Date() } },
      }),
    ]);

    // Cases por año
    const casesByYear = await prisma.case.groupBy({
      by: ["year"],
      _count: true,
      orderBy: { year: "asc" },
    });

    // Cases por tipo
    const casesByType = await prisma.case.groupBy({
      by: ["procedureType"],
      _count: true,
    });

    // Cases por scope
    const casesByScope = await prisma.case.groupBy({
      by: ["scope"],
      _count: true,
    });

    // Cases por tribunal mode
    const casesByTribunal = await prisma.case.groupBy({
      by: ["tribunalMode"],
      _count: true,
    });

    // Últimos 10 casos creados
    const recentCases = await prisma.case.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, title: true, status: true, createdAt: true },
    });

    // Plazos vencidos próximos
    const upcomingDeadlines = await prisma.processDeadline.findMany({
      where: { status: "ACTIVE" },
      take: 10,
      orderBy: { dueAt: "asc" },
      include: { case: { select: { code: true } } },
    });

    return NextResponse.json({
      summary: {
        totalCases,
        inProcess,
        closed,
        archived,
        suspended,
        totalDocs,
        totalMembers,
        totalUsers,
        totalArbitrators,
        totalPayments,
        totalDeadlines,
        activeDeadlines,
        overdueDeadlines,
      },
      casesByYear: casesByYear.map((c) => ({ year: c.year, count: c._count })),
      casesByType: casesByType.map((c) => ({ type: c.procedureType, count: c._count })),
      casesByScope: casesByScope.map((c) => ({ scope: c.scope, count: c._count })),
      casesByTribunal: casesByTribunal.map((c) => ({ mode: c.tribunalMode, count: c._count })),
      recentCases,
      upcomingDeadlines: upcomingDeadlines.map((d) => ({
        id: d.id,
        title: d.title,
        caseCode: d.case.code,
        dueAt: d.dueAt.toISOString(),
        daysRemaining: Math.ceil((d.dueAt.getTime() - Date.now()) / 86400000),
      })),
    });
  } catch (e: any) {
    console.error("stats error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
