/**
 * CAARD - API para configuración de Google Drive
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const configSchema = z.object({
  rootFolderId: z.string().min(1),
  sharedDriveId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const centerId = session.user.centerId;
    if (!centerId) {
      return NextResponse.json({ error: "Sin centro asignado" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = configSchema.parse(body);

    // Actualizar configuración del centro
    const center = await prisma.center.update({
      where: { id: centerId },
      data: {
        driveRootFolderId: validatedData.rootFolderId,
        driveSharedDriveId: validatedData.sharedDriveId || null,
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "GoogleDriveConfig",
        meta: {
          rootFolderId: validatedData.rootFolderId,
          sharedDriveId: validatedData.sharedDriveId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        rootFolderId: center.driveRootFolderId,
        sharedDriveId: center.driveSharedDriveId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
