/**
 * CAARD - Gestión de Testimonios
 * Permite editar los testimonios que aparecen en el sitio web
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TestimonialsManagementClient } from "./testimonials-management-client";

export const metadata: Metadata = {
  title: "Testimonios | CMS - CAARD",
  description: "Gestión de testimonios del centro de arbitraje",
};

async function getTestimonialsSections() {
  // Buscar todas las páginas que tienen secciones de tipo TESTIMONIALS
  const pages = await prisma.cmsPage.findMany({
    where: {
      sections: {
        some: {
          type: "TESTIMONIALS",
        },
      },
    },
    include: {
      sections: {
        where: { type: "TESTIMONIALS" },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return pages;
}

export default async function TestimonialsManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  const pagesWithTestimonials = await getTestimonialsSections();

  return <TestimonialsManagementClient pagesWithTestimonials={pagesWithTestimonials} />;
}
