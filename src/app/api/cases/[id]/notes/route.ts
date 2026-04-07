/**
 * CAARD - Case Notes API
 * GET /api/cases/[id]/notes - List notes
 * POST /api/cases/[id]/notes - Add note
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase } from "@/lib/case-authorization";
import { Role } from "@prisma/client";
import { z } from "zod";

const ALLOWED_STAFF: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SECRETARIA",
  "CENTER_STAFF",
];

const noteSchema = z.object({
  content: z.string().min(1),
  title: z.string().optional().nullable(),
  isPrivate: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;

    const accessResult = await canAccessCase(userId, userRole, caseId);
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: "Sin acceso a este expediente" },
        { status: 403 }
      );
    }

    const isStaff = ALLOWED_STAFF.includes(userRole);
    const notes = await prisma.caseNote.findMany({
      where: {
        caseId,
        ...(isStaff ? {} : { isPrivate: false }),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error listing notes:", error);
    return NextResponse.json(
      { error: "Error al listar notas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: caseId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    if (!ALLOWED_STAFF.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para crear notas" },
        { status: 403 }
      );
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { centerId: true, code: true },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = noteSchema.parse(body);

    const note = await prisma.caseNote.create({
      data: {
        caseId,
        authorId: session.user.id,
        title: data.title || null,
        content: data.content,
        isPrivate: data.isPrivate ?? true,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        centerId: caseData.centerId,
        caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "CaseNote",
        entityId: note.id,
        meta: { caseCode: caseData.code, isPrivate: note.isPrivate },
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Error al crear nota" },
      { status: 500 }
    );
  }
}
