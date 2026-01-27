/**
 * CAARD CMS - API de Avisos/Anuncios
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const announcementTypes = ["INFO", "WARNING", "SUCCESS", "ERROR", "NEWS"] as const;

const createAnnouncementSchema = z.object({
  type: z.enum(announcementTypes).optional(),
  title: z.string().min(1).max(200),
  content: z.string().max(1000).optional(),
  linkUrl: z.string().url().optional(),
  linkText: z.string().max(50).optional(),
  showOnHomepage: z.boolean().optional(),
  showOnAllPages: z.boolean().optional(),
  showAsPopup: z.boolean().optional(),
  showAsBanner: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active") === "true";
    const homepage = searchParams.get("homepage") === "true";

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const now = new Date();
    const where: any = { centerId: center.id };

    if (active) {
      where.isActive = true;
      where.AND = [
        { startDate: { lte: now } },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ];
    }

    if (homepage) {
      where.showOnHomepage = true;
    }

    const announcements = await prisma.cmsAnnouncement.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Error al obtener avisos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const announcement = await prisma.cmsAnnouncement.create({
      data: {
        centerId: center.id,
        type: data.type || "INFO",
        title: data.title,
        content: data.content,
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        showOnHomepage: data.showOnHomepage ?? true,
        showOnAllPages: data.showOnAllPages ?? false,
        showAsPopup: data.showAsPopup ?? false,
        showAsBanner: data.showAsBanner ?? true,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Error al crear aviso" }, { status: 500 });
  }
}
