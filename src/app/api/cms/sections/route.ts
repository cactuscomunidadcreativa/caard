/**
 * CAARD CMS - API de Secciones
 * GET /api/cms/sections?pageId=xxx - Listar secciones de una página
 * POST /api/cms/sections - Crear sección
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sectionTypes = [
  // Principales
  "HERO", "SLIDER", "BANNER",
  // Contenido
  "TEXT", "CARDS", "FEATURE_GRID", "SPLIT_CONTENT",
  // Media
  "VIDEO", "GALLERY", "EMBED",
  // Interactivo
  "ACCORDION", "CTA", "STATS", "PRICING",
  // Personas
  "TEAM", "TESTIMONIALS",
  // Formularios
  "CONTACT_FORM", "DYNAMIC_FORM",
  // Otros
  "TIMELINE", "LOGO_CLOUD", "CUSTOM"
] as const;

const createSectionSchema = z.object({
  pageId: z.string().min(1),
  type: z.enum(sectionTypes),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  content: z.any().optional(), // JSON flexible
  bgColor: z.string().max(20).optional(),
  textColor: z.string().max(20).optional(),
  bgImage: z.string().url().optional(),
  padding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json({ error: "pageId requerido" }, { status: 400 });
    }

    const sections = await prisma.cmsSection.findMany({
      where: { pageId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json({ error: "Error al obtener secciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que la página existe
    const page = await prisma.cmsPage.findUnique({ where: { id: data.pageId } });
    if (!page) {
      return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
    }

    // Obtener el último sortOrder
    const lastSection = await prisma.cmsSection.findFirst({
      where: { pageId: data.pageId },
      orderBy: { sortOrder: "desc" },
    });

    const section = await prisma.cmsSection.create({
      data: {
        pageId: data.pageId,
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content || {},
        bgColor: data.bgColor,
        textColor: data.textColor,
        bgImage: data.bgImage,
        padding: data.padding,
        sortOrder: data.sortOrder ?? (lastSection?.sortOrder ?? 0) + 1,
        isVisible: data.isVisible ?? true,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json({ error: "Error al crear sección" }, { status: 500 });
  }
}
