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

    // Serialize BigInt fields
    const serialized: any = {
      ...caseData,
      disputeAmountCents: (caseData as any).disputeAmountCents?.toString() ?? null,
      centerFeeCents: (caseData as any).centerFeeCents?.toString() ?? null,
      taxCents: (caseData as any).taxCents?.toString() ?? null,
      totalAdminFeeCents: (caseData as any).totalAdminFeeCents?.toString() ?? null,
    };
    if ((caseData as any).documents) {
      serialized.documents = (caseData as any).documents.map((d: any) => ({
        ...d,
        sizeBytes: d.sizeBytes != null ? d.sizeBytes.toString() : null,
      }));
    }

    if (accessResult.accessLevel === "own") {
      const filteredCase = {
        ...serialized,
        _count: { ...caseData._count },
      };
      return NextResponse.json({ case: filteredCase });
    }

    return NextResponse.json({ case: serialized });
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
    const allowedFields = [
      "title",
      "status",
      "claimantName",
      "respondentName",
      "currentStage",
      "tribunalMode",
      "currency",
      "isBlocked",
      "blockReason",
      "driveFolderId",
    ];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Si llega una URL de Drive en driveFolderId, extraer el ID
    if (typeof updateData.driveFolderId === "string") {
      const m = updateData.driveFolderId.match(/[-\w]{25,}/);
      if (m) updateData.driveFolderId = m[0];
    }

    // disputeAmount comes as decimal number; store as cents BigInt
    if (body.disputeAmount !== undefined) {
      const n = Number(body.disputeAmount);
      if (!isNaN(n)) {
        updateData.disputeAmountCents = BigInt(Math.round(n * 100));
      } else if (body.disputeAmount === null || body.disputeAmount === "") {
        updateData.disputeAmountCents = null;
      }
    }

    if (body.isBlocked === true) {
      updateData.blockedAt = new Date();
      updateData.blockedBy = session.user.id;
    } else if (body.isBlocked === false) {
      updateData.blockedAt = null;
      updateData.blockedBy = null;
      updateData.blockReason = null;
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
      case: {
        ...updatedCase,
        disputeAmountCents: updatedCase.disputeAmountCents?.toString() ?? null,
        centerFeeCents: (updatedCase as any).centerFeeCents?.toString() ?? null,
        taxCents: (updatedCase as any).taxCents?.toString() ?? null,
        totalAdminFeeCents: (updatedCase as any).totalAdminFeeCents?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Error al actualizar expediente" },
      { status: 500 }
    );
  }
}
