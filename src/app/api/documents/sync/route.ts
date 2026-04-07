/**
 * CAARD - API de Sincronización con Google Drive
 * POST /api/documents/sync - Sincronizar documentos con Google Drive
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getGoogleWorkspaceService } from "@/lib/google-workspace";
import { google } from "googleapis";

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

    // Verificar que Google Workspace esté autorizado
    const workspace = getGoogleWorkspaceService();
    const configured = await workspace.ensureConfigured(true);

    if (!configured) {
      return NextResponse.json({
        success: false,
        error: "Google Workspace no autorizado",
        message: "Autorice Google Workspace desde /admin/integrations primero",
        needsConfiguration: true,
      }, { status: 400 });
    }

    // Cliente de Google Drive con OAuth ya autorizado
    const drive = google.drive({ version: "v3", auth: workspace.getAuthClient() });

    // Determinar carpeta raíz: usar la configurada o crear una "CAARD - Expedientes"
    let rootFolderId = center.driveRootFolderId;
    if (!rootFolderId) {
      // Crear carpeta raíz en Drive
      const rootFolder = await drive.files.create({
        requestBody: {
          name: `CAARD - Expedientes`,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id, webViewLink",
      });
      rootFolderId = rootFolder.data.id || null;

      if (rootFolderId) {
        await prisma.center.update({
          where: { id: centerId },
          data: { driveRootFolderId: rootFolderId },
        });
      }
    }

    if (!rootFolderId) {
      return NextResponse.json({
        success: false,
        error: "No se pudo crear la carpeta raíz en Drive",
      }, { status: 500 });
    }

    // Obtener casos que necesitan sincronización (sin carpeta de Drive)
    const casesToSync = await prisma.case.findMany({
      where: {
        centerId,
        driveFolderId: null,
      },
      include: {
        folders: true,
      },
      take: 50, // Limitar a 50 casos por request para no exceder timeout
    });

    const syncStats = {
      casesProcessed: 0,
      foldersCreated: 0,
      documentsUploaded: 0,
      errors: [] as string[],
    };

    for (const caseData of casesToSync) {
      try {
        // Crear carpeta del caso dentro de la raíz
        const caseFolder = await drive.files.create({
          requestBody: {
            name: caseData.code.replace(/[^a-zA-Z0-9-]/g, "_"),
            mimeType: "application/vnd.google-apps.folder",
            parents: [rootFolderId],
          },
          fields: "id, webViewLink",
        });

        const caseFolderId = caseFolder.data.id;
        if (!caseFolderId) continue;

        await prisma.case.update({
          where: { id: caseData.id },
          data: {
            driveFolderId: caseFolderId,
            driveFolderPath: `/${center.code}/${caseData.code}`,
          },
        });
        syncStats.foldersCreated++;

        // Crear subcarpetas
        for (const folder of caseData.folders) {
          if (!folder.driveFolderId) {
            const subFolder = await drive.files.create({
              requestBody: {
                name: folder.name,
                mimeType: "application/vnd.google-apps.folder",
                parents: [caseFolderId],
              },
              fields: "id",
            });

            if (subFolder.data.id) {
              await prisma.caseFolder.update({
                where: { id: folder.id },
                data: {
                  driveFolderId: subFolder.data.id,
                  drivePath: `/${center.code}/${caseData.code}/${folder.key}`,
                },
              });
              syncStats.foldersCreated++;
            }
          }
        }

        syncStats.casesProcessed++;
      } catch (error: any) {
        syncStats.errors.push(`Error en caso ${caseData.code}: ${error.message || error}`);
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
