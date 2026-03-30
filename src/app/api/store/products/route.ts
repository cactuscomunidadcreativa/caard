/**
 * CAARD Store - API de Productos
 * GET: Listar productos con filtros, paginación. Público para publicados.
 * POST: Crear producto. Auth requerida.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productTypes = ["DIGITAL", "PHYSICAL", "SERVICE"] as const;

const createProductSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(1000).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  type: z.enum(productTypes).optional(),
  categoryId: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  comparePriceCents: z.number().int().nonnegative().optional(),
  currency: z.enum(["PEN", "USD"]).optional(),
  taxConfig: z
    .object({
      igv: z.boolean().optional(),
      detraccion: z.boolean().optional(),
      percepcion: z.boolean().optional(),
    })
    .optional(),
  // Físico
  stock: z.number().int().nonnegative().optional(),
  trackStock: z.boolean().optional(),
  weight: z.number().nonnegative().optional(),
  requiresShipping: z.boolean().optional(),
  // Digital
  digitalFileUrl: z.string().url().optional(),
  digitalFileType: z.string().max(100).optional(),
  // Servicio
  serviceDurationMinutes: z.number().int().positive().optional(),
  serviceBookingUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published") === "true";
    const featured = searchParams.get("featured") === "true";
    const type = searchParams.get("type");
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const where: any = { centerId: center.id };
    if (published) where.isPublished = true;
    if (featured) where.isFeatured = true;
    if (type && productTypes.includes(type as any)) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.storeProduct.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.storeProduct.count({ where }),
    ]);

    return NextResponse.json({
      items: products,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createProductSchema.safeParse(body);

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

    const slug = data.slug || generateSlug(data.title);

    // Verificar slug único
    const existing = await prisma.storeProduct.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe un producto con ese slug" }, { status: 400 });
    }

    const product = await prisma.storeProduct.create({
      data: {
        centerId: center.id,
        slug,
        title: data.title,
        description: data.description,
        content: data.content,
        coverImage: data.coverImage,
        images: data.images || [],
        type: data.type || "DIGITAL",
        categoryId: data.categoryId,
        priceCents: data.priceCents,
        comparePriceCents: data.comparePriceCents,
        currency: data.currency || "PEN",
        taxConfig: data.taxConfig || { igv: false, detraccion: false, percepcion: false },
        stock: data.stock,
        trackStock: data.trackStock || false,
        weight: data.weight,
        requiresShipping: data.requiresShipping || false,
        digitalFileUrl: data.digitalFileUrl,
        digitalFileType: data.digitalFileType,
        serviceDurationMinutes: data.serviceDurationMinutes,
        serviceBookingUrl: data.serviceBookingUrl,
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
