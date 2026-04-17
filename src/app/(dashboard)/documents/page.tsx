/**
 * CAARD - Página de Documentos
 * Gestión de documentos con sincronización Google Drive y backup local
 */

import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getAccessibleCaseIds, hasFullAccess } from "@/lib/case-authorization";
import { DocumentsClient } from "./documents-client";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Documentos | CAARD",
  description: "Gestión de documentos del sistema de arbitraje",
};

async function getDocumentsData(userId: string, userRole: Role, centerId?: string) {
  // Obtener casos accesibles según el rol
  const isFullAccess = hasFullAccess(userRole);

  let caseFilter: any = {};

  if (!isFullAccess) {
    const accessibleCaseIds = await getAccessibleCaseIds(userId, userRole);
    if (accessibleCaseIds.length === 0) {
      return { documents: [], cases: [], folders: [], stats: { total: 0, byType: {} } };
    }
    caseFilter = { id: { in: accessibleCaseIds } };
  }

  if (centerId) {
    caseFilter.centerId = centerId;
  }

  // Obtener casos con sus documentos
  const cases = await prisma.case.findMany({
    where: caseFilter,
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      driveFolderId: true,
      folders: {
        select: {
          id: true,
          key: true,
          name: true,
          parentId: true,
          driveFolderId: true,
          sortOrder: true,
          _count: {
            select: { documents: true },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: {
        select: { documents: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Obtener documentos recientes
  const recentDocuments = await prisma.caseDocument.findMany({
    where: {
      case: caseFilter,
      status: "ACTIVE",
    },
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
    take: 20,
  });

  // Estadísticas
  const stats = await prisma.caseDocument.groupBy({
    by: ["documentType"],
    where: {
      case: caseFilter,
      status: "ACTIVE",
    },
    _count: true,
  });

  const totalDocs = await prisma.caseDocument.count({
    where: {
      case: caseFilter,
      status: "ACTIVE",
    },
  });

  return {
    documents: recentDocuments,
    cases,
    stats: {
      total: totalDocs,
      byType: stats.reduce((acc, s) => {
        acc[s.documentType] = s._count;
        return acc;
      }, {} as Record<string, number>),
    },
  };
}

export default async function DocumentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getDocumentsData(
    session.user.id,
    session.user.role as Role,
    session.user.centerId || undefined
  );

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DocumentsClient
        initialDocuments={data.documents}
        cases={data.cases}
        stats={data.stats}
        userRole={session.user.role as Role}
      />
    </Suspense>
  );
}
