/**
 * API: Solicitud de Emergencia Individual
 * =========================================
 * Operaciones sobre una solicitud de emergencia específica
 * Incluye transiciones de estado y acciones del flujo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  addBusinessDays,
  PLAZOS_EMERGENCIA,
  calculateEmergencyFee,
} from "@/lib/rules";

// Schema para actualizar solicitud
const updateEmergencySchema = z.object({
  status: z
    .enum([
      "REQUESTED",
      "PENDING_VERIFICATION",
      "VERIFICATION_FAILED",
      "PENDING_PAYMENT",
      "PAYMENT_OVERDUE",
      "PENDING_DESIGNATION",
      "DESIGNATION_OVERDUE",
      "PENDING_ACCEPTANCE",
      "IN_PROCESS",
      "RESOLVED",
      "PENDING_MAIN_CASE",
      "COMPLETED",
      "EXPIRED",
      "ARCHIVED",
    ])
    .optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  urgencyJustification: z.string().optional(),
  requestedMeasures: z.string().optional(),
  verificationNotes: z.string().optional(),
  missingRequirements: z.array(z.string()).optional(),
  emergencyArbitratorId: z.string().optional(),
  arbitratorRejectionReason: z.string().optional(),
  resolution: z.string().optional(),
  expirationReason: z.string().optional(),
  mainCaseId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Schema para verificación formal
const verificationSchema = z.object({
  isComplete: z.boolean(),
  missingRequirements: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Schema para designar árbitro
const designateArbitratorSchema = z.object({
  arbitratorId: z.string(),
  notes: z.string().optional(),
});

// Schema para aceptar/rechazar (árbitro)
const arbitratorResponseSchema = z.object({
  accepted: z.boolean(),
  rejectionReason: z.string().optional(),
});

// Schema para resolución
const resolutionSchema = z.object({
  resolution: z.string().min(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener solicitud por ID
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

    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            members: true,
          },
        },
      },
    });

    if (!emergency) {
      return NextResponse.json(
        { error: "Solicitud de emergencia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(
      user.role
    );
    const isRequester = emergency.requesterId === session.user.id;
    const isAssignedArbitrator = emergency.emergencyArbitratorId === session.user.id;

    if (!isAdmin && !isRequester && !isAssignedArbitrator) {
      return NextResponse.json(
        { error: "No tiene acceso a esta solicitud" },
        { status: 403 }
      );
    }

    // Enriquecer con información de deadlines y acciones disponibles
    const now = new Date();
    const availableActions = getAvailableActions(emergency, user.role);

    return NextResponse.json({
      ...emergency,
      availableActions,
      deadlineStatus: {
        verification: emergency.verificationDueAt
          ? {
              isOverdue: emergency.verificationDueAt < now && !emergency.verificationCompletedAt,
              daysRemaining: Math.ceil(
                (emergency.verificationDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
        payment: emergency.paymentDueAt
          ? {
              isOverdue: emergency.paymentDueAt < now && !emergency.paymentConfirmedAt,
              daysRemaining: Math.ceil(
                (emergency.paymentDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
        designation: emergency.designationDueAt
          ? {
              isOverdue: emergency.designationDueAt < now && !emergency.arbitratorDesignatedAt,
              daysRemaining: Math.ceil(
                (emergency.designationDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
        resolution: emergency.resolutionDueAt
          ? {
              isOverdue: emergency.resolutionDueAt < now && !emergency.resolvedAt,
              daysRemaining: Math.ceil(
                (emergency.resolutionDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
        principalRequest: emergency.principalRequestDueAt
          ? {
              isOverdue: emergency.principalRequestDueAt < now && !emergency.mainCaseSubmittedAt,
              daysRemaining: Math.ceil(
                (emergency.principalRequestDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching emergency:", error);
    return NextResponse.json(
      { error: "Error al obtener solicitud de emergencia" },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar solicitud
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEmergencySchema.parse(body);

    const currentEmergency = await prisma.emergencyRequest.findUnique({
      where: { id },
    });

    if (!currentEmergency) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos según la acción
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(
      user.role
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: "No tiene permisos para actualizar esta solicitud" },
        { status: 403 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};

    // Campos editables
    const editableFields = [
      "title",
      "description",
      "urgencyJustification",
      "requestedMeasures",
      "verificationNotes",
      "missingRequirements",
      "resolution",
      "expirationReason",
      "mainCaseId",
      "metadata",
    ];

    for (const field of editableFields) {
      if ((validatedData as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (validatedData as Record<string, unknown>)[field];
      }
    }

    // Manejar cambios de estado
    if (validatedData.status && validatedData.status !== currentEmergency.status) {
      updateData.status = validatedData.status;

      // Acciones automáticas según el nuevo estado
      switch (validatedData.status) {
        case "VERIFICATION_FAILED":
          // No calcular más plazos
          break;

        case "PENDING_PAYMENT":
          // Calcular plazo de pago
          const paymentDueAt = addBusinessDays(
            new Date(),
            PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO
          );
          updateData.paymentDueAt = paymentDueAt;
          break;

        case "PENDING_DESIGNATION":
          // Calcular plazo de designación
          const designationDueAt = addBusinessDays(
            new Date(),
            PLAZOS_EMERGENCIA.DESIGNACION_ARBITRO
          );
          updateData.designationDueAt = designationDueAt;
          break;

        case "IN_PROCESS":
          // Calcular plazo de resolución
          const resolutionDueAt = addBusinessDays(
            new Date(),
            PLAZOS_EMERGENCIA.RESOLUCION_ARBITRO
          );
          updateData.resolutionDueAt = resolutionDueAt;
          break;

        case "PENDING_MAIN_CASE":
          // Calcular plazo para presentar caso principal
          const principalDueAt = addBusinessDays(
            new Date(),
            PLAZOS_EMERGENCIA.SOLICITUD_PRINCIPAL
          );
          updateData.principalRequestDueAt = principalDueAt;
          break;

        case "EXPIRED":
          updateData.expiredAt = new Date();
          break;

        case "ARCHIVED":
          // Solo marcar como archivado
          break;
      }
    }

    // Actualizar
    const updatedEmergency = await prisma.emergencyRequest.update({
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
        centerId: currentEmergency.centerId,
        caseId: currentEmergency.caseId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "EmergencyRequest",
        entityId: id,
        meta: {
          previousStatus: currentEmergency.status,
          newStatus: validatedData.status,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json(updatedEmergency);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating emergency:", error);
    return NextResponse.json(
      { error: "Error al actualizar solicitud" },
      { status: 500 }
    );
  }
}

// Helper: Obtener acciones disponibles según estado y rol
function getAvailableActions(emergency: any, role: string): string[] {
  const actions: string[] = [];
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(role);
  const isArbitrator = role === "ARBITRO";

  switch (emergency.status) {
    case "REQUESTED":
      if (isAdmin) actions.push("VERIFY", "REJECT");
      break;

    case "PENDING_VERIFICATION":
      if (isAdmin) actions.push("COMPLETE_VERIFICATION", "FAIL_VERIFICATION");
      break;

    case "VERIFICATION_FAILED":
      if (isAdmin) actions.push("ARCHIVE", "RETRY_VERIFICATION");
      break;

    case "PENDING_PAYMENT":
      if (isAdmin) actions.push("CONFIRM_PAYMENT", "MARK_PAYMENT_OVERDUE");
      break;

    case "PAYMENT_OVERDUE":
      if (isAdmin) actions.push("CONFIRM_PAYMENT", "ARCHIVE");
      break;

    case "PENDING_DESIGNATION":
      if (isAdmin) actions.push("DESIGNATE_ARBITRATOR");
      break;

    case "DESIGNATION_OVERDUE":
      if (isAdmin) actions.push("DESIGNATE_ARBITRATOR", "ESCALATE");
      break;

    case "PENDING_ACCEPTANCE":
      if (isArbitrator && emergency.emergencyArbitratorId) {
        actions.push("ACCEPT_DESIGNATION", "REJECT_DESIGNATION");
      }
      if (isAdmin) actions.push("REASSIGN_ARBITRATOR");
      break;

    case "IN_PROCESS":
      if (isArbitrator) actions.push("SUBMIT_RESOLUTION");
      if (isAdmin) actions.push("REASSIGN_ARBITRATOR");
      break;

    case "RESOLVED":
      if (isAdmin) actions.push("VIEW_RESOLUTION");
      break;

    case "PENDING_MAIN_CASE":
      if (isAdmin) actions.push("LINK_MAIN_CASE", "MARK_EXPIRED");
      break;

    case "EXPIRED":
    case "ARCHIVED":
      if (isAdmin) actions.push("VIEW_HISTORY");
      break;
  }

  return actions;
}
