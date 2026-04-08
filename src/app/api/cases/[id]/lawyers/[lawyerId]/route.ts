/**
 * CAARD - API de Abogado Individual del Caso
 * DELETE /api/cases/[id]/lawyers/[lawyerId] - Remover abogado del caso
 * PATCH /api/cases/[id]/lawyers/[lawyerId] - Actualizar asignación de abogado
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase, canRemoveLawyer } from "@/lib/case-authorization";
import { Role } from "@prisma/client";

/**
 * DELETE /api/cases/[id]/lawyers/[lawyerId] - Remover abogado del caso
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lawyerId: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId, lawyerId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Verificar permisos para remover al abogado
    const removePermission = await canRemoveLawyer(userId, userRole, caseId, lawyerId);

    if (!removePermission.canRemove) {
      return NextResponse.json(
        { error: removePermission.reason || "Sin permisos para remover este abogado" },
        { status: 403 }
      );
    }

    // Obtener la asignación actual
    const lawyerAssignment = await prisma.caseLawyer.findFirst({
      where: {
        caseId,
        lawyerId,
        isActive: true,
      },
      include: {
        lawyer: { select: { name: true, email: true } },
        case: { select: { centerId: true, code: true } },
      },
    });

    if (!lawyerAssignment) {
      return NextResponse.json(
        { error: "Asignación de abogado no encontrada" },
        { status: 404 }
      );
    }

    // Marcar como inactivo (soft delete) y registrar fecha de revocación
    await prisma.caseLawyer.update({
      where: { id: lawyerAssignment.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
        notes: `Removido por ${session.user.name || session.user.email} el ${new Date().toLocaleDateString("es-PE")}`,
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: lawyerAssignment.case.centerId,
        caseId,
        userId: session.user.id,
        action: "DELETE",
        entity: "CaseLawyer",
        entityId: lawyerAssignment.id,
        meta: {
          lawyerName: lawyerAssignment.lawyer.name,
          lawyerEmail: lawyerAssignment.lawyer.email,
          representationType: lawyerAssignment.representationType,
          removedBy: session.user.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Abogado ${lawyerAssignment.lawyer.name} removido del caso ${lawyerAssignment.case.code}`,
    });
  } catch (error) {
    console.error("Error removing lawyer:", error);
    return NextResponse.json(
      { error: "Error al remover abogado" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id]/lawyers/[lawyerId] - Actualizar asignación de abogado
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lawyerId: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId, lawyerId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Solo admins y secretaría pueden actualizar
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para actualizar" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const allowedFields = ["isLead", "barAssociation", "caseNumber", "notes"];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const lawyerAssignment = await prisma.caseLawyer.findFirst({
      where: {
        caseId,
        lawyerId,
        isActive: true,
      },
    });

    if (!lawyerAssignment) {
      return NextResponse.json(
        { error: "Asignación de abogado no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.caseLawyer.update({
      where: { id: lawyerAssignment.id },
      data: updateData,
      include: {
        lawyer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      lawyer: updated,
    });
  } catch (error) {
    console.error("Error updating lawyer assignment:", error);
    return NextResponse.json(
      { error: "Error al actualizar asignación" },
      { status: 500 }
    );
  }
}
