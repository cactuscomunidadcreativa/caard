/**
 * CAARD - API de Suscripción a Biblioteca de Laudos (Individual)
 * DELETE: Cancelar suscripción (soft cancel)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const updated = await prisma.laudoSubscription.update({
      where: { id },
      data: { status: "SUB_CANCELLED", cancelledAt: new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error cancelling laudo subscription:", error);
    return NextResponse.json({ error: "Error al cancelar suscripción" }, { status: 500 });
  }
}
