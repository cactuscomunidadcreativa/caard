/**
 * CAARD - API de Árbitros Públicos
 * Retorna la lista de árbitros activos del centro para mostrar en la web pública
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get("specialization");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Obtener el centro principal
    const center = await prisma.center.findFirst({
      where: {},
    });

    if (!center) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    // Construir filtros
    const where: any = {
      centerId: center.id,
      status: "ACTIVE", // Solo árbitros activos
    };

    // Filtrar por especialidad
    if (specialization) {
      where.specializations = {
        has: specialization,
      };
    }

    // Buscar por nombre
    if (search) {
      where.user = {
        name: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    // Obtener total para paginación
    const total = await prisma.arbitratorRegistry.count({ where });

    // Obtener árbitros con paginación
    const arbitrators = await prisma.arbitratorRegistry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            // email omitido: era un PII leak en endpoint público
            image: true,
          },
        },
      },
      orderBy: [
        { approvalDate: "asc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Stats reales desde CaseMember (no desde el campo manual del registry)
    const { getArbitratorStats } = await import("@/lib/arbitrator-stats");
    const publicArbitrators = await Promise.all(
      arbitrators.map(async (arb) => {
        const stats = await getArbitratorStats({ registryId: arb.id });
        return {
          id: arb.id,
          name: arb.user.name,
          image: arb.user.image,
          specializations: arb.specializations,
          barAssociation: arb.barAssociation,
          // Estadísticas públicas REALES (no el campo manual)
          casesCompleted: stats.closedCases,
          casesActive: stats.activeCases,
          acceptsEmergency: arb.acceptsEmergency,
          memberSince: arb.approvalDate,
        };
      })
    );

    return NextResponse.json({
      arbitrators: publicArbitrators,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching public arbitrators:", error);
    return NextResponse.json(
      { error: "Error al obtener la lista de árbitros" },
      { status: 500 }
    );
  }
}
