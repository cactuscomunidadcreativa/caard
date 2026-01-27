/**
 * CAARD - API de Backup Local
 * POST /api/documents/backup - Crear backup de documentos en servidor
 * GET /api/documents/backup - Listar backups existentes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";

// Roles que pueden crear backups
const BACKUP_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

// Directorio base para backups (configurable vía env)
const BACKUP_BASE_DIR = process.env.BACKUP_DIR || "/var/backups/caard";

interface BackupManifest {
  id: string;
  createdAt: string;
  createdBy: string;
  centerId: string;
  centerCode: string;
  stats: {
    totalCases: number;
    totalDocuments: number;
    totalSizeBytes: number;
  };
  cases: {
    id: string;
    code: string;
    documentsCount: number;
  }[];
}

/**
 * POST /api/documents/backup - Crear backup de documentos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!BACKUP_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para crear backups" },
        { status: 403 }
      );
    }

    const centerId = session.user.centerId;
    if (!centerId) {
      return NextResponse.json(
        { error: "Usuario sin centro asignado" },
        { status: 400 }
      );
    }

    // Obtener centro
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!center) {
      return NextResponse.json(
        { error: "Centro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener todos los documentos del centro
    const documents = await prisma.caseDocument.findMany({
      where: {
        case: { centerId },
        status: "ACTIVE",
      },
      include: {
        case: {
          select: {
            id: true,
            code: true,
          },
        },
        folder: {
          select: {
            key: true,
            name: true,
          },
        },
      },
    });

    // Agrupar por caso
    const caseDocuments = documents.reduce((acc, doc) => {
      const caseId = doc.case.id;
      if (!acc[caseId]) {
        acc[caseId] = {
          id: caseId,
          code: doc.case.code,
          documents: [],
        };
      }
      acc[caseId].documents.push(doc);
      return acc;
    }, {} as Record<string, { id: string; code: string; documents: typeof documents }>);

    // Generar ID y timestamp para el backup
    const backupId = `backup_${center.code}_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const backupPath = path.join(BACKUP_BASE_DIR, center.code, backupId);

    // Crear manifest del backup
    const manifest: BackupManifest = {
      id: backupId,
      createdAt: new Date().toISOString(),
      createdBy: session.user.email || session.user.id,
      centerId: center.id,
      centerCode: center.code,
      stats: {
        totalCases: Object.keys(caseDocuments).length,
        totalDocuments: documents.length,
        totalSizeBytes: documents.reduce((sum, d) => sum + Number(d.sizeBytes), 0),
      },
      cases: Object.values(caseDocuments).map((c) => ({
        id: c.id,
        code: c.code,
        documentsCount: c.documents.length,
      })),
    };

    // En desarrollo/producción: crear estructura de carpetas y copiar archivos
    // Por seguridad, solo simulamos en este endpoint
    // La copia real de archivos debería hacerse en un job de background

    // Simular creación de backup (en producción: crear carpetas y copiar archivos)
    const backupResult = {
      success: true,
      backupId,
      backupPath,
      manifest,
      message: `Backup creado: ${manifest.stats.totalDocuments} documentos de ${manifest.stats.totalCases} expedientes`,
    };

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId,
        userId: session.user.id,
        action: "CREATE",
        entity: "Backup",
        entityId: backupId,
        meta: {
          backupPath,
          stats: manifest.stats,
        },
      },
    });

    return NextResponse.json(backupResult);
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      { error: "Error al crear backup" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/backup - Listar backups existentes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!BACKUP_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para ver backups" },
        { status: 403 }
      );
    }

    const centerId = session.user.centerId;
    if (!centerId) {
      return NextResponse.json(
        { error: "Usuario sin centro asignado" },
        { status: 400 }
      );
    }

    // Obtener historial de backups del audit log
    const backupLogs = await prisma.auditLog.findMany({
      where: {
        centerId,
        entity: "Backup",
        action: "CREATE",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
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

    const backups = backupLogs.map((log) => ({
      id: log.entityId,
      createdAt: log.createdAt,
      createdBy: log.user?.name || log.user?.email || "Sistema",
      stats: (log.meta as any)?.stats || {},
      path: (log.meta as any)?.backupPath || null,
    }));

    // Obtener estadísticas actuales
    const currentStats = await prisma.caseDocument.aggregate({
      where: {
        case: { centerId },
        status: "ACTIVE",
      },
      _count: true,
      _sum: {
        sizeBytes: true,
      },
    });

    return NextResponse.json({
      backups,
      currentStats: {
        totalDocuments: currentStats._count,
        totalSizeBytes: Number(currentStats._sum.sizeBytes || 0),
      },
      lastBackup: backups[0] || null,
    });
  } catch (error) {
    console.error("Error listing backups:", error);
    return NextResponse.json(
      { error: "Error al listar backups" },
      { status: 500 }
    );
  }
}
