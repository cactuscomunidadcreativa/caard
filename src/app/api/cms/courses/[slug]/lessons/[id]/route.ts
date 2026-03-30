/**
 * CAARD CMS - API de Leccion Individual
 * PUT /api/cms/courses/[slug]/lessons/[id] - Actualiza una leccion
 * DELETE /api/cms/courses/[slug]/lessons/[id] - Elimina una leccion
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateLessonSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  content: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await auth();
    const { slug, id } = await params;

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
    const validation = updateLessonSchema.safeParse(body);

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

    // Verificar que el curso existe
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

    // Verificar que la leccion pertenece al curso
    const existing = await prisma.courseLesson.findFirst({
      where: { id, courseId: course.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Leccion no encontrada" },
        { status: 404 }
      );
    }

    const lesson = await prisma.courseLesson.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.durationMinutes !== undefined && {
          durationMinutes: data.durationMinutes,
        }),
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Error al actualizar leccion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await auth();
    const { slug, id } = await params;

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

    const existing = await prisma.courseLesson.findFirst({
      where: { id, courseId: course.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Leccion no encontrada" },
        { status: 404 }
      );
    }

    await prisma.courseLesson.delete({ where: { id } });

    return NextResponse.json({ message: "Leccion eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Error al eliminar leccion" },
      { status: 500 }
    );
  }
}
