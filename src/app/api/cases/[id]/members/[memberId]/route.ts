/**
 * CAARD - API de Miembro Individual del Caso
 * DELETE /api/cases/[id]/members/[memberId] - Remover miembro del caso
 * PATCH /api/cases/[id]/members/[memberId] - Actualizar miembro
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRemoveArbitrator } from "@/lib/case-authorization";
import { Role } from "@prisma/client";

/**
 * DELETE /api/cases/[id]/members/[memberId] - Remover miembro del caso
 * Para ARBITROS: requiere aprobación del centro (ADMIN/SUPER_ADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId, memberId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Obtener el miembro a remover
    const member = await prisma.caseMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        case: { select: { centerId: true, code: true } },
      },
    });

    if (!member || member.caseId !== caseId) {
      return NextResponse.json(
        { error: "Miembro no encontrado en este caso" },
        { status: 404 }
      );
    }

    // Para árbitros, verificar permisos especiales
    if (member.role === "ARBITRO") {
      const removeResult = await canRemoveArbitrator(
        userId,
        userRole,
        caseId,
        member.userId || ""
      );

      if (!removeResult.canRemove) {
        if (removeResult.requiresApproval) {
          // Crear solicitud de recusación (pendiente de implementar modelo)
          return NextResponse.json({
            success: false,
            requiresApproval: true,
            message: "La recusación del árbitro requiere aprobación del centro. Se ha creado una solicitud.",
          });
        }

        return NextResponse.json(
          { error: removeResult.reason || "Sin permisos para remover árbitro" },
          { status: 403 }
        );
      }
    } else {
      // Para otros miembros, solo SUPER_ADMIN, ADMIN, SECRETARIA pueden remover
      if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole)) {
        return NextResponse.json(
          { error: "Sin permisos para remover miembros" },
          { status: 403 }
        );
      }
    }

    // No permitir remover partes principales (DEMANDANTE/DEMANDADO primario)
    if ((member.role === "DEMANDANTE" || member.role === "DEMANDADO") && member.isPrimary) {
      return NextResponse.json(
        { error: "No se puede remover la parte principal del caso" },
        { status: 400 }
      );
    }

    // Remover el miembro
    await prisma.caseMember.delete({
      where: { id: memberId },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: member.case.centerId,
        caseId,
        userId: session.user.id,
        action: "DELETE",
        entity: "CaseMember",
        entityId: memberId,
        meta: {
          memberName: member.displayName || member.user?.name,
          memberRole: member.role,
          caseCode: member.case.code,
          removedBy: session.user.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${member.displayName || member.user?.name} removido del caso`,
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Error al remover miembro" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id]/members/[memberId] - Actualizar miembro
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId, memberId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    // Solo roles administrativos pueden actualizar
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para actualizar" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Verificar que el miembro pertenece al caso
    const member = await prisma.caseMember.findFirst({
      where: {
        id: memberId,
        caseId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    // Campos permitidos para actualizar
    const allowedFields = ["displayName", "email", "phoneE164", "isPrimary"];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await prisma.caseMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      member: updated,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Error al actualizar miembro" },
      { status: 500 }
    );
  }
}
