/**
 * CAARD - Página del Blog
 * Muestra artículos del CMS con soporte para traducciones
 */

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BlogClient } from "./blog-client";

export const metadata: Metadata = {
  title: "Blog | CAARD",
  description: "Artículos, noticias y análisis sobre arbitraje y resolución de disputas.",
};

async function getArticles() {
  // Obtener el centro principal
  const center = await prisma.center.findFirst({
    where: {},
  });

  if (!center) return { articles: [], featured: [], categories: [] };

  // Artículos publicados
  const articles = await prisma.cmsArticle.findMany({
    where: {
      centerId: center.id,
      isPublished: true,
    },
    orderBy: {
      publishedAt: "desc",
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

  // Artículos destacados
  const featured = await prisma.cmsArticle.findMany({
    where: {
      centerId: center.id,
      isPublished: true,
      isFeatured: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 3,
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

  // Categorías con conteo
  const categories = await prisma.cmsCategory.findMany({
    where: {
      centerId: center.id,
    },
    include: {
      _count: {
        select: {
          articles: {
            where: { isPublished: true },
          },
        },
      },
    },
  });

  return {
    articles: articles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      coverImage: a.coverImage,
      content: a.content,
      category: a.category?.name || null,
      categorySlug: a.category?.slug || null,
      tags: a.tags,
      isFeatured: a.isFeatured,
      publishedAt: a.publishedAt?.toISOString() || a.createdAt.toISOString(),
      viewCount: a.viewCount,
      author: a.author
        ? {
            name: a.author.name,
            image: a.author.image,
          }
        : null,
    })),
    featured: featured.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      coverImage: a.coverImage,
      content: a.content,
      category: a.category?.name || null,
      categorySlug: a.category?.slug || null,
      tags: a.tags,
      isFeatured: a.isFeatured,
      publishedAt: a.publishedAt?.toISOString() || a.createdAt.toISOString(),
      viewCount: a.viewCount,
      author: a.author
        ? {
            name: a.author.name,
            image: a.author.image,
          }
        : null,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      color: c.color,
      count: c._count.articles,
    })),
  };
}

export default async function BlogPage() {
  const data = await getArticles();

  return <BlogClient data={data} />;
}
