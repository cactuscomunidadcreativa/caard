/**
 * CAARD CMS - API de Media Library
 * =================================
 * Lista y gestiona archivos subidos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// GET - Listar medios
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const mimeType = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Obtener centro del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { centerId: true },
    });

    let centerId = user?.centerId;

    if (!centerId) {
      const defaultCenter = await prisma.center.findFirst({
        where: { code: "CAARD" },
      });
      centerId = defaultCenter?.id;
    }

    if (!centerId) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    // Construir filtros
    const where: any = { centerId };

    if (folder) {
      where.folder = folder;
    }

    if (mimeType) {
      where.mimeType = { startsWith: mimeType };
    }

    // Obtener medios
    const [media, total] = await Promise.all([
      prisma.cmsMedia.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.cmsMedia.count({ where }),
    ]);

    return NextResponse.json(
      media.map((m) => ({
        id: m.id,
        url: m.url,
        filename: m.filename,
        mimeType: m.mimeType,
        size: m.size,
        width: m.width,
        height: m.height,
        folder: m.folder,
        createdAt: m.createdAt.toISOString(),
        uploadedBy: m.uploadedBy?.name,
      }))
    );
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Error al obtener medios" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un medio
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo admin puede eliminar
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    // Buscar medio
    const media = await prisma.cmsMedia.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Medio no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar archivo físico
    const filepath = path.join(process.cwd(), "public", media.url);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    // Eliminar de base de datos
    await prisma.cmsMedia.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Error al eliminar medio" },
      { status: 500 }
    );
  }
}
