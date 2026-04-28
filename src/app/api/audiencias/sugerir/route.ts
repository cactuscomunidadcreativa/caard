/**
 * POST /api/audiencias/sugerir
 * El árbitro sugiere fechas para una audiencia. Crea un CaseHearing
 * con status=SUGGESTED. La secretaría confirma/programa después
 * vía POST /api/audiencias con fromSuggestionId.
 *
 * Body:
 *  - caseId
 *  - hearingType (INSTALACION|SANEAMIENTO|PRUEBAS|ALEGATOS|INFORMES|ESPECIAL)
 *  - modality (VIRTUAL|PRESENCIAL|MIXTA)
 *  - estimatedDuration (minutos, string)
 *  - notes
 *  - suggestedDates: [{ date: 'YYYY-MM-DD', time: 'HH:mm', priority: 1..3 }]
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

const HEARING_TYPE_LABELS: Record<string, string> = {
  INSTALACION: "Audiencia de Instalación",
  SANEAMIENTO: "Audiencia de Saneamiento",
  PRUEBAS: "Audiencia de Actuación de Pruebas",
  ALEGATOS: "Audiencia de Alegatos",
  INFORMES: "Audiencia de Informes Orales",
  ESPECIAL: "Audiencia Especial",
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission("hearings.create");
    const body = await request.json();

    const {
      caseId,
      hearingType,
      modality = "VIRTUAL",
      estimatedDuration = "60",
      notes,
      suggestedDates,
    } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: "caseId es requerido" },
        { status: 400 }
      );
    }
    if (!hearingType) {
      return NextResponse.json(
        { error: "hearingType es requerido" },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(suggestedDates) ||
      suggestedDates.length === 0 ||
      suggestedDates.length > 3
    ) {
      return NextResponse.json(
        { error: "Debe sugerir entre 1 y 3 fechas" },
        { status: 400 }
      );
    }

    // Validar fechas
    const cleaned = suggestedDates
      .filter((d: any) => d?.date && d?.time)
      .slice(0, 3)
      .map((d: any, i: number) => ({
        date: String(d.date),
        time: String(d.time),
        priority: Number(d.priority || i + 1),
        iso: new Date(`${d.date}T${d.time}`).toISOString(),
      }));

    if (cleaned.length === 0) {
      return NextResponse.json(
        { error: "Las fechas sugeridas son inválidas" },
        { status: 400 }
      );
    }

    // Verificar que el árbitro tiene acceso al caso (es miembro del case)
    const isMember = await prisma.caseMember.findFirst({
      where: { caseId, userId: session.user.id },
      select: { id: true, role: true },
    });
    const isStaff = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(
      session.user.role
    );
    if (!isMember && !isStaff) {
      return NextResponse.json(
        { error: "No tienes acceso a este expediente" },
        { status: 403 }
      );
    }

    // Cargar info del caso (para audit y notificación)
    const caso = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, code: true, title: true, centerId: true },
    });
    if (!caso) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    const isOnline = modality === "VIRTUAL" || modality === "MIXTA";
    const title = HEARING_TYPE_LABELS[hearingType] || "Audiencia";
    // primer slot = fecha tentativa "principal"
    const primary = cleaned[0];

    const hearing = await prisma.caseHearing.create({
      data: {
        caseId,
        type: hearingType,
        title,
        hearingAt: new Date(primary.iso),
        durationMinutes: Number(estimatedDuration) || 60,
        isOnline,
        location: null,
        meetingUrl: null,
        notes: notes ? String(notes).slice(0, 2000) : null,
        status: "SUGGESTED",
        suggestedById: session.user.id,
        suggestedDates: cleaned as any,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "CaseHearing",
        entityId: hearing.id,
        userId: session.user.id,
        caseId,
        meta: {
          operation: "SUGGEST",
          hearingType,
          modality,
          options: cleaned.length,
          firstSuggested: primary.iso,
        },
      },
    });

    // Notificar a secretaría/admin del centro para que confirme
    try {
      const staff = await prisma.user.findMany({
        where: {
          centerId: caso.centerId,
          role: { in: ["SECRETARIA", "ADMIN", "CENTER_STAFF"] as any },
          isActive: true,
        },
        select: { id: true },
      });
      if (staff.length > 0) {
        await prisma.notification.createMany({
          data: staff.map((u) => ({
            userId: u.id,
            type: "SYSTEM" as const,
            title: `Audiencia sugerida — ${caso.code}`,
            message: `El árbitro sugirió ${cleaned.length} fecha(s) para "${title}". Requiere confirmación.`,
            metadata: {
              caseId,
              hearingId: hearing.id,
              suggestedDates: cleaned,
            },
            isRead: false,
          })),
        });
      }
    } catch (notifErr) {
      console.error("notif sugerir audiencia:", notifErr);
    }

    return NextResponse.json(
      { success: true, hearing },
      { status: 201 }
    );
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("POST audiencias/sugerir:", e);
    return NextResponse.json(
      { error: "Error al enviar sugerencia" },
      { status: 500 }
    );
  }
}
