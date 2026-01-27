/**
 * CAARD - API de Tipos de Arbitraje
 * GET /api/admin/arbitration-types - Listar tipos
 * POST /api/admin/arbitration-types - Crear tipo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, ArbitrationKind, TribunalMode } from "@prisma/client";
import { z } from "zod";

// Roles con acceso
const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

// Schema para crear tipo
const createArbitrationTypeSchema = z.object({
  centerId: z.string().min(1),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  kind: z.nativeEnum(ArbitrationKind).default("INSTITUTIONAL"),
  tribunalMode: z.nativeEnum(TribunalMode).default("SOLE_ARBITRATOR"),
  baseFeeCents: z.number().int().positive().optional().nullable(),
  currency: z.string().default("PEN"),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const centerId = session.user.centerId;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos" },
        { status: 403 }
      );
    }

    // Filtro por centro para ADMIN, todos para SUPER_ADMIN
    const whereClause = userRole === "SUPER_ADMIN" ? {} : { centerId: centerId || undefined };

    const arbitrationTypes = await prisma.arbitrationType.findMany({
      where: whereClause,
      include: {
        center: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        notificationRules: {
          orderBy: { eventType: "asc" },
        },
        _count: {
          select: {
            cases: true,
          },
        },
      },
      orderBy: [{ center: { code: "asc" } }, { code: "asc" }],
    });

    return NextResponse.json({ arbitrationTypes });
  } catch (error) {
    console.error("Error fetching arbitration types:", error);
    return NextResponse.json(
      { error: "Error al obtener tipos de arbitraje" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userCenterId = session.user.centerId;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para crear tipos de arbitraje" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createArbitrationTypeSchema.parse(body);

    // Si no es SUPER_ADMIN, solo puede crear en su centro
    if (userRole !== "SUPER_ADMIN" && validatedData.centerId !== userCenterId) {
      return NextResponse.json(
        { error: "Solo puede crear tipos en su centro" },
        { status: 403 }
      );
    }

    // Verificar que el centro existe
    const center = await prisma.center.findUnique({
      where: { id: validatedData.centerId },
    });

    if (!center) {
      return NextResponse.json(
        { error: "Centro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no exista el código en el mismo centro
    const existing = await prisma.arbitrationType.findFirst({
      where: {
        centerId: validatedData.centerId,
        code: validatedData.code,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un tipo con ese código en este centro" },
        { status: 400 }
      );
    }

    const arbitrationType = await prisma.arbitrationType.create({
      data: {
        centerId: validatedData.centerId,
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description,
        kind: validatedData.kind,
        tribunalMode: validatedData.tribunalMode,
        baseFeeCents: validatedData.baseFeeCents,
        currency: validatedData.currency,
        isActive: validatedData.isActive,
      },
      include: {
        center: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        notificationRules: true,
        _count: {
          select: {
            cases: true,
          },
        },
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: validatedData.centerId,
        userId: session.user.id,
        action: "CREATE",
        entity: "ArbitrationType",
        entityId: arbitrationType.id,
        meta: {
          code: arbitrationType.code,
          name: arbitrationType.name,
        },
      },
    });

    return NextResponse.json({ arbitrationType }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating arbitration type:", error);
    return NextResponse.json(
      { error: "Error al crear tipo de arbitraje" },
      { status: 500 }
    );
  }
}
