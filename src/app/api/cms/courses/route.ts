/**
 * CAARD CMS - API de Cursos
 * GET /api/cms/courses - Lista cursos con filtros y paginacion
 * POST /api/cms/courses - Crea un nuevo curso
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const courseModalities = ["ONLINE", "PRESENCIAL", "HYBRID"] as const;
const courseStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const createCourseSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional(),
  modality: z.enum(courseModalities).optional(),
  status: z.enum(courseStatuses).optional(),
  categoryId: z.string().optional(),
  isFree: z.boolean().optional(),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).optional(),
  taxConfig: z.any().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  location: z.string().max(500).optional(),
  maxCapacity: z.number().int().positive().optional().nullable(),
  instructorName: z.string().max(200).optional(),
  instructorBio: z.string().max(2000).optional(),
  instructorImage: z.string().url().optional(),
  durationHours: z.number().positive().optional().nullable(),
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
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const modality = searchParams.get("modality");
    const categoryId = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";
    const published = searchParams.get("published") === "true";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    const where: any = { centerId: center.id };
    if (published) where.status = "PUBLISHED";
    if (status) where.status = status;
    if (modality) where.modality = modality;
    if (categoryId) where.categoryId = categoryId;
    if (featured) where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      items: courses,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Error al obtener cursos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (
      !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(
        session.user.role || ""
      )
    ) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    const slug = data.slug || generateSlug(data.title);

    // Verificar slug unico
    const existing = await prisma.course.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un curso con ese slug" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        centerId: center.id,
        slug,
        title: data.title,
        description: data.description,
        content: data.content,
        coverImage: data.coverImage,
        modality: data.modality || "ONLINE",
        status: data.status || "DRAFT",
        categoryId: data.categoryId,
        isFree: data.isFree || false,
        priceCents: data.priceCents,
        currency: data.currency || "PEN",
        taxConfig: data.taxConfig,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        timezone: data.timezone || "America/Lima",
        location: data.location,
        maxCapacity: data.maxCapacity,
        instructorName: data.instructorName,
        instructorBio: data.instructorBio,
        instructorImage: data.instructorImage,
        durationHours: data.durationHours,
        isFeatured: data.isFeatured || false,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Error al crear curso" },
      { status: 500 }
    );
  }
}
