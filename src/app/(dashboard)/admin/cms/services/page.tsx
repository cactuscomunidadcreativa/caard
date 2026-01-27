/**
 * CAARD - Gestión de Servicios
 * Permite editar los servicios que aparecen en el sitio web
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServicesManagementClient } from "./services-management-client";

export const metadata: Metadata = {
  title: "Servicios | CMS - CAARD",
  description: "Gestión de servicios del centro de arbitraje",
};

async function getServicesSections() {
  // Buscar páginas de servicios y páginas con secciones CARDS de servicios
  const pages = await prisma.cmsPage.findMany({
    where: {
      OR: [
        { slug: "servicios-ad-hoc" },
        { slug: "arbitraje-emergencia" },
        { slug: "arbitraje" },
        {
          sections: {
            some: {
              type: "CARDS",
              OR: [
                { title: { contains: "servicio", mode: "insensitive" } },
                { content: { path: ["type"], equals: "services" } },
              ],
            },
          },
        },
      ],
    },
    include: {
      sections: {
        where: { type: "CARDS" },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return pages;
}

export default async function ServicesManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  const pagesWithServices = await getServicesSections();

  return <ServicesManagementClient pagesWithServices={pagesWithServices} />;
}
