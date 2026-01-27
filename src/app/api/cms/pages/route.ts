/**
 * CAARD CMS - API de Páginas
 * GET /api/cms/pages - Listar páginas
 * POST /api/cms/pages - Crear página
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  title: z.string().min(1).max(200),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");

    // Obtener centro por defecto
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const pages = await prisma.cmsPage.findMany({
      where: {
        centerId: center.id,
        ...(published === "true" ? { isPublished: true } : {}),
      },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { sections: true } },
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json({ error: "Error al obtener páginas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Obtener centro
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar slug único
    const existing = await prisma.cmsPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug: data.slug } },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe una página con ese slug" }, { status: 400 });
    }

    const page = await prisma.cmsPage.create({
      data: {
        centerId: center.id,
        slug: data.slug,
        title: data.title,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        isPublished: data.isPublished || false,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json({ error: "Error al crear página" }, { status: 500 });
  }
}
