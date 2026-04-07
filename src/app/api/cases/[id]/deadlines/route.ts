/**
 * CAARD - Case Deadlines API
 * POST /api/cases/[id]/deadlines - Add deadline
 * GET /api/cases/[id]/deadlines - List deadlines
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

const deadlineSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  dueAt: z.string().min(1),
  timezone: z.string().optional(),
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

    const deadlines = await prisma.caseDeadline.findMany({
      where: { caseId },
      orderBy: { dueAt: "asc" },
    });

    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error("Error listing deadlines:", error);
    return NextResponse.json(
      { error: "Error al listar plazos" },
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
        { error: "Sin permisos para crear plazos" },
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
    const data = deadlineSchema.parse(body);

    const due = new Date(data.dueAt);
    if (isNaN(due.getTime())) {
      return NextResponse.json(
        { error: "Fecha inválida" },
        { status: 400 }
      );
    }

    const deadline = await prisma.caseDeadline.create({
      data: {
        caseId,
        title: data.title,
        description: data.description || null,
        dueAt: due,
        timezone: data.timezone || "America/Lima",
      },
    });

    await prisma.auditLog.create({
      data: {
        centerId: caseData.centerId,
        caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "CaseDeadline",
        entityId: deadline.id,
        meta: {
          caseCode: caseData.code,
          title: deadline.title,
          dueAt: due.toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating deadline:", error);
    return NextResponse.json(
      { error: "Error al crear plazo" },
      { status: 500 }
    );
  }
}
