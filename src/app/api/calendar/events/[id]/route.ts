/**
 * CAARD - API de Evento Individual de Calendario
 * PUT: Actualizar evento
 * DELETE: Cancelar evento
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleWorkspaceService } from "@/lib/google-workspace";
import { z } from "zod";

const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  attendeeEmails: z.array(z.string().email()).optional(),
  location: z.string().optional(),
  calendarId: z.string().optional().default("primary"),
});

/**
 * PUT /api/calendar/events/[id]
 * Actualiza un evento de Google Calendar
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const workspace = getGoogleWorkspaceService();
    if (!workspace.isConfigured()) {
      return NextResponse.json(
        { error: "Google Workspace no configurado" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = updateEventSchema.parse(body);

    const updates: any = {};
    if (data.title) updates.summary = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.location !== undefined) updates.location = data.location;
    if (data.startTime) updates.start = { dateTime: data.startTime, timeZone: "America/Lima" };
    if (data.endTime) updates.end = { dateTime: data.endTime, timeZone: "America/Lima" };
    if (data.attendeeEmails) {
      updates.attendees = data.attendeeEmails.map((email: string) => ({ email }));
    }

    const result = await workspace.updateEvent(data.calendarId, eventId, updates);

    // Audit log
    await prisma.auditLog.create({
      data: {
        centerId: session.user.centerId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "CalendarEvent",
        entityId: eventId,
        meta: {
          updates: Object.keys(data).filter((k) => k !== "calendarId"),
        },
      },
    });

    return NextResponse.json({ success: true, event: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos invalidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      { error: "Error al actualizar evento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/events/[id]?calendarId=primary
 * Cancela un evento de Google Calendar
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const workspace = getGoogleWorkspaceService();
    if (!workspace.isConfigured()) {
      return NextResponse.json(
        { error: "Google Workspace no configurado" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";

    await workspace.deleteEvent(calendarId, eventId);

    // Audit log
    await prisma.auditLog.create({
      data: {
        centerId: session.user.centerId,
        userId: session.user.id,
        action: "DELETE",
        entity: "CalendarEvent",
        entityId: eventId,
        meta: { calendarId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      { error: "Error al eliminar evento" },
      { status: 500 }
    );
  }
}
