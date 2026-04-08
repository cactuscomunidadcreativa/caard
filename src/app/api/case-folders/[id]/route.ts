/**
 * PATCH /api/case-folders/[id] - Actualizar visibilidad de una carpeta
 * Solo staff/admin.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const role = session.user.role;
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.visibility && ["ALL", "STAFF_AND_ARBITRATORS", "STAFF_ONLY"].includes(body.visibility)) {
      data.visibility = body.visibility;
    }
    if (body.name && typeof body.name === "string") data.name = body.name;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }
    const folder = await prisma.caseFolder.update({ where: { id }, data });
    return NextResponse.json({ folder });
  } catch (e: any) {
    console.error("update folder error:", e?.message);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
