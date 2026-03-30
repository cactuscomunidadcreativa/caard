/**
 * CAARD - API de Eventos de Calendario
 * GET: Lista eventos para un caso
 * POST: Crea una audiencia/evento vinculado a un caso
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleWorkspaceService } from "@/lib/google-workspace";
import { z } from "zod";

const createEventSchema = z.object({
  caseId: z.string().min(1, "caseId es requerido"),
  title: z.string().min(1, "title es requerido"),
  description: z.string().optional(),
  startTime: z.string().min(1, "startTime es requerido"),
  endTime: z.string().min(1, "endTime es requerido"),
  attendeeEmails: z.array(z.string().email()).default([]),
  location: z.string().optional(),
  meetLink: z.boolean().optional().default(false),
  calendarId: z.string().optional().default("primary"),
});

/**
 * GET /api/calendar/events?caseId=xxx&from=2024-01-01&to=2024-12-31
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const workspace = getGoogleWorkspaceService();
    if (!workspace.isConfigured()) {
      return NextResponse.json(
        { error: "Google Workspace no configurado" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const calendarId = searchParams.get("calendarId") || "primary";

    // Rango de fechas por defecto: hoy +/- 30 dias
    const now = new Date();
    const timeMin = from || new Date(now.getTime() - 30 * 86400000).toISOString();
    const timeMax = to || new Date(now.getTime() + 90 * 86400000).toISOString();

    // Buscar en Google Calendar con filtro por caso si se proporciona
    const query = caseId ? `CAARD-${caseId}` : undefined;
    const events = await workspace.listEvents(calendarId, timeMin, timeMax, {
      query,
      maxResults: 50,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error listing calendar events:", error);
    return NextResponse.json(
      { error: "Error al listar eventos del calendario" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/events
 * Crea una audiencia/evento y lo vincula a un caso
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const workspace = getGoogleWorkspaceService();
    if (!workspace.isConfigured()) {
      return NextResponse.json(
        { error: "Google Workspace no configurado" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = createEventSchema.parse(body);

    // Verificar que el caso existe
    const caseRecord = await prisma.case.findUnique({
      where: { id: data.caseId },
      select: { id: true, code: true, title: true },
    });

    if (!caseRecord) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    // Construir evento para Google Calendar
    const eventSummary = `[${caseRecord.code}] ${data.title}`;
    const eventDescription = [
      data.description || "",
      "",
      `Expediente: ${caseRecord.code} - ${caseRecord.title}`,
      `Referencia CAARD: CAARD-${data.caseId}`,
    ].join("\n");

    const calendarEvent: any = {
      summary: eventSummary,
      description: eventDescription,
      location: data.location,
      start: { dateTime: data.startTime, timeZone: "America/Lima" },
      end: { dateTime: data.endTime, timeZone: "America/Lima" },
      attendees: data.attendeeEmails.map((email) => ({ email })),
    };

    // Crear enlace de Google Meet si se solicita
    if (data.meetLink) {
      calendarEvent.conferenceData = {
        createRequest: {
          requestId: `caard-${data.caseId}-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const result = await workspace.createEvent(data.calendarId, calendarEvent);

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: session.user.centerId,
        userId: session.user.id,
        action: "CREATE",
        entity: "CalendarEvent",
        entityId: result.id,
        meta: {
          caseId: data.caseId,
          code: caseRecord.code,
          eventTitle: data.title,
          startTime: data.startTime,
          endTime: data.endTime,
          meetLink: result.meetLink || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      event: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos invalidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: "Error al crear evento en el calendario" },
      { status: 500 }
    );
  }
}
