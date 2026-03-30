/**
 * CAARD - Renderizador público de Landing Pages
 * URL: /l/[slug] (URL corta para marketing)
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SectionRenderer } from "@/components/cms/section-renderer";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) return {};

  const page = await prisma.landingPage.findUnique({
    where: { centerId_slug: { centerId: center.id, slug } },
  });

  if (!page || !page.isPublished) return {};

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      images: page.ogImage ? [page.ogImage] : undefined,
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) notFound();

  const page = await prisma.landingPage.findUnique({
    where: { centerId_slug: { centerId: center.id, slug } },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page || !page.isPublished) notFound();

  // Verificar expiración
  if (page.expiresAt && page.expiresAt < new Date()) notFound();

  return (
    <div className="min-h-screen">
      {page.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section as any}
        />
      ))}
    </div>
  );
}
