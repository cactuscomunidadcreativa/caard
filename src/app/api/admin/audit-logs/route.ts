/**
 * GET /api/admin/audit-logs
 *
 * Listado de eventos de auditoría para el centro. Soporta filtros por
 * acción, entidad, caso, usuario, y rango de fechas. Paginado.
 *
 * Solo visible para SUPER_ADMIN, ADMIN, SECRETARIA y CENTER_STAFF.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// "Centro" = mega admin del sistema. Restringido para que solo el equipo
// directivo vea la trazabilidad completa.
const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const caseId = searchParams.get("caseId");
    const caseCode = searchParams.get("caseCode");
    const userId = searchParams.get("userId");
    const userQuery = searchParams.get("user"); // name/email
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (caseId) where.caseId = caseId;
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    // Si hay caseCode o user query, resolvemos primero a IDs.
    if (caseCode && !caseId) {
      const c = await prisma.case.findFirst({
        where: { code: { contains: caseCode, mode: "insensitive" } },
        select: { id: true },
      });
      where.caseId = c?.id || "__none__";
    }
    if (userQuery && !userId) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: userQuery, mode: "insensitive" } },
            { email: { contains: userQuery, mode: "insensitive" } },
          ],
        },
        select: { id: true },
        take: 50,
      });
      where.userId = { in: users.length ? users.map((u) => u.id) : ["__none__"] };
    }

    const [logs, total, distinctEntities, distinctActions] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          meta: true,
          ip: true,
          userAgent: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, role: true } },
          case: { select: { id: true, code: true } },
        },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog
        .findMany({ distinct: ["entity"], select: { entity: true }, take: 100 })
        .then((rs) => rs.map((r) => r.entity).sort()),
      prisma.auditLog
        .findMany({ distinct: ["action"], select: { action: true }, take: 100 })
        .then((rs) => rs.map((r) => r.action).sort()),
    ]);

    return NextResponse.json({
      logs,
      total,
      limit,
      facets: { entities: distinctEntities, actions: distinctActions },
    });
  } catch (e: any) {
    console.error("audit-logs error:", e?.message);
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
