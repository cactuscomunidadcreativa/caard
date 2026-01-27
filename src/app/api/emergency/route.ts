/**
 * API: Arbitraje de Emergencia
 * =============================
 * Gestión completa del flujo de arbitraje de emergencia
 * Plazos estrictos según reglamento (1-4 días hábiles)
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
import { generateEmergencyRequestNumber } from "@/lib/case-code";

// Schema para crear solicitud de emergencia
const createEmergencySchema = z.object({
  centerId: z.string(),
  caseId: z.string().optional(), // Puede no tener caso aún

  // Datos del solicitante
  requesterName: z.string().min(2),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().optional(),

  // Descripción de la emergencia
  title: z.string().min(10),
  description: z.string().min(50),
  urgencyJustification: z.string().min(20),
  requestedMeasures: z.string().min(20),

  // Metadata adicional
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET: Listar solicitudes de emergencia
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get("centerId");
    const status = searchParams.get("status");
    const caseId = searchParams.get("caseId");
    const requesterId = searchParams.get("requesterId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (centerId) where.centerId = centerId;
    if (status) where.status = status;
    if (caseId) where.caseId = caseId;
    if (requesterId) where.requesterId = requesterId;

    // Filtrar por rol
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Roles administrativos ven todo, otros solo lo suyo
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(user.role)) {
      where.requesterId = session.user.id;
    } else if (user.centerId && user.role !== "SUPER_ADMIN") {
      // Admin de centro solo ve su centro
      where.centerId = user.centerId;
    }

    const [emergencies, total] = await Promise.all([
      prisma.emergencyRequest.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emergencyRequest.count({ where }),
    ]);

    // Enriquecer con información de deadlines
    const now = new Date();
    const enrichedEmergencies = emergencies.map((e) => {
      const deadlines: Record<string, { date: Date; isOverdue: boolean; daysRemaining: number }> = {};

      if (e.verificationDueAt) {
        deadlines.verification = {
          date: e.verificationDueAt,
          isOverdue: e.verificationDueAt < now && !e.verificationCompletedAt,
          daysRemaining: Math.ceil(
            (e.verificationDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      }

      if (e.paymentDueAt) {
        deadlines.payment = {
          date: e.paymentDueAt,
          isOverdue: e.paymentDueAt < now && !e.paymentConfirmedAt,
          daysRemaining: Math.ceil(
            (e.paymentDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      }

      if (e.designationDueAt) {
        deadlines.designation = {
          date: e.designationDueAt,
          isOverdue: e.designationDueAt < now && !e.arbitratorDesignatedAt,
          daysRemaining: Math.ceil(
            (e.designationDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      }

      if (e.resolutionDueAt) {
        deadlines.resolution = {
          date: e.resolutionDueAt,
          isOverdue: e.resolutionDueAt < now && !e.resolvedAt,
          daysRemaining: Math.ceil(
            (e.resolutionDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      }

      if (e.principalRequestDueAt) {
        deadlines.principalRequest = {
          date: e.principalRequestDueAt,
          isOverdue: e.principalRequestDueAt < now && !e.mainCaseSubmittedAt,
          daysRemaining: Math.ceil(
            (e.principalRequestDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      }

      return {
        ...e,
        deadlines,
      };
    });

    return NextResponse.json({
      data: enrichedEmergencies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching emergencies:", error);
    return NextResponse.json(
      { error: "Error al obtener solicitudes de emergencia" },
      { status: 500 }
    );
  }
}

// POST: Crear solicitud de emergencia
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createEmergencySchema.parse(body);

    // Verificar que el centro existe
    const center = await prisma.center.findUnique({
      where: { id: validatedData.centerId },
    });

    if (!center) {
      return NextResponse.json({ error: "Centro no encontrado" }, { status: 404 });
    }

    // Si se proporciona caseId, verificar que existe
    if (validatedData.caseId) {
      const caseData = await prisma.case.findUnique({
        where: { id: validatedData.caseId },
      });

      if (!caseData) {
        return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
      }
    }

    // Generar número de solicitud de emergencia
    // Formato: 001-2025-ARBEME/CAARD
    const requestNumber = await generateEmergencyRequestNumber(validatedData.centerId);

    // Calcular plazos de emergencia
    const now = new Date();
    const verificationDueAt = addBusinessDays(now, PLAZOS_EMERGENCIA.VERIFICACION_FORMAL);

    // Crear solicitud
    const emergency = await prisma.emergencyRequest.create({
      data: {
        centerId: validatedData.centerId,
        caseId: validatedData.caseId,
        requestNumber,
        requesterId: session.user.id,
        requesterName: validatedData.requesterName,
        requesterEmail: validatedData.requesterEmail,
        requesterPhone: validatedData.requesterPhone,
        title: validatedData.title,
        description: validatedData.description,
        urgencyJustification: validatedData.urgencyJustification,
        requestedMeasures: validatedData.requestedMeasures,
        status: "REQUESTED",
        requestedAt: now,
        verificationDueAt,
        missingRequirements: [],
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

    // Si hay caso asociado, actualizar su estado
    if (validatedData.caseId) {
      await prisma.case.update({
        where: { id: validatedData.caseId },
        data: {
          status: "EMERGENCY_REQUESTED",
          procedureType: "EMERGENCY",
        },
      });
    }

    // Crear plazo de verificación
    await prisma.processDeadline.create({
      data: {
        caseId: validatedData.caseId || emergency.id, // Si no hay caso, usar ID de emergencia como referencia
        type: "EMERGENCY_VERIFICATION",
        title: "Verificación formal de solicitud de emergencia",
        description: `Verificar requisitos formales de la solicitud ${requestNumber}`,
        startsAt: now,
        businessDays: PLAZOS_EMERGENCIA.VERIFICACION_FORMAL,
        dueAt: verificationDueAt,
        onOverdueAction: "ESCALATE",
        notifyRoles: ["SECRETARIA", "ADMIN"],
        metadata: {
          emergencyRequestId: emergency.id,
          emergencyNumber: requestNumber,
        },
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        centerId: validatedData.centerId,
        caseId: validatedData.caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "EmergencyRequest",
        entityId: emergency.id,
        meta: {
          requestNumber,
          status: "REQUESTED",
          verificationDueAt: verificationDueAt.toISOString(),
        },
      },
    });

    return NextResponse.json(emergency, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating emergency request:", error);
    return NextResponse.json(
      { error: "Error al crear solicitud de emergencia" },
      { status: 500 }
    );
  }
}
