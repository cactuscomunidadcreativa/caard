/**
 * CAARD - Página de Artículo Individual
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleClient } from "./article-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const center = await prisma.center.findFirst({
    where: {},
  });

  if (!center) return { title: "Artículo no encontrado" };

  const article = await prisma.cmsArticle.findUnique({
    where: {
      centerId_slug: {
        centerId: center.id,
        slug,
      },
    },
  });

  if (!article) return { title: "Artículo no encontrado" };

  return {
    title: `${article.title} | Blog CAARD`,
    description: article.excerpt || `Lee ${article.title} en el blog de CAARD`,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

async function getArticle(slug: string) {
  const center = await prisma.center.findFirst({
    where: {},
  });

  if (!center) return null;

  const article = await prisma.cmsArticle.findUnique({
    where: {
      centerId_slug: {
        centerId: center.id,
        slug,
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: true,
    },
  });

  if (!article || !article.isPublished) return null;

  // Incrementar contador de vistas
  await prisma.cmsArticle.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  });

  // Artículos relacionados (misma categoría)
  const related = await prisma.cmsArticle.findMany({
    where: {
      centerId: center.id,
      isPublished: true,
      id: { not: article.id },
      categoryId: article.categoryId,
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImage: article.coverImage,
      category: article.category?.name || null,
      tags: article.tags,
      publishedAt: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
      viewCount: article.viewCount + 1,
      author: article.author
        ? {
            name: article.author.name,
            image: article.author.image,
          }
        : null,
    },
    related: related.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      coverImage: a.coverImage,
      publishedAt: a.publishedAt?.toISOString() || a.createdAt.toISOString(),
      author: a.author
        ? {
            name: a.author.name,
            image: a.author.image,
          }
        : null,
    })),
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const data = await getArticle(slug);

  if (!data) {
    notFound();
  }

  return <ArticleClient data={data} />;
}
