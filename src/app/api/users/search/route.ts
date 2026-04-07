/**
 * CAARD - User Search API for autocomplete
 * GET /api/users/search?q=text&role=ARBITRO&limit=20
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const ALLOWED_STAFF: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SECRETARIA",
  "CENTER_STAFF",
];

const VALID_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "ADMIN",
  "CENTER_STAFF",
  "SECRETARIA",
  "ARBITRO",
  "ABOGADO",
  "DEMANDANTE",
  "DEMANDADO",
  "ESTUDIANTE",
]);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    if (!ALLOWED_STAFF.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const roleParam = searchParams.get("role");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1),
      50
    );

    const where: any = {};
    if (roleParam && VALID_ROLES.has(roleParam)) {
      where.role = roleParam as Role;
    }

    if (q.length > 0) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const items = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: [{ name: "asc" }],
      take: limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Error al buscar usuarios" },
      { status: 500 }
    );
  }
}
