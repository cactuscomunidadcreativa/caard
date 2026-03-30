/**
 * CAARD - Gestión de Sedes
 * Permite editar las sedes/ubicaciones que aparecen en el sitio web
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LocationsManagementClient } from "./locations-management-client";

export const metadata: Metadata = {
  title: "Sedes | CMS - CAARD",
  description: "Gestión de sedes del centro de arbitraje",
};

async function getLocationsSections() {
  // Buscar la página de sedes y páginas con secciones de tipo CARDS para ubicaciones
  const pages = await prisma.cmsPage.findMany({
    where: {
      OR: [
        { slug: "sedes" },
        { slug: "contacto" },
        {
          sections: {
            some: {
              type: "CARDS",
              title: {
                contains: "sede",
                mode: "insensitive",
              },
            },
          },
        },
      ],
    },
    include: {
      sections: {
        where: {
          OR: [
            { type: "CARDS" },
            { type: "EMBED" },
          ],
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return pages;
}

export default async function LocationsManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  const pagesWithLocations = await getLocationsSections();

  // Serializar Date objects para evitar error de hidratación en client components
  const serialized = JSON.parse(JSON.stringify(pagesWithLocations));

  return <LocationsManagementClient pagesWithLocations={serialized} />;
}
