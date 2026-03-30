/**
 * CAARD - API de Inscripciones (Enrollments)
 * GET /api/enrollments - Lista inscripciones del usuario autenticado
 * POST /api/enrollments - Inscribirse en un curso
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const enrollSchema = z.object({
  courseId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const where: any = { userId: session.user.id };
    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverImage: true,
              modality: true,
              status: true,
              isFree: true,
              priceCents: true,
              currency: true,
              instructorName: true,
              durationHours: true,
              _count: { select: { lessons: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return NextResponse.json({
      items: enrollments,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Error al obtener inscripciones" },
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

    const body = await request.json();
    const validation = enrollSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { courseId } = validation.data;

    // Verificar que el curso existe y esta publicado
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        status: true,
        isFree: true,
        priceCents: true,
        currency: true,
        maxCapacity: true,
        currentEnrolled: true,
      },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Curso no encontrado o no disponible" },
        { status: 404 }
      );
    }

    // Verificar capacidad
    if (
      course.maxCapacity !== null &&
      course.currentEnrolled >= course.maxCapacity
    ) {
      return NextResponse.json(
        { error: "El curso ha alcanzado su capacidad maxima" },
        { status: 400 }
      );
    }

    // Verificar si ya esta inscrito
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: { courseId, userId: session.user.id },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Ya estas inscrito en este curso" },
        { status: 400 }
      );
    }

    // Determinar estado segun si es gratuito o de pago
    const isFree = course.isFree || !course.priceCents;
    const enrollmentStatus = isFree ? "ENROLLED" : "PENDING_PAYMENT";

    // Crear inscripcion y actualizar contador en una transaccion
    const enrollment = await prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          courseId,
          userId: session.user.id,
          status: enrollmentStatus,
          currency: course.currency,
          ...(isFree && { enrolledAt: new Date() }),
        },
      });

      await tx.course.update({
        where: { id: courseId },
        data: { currentEnrolled: { increment: 1 } },
      });

      return newEnrollment;
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: "Error al inscribirse en el curso" },
      { status: 500 }
    );
  }
}
