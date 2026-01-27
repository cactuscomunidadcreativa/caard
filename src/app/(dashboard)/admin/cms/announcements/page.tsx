/**
 * CAARD - Panel de Avisos/Anuncios
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnnouncementsClient } from "./announcements-client";

export const metadata: Metadata = {
  title: "Avisos | CMS CAARD",
  description: "Gestiona los avisos y anuncios del sitio",
};

async function getAnnouncements() {
  const center = await prisma.center.findFirst();
  if (!center) return { announcements: [], total: 0 };

  const [announcements, total] = await Promise.all([
    prisma.cmsAnnouncement.findMany({
      where: { centerId: center.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.cmsAnnouncement.count({ where: { centerId: center.id } }),
  ]);

  return { announcements, total };
}

export default async function AnnouncementsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { announcements, total } = await getAnnouncements();

  const now = new Date();
  const active = announcements.filter((a) => {
    if (!a.isActive) return false;
    if (a.endDate && new Date(a.endDate) < now) return false;
    return true;
  }).length;

  const onHomepage = announcements.filter((a) => a.showOnHomepage && a.isActive).length;
  const asBanner = announcements.filter((a) => a.showAsBanner && a.isActive).length;

  return (
    <AnnouncementsClient
      announcements={announcements}
      total={total}
      active={active}
      onHomepage={onHomepage}
      asBanner={asBanner}
    />
  );
}
