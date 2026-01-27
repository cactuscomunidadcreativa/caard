/**
 * CAARD - API de Documentos General
 * GET /api/documents - Listar todos los documentos accesibles
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleCaseIds, hasFullAccess } from "@/lib/case-authorization";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;
    const isFullAccess = hasFullAccess(userRole);

    // Construir filtro de casos accesibles
    let caseFilter: any = {};

    if (!isFullAccess) {
      const accessibleCaseIds = await getAccessibleCaseIds(userId, userRole);
      if (accessibleCaseIds.length === 0) {
        return NextResponse.json({ documents: [], total: 0 });
      }
      caseFilter = { id: { in: accessibleCaseIds } };
    }

    if (session.user.centerId) {
      caseFilter.centerId = session.user.centerId;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search");
    const documentType = searchParams.get("documentType");
    const caseId = searchParams.get("caseId");

    // Construir where clause
    const whereClause: any = {
      case: caseFilter,
      status: "ACTIVE",
    };

    if (search) {
      whereClause.originalFileName = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (documentType) {
      whereClause.documentType = documentType;
    }

    if (caseId) {
      whereClause.caseId = caseId;
    }

    const [documents, total] = await Promise.all([
      prisma.caseDocument.findMany({
        where: whereClause,
        include: {
          case: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.caseDocument.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      documents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error listing documents:", error);
    return NextResponse.json(
      { error: "Error al listar documentos" },
      { status: 500 }
    );
  }
}
