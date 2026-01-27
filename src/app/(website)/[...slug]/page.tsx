/**
 * CAARD - Página dinámica del sitio web
 * Renderiza páginas del CMS según el slug
 */

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SectionRenderer } from "@/components/cms/section-renderer";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function getPage(slugArray: string[]) {
  const slug = slugArray.join("/") || "inicio";

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) return null;

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

  return page;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return { title: "Página no encontrada | CAARD" };
  }

  return {
    title: page.metaTitle || `${page.title} | CAARD`,
    description: page.metaDescription || undefined,
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page || !page.isPublished) {
    notFound();
  }

  return (
    <>
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}

      {page.sections.length === 0 && (
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
          <p className="text-muted-foreground">Esta página no tiene contenido todavía.</p>
        </div>
      )}
    </>
  );
}
