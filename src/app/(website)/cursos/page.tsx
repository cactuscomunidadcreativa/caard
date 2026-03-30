/**
 * CAARD - Página de Cursos
 * Muestra cursos publicados del catálogo
 */

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CursosClient } from "./cursos-client";

export const metadata: Metadata = {
  title: "Cursos | CAARD",
  description:
    "Cursos de formación en arbitraje: online, presenciales e híbridos ofrecidos por CAARD.",
};

async function getCourses() {
  const center = await prisma.center.findFirst({
    where: {},
  });

  if (!center) return { courses: [], categories: [] };

  const courses = await prisma.course.findMany({
    where: {
      centerId: center.id,
      status: "PUBLISHED",
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  // Extract unique categories from courses that have categoryId
  // (Course model has categoryId but no category relation defined in schema,
  //  so we just pass it as-is)
  const categories: string[] = [];

  return {
    courses: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      modality: c.modality,
      isFree: c.isFree,
      priceCents: c.priceCents,
      currency: c.currency,
      instructorName: c.instructorName,
      durationHours: c.durationHours,
      categoryId: c.categoryId,
    })),
    categories,
  };
}

export default async function CursosPage() {
  const data = await getCourses();

  return <CursosClient courses={data.courses} categories={data.categories} />;
}
