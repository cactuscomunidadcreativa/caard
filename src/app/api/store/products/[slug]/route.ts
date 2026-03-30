/**
 * CAARD Store - API de Producto Individual
 * GET, PUT, DELETE para un producto específico
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productTypes = ["DIGITAL", "PHYSICAL", "SERVICE"] as const;

const updateProductSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional().nullable(),
  content: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  images: z.array(z.string().url()).optional(),
  type: z.enum(productTypes).optional(),
  categoryId: z.string().optional().nullable(),
  priceCents: z.number().int().nonnegative().optional(),
  comparePriceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).optional(),
  taxConfig: z
    .object({
      igv: z.boolean().optional(),
      detraccion: z.boolean().optional(),
      percepcion: z.boolean().optional(),
    })
    .optional(),
  // Físico
  stock: z.number().int().nonnegative().optional().nullable(),
  trackStock: z.boolean().optional(),
  weight: z.number().nonnegative().optional().nullable(),
  requiresShipping: z.boolean().optional(),
  // Digital
  digitalFileUrl: z.string().optional().nullable(),
  digitalFileType: z.string().max(100).optional().nullable(),
  // Servicio
  serviceDurationMinutes: z.number().int().positive().optional().nullable(),
  serviceBookingUrl: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// GET - Obtener un producto
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

    const product = await prisma.storeProduct.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
  }
}

// PUT - Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);

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
    const existing = await prisma.storeProduct.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const product = await prisma.storeProduct.update({
      where: { centerId_slug: { centerId: center.id, slug } },
      data: validation.data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

// DELETE - Eliminar un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar que existe
    const existing = await prisma.storeProduct.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await prisma.storeProduct.delete({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
