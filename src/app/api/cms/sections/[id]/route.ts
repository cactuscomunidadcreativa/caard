/**
 * CAARD CMS - API de Sección Individual
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sectionTypes = [
  "HERO", "TEXT", "CARDS", "GALLERY", "ACCORDION", "CTA",
  "STATS", "TESTIMONIALS", "CONTACT_FORM", "TEAM", "TIMELINE", "EMBED", "CUSTOM"
] as const;

const updateSectionSchema = z.object({
  type: z.enum(sectionTypes).optional(),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  content: z.any().optional(),
  bgColor: z.string().max(20).optional().nullable(),
  textColor: z.string().max(20).optional().nullable(),
  bgImage: z.string().optional().nullable(),
  padding: z.enum(["sm", "md", "lg", "xl"]).optional().nullable(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const section = await prisma.cmsSection.findUnique({
      where: { id },
      include: { page: true },
    });

    if (!section) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json({ error: "Error al obtener sección" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateSectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const section = await prisma.cmsSection.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json({ error: "Error al actualizar sección" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.cmsSection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json({ error: "Error al eliminar sección" }, { status: 500 });
  }
}
