/**
 * /api/audiencias
 * GET  : lista audiencias del centro (filtro por status, caseId)
 * POST : programar audiencia (secretaría/admin) — status=SCHEDULED
 *
 * Si el body trae fromSuggestionId, se actualiza la audiencia sugerida
 * existente a SCHEDULED en vez de crear una nueva (flujo: árbitro
 * sugirió → secretaría confirma fecha).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission("hearings.view");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const caseId = searchParams.get("caseId");

    const where: any = {};
    if (status && status !== "all") where.status = status;
    if (caseId) where.caseId = caseId;
    if (session.user.centerId) {
      where.case = { centerId: session.user.centerId };
    }

    const items = await prisma.caseHearing.findMany({
      where,
      include: {
        case: { select: { id: true, code: true, title: true } },
      },
      orderBy: [{ status: "asc" }, { hearingAt: "asc" }],
      take: 200,
    });

    return NextResponse.json({
      items: items.map((h) => ({
        ...h,
        hearingAt: h.hearingAt.toISOString(),
        createdAt: h.createdAt.toISOString(),
        updatedAt: h.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("GET audiencias:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission("hearings.create");
    const body = await request.json();

    const {
      caseId,
      type = "HEARING",
      title,
      description,
      scheduledAt,
      duration = 60,
      isOnline = true,
      location,
      meetingUrl,
      notes,
      fromSuggestionId, // si viene, actualizamos la sugerencia
      notifyParties = true,
      notifyArbitrators = true,
    } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: "title y scheduledAt son requeridos" },
        { status: 400 }
      );
    }
    if (!caseId && !fromSuggestionId) {
      return NextResponse.json(
        { error: "Se requiere caseId o fromSuggestionId" },
        { status: 400 }
      );
    }

    let hearing;
    if (fromSuggestionId) {
      // Actualizar sugerencia existente a SCHEDULED
      const existing = await prisma.caseHearing.findUnique({
        where: { id: fromSuggestionId },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Sugerencia no encontrada" },
          { status: 404 }
        );
      }
      hearing = await prisma.caseHearing.update({
        where: { id: fromSuggestionId },
        data: {
          title,
          hearingAt: new Date(scheduledAt),
          type,
          durationMinutes: duration,
          isOnline,
          location: isOnline ? null : location || null,
          meetingUrl: isOnline ? meetingUrl || null : null,
          notes: notes || null,
          status: "SCHEDULED",
          scheduledById: session.user.id,
        },
      });
    } else {
      hearing = await prisma.caseHearing.create({
        data: {
          caseId,
          type,
          title,
          hearingAt: new Date(scheduledAt),
          durationMinutes: duration,
          isOnline,
          location: isOnline ? null : location || null,
          meetingUrl: isOnline ? meetingUrl || null : null,
          notes: notes || null,
          status: "SCHEDULED",
          scheduledById: session.user.id,
        },
      });
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        action: fromSuggestionId ? "UPDATE" : "CREATE",
        entity: "CaseHearing",
        entityId: hearing.id,
        userId: session.user.id,
        caseId: hearing.caseId,
        meta: {
          operation: fromSuggestionId ? "CONFIRM_SUGGESTED" : "SCHEDULE_NEW",
          type,
          hearingAt: hearing.hearingAt.toISOString(),
          notifyParties,
          notifyArbitrators,
        },
      },
    });

    // Notificar a partes y árbitros (in-app)
    try {
      const targets: { role: string }[] = [];
      if (notifyParties) targets.push({ role: "DEMANDANTE" }, { role: "DEMANDADO" });
      if (notifyArbitrators) targets.push({ role: "ARBITRO" });
      if (targets.length > 0) {
        const members = await prisma.caseMember.findMany({
          where: {
            caseId: hearing.caseId,
            userId: { not: null },
            role: { in: targets.map((t) => t.role) as any },
          },
          select: { userId: true },
        });
        const userIds = [...new Set(members.map((m) => m.userId).filter(Boolean))] as string[];
        if (userIds.length > 0) {
          await prisma.notification.createMany({
            data: userIds.map((uid) => ({
              userId: uid,
              type: "SYSTEM" as const,
              title: `Audiencia programada — ${title}`,
              message: `Fecha: ${hearing.hearingAt.toLocaleString("es-PE", { timeZone: "America/Lima" })}`,
              metadata: {
                caseId: hearing.caseId,
                hearingId: hearing.id,
                hearingAt: hearing.hearingAt.toISOString(),
              },
              isRead: false,
            })),
          });
        }
      }
    } catch (notifErr) {
      console.error("notif audiencia error:", notifErr);
    }

    return NextResponse.json({ success: true, hearing }, { status: 201 });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("POST audiencia:", e);
    return NextResponse.json({ error: "Error al programar audiencia" }, { status: 500 });
  }
}
