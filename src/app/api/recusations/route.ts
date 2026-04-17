/**
 * GET /api/recusations  - Lista recusaciones (filtros por caseId, status)
 * POST /api/recusations - Presenta una recusación contra un árbitro
 *
 * Flujo:
 * 1. Parte/abogado presenta recusación → estado FILED, notifica al árbitro
 * 2. Árbitro responde → estado RESPONSE_RECEIVED
 * 3. Consejo decide → ACCEPTED/REJECTED
 * 4. Si ACCEPTED → se crea orden de pago automática al árbitro (devolución de honorarios)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const arbitratorId = searchParams.get("arbitratorId");

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;
    if (arbitratorId) where.arbitratorId = arbitratorId;

    // Filtrado por rol:
    // - Staff: ve todas
    // - Árbitro: solo las que le involucran
    // - Partes: solo las de sus casos
    const isStaff = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role);
    if (!isStaff) {
      if (session.user.role === "ARBITRO") {
        const reg = await prisma.arbitratorRegistry.findUnique({
          where: { userId: session.user.id },
        });
        if (reg) where.arbitratorId = reg.id;
        else return NextResponse.json({ recusations: [] });
      } else {
        // Solo ve de sus casos
        const myMemberships = await prisma.caseMember.findMany({
          where: { userId: session.user.id },
          select: { caseId: true },
        });
        where.caseId = { in: myMemberships.map((m) => m.caseId) };
      }
    }

    const recusations = await prisma.recusation.findMany({
      where,
      include: {
        case: { select: { id: true, code: true, title: true } },
        arbitrator: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: { select: { displayName: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recusations });
  } catch (e: any) {
    console.error("GET /recusations error:", e);
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { caseId, arbitratorId, reason, supportingDocuments } = body;

    if (!caseId || !arbitratorId || !reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Se requieren: caso, árbitro y motivo (mín. 10 caracteres)" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es miembro del caso o staff
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        center: { select: { id: true } },
        members: { where: { userId: session.user.id } },
      },
    });
    if (!caseRecord) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const isStaff = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role);
    const member = caseRecord.members[0];
    if (!isStaff && !member) {
      return NextResponse.json(
        { error: "No es miembro del caso" },
        { status: 403 }
      );
    }

    // Validar que el árbitro existe y pertenece al caso
    const arbitrator = await prisma.arbitratorRegistry.findUnique({
      where: { id: arbitratorId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!arbitrator) {
      return NextResponse.json({ error: "Árbitro no encontrado" }, { status: 404 });
    }

    // Crear recusación
    const recusation = await prisma.recusation.create({
      data: {
        caseId,
        arbitratorId,
        requesterId: session.user.id,
        requesterRole: member?.role || session.user.role as any,
        reason,
        supportingDocuments: supportingDocuments || [],
        status: "FILED",
        responseDueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días para responder
      },
    });

    // Notificación in-app + email al árbitro recusado
    if (arbitrator.user) {
      await prisma.notification.create({
        data: {
          userId: arbitrator.user.id,
          type: "SYSTEM",
          title: `Recusación presentada contra usted — Expediente ${caseRecord.code}`,
          message: `Se ha presentado una recusación. Tiene 5 días para responder. Motivo: ${reason.slice(0, 100)}...`,
          metadata: {
            recusationId: recusation.id,
            caseId,
            caseCode: caseRecord.code,
          },
          isRead: false,
        },
      });

      if (arbitrator.user.email) {
        try {
          const { sendEmail } = await import("@/lib/email/service");
          await sendEmail({
            to: arbitrator.user.email,
            subject: `Recusación — Expediente ${caseRecord.code}`,
            html: `
              <h2 style="color:#0B2A5B">Notificación de Recusación</h2>
              <p>Estimado(a) ${arbitrator.user.name}:</p>
              <p>Se ha presentado una recusación en su contra en el expediente <strong>${caseRecord.code}</strong>.</p>
              <div style="margin:16px 0"><strong>Motivo:</strong><blockquote style="border-left:3px solid #D66829;padding-left:12px;color:#333">${reason}</blockquote></div>
              <p>Usted cuenta con <strong>5 días</strong> para presentar su respuesta. Luego el Consejo Superior resolverá.</p>
              <p><a href="${process.env.NEXTAUTH_URL || "https://caardpe.com"}/dashboard/recusaciones" style="background:#D66829;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block">Ver recusación</a></p>
            `,
          });
        } catch {}
      }
    }

    // Notificar al staff
    const staff = await prisma.user.findMany({
      where: {
        centerId: caseRecord.centerId,
        role: { in: ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"] },
        isActive: true,
      },
      select: { id: true },
    });
    if (staff.length) {
      await prisma.notification.createMany({
        data: staff.map((s) => ({
          userId: s.id,
          type: "SYSTEM" as const,
          title: `Nueva recusación en ${caseRecord.code}`,
          message: `Un árbitro ha sido recusado. Pendiente de respuesta y decisión del consejo.`,
          metadata: { recusationId: recusation.id, caseId, caseCode: caseRecord.code },
          isRead: false,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Recusation",
        entityId: recusation.id,
        userId: session.user.id,
        caseId,
        meta: { reason, arbitratorId },
      },
    });

    return NextResponse.json({ success: true, recusation });
  } catch (e: any) {
    console.error("POST /recusations error:", e);
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
