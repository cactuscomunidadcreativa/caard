/**
 * CAARD CMS - API de Lecciones de Curso
 * GET /api/cms/courses/[slug]/lessons - Lista lecciones de un curso
 * POST /api/cms/courses/[slug]/lessons - Crea una leccion
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createLessonSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional().nullable(),
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
      select: { id: true, status: true },
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

    const lessons = await prisma.courseLesson.findMany({
      where: { courseId: course.id },
      include: {
        materials: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ items: lessons });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Error al obtener lecciones" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const validation = createLessonSchema.safeParse(body);

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

    const course = await prisma.course.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    // Si no se proporciona sortOrder, ponerlo al final
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const lastLesson = await prisma.courseLesson.findFirst({
        where: { courseId: course.id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (lastLesson?.sortOrder ?? -1) + 1;
    }

    const lesson = await prisma.courseLesson.create({
      data: {
        courseId: course.id,
        title: data.title,
        description: data.description,
        content: data.content,
        videoUrl: data.videoUrl,
        sortOrder,
        durationMinutes: data.durationMinutes,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Error al crear leccion" },
      { status: 500 }
    );
  }
}
