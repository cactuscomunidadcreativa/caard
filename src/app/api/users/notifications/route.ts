/**
 * CAARD - API de Preferencias de Notificaciones
 * GET: Obtener preferencias
 * PUT: Actualizar preferencias
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  caseUpdates: z.boolean(),
  documentNotifications: z.boolean(),
  deadlineReminders: z.boolean(),
  paymentAlerts: z.boolean(),
  hearingReminders: z.boolean(),
  marketingEmails: z.boolean(),
});

// GET /api/users/notifications - Obtener preferencias
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      // Retornar valores por defecto
      return NextResponse.json({
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        caseUpdates: true,
        documentNotifications: true,
        deadlineReminders: true,
        paymentAlerts: true,
        hearingReminders: true,
        marketingEmails: false,
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error al obtener preferencias:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/users/notifications - Actualizar preferencias
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_NOTIFICATION_PREFERENCES",
        entity: "NotificationPreference",
        entityId: preferences.id,
        meta: validatedData,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al actualizar preferencias:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
