/**
 * CAARD - Página de Laudos
 * Biblioteca de laudos arbitrales publicados
 */

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LaudosClient } from "./laudos-client";

export const metadata: Metadata = {
  title: "Biblioteca de Laudos | CAARD",
  description:
    "Biblioteca de laudos arbitrales: busca, filtra y accede a laudos anonimizados para tu investigación.",
};

async function getLaudos() {
  const center = await prisma.center.findFirst({
    where: {},
  });

  if (!center) return { laudos: [], years: [], subjects: [] };

  const laudos = await prisma.laudo.findMany({
    where: {
      centerId: center.id,
      isPublished: true,
    },
    orderBy: [{ isFeatured: "desc" }, { year: "desc" }, { createdAt: "desc" }],
    include: {
      category: true,
    },
  });

  // Extract unique years and subjects for filters
  const years = Array.from(
    new Set(laudos.map((l) => l.year).filter(Boolean))
  ).sort((a, b) => (b ?? 0) - (a ?? 0)) as number[];

  const subjects = Array.from(
    new Set(laudos.map((l) => l.subject).filter(Boolean))
  ).sort() as string[];

  return {
    laudos: laudos.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      summary: l.summary,
      accessLevel: l.accessLevel,
      priceCents: l.priceCents,
      currency: l.currency,
      year: l.year,
      subject: l.subject,
      arbitrationType: l.arbitrationType,
      result: l.result,
      pageCount: l.pageCount,
      categoryName: l.category?.name || null,
    })),
    years,
    subjects,
  };
}

export default async function LaudosPage() {
  const data = await getLaudos();

  return (
    <LaudosClient
      laudos={data.laudos}
      years={data.years}
      subjects={data.subjects}
    />
  );
}
