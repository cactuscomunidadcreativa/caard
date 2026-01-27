/**
 * CAARD CMS - API de Eventos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventTypes = ["WEBINAR", "CONFERENCE", "WORKSHOP", "COURSE", "SEMINAR", "OTHER"] as const;

const createEventSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional(),
  type: z.enum(eventTypes).optional(),
  categoryId: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  location: z.string().max(500).optional(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().url().optional(),
  registrationUrl: z.string().url().optional(),
  maxAttendees: z.number().positive().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.enum(["PEN", "USD"]).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published") === "true";
    const upcoming = searchParams.get("upcoming") === "true";
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const where: any = { centerId: center.id };
    if (published) where.isPublished = true;
    if (featured) where.isFeatured = true;
    if (upcoming) where.startDate = { gte: new Date() };

    const [events, total] = await Promise.all([
      prisma.cmsEvent.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
        orderBy: { startDate: upcoming ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cmsEvent.count({ where }),
    ]);

    return NextResponse.json({
      items: events,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

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

    // Verificar slug único
    const existing = await prisma.cmsEvent.findUnique({
      where: { centerId_slug: { centerId: center.id, slug: data.slug } },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe un evento con ese slug" }, { status: 400 });
    }

    const event = await prisma.cmsEvent.create({
      data: {
        centerId: center.id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        content: data.content,
        coverImage: data.coverImage,
        type: data.type || "OTHER",
        categoryId: data.categoryId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        timezone: data.timezone || "America/Lima",
        location: data.location,
        isOnline: data.isOnline || false,
        onlineUrl: data.onlineUrl,
        registrationUrl: data.registrationUrl,
        maxAttendees: data.maxAttendees,
        price: data.price,
        currency: data.currency || "PEN",
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
  }
}
