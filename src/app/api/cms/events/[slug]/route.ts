/**
 * CAARD CMS - API de Evento Individual
 * GET, PUT, DELETE para un evento específico
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventTypes = ["WEBINAR", "CONFERENCE", "WORKSHOP", "COURSE", "SEMINAR", "OTHER"] as const;

const updateEventSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional().nullable(),
  content: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  type: z.enum(eventTypes).optional(),
  categoryId: z.string().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  timezone: z.string().optional(),
  location: z.string().max(500).optional().nullable(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().optional().nullable(),
  registrationUrl: z.string().optional().nullable(),
  maxAttendees: z.number().positive().optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// GET - Obtener un evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const event = await prisma.cmsEvent.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Error al obtener evento" }, { status: 500 });
  }
}

// PUT - Actualizar un evento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validation = updateEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar que existe
    const existing = await prisma.cmsEvent.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const data = validation.data;

    // Validar fechas
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end < start) {
        return NextResponse.json(
          { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const event = await prisma.cmsEvent.update({
      where: { centerId_slug: { centerId: center.id, slug } },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 });
  }
}

// DELETE - Eliminar un evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar que existe
    const existing = await prisma.cmsEvent.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    await prisma.cmsEvent.delete({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 });
  }
}
