/**
 * API: Notificaciones del Usuario
 * =================================
 * Obtiene las notificaciones del usuario autenticado
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = {
      userId: session.user.id,
      status: "SENT",
    };

    const notifications = await prisma.notificationQueue.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: limit,
    });

    // Transformar a formato frontend
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      type: mapEventToType(n.eventType),
      title: n.subject || getDefaultTitle(n.eventType),
      message: n.body || "",
      caseCode: n.case?.code,
      caseId: n.caseId,
      isRead: false, // TODO: implementar tracking de lectura
      isImportant: isImportantEvent(n.eventType),
      createdAt: n.sentAt || n.createdAt,
      actionUrl: n.caseId ? `/cases/${n.caseId}` : undefined,
    }));

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

// Mapear evento a tipo de notificación
function mapEventToType(eventType: string): string {
  const mapping: Record<string, string> = {
    CASE_SUBMITTED: "CASE_UPDATE",
    CASE_OBSERVED: "CASE_UPDATE",
    CASE_ADMITTED: "CASE_UPDATE",
    CASE_REJECTED: "CASE_UPDATE",
    DOCUMENT_UPLOADED: "DOCUMENT",
    DOCUMENT_REPLACED: "DOCUMENT",
    DEADLINE_UPCOMING: "DEADLINE",
    DEADLINE_OVERDUE: "DEADLINE",
    HEARING_SCHEDULED: "HEARING",
    HEARING_UPDATED: "HEARING",
    HEARING_REMINDER: "HEARING",
    PAYMENT_REQUIRED: "PAYMENT",
    PAYMENT_PENDING: "PAYMENT",
    PAYMENT_CONFIRMED: "PAYMENT",
    PAYMENT_FAILED: "PAYMENT",
    PAYMENT_OVERDUE: "PAYMENT",
    AWARD_ISSUED: "CASE_UPDATE",
    CASE_CLOSED: "CASE_UPDATE",
  };

  return mapping[eventType] || "SYSTEM";
}

// Título por defecto según evento
function getDefaultTitle(eventType: string): string {
  const titles: Record<string, string> = {
    CASE_SUBMITTED: "Solicitud recibida",
    CASE_OBSERVED: "Solicitud observada",
    CASE_ADMITTED: "Demanda admitida",
    CASE_REJECTED: "Solicitud rechazada",
    DOCUMENT_UPLOADED: "Nuevo documento",
    DOCUMENT_REPLACED: "Documento actualizado",
    DEADLINE_UPCOMING: "Plazo próximo a vencer",
    DEADLINE_OVERDUE: "Plazo vencido",
    HEARING_SCHEDULED: "Audiencia programada",
    HEARING_UPDATED: "Audiencia actualizada",
    HEARING_REMINDER: "Recordatorio de audiencia",
    PAYMENT_REQUIRED: "Pago requerido",
    PAYMENT_PENDING: "Pago pendiente",
    PAYMENT_CONFIRMED: "Pago confirmado",
    PAYMENT_FAILED: "Pago fallido",
    PAYMENT_OVERDUE: "Pago vencido",
    AWARD_ISSUED: "Laudo emitido",
    CASE_CLOSED: "Caso cerrado",
  };

  return titles[eventType] || "Notificación";
}

// Verificar si es evento importante
function isImportantEvent(eventType: string): boolean {
  const importantEvents = [
    "DEADLINE_OVERDUE",
    "PAYMENT_OVERDUE",
    "CASE_REJECTED",
    "PAYMENT_FAILED",
    "CASE_OBSERVED",
  ];

  return importantEvents.includes(eventType);
}
