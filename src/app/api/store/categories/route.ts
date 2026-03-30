/**
 * CAARD Store - API de Categorías de Tienda
 * GET: Listar categorías con conteo de productos.
 * POST: Crear categoría. Auth requerida.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(300).optional(),
  coverImage: z.string().url().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const categories = await prisma.storeCategory.findMany({
      where: { centerId: center.id },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ items: categories });
  } catch (error) {
    console.error("Error fetching store categories:", error);
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

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

    const slug = data.slug || generateSlug(data.name);

    // Verificar slug único
    const existing = await prisma.storeCategory.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe una categoría con ese slug" }, { status: 400 });
    }

    const category = await prisma.storeCategory.create({
      data: {
        centerId: center.id,
        slug,
        name: data.name,
        description: data.description,
        coverImage: data.coverImage,
        sortOrder: data.sortOrder || 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating store category:", error);
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
