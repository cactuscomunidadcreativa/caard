/**
 * CAARD Store - API de Categoría Individual
 * PUT, DELETE para una categoría de tienda específica
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(300).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});

// PUT - Actualizar una categoría
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
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Verificar que existe
    const existing = await prisma.storeCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    // Si se cambia slug, verificar unicidad
    const data = validation.data;
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.storeCategory.findUnique({
        where: { centerId_slug: { centerId: existing.centerId, slug: data.slug } },
      });
      if (slugExists) {
        return NextResponse.json({ error: "Ya existe una categoría con ese slug" }, { status: 400 });
      }
    }

    const category = await prisma.storeCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating store category:", error);
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

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que existe y contar productos
    const existing = await prisma.storeCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    // No eliminar si tiene productos asociados
    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar la categoría porque tiene productos asociados",
          details: {
            products: existing._count.products,
          },
        },
        { status: 400 }
      );
    }

    await prisma.storeCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting store category:", error);
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}
