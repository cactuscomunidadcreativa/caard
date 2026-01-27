/**
 * CAARD - API de Tipos de Arbitraje
 * GET /api/arbitration-types - Listar tipos disponibles
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener centro del usuario o usar el primero disponible
    let centerId = session.user.centerId;

    if (!centerId) {
      const defaultCenter = await prisma.center.findFirst();
      if (!defaultCenter) {
        return NextResponse.json([]);
      }
      centerId = defaultCenter.id;
    }

    // Obtener tipos de arbitraje activos del centro
    const arbitrationTypes = await prisma.arbitrationType.findMany({
      where: {
        centerId,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        kind: true,
        tribunalMode: true,
        baseFeeCents: true,
        currency: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(arbitrationTypes);
  } catch (error) {
    console.error("Error fetching arbitration types:", error);
    return NextResponse.json(
      { error: "Error al obtener tipos de arbitraje" },
      { status: 500 }
    );
  }
}
