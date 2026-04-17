/**
 * CAARD - Panel de Eventos
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventsClient } from "./events-client";

export const metadata: Metadata = {
  title: "Eventos | CMS CAARD",
  description: "Gestiona los eventos y actividades del centro",
};

async function getEvents() {
  const center = await prisma.center.findFirst();
  if (!center) return { events: [], total: 0 };

  const [events, total] = await Promise.all([
    prisma.cmsEvent.findMany({
      where: { centerId: center.id },
      orderBy: { startDate: "desc" },
      include: {
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.cmsEvent.count({ where: { centerId: center.id } }),
  ]);

  return { events, total };
}

export default async function EventsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const { events, total } = await getEvents();

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.startDate) > now).length;
  const published = events.filter((e) => e.isPublished).length;
  const online = events.filter((e) => e.isOnline).length;

  return (
    <EventsClient
      events={events}
      total={total}
      upcoming={upcoming}
      published={published}
      online={online}
    />
  );
}
