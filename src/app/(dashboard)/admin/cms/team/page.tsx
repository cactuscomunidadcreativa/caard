/**
 * CAARD - Gestión del Equipo del Centro
 * Permite editar los miembros del equipo que aparecen en el sitio web
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamManagementClient } from "./team-management-client";

export const metadata: Metadata = {
  title: "Equipo del Centro | CMS - CAARD",
  description: "Gestión del equipo y personal del centro de arbitraje",
};

async function getTeamSections() {
  // Buscar todas las páginas que tienen secciones de tipo TEAM
  const pages = await prisma.cmsPage.findMany({
    where: {
      sections: {
        some: {
          type: "TEAM",
        },
      },
    },
    include: {
      sections: {
        where: { type: "TEAM" },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return pages;
}

export default async function TeamManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  const pagesWithTeam = await getTeamSections();

  return <TeamManagementClient pagesWithTeam={pagesWithTeam} />;
}
