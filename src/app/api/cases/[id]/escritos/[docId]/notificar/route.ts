/**
 * POST /api/cases/[id]/escritos/[docId]/notificar
 * El centro notifica el escrito (ya proveído) a ambas partes.
 * - Cambia escritoStatus a NOTIFIED
 * - Cambia accessLevel a ALL (escrito ahora visible a todos)
 * - Setea deadlineStartsAt = ahora → desde aquí corren los plazos
 * - Envía email a todas las partes y sus abogados con el texto de notificación
 *
 * Body: { text: string }
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
    if (
      !["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(
        session.user.role
      )
    ) {
      return NextResponse.json(
        { error: "Solo el centro puede notificar a las partes" },
        { status: 403 }
      );
    }

    const { id: caseId, docId } = await params;
    const body = await req.json().catch(() => ({}));
    const text: string = body?.text || "";

    const doc = await prisma.caseDocument.findUnique({
      where: { id: docId },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            centerId: true,
            members: {
              where: {
                role: { in: ["DEMANDANTE", "DEMANDADO", "ABOGADO"] },
              },
              select: { id: true, email: true, displayName: true, role: true },
            },
          },
        },
      },
    });
    if (!doc || doc.caseId !== caseId || !doc.isEscrito) {
      return NextResponse.json({ error: "Escrito no encontrado" }, { status: 404 });
    }
    if (doc.escritoStatus !== "PROVEIDO") {
      return NextResponse.json(
        {
          error:
            "Solo se pueden notificar escritos en estado PROVEIDO (proveído por el tribunal)",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    await prisma.caseDocument.update({
      where: { id: docId },
      data: {
        escritoStatus: "NOTIFIED",
        notifiedAt: now,
        notifiedById: session.user.id,
        notificationText: text || null,
        deadlineStartsAt: now,
        // Al notificar, el escrito pasa a ser visible a todos
        accessLevel: "ALL",
      },
    });

    // Enviar email a todas las partes y abogados con la notificación
    const parties = doc.case.members.filter((m) => !!m.email);
    const { sendEmail } = await import("@/lib/email/service");
    for (const p of parties) {
      try {
        await sendEmail({
          to: p.email!,
          subject: `Notificación — Expediente ${doc.case.code}`,
          html: `
            <h2 style="color:#0B2A5B">Notificación del Centro</h2>
            <p>Estimado(a) ${p.displayName || ""} (${p.role}):</p>
            <p>Se le notifica el siguiente escrito en el expediente <strong>${doc.case.code}</strong>:</p>
            <p><strong>Documento:</strong> ${doc.originalFileName}</p>
            ${
              doc.proveidoText
                ? `<div style="margin:16px 0"><strong>Resolución del tribunal:</strong><blockquote style="border-left:3px solid #D66829;padding-left:12px;color:#333">${doc.proveidoText}</blockquote></div>`
                : ""
            }
            ${
              text
                ? `<div style="margin:16px 0"><strong>Nota del centro:</strong><p>${text}</p></div>`
                : ""
            }
            <p style="margin-top:16px">
              <a href="${process.env.NEXTAUTH_URL || "https://caardpe.com"}/cases/${caseId}" style="background:#D66829;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block">Ver expediente</a>
            </p>
            <p style="color:#666;font-size:12px;margin-top:24px">Los plazos correspondientes comienzan a correr desde la fecha y hora de esta notificación (${now.toLocaleString("es-PE", { timeZone: "America/Lima" })}).</p>
            <p style="color:#666;font-size:12px;margin-top:16px">CAARD — Centro de Administración de Arbitrajes y Resolución de Disputas</p>
          `,
        });
      } catch (err) {
        console.error("Error enviando notificación:", err);
      }
    }

    // Crear notificación in-app también
    const userIdsToNotify = await prisma.caseMember.findMany({
      where: {
        caseId,
        role: { in: ["DEMANDANTE", "DEMANDADO", "ABOGADO"] },
        userId: { not: null },
      },
      select: { userId: true },
    });
    if (userIdsToNotify.length) {
      await prisma.notification.createMany({
        data: userIdsToNotify.map((u) => ({
          userId: u.userId!,
          type: "DOCUMENT" as const,
          title: `Notificación en ${doc.case.code}`,
          message: `Se ha notificado un escrito. Los plazos corren desde ${now.toLocaleDateString("es-PE")}.`,
          metadata: {
            caseId,
            documentId: docId,
            caseCode: doc.case.code,
          },
          isRead: false,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "CaseDocument",
        entityId: docId,
        userId: session.user.id,
        caseId,
        meta: {
          operation: "ESCRITO_NOTIFIED",
          notificationText: text,
          partiesNotified: parties.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deadlineStartsAt: now.toISOString(),
      partiesNotified: parties.length,
    });
  } catch (e: any) {
    console.error("notificar escrito error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al notificar" },
      { status: 500 }
    );
  }
}
