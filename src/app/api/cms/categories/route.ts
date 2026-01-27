/**
 * CAARD CMS - API de Categorías
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCategorySchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  color: z.string().max(20).optional(),
});

export async function GET() {
  try {
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const categories = await prisma.cmsCategory.findMany({
      where: { centerId: center.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "SECRETARIA"].includes(session.user.role || "")) {
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

    // Verificar slug único
    const existing = await prisma.cmsCategory.findUnique({
      where: { centerId_slug: { centerId: center.id, slug: data.slug } },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe una categoría con ese slug" }, { status: 400 });
    }

    const category = await prisma.cmsCategory.create({
      data: {
        centerId: center.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
