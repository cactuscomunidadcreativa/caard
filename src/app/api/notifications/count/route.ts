/**
 * CAARD - API para contar notificaciones
 * GET /api/notifications/count - Obtener conteo de notificaciones no leídas
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

    // Contar notificaciones pendientes del usuario
    const count = await prisma.notificationQueue.count({
      where: {
        userId: session.user.id,
        status: "QUEUED",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting notifications:", error);
    return NextResponse.json({ count: 0 });
  }
}
