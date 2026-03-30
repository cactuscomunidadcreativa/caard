/**
 * CAARD - Página de Tienda
 * Muestra productos publicados del catálogo
 */

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TiendaClient } from "./tienda-client";

export const metadata: Metadata = {
  title: "Tienda | CAARD",
  description:
    "Tienda de productos y servicios para profesionales del arbitraje.",
};

async function getProducts() {
  const center = await prisma.center.findFirst({
    where: {},
  });

  if (!center) return { products: [], categories: [] };

  const [products, categories] = await Promise.all([
    prisma.storeProduct.findMany({
      where: {
        centerId: center.id,
        isPublished: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
      },
    }),
    prisma.storeCategory.findMany({
      where: { centerId: center.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      coverImage: p.coverImage,
      type: p.type,
      priceCents: p.priceCents,
      comparePriceCents: p.comparePriceCents,
      currency: p.currency,
      categoryName: p.category?.name || null,
      categoryId: p.categoryId,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
  };
}

export default async function TiendaPage() {
  const data = await getProducts();

  return (
    <TiendaClient products={data.products} categories={data.categories} />
  );
}
