/**
 * CAARD - API de Tipo de Arbitraje Individual
 * GET /api/admin/arbitration-types/[id] - Obtener tipo
 * PATCH /api/admin/arbitration-types/[id] - Actualizar tipo
 * DELETE /api/admin/arbitration-types/[id] - Eliminar tipo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, ArbitrationKind, TribunalMode } from "@prisma/client";
import { z } from "zod";

// Roles con acceso
const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

// Schema para actualizar tipo
const updateArbitrationTypeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  kind: z.nativeEnum(ArbitrationKind).optional(),
  tribunalMode: z.nativeEnum(TribunalMode).optional(),
  baseFeeCents: z.number().int().positive().optional().nullable(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos" },
        { status: 403 }
      );
    }

    const arbitrationType = await prisma.arbitrationType.findUnique({
      where: { id },
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
    });

    if (!arbitrationType) {
      return NextResponse.json(
        { error: "Tipo de arbitraje no encontrado" },
        { status: 404 }
      );
    }

    // Verificar acceso por centro
    if (userRole !== "SUPER_ADMIN" && arbitrationType.centerId !== session.user.centerId) {
      return NextResponse.json(
        { error: "Sin acceso a este tipo de arbitraje" },
        { status: 403 }
      );
    }

    return NextResponse.json({ arbitrationType });
  } catch (error) {
    console.error("Error fetching arbitration type:", error);
    return NextResponse.json(
      { error: "Error al obtener tipo de arbitraje" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para modificar tipos de arbitraje" },
        { status: 403 }
      );
    }

    const existingType = await prisma.arbitrationType.findUnique({
      where: { id },
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Tipo de arbitraje no encontrado" },
        { status: 404 }
      );
    }

    // Verificar acceso por centro
    if (userRole !== "SUPER_ADMIN" && existingType.centerId !== session.user.centerId) {
      return NextResponse.json(
        { error: "Sin acceso a este tipo de arbitraje" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateArbitrationTypeSchema.parse(body);

    const updateData: any = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.kind !== undefined) {
      updateData.kind = validatedData.kind;
    }
    if (validatedData.tribunalMode !== undefined) {
      updateData.tribunalMode = validatedData.tribunalMode;
    }
    if (validatedData.baseFeeCents !== undefined) {
      updateData.baseFeeCents = validatedData.baseFeeCents;
    }
    if (validatedData.currency !== undefined) {
      updateData.currency = validatedData.currency;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    const arbitrationType = await prisma.arbitrationType.update({
      where: { id },
      data: updateData,
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
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: existingType.centerId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "ArbitrationType",
        entityId: arbitrationType.id,
        meta: {
          changes: validatedData,
        },
      },
    });

    return NextResponse.json({ arbitrationType });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating arbitration type:", error);
    return NextResponse.json(
      { error: "Error al actualizar tipo de arbitraje" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    // Solo SUPER_ADMIN puede eliminar
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Solo SUPER_ADMIN puede eliminar tipos de arbitraje" },
        { status: 403 }
      );
    }

    const existingType = await prisma.arbitrationType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cases: true,
          },
        },
      },
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Tipo de arbitraje no encontrado" },
        { status: 404 }
      );
    }

    // No permitir eliminar si tiene casos asociados
    if (existingType._count.cases > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un tipo con casos asociados. Desactívelo en su lugar." },
        { status: 400 }
      );
    }

    await prisma.arbitrationType.delete({ where: { id } });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: existingType.centerId,
        userId: session.user.id,
        action: "DELETE",
        entity: "ArbitrationType",
        entityId: id,
        meta: {
          code: existingType.code,
          name: existingType.name,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting arbitration type:", error);
    return NextResponse.json(
      { error: "Error al eliminar tipo de arbitraje" },
      { status: 500 }
    );
  }
}
