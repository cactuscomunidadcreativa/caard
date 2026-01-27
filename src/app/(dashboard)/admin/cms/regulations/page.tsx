/**
 * CAARD - Gestión de Reglamentos
 * Permite editar los reglamentos y documentos normativos del sitio web
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegulationsManagementClient } from "./regulations-management-client";

export const metadata: Metadata = {
  title: "Reglamentos | CMS - CAARD",
  description: "Gestión de reglamentos del centro de arbitraje",
};

async function getRegulationsSections() {
  // Buscar la página de reglamentos y páginas con secciones de documentos
  const pages = await prisma.cmsPage.findMany({
    where: {
      OR: [
        { slug: "reglamentos" },
        {
          sections: {
            some: {
              OR: [
                { type: "ACCORDION" },
                { type: "CARDS" },
                { type: "TEXT" },
              ],
              title: {
                contains: "reglament",
                mode: "insensitive",
              },
            },
          },
        },
      ],
    },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return pages;
}

export default async function RegulationsManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  const pagesWithRegulations = await getRegulationsSections();

  return <RegulationsManagementClient pagesWithRegulations={pagesWithRegulations} />;
}
