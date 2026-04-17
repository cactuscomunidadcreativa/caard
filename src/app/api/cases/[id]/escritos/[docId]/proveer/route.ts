/**
 * POST /api/cases/[id]/escritos/[docId]/proveer
 * El tribunal arbitral emite su resolución sobre un escrito.
 * Body: { text: string, accept?: boolean }
 * - accept=true (default): escrito pasa a PROVEIDO, listo para notificar
 * - accept=false: escrito pasa a REJECTED
 * Solo árbitros del caso (o staff con SUPER_ADMIN) pueden proveer.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id: caseId, docId } = await params;
    const body = await req.json().catch(() => ({}));
    const text: string = body?.text || "";
    const accept = body?.accept !== false;

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Se requiere la resolución del tribunal (mínimo 5 caracteres)" },
        { status: 400 }
      );
    }

    const doc = await prisma.caseDocument.findUnique({
      where: { id: docId },
      include: {
        case: { select: { id: true, code: true, centerId: true } },
        uploadedBy: { select: { id: true, email: true, name: true } },
      },
    });
    if (!doc || doc.caseId !== caseId || !doc.isEscrito) {
      return NextResponse.json({ error: "Escrito no encontrado" }, { status: 404 });
    }
    if (doc.escritoStatus !== "SUBMITTED") {
      return NextResponse.json(
        { error: "El escrito ya fue proveído o notificado" },
        { status: 400 }
      );
    }

    // Autorización: árbitro del caso o SUPER_ADMIN
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const isArbitrator = await prisma.caseMember.findFirst({
      where: { caseId, userId: session.user.id, role: "ARBITRO" },
    });
    if (!isSuperAdmin && !isArbitrator) {
      return NextResponse.json(
        { error: "Solo el tribunal arbitral puede proveer escritos" },
        { status: 403 }
      );
    }

    const newStatus = accept ? "PROVEIDO" : "REJECTED";
    const updated = await prisma.caseDocument.update({
      where: { id: docId },
      data: {
        escritoStatus: newStatus,
        proveidoAt: new Date(),
        proveidoById: session.user.id,
        proveidoText: text,
      },
    });

    // Notificar a staff del centro: "escrito proveído, pendiente de notificar"
    if (accept) {
      const staff = await prisma.user.findMany({
        where: {
          centerId: doc.case.centerId,
          role: { in: ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"] },
          isActive: true,
        },
        select: { id: true },
      });
      if (staff.length) {
        await prisma.notification.createMany({
          data: staff.map((s) => ({
            userId: s.id,
            type: "DOCUMENT" as const,
            title: `Escrito proveído en ${doc.case.code}`,
            message: "El tribunal resolvió. Pendiente de notificar a las partes.",
            metadata: {
              caseId,
              caseCode: doc.case.code,
              documentId: docId,
              proveidoText: text,
            },
            isRead: false,
          })),
        });
      }
    } else {
      // Si rechazado, notificar al presentante
      if (doc.uploadedBy?.email) {
        try {
          const { sendEmail } = await import("@/lib/email/service");
          await sendEmail({
            to: doc.uploadedBy.email,
            subject: `Escrito rechazado — Expediente ${doc.case.code}`,
            html: `
              <h2 style="color:#0B2A5B">Escrito No Admitido</h2>
              <p>El tribunal arbitral ha rechazado el escrito que presentó.</p>
              <p><strong>Resolución:</strong></p>
              <blockquote style="border-left:3px solid #D66829;padding-left:12px;color:#333">${text}</blockquote>
            `,
          });
        } catch {}
      }
    }

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "CaseDocument",
        entityId: docId,
        userId: session.user.id,
        caseId,
        meta: {
          operation: accept ? "ESCRITO_PROVEIDO" : "ESCRITO_REJECTED",
          proveidoText: text,
        },
      },
    });

    return NextResponse.json({ success: true, escrito: updated });
  } catch (e: any) {
    console.error("proveer escrito error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al proveer" },
      { status: 500 }
    );
  }
}
