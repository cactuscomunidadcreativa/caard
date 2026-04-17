/**
 * CAARD - Panel de Artículos/Blog
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArticlesClient } from "./articles-client";

export const metadata: Metadata = {
  title: "Artículos | CMS CAARD",
  description: "Gestiona los artículos y publicaciones del blog",
};

async function getArticles() {
  const center = await prisma.center.findFirst();
  if (!center) return { articles: [], total: 0 };

  const [articles, total] = await Promise.all([
    prisma.cmsArticle.findMany({
      where: { centerId: center.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.cmsArticle.count({ where: { centerId: center.id } }),
  ]);

  return { articles, total };
}

export default async function ArticlesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const { articles, total } = await getArticles();
  const published = articles.filter((a) => a.isPublished).length;
  const featured = articles.filter((a) => a.isFeatured).length;

  // Serializar las fechas para el componente cliente
  const serializedArticles = articles.map((article) => ({
    ...article,
    createdAt: article.createdAt,
  }));

  return (
    <ArticlesClient
      articles={serializedArticles}
      total={total}
      published={published}
      featured={featured}
    />
  );
}
