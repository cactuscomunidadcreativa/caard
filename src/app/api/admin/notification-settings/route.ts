/**
 * CAARD - API de Configuracion de Notificaciones
 * GET: Obtener configuracion actual
 * PUT: Actualizar configuracion
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"];

// GET - Obtener configuracion
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const centerId = (session.user as any).centerId;

    // Buscar configuracion del centro
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: {
        notificationSettings: true,
      },
    });

    return NextResponse.json({
      settings: center?.notificationSettings || null,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Error al obtener configuracion" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuracion
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const centerId = (session.user as any).centerId;
    const settings = await request.json();

    // Actualizar configuracion del centro
    await prisma.center.update({
      where: { id: centerId },
      data: {
        notificationSettings: settings,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuracion actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuracion" },
      { status: 500 }
    );
  }
}
