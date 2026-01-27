/**
 * API: Plazos Procesales
 * =======================
 * Gestión de plazos y vencimientos del sistema de arbitraje
 * Totalmente configurable para adaptarse a diferentes reglamentos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addBusinessDays, calculateDeadline } from "@/lib/rules";

// Schema para crear plazo
const createDeadlineSchema = z.object({
  caseId: z.string(),
  type: z.enum([
    "PAYMENT",
    "CONTESTACION",
    "RECONVENCION",
    "CONTESTACION_RECONVENCION",
    "ALEGATOS",
    "RECUSACION_ABSOLUCION",
    "DESIGNACION_ARBITRO",
    "SUBSANACION",
    "EMERGENCY_VERIFICATION",
    "EMERGENCY_PAYMENT",
    "EMERGENCY_DESIGNATION",
    "EMERGENCY_RESOLUTION",
    "EMERGENCY_PRINCIPAL_REQUEST",
    "CUSTOM",
  ]),
  title: z.string(),
  description: z.string().optional(),
  businessDays: z.number().positive(),
  startsAt: z.string().datetime().optional(), // Default: now
  timezone: z.string().default("America/Lima"),
  onOverdueAction: z.enum(["SUSPEND", "ARCHIVE", "NOTIFY", "ESCALATE", "AUTO_REJECT", "EXPIRE_EMERGENCY"]).optional(),
  changeStateTo: z.string().optional(),
  notifyRoles: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET: Listar plazos
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const upcoming = searchParams.get("upcoming"); // días para vencimientos próximos
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (caseId) {
      where.caseId = caseId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Filtrar vencimientos próximos
    if (upcoming) {
      const days = parseInt(upcoming);
      const futureDate = addBusinessDays(new Date(), days);
      where.dueAt = { lte: futureDate };
      where.status = "ACTIVE";
    }

    // Filtrar por rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Solo ciertos roles pueden ver todos los plazos
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(user.role)) {
      const userCases = await prisma.caseMember.findMany({
        where: { userId: session.user.id },
        select: { caseId: true },
      });
      where.caseId = { in: userCases.map((c) => c.caseId) };
    }

    const [deadlines, total] = await Promise.all([
      prisma.processDeadline.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { dueAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.processDeadline.count({ where }),
    ]);

    // Calcular estado real (si está vencido pero no marcado)
    const now = new Date();
    const enrichedDeadlines = deadlines.map((d) => ({
      ...d,
      isOverdue: d.status === "ACTIVE" && new Date(d.dueAt) < now,
      daysRemaining: Math.ceil(
        (new Date(d.dueAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json({
      data: enrichedDeadlines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    return NextResponse.json(
      { error: "Error al obtener plazos" },
      { status: 500 }
    );
  }
}

// POST: Crear plazo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Solo roles administrativos pueden crear plazos
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para crear plazos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createDeadlineSchema.parse(body);

    // Verificar que el caso existe
    const caseData = await prisma.case.findUnique({
      where: { id: validatedData.caseId },
      select: { id: true, code: true, centerId: true },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    // Calcular fecha de vencimiento
    const startsAt = validatedData.startsAt
      ? new Date(validatedData.startsAt)
      : new Date();

    const deadlineResult = calculateDeadline(
      startsAt,
      validatedData.businessDays,
      validatedData.timezone
    );

    // Crear plazo
    const deadline = await prisma.processDeadline.create({
      data: {
        caseId: validatedData.caseId,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        startsAt,
        businessDays: validatedData.businessDays,
        dueAt: deadlineResult.dueDate,
        timezone: validatedData.timezone,
        onOverdueAction: validatedData.onOverdueAction,
        changeStateTo: validatedData.changeStateTo as any,
        notifyRoles: validatedData.notifyRoles || [],
        metadata: validatedData.metadata as any,
      },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        centerId: caseData.centerId,
        caseId: validatedData.caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "ProcessDeadline",
        entityId: deadline.id,
        meta: {
          type: validatedData.type,
          businessDays: validatedData.businessDays,
          dueAt: deadlineResult.dueDate.toISOString(),
        },
      },
    });

    return NextResponse.json(deadline, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating deadline:", error);
    return NextResponse.json(
      { error: "Error al crear plazo" },
      { status: 500 }
    );
  }
}
