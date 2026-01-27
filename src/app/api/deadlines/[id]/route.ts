/**
 * API: Plazo Individual
 * ======================
 * Operaciones sobre un plazo específico
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addBusinessDays } from "@/lib/rules";

// Schema para actualizar plazo
const updateDeadlineSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "OVERDUE", "CANCELLED", "EXTENDED"]).optional(),
  completedAt: z.string().datetime().optional(),
  dueAt: z.string().datetime().optional(),
  onOverdueAction: z.string().optional(),
  changeStateTo: z.string().optional(),
  notifyRoles: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Schema para extender plazo
const extendDeadlineSchema = z.object({
  additionalDays: z.number().positive(),
  reason: z.string().min(10),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener plazo por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const deadline = await prisma.processDeadline.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            centerId: true,
            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!deadline) {
      return NextResponse.json(
        { error: "Plazo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar acceso
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(
      user.role
    );
    const isCaseMember = deadline.case.members.some(
      (m) => m.userId === session.user.id
    );

    if (!isAdmin && !isCaseMember) {
      return NextResponse.json(
        { error: "No tiene acceso a este plazo" },
        { status: 403 }
      );
    }

    // Enriquecer con información calculada
    const now = new Date();
    const enrichedDeadline = {
      ...deadline,
      isOverdue: deadline.status === "ACTIVE" && new Date(deadline.dueAt) < now,
      daysRemaining: Math.ceil(
        (new Date(deadline.dueAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };

    return NextResponse.json(enrichedDeadline);
  } catch (error) {
    console.error("Error fetching deadline:", error);
    return NextResponse.json(
      { error: "Error al obtener plazo" },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar plazo
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Solo roles administrativos pueden actualizar
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para actualizar plazos" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDeadlineSchema.parse(body);

    const currentDeadline = await prisma.processDeadline.findUnique({
      where: { id },
      include: {
        case: {
          select: { centerId: true },
        },
      },
    });

    if (!currentDeadline) {
      return NextResponse.json(
        { error: "Plazo no encontrado" },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;

      if (validatedData.status === "COMPLETED") {
        updateData.completedAt = validatedData.completedAt
          ? new Date(validatedData.completedAt)
          : new Date();
      }
    }

    if (validatedData.dueAt !== undefined) {
      updateData.dueAt = new Date(validatedData.dueAt);
    }

    if (validatedData.onOverdueAction !== undefined) {
      updateData.onOverdueAction = validatedData.onOverdueAction;
    }

    if (validatedData.changeStateTo !== undefined) {
      updateData.changeStateTo = validatedData.changeStateTo;
    }

    if (validatedData.notifyRoles !== undefined) {
      updateData.notifyRoles = validatedData.notifyRoles;
    }

    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata;
    }

    const updatedDeadline = await prisma.processDeadline.update({
      where: { id },
      data: updateData,
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
        centerId: currentDeadline.case.centerId,
        caseId: currentDeadline.caseId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "ProcessDeadline",
        entityId: id,
        meta: {
          previousStatus: currentDeadline.status,
          newStatus: validatedData.status,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json(updatedDeadline);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating deadline:", error);
    return NextResponse.json(
      { error: "Error al actualizar plazo" },
      { status: 500 }
    );
  }
}

// POST: Extender plazo (acción especial)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Solo SUPER_ADMIN, ADMIN y SECRETARIA pueden extender plazos
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para extender plazos" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = extendDeadlineSchema.parse(body);

    const currentDeadline = await prisma.processDeadline.findUnique({
      where: { id },
      include: {
        case: {
          select: { centerId: true },
        },
      },
    });

    if (!currentDeadline) {
      return NextResponse.json(
        { error: "Plazo no encontrado" },
        { status: 404 }
      );
    }

    // No se puede extender plazos completados o cancelados
    if (["COMPLETED", "CANCELLED"].includes(currentDeadline.status)) {
      return NextResponse.json(
        { error: "No se puede extender un plazo completado o cancelado" },
        { status: 400 }
      );
    }

    // Calcular nueva fecha de vencimiento
    const currentDueAt = new Date(currentDeadline.dueAt);
    const newDueAt = addBusinessDays(currentDueAt, validatedData.additionalDays);

    // Actualizar plazo
    const extendedDeadline = await prisma.processDeadline.update({
      where: { id },
      data: {
        status: "EXTENDED",
        originalDueAt: currentDeadline.originalDueAt || currentDueAt,
        dueAt: newDueAt,
        extensionReason: validatedData.reason,
        extendedById: session.user.id,
        extendedAt: new Date(),
        // Resetear recordatorios
        reminder3DaysSent: false,
        reminder1DaySent: false,
        reminderOverdueSent: false,
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

    // Registrar intervención administrativa
    await prisma.adminIntervention.create({
      data: {
        centerId: currentDeadline.case.centerId,
        adminUserId: session.user.id,
        action: "EXTEND_DEADLINE",
        targetEntity: "ProcessDeadline",
        targetEntityId: id,
        justification: validatedData.reason,
        previousValue: {
          dueAt: currentDueAt.toISOString(),
        },
        newValue: {
          dueAt: newDueAt.toISOString(),
          additionalDays: validatedData.additionalDays,
        },
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        centerId: currentDeadline.case.centerId,
        caseId: currentDeadline.caseId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "ProcessDeadline",
        entityId: id,
        meta: {
          action: "EXTEND",
          previousDueAt: currentDueAt.toISOString(),
          newDueAt: newDueAt.toISOString(),
          additionalDays: validatedData.additionalDays,
          reason: validatedData.reason,
        },
      },
    });

    return NextResponse.json({
      message: "Plazo extendido exitosamente",
      deadline: extendedDeadline,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error extending deadline:", error);
    return NextResponse.json(
      { error: "Error al extender plazo" },
      { status: 500 }
    );
  }
}

// DELETE: Cancelar plazo
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Solo SUPER_ADMIN y ADMIN pueden cancelar plazos
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para cancelar plazos" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "Cancelado por administrador";

    const deadline = await prisma.processDeadline.findUnique({
      where: { id },
      include: {
        case: {
          select: { centerId: true },
        },
      },
    });

    if (!deadline) {
      return NextResponse.json(
        { error: "Plazo no encontrado" },
        { status: 404 }
      );
    }

    // Marcar como cancelado
    const cancelledDeadline = await prisma.processDeadline.update({
      where: { id },
      data: {
        status: "CANCELLED",
        metadata: {
          ...(deadline.metadata as object || {}),
          cancelledAt: new Date().toISOString(),
          cancelledBy: session.user.id,
          cancellationReason: reason,
        },
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        centerId: deadline.case.centerId,
        caseId: deadline.caseId,
        userId: session.user.id,
        action: "DELETE",
        entity: "ProcessDeadline",
        entityId: id,
        meta: {
          type: deadline.type,
          reason,
        },
      },
    });

    return NextResponse.json({
      message: "Plazo cancelado",
      deadline: cancelledDeadline,
    });
  } catch (error) {
    console.error("Error cancelling deadline:", error);
    return NextResponse.json(
      { error: "Error al cancelar plazo" },
      { status: 500 }
    );
  }
}
