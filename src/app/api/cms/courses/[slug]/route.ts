/**
 * CAARD CMS - API de Curso Individual
 * GET /api/cms/courses/[slug] - Obtiene un curso con lecciones y materiales
 * PUT /api/cms/courses/[slug] - Actualiza un curso
 * DELETE /api/cms/courses/[slug] - Elimina un curso
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const courseModalities = ["ONLINE", "PRESENCIAL", "HYBRID"] as const;
const courseStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const updateCourseSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  content: z.string().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  modality: z.enum(courseModalities).optional(),
  status: z.enum(courseStatuses).optional(),
  categoryId: z.string().optional().nullable(),
  isFree: z.boolean().optional(),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).optional(),
  taxConfig: z.any().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  timezone: z.string().optional(),
  location: z.string().max(500).optional().nullable(),
  maxCapacity: z.number().int().positive().optional().nullable(),
  instructorName: z.string().max(200).optional().nullable(),
  instructorBio: z.string().max(2000).optional().nullable(),
  instructorImage: z.string().url().optional().nullable(),
  durationHours: z.number().positive().optional().nullable(),
  isFeatured: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: {
        lessons: {
          include: {
            materials: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    // Si no esta publicado, requiere autenticacion
    if (course.status !== "PUBLISHED") {
      const session = await auth();
      if (
        !session?.user ||
        !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(
          session.user.role || ""
        )
      ) {
        return NextResponse.json(
          { error: "Curso no encontrado" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Error al obtener curso" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;

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
    const validation = updateCourseSchema.safeParse(body);

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

    const existing = await prisma.course.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    // Si se cambia el slug, verificar que no exista
    if (data.slug && data.slug !== slug) {
      const slugExists = await prisma.course.findUnique({
        where: { centerId_slug: { centerId: center.id, slug: data.slug } },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Ya existe un curso con ese slug" },
          { status: 400 }
        );
      }
    }

    const course = await prisma.course.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.modality !== undefined && { modality: data.modality }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.taxConfig !== undefined && { taxConfig: data.taxConfig }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.maxCapacity !== undefined && {
          maxCapacity: data.maxCapacity,
        }),
        ...(data.instructorName !== undefined && {
          instructorName: data.instructorName,
        }),
        ...(data.instructorBio !== undefined && {
          instructorBio: data.instructorBio,
        }),
        ...(data.instructorImage !== undefined && {
          instructorImage: data.instructorImage,
        }),
        ...(data.durationHours !== undefined && {
          durationHours: data.durationHours,
        }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Error al actualizar curso" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;

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

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    const existing = await prisma.course.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    await prisma.course.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Error al eliminar curso" },
      { status: 500 }
    );
  }
}
