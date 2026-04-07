/**
 * CAARD - Case Note Item API
 * DELETE /api/cases/[id]/notes/[noteId] - Delete a note (author or admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId, noteId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;

    const note = await prisma.caseNote.findUnique({
      where: { id: noteId },
      include: { case: { select: { centerId: true, code: true } } },
    });

    if (!note || note.caseId !== caseId) {
      return NextResponse.json(
        { error: "Nota no encontrada" },
        { status: 404 }
      );
    }

    const isAuthor = note.authorId === userId;
    const isAdmin = ADMIN_ROLES.includes(userRole);

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Sin permisos para eliminar esta nota" },
        { status: 403 }
      );
    }

    await prisma.caseNote.delete({ where: { id: noteId } });

    await prisma.auditLog.create({
      data: {
        centerId: note.case.centerId,
        caseId,
        userId,
        action: "DELETE",
        entity: "CaseNote",
        entityId: noteId,
        meta: { caseCode: note.case.code },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Error al eliminar nota" },
      { status: 500 }
    );
  }
}
