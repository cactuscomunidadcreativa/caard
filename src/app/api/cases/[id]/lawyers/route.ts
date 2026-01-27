/**
 * CAARD - API de Abogados del Caso
 * GET /api/cases/[id]/lawyers - Listar abogados del caso
 * POST /api/cases/[id]/lawyers - Agregar abogado al caso
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase, canRemoveLawyer } from "@/lib/case-authorization";
import { Role, LawyerRepresentationType } from "@prisma/client";
import { z } from "zod";

const addLawyerSchema = z.object({
  lawyerId: z.string().optional(), // Si ya existe el usuario abogado
  email: z.string().email(),
  name: z.string().min(2),
  representationType: z.nativeEnum(LawyerRepresentationType),
  representedMemberId: z.string().optional(),
  barAssociation: z.string().optional(),
  caseNumber: z.string().optional(), // Número de colegiatura
});

/**
 * GET /api/cases/[id]/lawyers - Listar abogados del caso
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

    const lawyers = await prisma.caseLawyer.findMany({
      where: { caseId },
      include: {
        lawyer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phoneE164: true,
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
      orderBy: [
        { isActive: "desc" },
        { isLead: "desc" },
        { createdAt: "asc" },
      ],
    });

    // Determinar si el usuario puede remover cada abogado
    const lawyersWithPermissions = await Promise.all(
      lawyers.map(async (lawyer) => {
        const removePermission = await canRemoveLawyer(
          userId,
          userRole,
          caseId,
          lawyer.lawyerId
        );
        return {
          ...lawyer,
          canRemove: removePermission.canRemove,
        };
      })
    );

    return NextResponse.json({ lawyers: lawyersWithPermissions });
  } catch (error) {
    console.error("Error listing lawyers:", error);
    return NextResponse.json(
      { error: "Error al listar abogados" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases/[id]/lawyers - Agregar abogado al caso
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
    const userId = session.user.id;

    // Verificar acceso al caso
    const accessResult = await canAccessCase(userId, userRole, caseId);
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: "Sin acceso a este expediente" },
        { status: 403 }
      );
    }

    // Solo las partes del caso, admins o secretaría pueden agregar abogados
    const canAddLawyer = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(userRole) ||
      (await prisma.caseMember.findFirst({
        where: {
          caseId,
          userId,
          role: { in: ["DEMANDANTE", "DEMANDADO"] },
        },
      }));

    if (!canAddLawyer) {
      return NextResponse.json(
        { error: "Sin permisos para agregar abogados" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = addLawyerSchema.parse(body);

    // Obtener el caso para el centerId
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { centerId: true },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    // Buscar o crear el usuario abogado
    let lawyerUser = validatedData.lawyerId
      ? await prisma.user.findUnique({ where: { id: validatedData.lawyerId } })
      : await prisma.user.findUnique({ where: { email: validatedData.email } });

    if (!lawyerUser) {
      lawyerUser = await prisma.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          role: "ABOGADO",
          centerId: caseData.centerId,
        },
      });
    }

    // Verificar si ya está asignado con ese tipo de representación
    const existingAssignment = await prisma.caseLawyer.findFirst({
      where: {
        caseId,
        lawyerId: lawyerUser.id,
        representationType: validatedData.representationType,
        isActive: true,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "El abogado ya está asignado a este caso con ese tipo de representación" },
        { status: 400 }
      );
    }

    // Crear la asignación
    const lawyerAssignment = await prisma.caseLawyer.create({
      data: {
        caseId,
        lawyerId: lawyerUser.id,
        representationType: validatedData.representationType,
        representedMemberId: validatedData.representedMemberId || null,
        barAssociation: validatedData.barAssociation || null,
        caseNumber: validatedData.caseNumber || null,
        isActive: true,
        authorizedAt: new Date(),
      },
      include: {
        lawyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: caseData.centerId,
        caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "CaseLawyer",
        entityId: lawyerAssignment.id,
        meta: {
          lawyerName: lawyerUser.name,
          lawyerEmail: lawyerUser.email,
          representationType: validatedData.representationType,
        },
      },
    });

    return NextResponse.json({
      success: true,
      lawyer: lawyerAssignment,
      message: `Abogado ${lawyerUser.name} agregado al caso`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error adding lawyer:", error);
    return NextResponse.json(
      { error: "Error al agregar abogado" },
      { status: 500 }
    );
  }
}
