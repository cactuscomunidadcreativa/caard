/**
 * CAARD - API de Hero Images
 * Gestión de imágenes de cabecera por página
 * Usa el campo `folder` = "heroes" y `alt` = "hero-{slug}" para identificar
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Páginas que pueden tener hero image
const HERO_PAGES = [
  { slug: "home", label: "Inicio" },
  { slug: "arbitraje", label: "Arbitraje" },
  { slug: "eventos", label: "Eventos" },
  { slug: "cursos", label: "Cursos" },
  { slug: "tienda", label: "Tienda" },
  { slug: "laudos", label: "Biblioteca de Laudos" },
  { slug: "arbitros", label: "Nuestros Árbitros" },
  { slug: "blog", label: "Blog" },
  { slug: "contacto", label: "Contacto" },
  { slug: "presentacion", label: "Presentación" },
  { slug: "solicitud-arbitral", label: "Solicitud Arbitral" },
  { slug: "registro-arbitros", label: "Registro de Árbitros" },
  { slug: "arbitraje-emergencia", label: "Arbitraje de Emergencia" },
];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    // Buscar imágenes guardadas en CmsMedia con folder = "heroes"
    const heroMedia = await prisma.cmsMedia.findMany({
      where: {
        centerId: center.id,
        folder: "heroes",
      },
    });

    const heroMap: Record<string, string> = {};
    for (const media of heroMedia) {
      if (media.alt && media.url) {
        heroMap[media.alt] = media.url;
      }
    }

    const pages = HERO_PAGES.map((page) => ({
      ...page,
      imageUrl: heroMap[`hero-${page.slug}`] || null,
    }));

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching hero images:", error);
    return NextResponse.json({ error: "Error al obtener imágenes" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, imageUrl } = body;

    if (!slug || !imageUrl) {
      return NextResponse.json({ error: "slug e imageUrl son requeridos" }, { status: 400 });
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    // Buscar o crear el registro de media
    const existing = await prisma.cmsMedia.findFirst({
      where: {
        centerId: center.id,
        alt: `hero-${slug}`,
        folder: "heroes",
      },
    });

    if (existing) {
      await prisma.cmsMedia.update({
        where: { id: existing.id },
        data: { url: imageUrl },
      });
    } else {
      await prisma.cmsMedia.create({
        data: {
          centerId: center.id,
          filename: `hero-${slug}.jpg`,
          url: imageUrl,
          mimeType: "image/jpeg",
          size: 0,
          alt: `hero-${slug}`,
          folder: "heroes",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating hero image:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
