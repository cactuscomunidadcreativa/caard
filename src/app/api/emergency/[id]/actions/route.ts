/**
 * API: Acciones de Emergencia
 * ============================
 * Ejecuta acciones específicas del flujo de emergencia
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

// Schemas para cada acción
const verifySchema = z.object({
  action: z.literal("VERIFY"),
  isComplete: z.boolean(),
  missingRequirements: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const designateSchema = z.object({
  action: z.literal("DESIGNATE_ARBITRATOR"),
  arbitratorId: z.string(),
  notes: z.string().optional(),
});

const arbitratorResponseSchema = z.object({
  action: z.enum(["ACCEPT_DESIGNATION", "REJECT_DESIGNATION"]),
  rejectionReason: z.string().optional(),
});

const resolutionSchema = z.object({
  action: z.literal("SUBMIT_RESOLUTION"),
  resolution: z.string().min(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const paymentSchema = z.object({
  action: z.literal("CONFIRM_PAYMENT"),
  paymentId: z.string().optional(),
  notes: z.string().optional(),
});

const linkCaseSchema = z.object({
  action: z.literal("LINK_MAIN_CASE"),
  mainCaseId: z.string(),
});

const archiveSchema = z.object({
  action: z.literal("ARCHIVE"),
  reason: z.string(),
});

const actionSchema = z.discriminatedUnion("action", [
  verifySchema,
  designateSchema,
  arbitratorResponseSchema.extend({ action: z.literal("ACCEPT_DESIGNATION") }),
  arbitratorResponseSchema.extend({ action: z.literal("REJECT_DESIGNATION") }),
  resolutionSchema,
  paymentSchema,
  linkCaseSchema,
  archiveSchema,
  z.object({ action: z.literal("ESCALATE"), notes: z.string().optional() }),
  z.object({ action: z.literal("MARK_EXPIRED"), reason: z.string() }),
]);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Ejecutar acción
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
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedAction = actionSchema.parse(body);

    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id },
    });

    if (!emergency) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    let result;

    switch (validatedAction.action) {
      case "VERIFY":
        result = await handleVerification(
          emergency,
          validatedAction as z.infer<typeof verifySchema>,
          session.user.id,
          user.role
        );
        break;

      case "DESIGNATE_ARBITRATOR":
        result = await handleDesignation(
          emergency,
          validatedAction as z.infer<typeof designateSchema>,
          session.user.id,
          user.role
        );
        break;

      case "ACCEPT_DESIGNATION":
        result = await handleArbitratorAccept(
          emergency,
          session.user.id,
          user.role
        );
        break;

      case "REJECT_DESIGNATION":
        result = await handleArbitratorReject(
          emergency,
          (validatedAction as { rejectionReason?: string }).rejectionReason || "",
          session.user.id,
          user.role
        );
        break;

      case "SUBMIT_RESOLUTION":
        result = await handleResolution(
          emergency,
          validatedAction as z.infer<typeof resolutionSchema>,
          session.user.id,
          user.role
        );
        break;

      case "CONFIRM_PAYMENT":
        result = await handlePaymentConfirmation(
          emergency,
          validatedAction as z.infer<typeof paymentSchema>,
          session.user.id,
          user.role
        );
        break;

      case "LINK_MAIN_CASE":
        result = await handleLinkMainCase(
          emergency,
          validatedAction as z.infer<typeof linkCaseSchema>,
          session.user.id,
          user.role
        );
        break;

      case "ARCHIVE":
        result = await handleArchive(
          emergency,
          (validatedAction as z.infer<typeof archiveSchema>).reason,
          session.user.id,
          user.role
        );
        break;

      case "ESCALATE":
        result = await handleEscalate(
          emergency,
          session.user.id,
          user.role
        );
        break;

      case "MARK_EXPIRED":
        result = await handleExpire(
          emergency,
          (validatedAction as { reason: string }).reason,
          session.user.id,
          user.role
        );
        break;

      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error executing action:", error);
    return NextResponse.json(
      { error: "Error al ejecutar acción" },
      { status: 500 }
    );
  }
}

// Handlers para cada acción
async function handleVerification(
  emergency: any,
  data: z.infer<typeof verifySchema>,
  userId: string,
  role: string
) {
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(role)) {
    throw new Error("No autorizado");
  }

  const now = new Date();

  if (data.isComplete) {
    // Verificación exitosa - pasar a pendiente de pago
    const paymentDueAt = addBusinessDays(now, PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO);

    // Calcular tasa de emergencia
    const fee = calculateEmergencyFee("NACIONAL"); // TODO: determinar si es internacional

    // Crear orden de pago
    const year = new Date().getFullYear();
    const lastOrder = await prisma.paymentOrder.findFirst({
      where: { orderNumber: { startsWith: `OP-${year}-` } },
      orderBy: { orderNumber: "desc" },
    });
    const sequence = lastOrder
      ? parseInt(lastOrder.orderNumber.split("-")[2]) + 1
      : 1;
    const orderNumber = `OP-${year}-${sequence.toString().padStart(6, "0")}`;

    // Si hay caso asociado, crear orden de pago
    if (emergency.caseId) {
      await prisma.paymentOrder.create({
        data: {
          caseId: emergency.caseId,
          orderNumber,
          concept: "TASA_EMERGENCIA",
          description: "Tasa de arbitraje de emergencia",
          amountCents: fee.baseFee,
          igvCents: fee.igv,
          totalCents: fee.totalFee,
          currency: fee.currency,
          dueAt: paymentDueAt,
          blocksCase: true,
          createdById: userId,
        },
      });
    }

    const updated = await prisma.emergencyRequest.update({
      where: { id: emergency.id },
      data: {
        status: "PENDING_PAYMENT",
        verificationCompletedAt: now,
        verificationById: userId,
        verificationNotes: data.notes,
        missingRequirements: [],
        paymentDueAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        centerId: emergency.centerId,
        caseId: emergency.caseId,
        userId,
        action: "UPDATE",
        entity: "EmergencyRequest",
        entityId: emergency.id,
        meta: {
          action: "VERIFY",
          result: "COMPLETE",
          paymentDueAt: paymentDueAt.toISOString(),
        },
      },
    });

    return { success: true, message: "Verificación completada", data: updated };
  } else {
    // Verificación fallida
    const updated = await prisma.emergencyRequest.update({
      where: { id: emergency.id },
      data: {
        status: "VERIFICATION_FAILED",
        verificationCompletedAt: now,
        verificationById: userId,
        verificationNotes: data.notes,
        missingRequirements: data.missingRequirements || [],
      },
    });

    await prisma.auditLog.create({
      data: {
        centerId: emergency.centerId,
        caseId: emergency.caseId,
        userId,
        action: "UPDATE",
        entity: "EmergencyRequest",
        entityId: emergency.id,
        meta: {
          action: "VERIFY",
          result: "FAILED",
          missingRequirements: data.missingRequirements,
        },
      },
    });

    return {
      success: true,
      message: "Verificación fallida - requiere subsanación",
      data: updated,
    };
  }
}

async function handleDesignation(
  emergency: any,
  data: z.infer<typeof designateSchema>,
  userId: string,
  role: string
) {
  if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(role)) {
    throw new Error("No autorizado para designar árbitro");
  }

  // Verificar que el árbitro existe y está activo
  const arbitrator = await prisma.arbitratorRegistry.findUnique({
    where: { userId: data.arbitratorId },
  });

  if (!arbitrator || arbitrator.status !== "ACTIVE") {
    throw new Error("Árbitro no disponible");
  }

  if (!arbitrator.acceptsEmergency) {
    throw new Error("El árbitro no acepta casos de emergencia");
  }

  const now = new Date();

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "PENDING_ACCEPTANCE",
      emergencyArbitratorId: data.arbitratorId,
      arbitratorDesignatedAt: now,
      arbitratorDesignatedById: userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "DESIGNATE_ARBITRATOR",
        arbitratorId: data.arbitratorId,
      },
    },
  });

  return { success: true, message: "Árbitro designado", data: updated };
}

async function handleArbitratorAccept(
  emergency: any,
  userId: string,
  role: string
) {
  if (emergency.emergencyArbitratorId !== userId) {
    throw new Error("Solo el árbitro designado puede aceptar");
  }

  const now = new Date();
  const resolutionDueAt = addBusinessDays(now, PLAZOS_EMERGENCIA.RESOLUCION_ARBITRO);

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "IN_PROCESS",
      arbitratorAcceptedAt: now,
      resolutionDueAt,
    },
  });

  // Actualizar caso si existe
  if (emergency.caseId) {
    await prisma.case.update({
      where: { id: emergency.caseId },
      data: {
        status: "EMERGENCY_IN_PROCESS",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "ACCEPT_DESIGNATION",
        resolutionDueAt: resolutionDueAt.toISOString(),
      },
    },
  });

  return { success: true, message: "Designación aceptada", data: updated };
}

async function handleArbitratorReject(
  emergency: any,
  reason: string,
  userId: string,
  role: string
) {
  if (emergency.emergencyArbitratorId !== userId) {
    throw new Error("Solo el árbitro designado puede rechazar");
  }

  const now = new Date();

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "PENDING_DESIGNATION",
      arbitratorRejectedAt: now,
      arbitratorRejectionReason: reason,
      emergencyArbitratorId: null,
      arbitratorDesignatedAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "REJECT_DESIGNATION",
        reason,
      },
    },
  });

  return {
    success: true,
    message: "Designación rechazada - pendiente nueva designación",
    data: updated,
  };
}

async function handleResolution(
  emergency: any,
  data: z.infer<typeof resolutionSchema>,
  userId: string,
  role: string
) {
  if (emergency.emergencyArbitratorId !== userId) {
    throw new Error("Solo el árbitro asignado puede emitir resolución");
  }

  const now = new Date();
  const principalDueAt = addBusinessDays(now, PLAZOS_EMERGENCIA.SOLICITUD_PRINCIPAL);

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "PENDING_MAIN_CASE",
      resolution: data.resolution,
      resolvedAt: now,
      principalRequestDueAt: principalDueAt,
      metadata: {
        ...(emergency.metadata || {}),
        resolutionMetadata: data.metadata,
      },
    },
  });

  // Actualizar caso si existe
  if (emergency.caseId) {
    await prisma.case.update({
      where: { id: emergency.caseId },
      data: {
        status: "EMERGENCY_RESOLVED",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "SUBMIT_RESOLUTION",
        principalRequestDueAt: principalDueAt.toISOString(),
      },
    },
  });

  return {
    success: true,
    message: "Resolución emitida - pendiente caso principal",
    data: updated,
  };
}

async function handlePaymentConfirmation(
  emergency: any,
  data: z.infer<typeof paymentSchema>,
  userId: string,
  role: string
) {
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(role)) {
    throw new Error("No autorizado");
  }

  const now = new Date();
  const designationDueAt = addBusinessDays(now, PLAZOS_EMERGENCIA.DESIGNACION_ARBITRO);

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "PENDING_DESIGNATION",
      paymentConfirmedAt: now,
      paymentOrderId: data.paymentId,
      designationDueAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "CONFIRM_PAYMENT",
        paymentId: data.paymentId,
      },
    },
  });

  return { success: true, message: "Pago confirmado", data: updated };
}

async function handleLinkMainCase(
  emergency: any,
  data: z.infer<typeof linkCaseSchema>,
  userId: string,
  role: string
) {
  if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(role)) {
    throw new Error("No autorizado");
  }

  // Verificar que el caso existe
  const mainCase = await prisma.case.findUnique({
    where: { id: data.mainCaseId },
  });

  if (!mainCase) {
    throw new Error("Caso principal no encontrado");
  }

  const now = new Date();

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "COMPLETED",
      mainCaseId: data.mainCaseId,
      mainCaseSubmittedAt: now,
    },
  });

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "LINK_MAIN_CASE",
        mainCaseId: data.mainCaseId,
      },
    },
  });

  return {
    success: true,
    message: "Caso principal vinculado - emergencia completada",
    data: updated,
  };
}

async function handleArchive(
  emergency: any,
  reason: string,
  userId: string,
  role: string
) {
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    throw new Error("No autorizado para archivar");
  }

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "ARCHIVED",
      metadata: {
        ...(emergency.metadata || {}),
        archivedAt: new Date().toISOString(),
        archivedBy: userId,
        archiveReason: reason,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "ARCHIVE",
        reason,
      },
    },
  });

  return { success: true, message: "Solicitud archivada", data: updated };
}

async function handleEscalate(
  emergency: any,
  userId: string,
  role: string
) {
  if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(role)) {
    throw new Error("No autorizado para escalar");
  }

  // Crear notificación de escalamiento (el sistema de notificaciones lo manejará)
  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "ESCALATE",
        escalatedAt: new Date().toISOString(),
      },
    },
  });

  return {
    success: true,
    message: "Solicitud escalada - notificación enviada al Consejo Superior",
  };
}

async function handleExpire(
  emergency: any,
  reason: string,
  userId: string,
  role: string
) {
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    throw new Error("No autorizado");
  }

  const now = new Date();

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: {
      status: "EXPIRED",
      expiredAt: now,
      expirationReason: reason,
    },
  });

  // Actualizar caso si existe
  if (emergency.caseId) {
    await prisma.case.update({
      where: { id: emergency.caseId },
      data: {
        status: "EMERGENCY_EXPIRED",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      centerId: emergency.centerId,
      caseId: emergency.caseId,
      userId,
      action: "UPDATE",
      entity: "EmergencyRequest",
      entityId: emergency.id,
      meta: {
        action: "MARK_EXPIRED",
        reason,
      },
    },
  });

  return { success: true, message: "Solicitud marcada como caducada", data: updated };
}
