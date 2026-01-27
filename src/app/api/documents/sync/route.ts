/**
 * CAARD - API de Sincronización con Google Drive
 * POST /api/documents/sync - Sincronizar documentos con Google Drive
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Roles que pueden sincronizar
const SYNC_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (!SYNC_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para sincronizar" },
        { status: 403 }
      );
    }

    // Obtener centro del usuario
    const centerId = session.user.centerId;
    if (!centerId) {
      return NextResponse.json(
        { error: "Usuario sin centro asignado" },
        { status: 400 }
      );
    }

    // Obtener configuración del centro
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: {
        id: true,
        code: true,
        driveRootFolderId: true,
        driveSharedDriveId: true,
      },
    });

    if (!center) {
      return NextResponse.json(
        { error: "Centro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar configuración de Google Drive
    if (!center.driveRootFolderId) {
      return NextResponse.json({
        success: false,
        error: "Google Drive no configurado",
        message: "Configure la carpeta raíz de Google Drive en la configuración del centro",
        needsConfiguration: true,
      }, { status: 400 });
    }

    // Obtener casos que necesitan sincronización
    const casesToSync = await prisma.case.findMany({
      where: {
        centerId,
        OR: [
          { driveFolderId: null },
          {
            documents: {
              some: {
                driveFileId: "",
              },
            },
          },
        ],
      },
      include: {
        folders: true,
        documents: {
          where: {
            status: "ACTIVE",
          },
        },
      },
    });

    // Estadísticas de sincronización
    const syncStats = {
      casesProcessed: 0,
      foldersCreated: 0,
      documentsUploaded: 0,
      errors: [] as string[],
    };

    // TODO: Integración real con Google Drive API
    // Por ahora, simulamos la sincronización
    for (const caseData of casesToSync) {
      try {
        // Simular creación de carpeta en Drive para el caso
        if (!caseData.driveFolderId) {
          // En producción: crear carpeta en Google Drive
          // const driveFolder = await googleDrive.createFolder(caseData.code, center.driveRootFolderId);

          await prisma.case.update({
            where: { id: caseData.id },
            data: {
              driveFolderId: `drive_folder_${caseData.id}`, // Simulated ID
              driveFolderPath: `/${center.code}/${caseData.code}`,
            },
          });
          syncStats.foldersCreated++;
        }

        // Simular creación de subcarpetas
        for (const folder of caseData.folders) {
          if (!folder.driveFolderId) {
            await prisma.caseFolder.update({
              where: { id: folder.id },
              data: {
                driveFolderId: `drive_subfolder_${folder.id}`,
                drivePath: `/${center.code}/${caseData.code}/${folder.key}`,
              },
            });
            syncStats.foldersCreated++;
          }
        }

        syncStats.casesProcessed++;
      } catch (error) {
        syncStats.errors.push(`Error en caso ${caseData.code}: ${error}`);
      }
    }

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "DriveSync",
        meta: {
          casesProcessed: syncStats.casesProcessed,
          foldersCreated: syncStats.foldersCreated,
          documentsUploaded: syncStats.documentsUploaded,
          errors: syncStats.errors.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sincronización completada",
      stats: syncStats,
    });
  } catch (error) {
    console.error("Error syncing with Drive:", error);
    return NextResponse.json(
      { error: "Error al sincronizar con Google Drive" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/sync - Obtener estado de sincronización
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const centerId = session.user.centerId;
    if (!centerId) {
      return NextResponse.json({ error: "Sin centro asignado" }, { status: 400 });
    }

    // Obtener estadísticas de sincronización
    const [totalDocs, syncedDocs, pendingDocs, center] = await Promise.all([
      prisma.caseDocument.count({
        where: { case: { centerId }, status: "ACTIVE" },
      }),
      prisma.caseDocument.count({
        where: {
          case: { centerId },
          status: "ACTIVE",
          driveFileId: { not: "" },
        },
      }),
      prisma.caseDocument.count({
        where: {
          case: { centerId },
          status: "ACTIVE",
          driveFileId: "",
        },
      }),
      prisma.center.findUnique({
        where: { id: centerId },
        select: {
          driveRootFolderId: true,
          driveSharedDriveId: true,
        },
      }),
    ]);

    // Obtener última sincronización
    const lastSync = await prisma.auditLog.findFirst({
      where: {
        centerId,
        entity: "DriveSync",
        action: "UPDATE",
      },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        meta: true,
      },
    });

    return NextResponse.json({
      isConfigured: !!center?.driveRootFolderId,
      totalDocuments: totalDocs,
      syncedDocuments: syncedDocs,
      pendingDocuments: pendingDocs,
      syncPercentage: totalDocs > 0 ? Math.round((syncedDocs / totalDocs) * 100) : 100,
      lastSync: lastSync?.createdAt || null,
      lastSyncStats: lastSync?.meta || null,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { error: "Error al obtener estado de sincronización" },
      { status: 500 }
    );
  }
}
