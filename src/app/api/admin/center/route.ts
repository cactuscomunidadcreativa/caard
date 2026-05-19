/**
 * GET/PATCH /api/admin/center
 *
 * Editor de datos generales del centro (nombre, razón social, RUC,
 * colores de branding). El código (Center.code) NO se puede cambiar
 * porque es clave única usada en URLs y referencias.
 *
 * Solo SUPER_ADMIN y ADMIN. Cada cambio queda en AuditLog.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["SUPER_ADMIN", "ADMIN"];

async function loadCenter(userCenterId: string | null | undefined) {
  if (userCenterId) {
    return prisma.center.findUnique({ where: { id: userCenterId } });
  }
  return prisma.center.findFirst({ where: { code: "CAARD" } });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!ALLOWED.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const center = await loadCenter(session.user.centerId);
    if (!center) return NextResponse.json({ error: "No center" }, { status: 404 });
    return NextResponse.json({ center });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!ALLOWED.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const body = await req.json();
    const center = await loadCenter(session.user.centerId);
    if (!center) return NextResponse.json({ error: "No center" }, { status: 404 });

    const data: any = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (body.legalName !== undefined) data.legalName = body.legalName || null;
    if (body.taxId !== undefined) data.taxId = body.taxId || null;
    if (body.primaryColorHex !== undefined) {
      data.primaryColorHex = /^#[0-9a-fA-F]{6}$/.test(body.primaryColorHex)
        ? body.primaryColorHex
        : null;
    }
    if (body.accentColorHex !== undefined) {
      data.accentColorHex = /^#[0-9a-fA-F]{6}$/.test(body.accentColorHex)
        ? body.accentColorHex
        : null;
    }
    if (body.neutralColorHex !== undefined) {
      data.neutralColorHex = /^#[0-9a-fA-F]{6}$/.test(body.neutralColorHex)
        ? body.neutralColorHex
        : null;
    }

    const updated = await prisma.center.update({
      where: { id: center.id },
      data,
    });

    await prisma.auditLog
      .create({
        data: {
          centerId: center.id,
          userId: session.user.id,
          action: "UPDATE",
          entity: "Center",
          entityId: center.id,
          meta: { changed: Object.keys(data) },
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true, center: updated });
  } catch (e: any) {
    console.error("PATCH center error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
