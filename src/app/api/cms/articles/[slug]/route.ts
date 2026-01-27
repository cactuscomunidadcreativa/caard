/**
 * CAARD CMS - API de Artículo Individual
 * GET, PUT, DELETE para un artículo específico
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateArticleSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).optional(),
  coverImage: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// GET - Obtener un artículo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const article = await prisma.cmsArticle.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Error al obtener artículo" }, { status: 500 });
  }
}

// PUT - Actualizar un artículo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validation = updateArticleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar que existe
    const existing = await prisma.cmsArticle.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }

    const data = validation.data;

    // Si se está publicando por primera vez, establecer fecha de publicación
    const updateData: any = { ...data };
    if (data.isPublished && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const article = await prisma.cmsArticle.update({
      where: { centerId_slug: { centerId: center.id, slug } },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Error al actualizar artículo" }, { status: 500 });
  }
}

// DELETE - Eliminar un artículo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar que existe
    const existing = await prisma.cmsArticle.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }

    await prisma.cmsArticle.delete({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Error al eliminar artículo" }, { status: 500 });
  }
}
