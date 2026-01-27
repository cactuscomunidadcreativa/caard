/**
 * CAARD - Página de Eventos
 * Muestra eventos del CMS con soporte para traducciones
 */

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EventosClient } from "./eventos-client";

export const metadata: Metadata = {
  title: "Eventos | CAARD",
  description: "Eventos, conferencias y capacitaciones en arbitraje organizados por CAARD.",
};

async function getEvents() {
  // Obtener el centro principal
  const center = await prisma.center.findFirst({
    where: {},
  });

  if (!center) return { upcoming: [], past: [] };

  const now = new Date();

  // Eventos próximos
  const upcoming = await prisma.cmsEvent.findMany({
    where: {
      centerId: center.id,
      isPublished: true,
      startDate: {
        gte: now,
      },
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      category: true,
    },
  });

  // Eventos pasados (últimos 10)
  const past = await prisma.cmsEvent.findMany({
    where: {
      centerId: center.id,
      isPublished: true,
      startDate: {
        lt: now,
      },
    },
    orderBy: {
      startDate: "desc",
    },
    take: 10,
    include: {
      category: true,
    },
  });

  return {
    upcoming: upcoming.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      coverImage: e.coverImage,
      type: e.type,
      category: e.category?.name || null,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() || null,
      location: e.location,
      isOnline: e.isOnline,
      onlineUrl: e.onlineUrl,
      registrationUrl: e.registrationUrl,
      maxAttendees: e.maxAttendees,
      currentAttendees: e.currentAttendees,
      price: e.price,
      currency: e.currency,
    })),
    past: past.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      coverImage: e.coverImage,
      type: e.type,
      category: e.category?.name || null,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() || null,
      location: e.location,
      isOnline: e.isOnline,
      price: e.price,
      currency: e.currency,
    })),
  };
}

export default async function EventosPage() {
  const events = await getEvents();

  return <EventosClient events={events} />;
}
