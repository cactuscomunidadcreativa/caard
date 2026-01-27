/**
 * CAARD - API de Documentos del Caso
 * GET /api/cases/[id]/documents - Listar documentos del caso
 * Solo usuarios con acceso al caso pueden ver los documentos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase } from "@/lib/case-authorization";
import { Role } from "@prisma/client";

/**
 * GET /api/cases/[id]/documents - Listar documentos del caso
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
        { error: "Sin acceso a los documentos de este expediente" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const documentType = searchParams.get("documentType");
    const status = searchParams.get("status") || "ACTIVE";

    // Construir filtros
    const whereClause: any = {
      caseId,
      status,
    };

    if (folderId) {
      whereClause.folderId = folderId;
    }

    if (documentType) {
      whereClause.documentType = documentType;
    }

    const documents = await prisma.caseDocument.findMany({
      where: whereClause,
      include: {
        folder: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { folder: { key: "asc" } },
        { createdAt: "desc" },
      ],
    });

    // Obtener las carpetas del caso para la navegación
    const folders = await prisma.caseFolder.findMany({
      where: { caseId },
      orderBy: { key: "asc" },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({
      documents,
      folders,
      total: documents.length,
    });
  } catch (error) {
    console.error("Error listing documents:", error);
    return NextResponse.json(
      { error: "Error al listar documentos" },
      { status: 500 }
    );
  }
}
