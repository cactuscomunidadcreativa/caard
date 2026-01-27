/**
 * CAARD CMS - API de Categoría Individual
 * GET, PUT, DELETE para una categoría específica
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});

// GET - Obtener una categoría
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.cmsCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
            events: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Error al obtener categoría" }, { status: 500 });
  }
}

// PUT - Actualizar una categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Verificar que existe
    const existing = await prisma.cmsCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    const category = await prisma.cmsCategory.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
  }
}

// DELETE - Eliminar una categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que existe
    const existing = await prisma.cmsCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
            events: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    // Verificar que no tiene artículos o eventos asociados
    if (existing._count.articles > 0 || existing._count.events > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar la categoría porque tiene artículos o eventos asociados",
          details: {
            articles: existing._count.articles,
            events: existing._count.events,
          },
        },
        { status: 400 }
      );
    }

    await prisma.cmsCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}
