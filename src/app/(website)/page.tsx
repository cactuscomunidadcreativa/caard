/**
 * CAARD - Página de Inicio
 */

import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { AlertCircle } from "lucide-react";
import { HomePageClient } from "./home-client";

export const metadata: Metadata = {
  title: "CAARD | Centro de Arbitraje y Resolución de Disputas",
  description: "Centro de Administración de Arbitrajes y Resolución de Disputas. Impulsar el arbitraje como medio eficaz para la solución de controversias.",
};

async function getHomePageData() {
  try {
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return { page: null, announcements: [] };

    const [page, announcements] = await Promise.all([
      prisma.cmsPage.findUnique({
        where: { centerId_slug: { centerId: center.id, slug: "inicio" } },
        include: {
          sections: {
            where: { isVisible: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
      prisma.cmsAnnouncement.findMany({
        where: {
          centerId: center.id,
          isActive: true,
          showOnHomepage: true,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return { page, announcements };
  } catch {
    return { page: null, announcements: [] };
  }
}

export default async function HomePage() {
  const { page, announcements } = await getHomePageData();
  const hasCMSContent = page && page.sections.length > 0;

  return (
    <>
      {/* Avisos */}
      {announcements.length > 0 && (
        <div className="bg-[#D66829] text-white">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-3 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{announcement.title}</span>
                {announcement.content && (
                  <span className="hidden md:inline">- {announcement.content}</span>
                )}
                {announcement.linkUrl && (
                  <Link href={announcement.linkUrl} className="underline hover:no-underline">
                    {announcement.linkText || "Ver más"}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Si hay contenido CMS, mostrarlo */}
      {hasCMSContent ? (
        <>
          {page.sections.map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}
        </>
      ) : (
        /* Contenido estático de fallback con traducciones */
        <HomePageClient />
      )}
    </>
  );
}
