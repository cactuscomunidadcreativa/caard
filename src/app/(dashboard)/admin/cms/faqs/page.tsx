/**
 * CAARD - Gestión de Preguntas Frecuentes (FAQs)
 * Permite editar las preguntas frecuentes del sitio web
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FAQsManagementClient } from "./faqs-management-client";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | CMS - CAARD",
  description: "Gestión de preguntas frecuentes del centro de arbitraje",
};

async function getFAQsSections() {
  // Buscar todas las páginas que tienen secciones de tipo ACCORDION
  const pages = await prisma.cmsPage.findMany({
    where: {
      sections: {
        some: {
          type: "ACCORDION",
        },
      },
    },
    include: {
      sections: {
        where: { type: "ACCORDION" },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return pages;
}

export default async function FAQsManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  const pagesWithFAQs = await getFAQsSections();

  // Serializar Date objects para evitar error de hidratación en client components
  const serialized = JSON.parse(JSON.stringify(pagesWithFAQs));

  return <FAQsManagementClient pagesWithFAQs={serialized} />;
}
