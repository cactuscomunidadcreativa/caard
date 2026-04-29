/**
 * CAARD - Utilidades CMS
 * Funciones para cargar contenido dinámico del CMS
 */

import { prisma } from "@/lib/prisma";

export interface CmsPageData {
  page: {
    id: string;
    title: string;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
    isPublished: boolean;
    sections: CmsSection[];
  } | null;
  hasCmsContent: boolean;
}

export interface CmsSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  bgColor: string | null;
  textColor: string | null;
  bgImage: string | null;
  padding: string | null;
  isVisible: boolean;
  sortOrder: number;
}

/**
 * Obtiene una página CMS por su slug
 * Retorna null si no existe o no está publicada
 */
export async function getCmsPage(slug: string): Promise<CmsPageData> {
  try {
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return { page: null, hasCmsContent: false };
    }

    const page = await prisma.cmsPage.findUnique({
      where: {
        centerId_slug: { centerId: center.id, slug },
      },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Si no hay página o no está publicada, retorna null
    if (!page || !page.isPublished) {
      return { page: null, hasCmsContent: false };
    }

    // Si hay página pero sin secciones, aún así tiene contenido CMS (vacío)
    const hasCmsContent = page.sections.length > 0;

    return {
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        isPublished: page.isPublished,
        sections: page.sections as CmsSection[],
      },
      hasCmsContent,
    };
  } catch (error) {
    console.error(`Error loading CMS page (${slug}):`, error);
    return { page: null, hasCmsContent: false };
  }
}

/**
 * Obtiene los anuncios activos para mostrar en la página
 */
export async function getActiveAnnouncements() {
  try {
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return [];

    const announcements = await prisma.cmsAnnouncement.findMany({
      where: {
        centerId: center.id,
        isActive: true,
        showOnHomepage: true,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: { sortOrder: "asc" },
    });

    return announcements;
  } catch (error) {
    console.error("Error loading announcements:", error);
    return [];
  }
}

/**
 * Devuelve la URL del hero image configurado en /admin/cms/hero-images
 * para un slug de página dado ("home", "arbitraje", "contacto", etc.).
 *
 * El admin guarda en cmsMedia un registro con folder="heroes" y
 * alt="hero-{slug}". La URL ya viene resuelta (proxy /api/cms/media/...
 * o /uploads/...) lista para usarse directamente como src.
 *
 * Devuelve null si no hay imagen configurada.
 */
export async function getHeroImage(slug: string): Promise<string | null> {
  try {
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return null;

    const media = await prisma.cmsMedia.findFirst({
      where: {
        centerId: center.id,
        folder: "heroes",
        alt: `hero-${slug}`,
      },
      select: { url: true },
    });

    return media?.url || null;
  } catch (error) {
    console.error(`Error loading hero image (${slug}):`, error);
    return null;
  }
}
