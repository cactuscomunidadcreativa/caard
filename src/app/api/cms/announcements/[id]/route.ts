/**
 * CAARD CMS - API de Avisos/Anuncios por ID
 * GET, PUT, DELETE de un aviso específico
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const announcementTypes = ["INFO", "WARNING", "SUCCESS", "ERROR", "NEWS"] as const;

const updateAnnouncementSchema = z.object({
  type: z.enum(announcementTypes).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(1000).nullable().optional(),
  linkUrl: z.string().url().nullable().optional(),
  linkText: z.string().max(50).nullable().optional(),
  showOnHomepage: z.boolean().optional(),
  showOnAllPages: z.boolean().optional(),
  showAsPopup: z.boolean().optional(),
  showAsBanner: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

// GET - Obtener un aviso por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const announcement = await prisma.cmsAnnouncement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Aviso no encontrado" }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json({ error: "Error al obtener aviso" }, { status: 500 });
  }
}

// PUT - Actualizar un aviso
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que existe
    const existing = await prisma.cmsAnnouncement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Aviso no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const announcement = await prisma.cmsAnnouncement.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.linkText !== undefined && { linkText: data.linkText }),
        ...(data.showOnHomepage !== undefined && { showOnHomepage: data.showOnHomepage }),
        ...(data.showOnAllPages !== undefined && { showOnAllPages: data.showOnAllPages }),
        ...(data.showAsPopup !== undefined && { showAsPopup: data.showAsPopup }),
        ...(data.showAsBanner !== undefined && { showAsBanner: data.showAsBanner }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "Error al actualizar aviso" }, { status: 500 });
  }
}

// DELETE - Eliminar un aviso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que existe
    const existing = await prisma.cmsAnnouncement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Aviso no encontrado" }, { status: 404 });
    }

    await prisma.cmsAnnouncement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Error al eliminar aviso" }, { status: 500 });
  }
}
