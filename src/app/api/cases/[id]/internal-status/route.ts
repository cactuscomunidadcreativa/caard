/**
 * PATCH /api/cases/[id]/internal-status
 * Actualiza la nota interna de estado del expediente. Sólo
 * SECRETARIA / ADMIN / SUPER_ADMIN. Texto libre. Auditado.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Permiso "audit.view" representa el rol de seguimiento interno
    // (lo tiene SUPER_ADMIN, ADMIN y SECRETARIA por default; no ARBITRO,
    // ABOGADO, ni partes).
    const session = await requireAuthWithPermission("audit.view");
    const { id } = await params;
    const body = await request.json();
    const note = (body?.note || "").trim().slice(0, 2000);

    const updated = await prisma.case.update({
      where: { id },
      data: {
        internalStatusNote: note || null,
        internalStatusUpdatedAt: note ? new Date() : null,
        internalStatusUpdatedById: note ? session.user.id : null,
      },
      select: {
        id: true,
        internalStatusNote: true,
        internalStatusUpdatedAt: true,
        internalStatusUpdatedById: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Case",
        entityId: id,
        userId: session.user.id,
        caseId: id,
        meta: {
          operation: "INTERNAL_STATUS_NOTE",
          length: note.length,
        },
      },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("internal-status PATCH error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
