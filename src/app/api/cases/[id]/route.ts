/**
 * CAARD - API de Expediente Individual
 * GET /api/cases/[id] - Obtener expediente
 * PATCH /api/cases/[id] - Actualizar expediente
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase, hasFullAccess, requireCenterAccess } from "@/lib/case-authorization";
import { Role } from "@prisma/client";

/**
 * GET /api/cases/[id] - Obtener expediente con verificación de acceso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;
    const userCenterId = session.user.centerId;

    // Verificar acceso al caso (incluye verificación de centro)
    const accessResult = await canAccessCase(userId, userRole, id, userCenterId);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.reason || "Sin acceso a este expediente" },
        { status: 403 }
      );
    }

    // Obtener el caso con todas las relaciones relevantes
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        center: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        arbitrationType: {
          select: {
            id: true,
            code: true,
            name: true,
            kind: true,
            tribunalMode: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        lawyers: {
          where: { isActive: true },
          include: {
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            representedMember: {
              select: {
                id: true,
                displayName: true,
                role: true,
              },
            },
          },
        },
        folders: {
          orderBy: { key: "asc" },
        },
        _count: {
          select: {
            documents: true,
            payments: true,
            deadlines: true,
            hearings: true,
            notes: true,
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    // Si el usuario tiene acceso limitado, filtrar información sensible
    if (accessResult.accessLevel === "own") {
      // Remover notas privadas si no es staff/admin
      const filteredCase = {
        ...caseData,
        // Las notas privadas solo las ve el staff
        _count: {
          ...caseData._count,
          // No mostrar conteo de notas privadas a partes
        },
      };
      return NextResponse.json({ case: filteredCase });
    }

    return NextResponse.json({ case: caseData });
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Error al obtener expediente" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id] - Actualizar expediente
 * Solo SUPER_ADMIN, ADMIN, SECRETARIA pueden actualizar
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userCenterId = session.user.centerId;

    // Solo roles administrativos pueden actualizar casos
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para actualizar expedientes" },
        { status: 403 }
      );
    }

    // Verificar que el caso pertenece al centro del usuario
    const existingCase = await prisma.case.findUnique({
      where: { id },
      select: { centerId: true },
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    const centerAccess = await requireCenterAccess(userRole, userCenterId, existingCase.centerId);
    if (!centerAccess.allowed) {
      return NextResponse.json(
        { error: centerAccess.error || "Sin acceso a este centro" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const allowedFields = ["title", "status", "claimantName", "respondentName"];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Actualizar fechas según el status
    if (body.status) {
      if (body.status === "ADMITTED" && !body.admittedAt) {
        updateData.admittedAt = new Date();
      }
      if (body.status === "CLOSED" && !body.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: updatedCase.centerId,
        caseId: id,
        userId: session.user.id,
        action: "UPDATE",
        entity: "Case",
        entityId: id,
        meta: {
          changes: updateData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      case: updatedCase,
    });
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Error al actualizar expediente" },
      { status: 500 }
    );
  }
}
