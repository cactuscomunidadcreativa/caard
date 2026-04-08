/**
 * CAARD - API de Miembros del Caso
 * GET /api/cases/[id]/members - Listar miembros del caso
 * POST /api/cases/[id]/members - Agregar miembro al caso (árbitro, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase, canRemoveArbitrator } from "@/lib/case-authorization";
import { Role } from "@prisma/client";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  name: z.string().min(2).optional().nullable(),
  displayName: z.string().min(2).optional().nullable(),
  role: z.enum(["ARBITRO", "DEMANDANTE", "DEMANDADO", "SECRETARIA", "ABOGADO"]),
  phoneE164: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
});

/**
 * GET /api/cases/[id]/members - Listar miembros del caso
 */
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

    // Verificar acceso al caso
    const accessResult = await canAccessCase(userId, userRole, caseId);
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: "Sin acceso a este expediente" },
        { status: 403 }
      );
    }

    const members = await prisma.caseMember.findMany({
      where: { caseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phoneE164: true,
          },
        },
        lawyerRepresentations: {
          where: { isActive: true },
          include: {
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { isPrimary: "desc" },
        { createdAt: "asc" },
      ],
    });

    // Determinar permisos de remoción para árbitros
    const membersWithPermissions = await Promise.all(
      members.map(async (member) => {
        let canRemove = false;
        let requiresApproval = false;

        if (member.role === "ARBITRO" && member.userId) {
          const removeResult = await canRemoveArbitrator(
            userId,
            userRole,
            caseId,
            member.userId
          );
          canRemove = removeResult.canRemove;
          requiresApproval = removeResult.requiresApproval;
        }

        return {
          ...member,
          canRemove,
          requiresApproval,
        };
      })
    );

    return NextResponse.json({ members: membersWithPermissions });
  } catch (error) {
    console.error("Error listing members:", error);
    return NextResponse.json(
      { error: "Error al listar miembros" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases/[id]/members - Agregar miembro al caso
 * Solo SUPER_ADMIN, ADMIN, SECRETARIA pueden agregar miembros
 */
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

    // Solo roles administrativos pueden agregar miembros
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para agregar miembros" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = addMemberSchema.parse(body);

    const display = validatedData.displayName || validatedData.name || null;
    if (!display && !validatedData.userId) {
      return NextResponse.json(
        { error: "Se requiere displayName o userId" },
        { status: 400 }
      );
    }

    // Obtener el caso
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

    // Si viene userId, vincular al usuario existente. Si no, crear miembro standalone.
    let memberUser = null;
    if (validatedData.userId) {
      memberUser = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });
      if (!memberUser) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }
    }

    // Verificar duplicado por usuario
    if (memberUser) {
      const existingMember = await prisma.caseMember.findFirst({
        where: {
          caseId,
          userId: memberUser.id,
          role: validatedData.role,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: `El usuario ya es ${validatedData.role} en este caso` },
          { status: 400 }
        );
      }
    }

    const finalDisplayName =
      display || memberUser?.name || memberUser?.email || "Sin nombre";
    const finalEmail = validatedData.email || memberUser?.email || null;

    // Crear el miembro
    const member = await prisma.caseMember.create({
      data: {
        caseId,
        userId: memberUser?.id ?? null,
        role: validatedData.role as Role,
        displayName: finalDisplayName,
        email: finalEmail,
        phoneE164: validatedData.phoneE164 || null,
        isPrimary: validatedData.isPrimary ?? false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        centerId: caseData.centerId,
        caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "CaseMember",
        entityId: member.id,
        meta: {
          memberName: finalDisplayName,
          memberRole: validatedData.role,
          caseCode: caseData.code,
        },
      },
    });

    return NextResponse.json({
      success: true,
      member,
      message: `${finalDisplayName} agregado como ${validatedData.role}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Error al agregar miembro" },
      { status: 500 }
    );
  }
}
