/**
 * CAARD CMS - API de Página Individual
 * GET /api/cms/pages/[slug] - Obtener página
 * PUT /api/cms/pages/[slug] - Actualizar página
 * DELETE /api/cms/pages/[slug] - Eliminar página
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const editMode = searchParams.get("edit") === "true";

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const page = await prisma.cmsPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: {
        sections: {
          // En modo edición mostrar todas las secciones, de lo contrario solo visibles
          ...(editMode ? {} : { where: { isVisible: true } }),
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json({ error: "Error al obtener página" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validation = updatePageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const existingPage = await prisma.cmsPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
    }

    // Si se está publicando por primera vez
    const publishedAt = data.isPublished && !existingPage.isPublished
      ? new Date()
      : existingPage.publishedAt;

    const page = await prisma.cmsPage.update({
      where: { id: existingPage.id },
      data: {
        ...data,
        publishedAt,
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json({ error: "Error al actualizar página" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    await prisma.cmsPage.delete({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json({ error: "Error al eliminar página" }, { status: 500 });
  }
}
