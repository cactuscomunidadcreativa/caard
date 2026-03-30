/**
 * CAARD - API de Landing Pages
 * GET: Listar landing pages
 * POST: Crear landing page
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(300),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  ogImage: z.string().url().optional(),
  template: z.enum(["COURSE_PROMO", "SERVICE_PROMO", "EVENT_PROMO", "CUSTOM"]).default("CUSTOM"),
  conversionGoal: z.string().max(200).optional(),
  targetUrl: z.string().max(500).optional(),
  isPublished: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    const pages = await prisma.landingPage.findMany({
      where: { centerId: center.id },
      include: { _count: { select: { sections: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items: pages });
  } catch (error) {
    console.error("Error fetching landing pages:", error);
    return NextResponse.json({ error: "Error al obtener landing pages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos", details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    const existing = await prisma.landingPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug: data.slug } },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una landing page con ese slug" }, { status: 400 });
    }

    const page = await prisma.landingPage.create({
      data: {
        centerId: center.id,
        slug: data.slug,
        title: data.title,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        template: data.template,
        conversionGoal: data.conversionGoal,
        targetUrl: data.targetUrl,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Error creating landing page:", error);
    return NextResponse.json({ error: "Error al crear landing page" }, { status: 500 });
  }
}
