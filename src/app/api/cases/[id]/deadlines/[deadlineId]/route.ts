/**
 * CAARD - Case Deadline Item API
 * PATCH /api/cases/[id]/deadlines/[deadlineId] - Mark complete / update
 * DELETE /api/cases/[id]/deadlines/[deadlineId] - Remove deadline
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const ALLOWED_STAFF: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SECRETARIA",
  "CENTER_STAFF",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deadlineId: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId, deadlineId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    if (!ALLOWED_STAFF.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos" },
        { status: 403 }
      );
    }

    const deadline = await prisma.caseDeadline.findUnique({
      where: { id: deadlineId },
      include: { case: { select: { centerId: true, code: true } } },
    });

    if (!deadline || deadline.caseId !== caseId) {
      return NextResponse.json(
        { error: "Plazo no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.isCompleted !== undefined) {
      updateData.isCompleted = !!body.isCompleted;
      updateData.completedAt = body.isCompleted ? new Date() : null;
    }
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueAt !== undefined) {
      const d = new Date(body.dueAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
      }
      updateData.dueAt = d;
    }

    const updated = await prisma.caseDeadline.update({
      where: { id: deadlineId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        centerId: deadline.case.centerId,
        caseId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "CaseDeadline",
        entityId: deadlineId,
        meta: { caseCode: deadline.case.code, changes: updateData },
      },
    });

    return NextResponse.json({ success: true, deadline: updated });
  } catch (error) {
    console.error("Error updating deadline:", error);
    return NextResponse.json(
      { error: "Error al actualizar plazo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deadlineId: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId, deadlineId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    if (!ALLOWED_STAFF.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos" },
        { status: 403 }
      );
    }

    const deadline = await prisma.caseDeadline.findUnique({
      where: { id: deadlineId },
      include: { case: { select: { centerId: true, code: true } } },
    });

    if (!deadline || deadline.caseId !== caseId) {
      return NextResponse.json(
        { error: "Plazo no encontrado" },
        { status: 404 }
      );
    }

    await prisma.caseDeadline.delete({ where: { id: deadlineId } });

    await prisma.auditLog.create({
      data: {
        centerId: deadline.case.centerId,
        caseId,
        userId: session.user.id,
        action: "DELETE",
        entity: "CaseDeadline",
        entityId: deadlineId,
        meta: { caseCode: deadline.case.code, title: deadline.title },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deadline:", error);
    return NextResponse.json(
      { error: "Error al eliminar plazo" },
      { status: 500 }
    );
  }
}
