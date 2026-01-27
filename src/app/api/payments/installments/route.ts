/**
 * CAARD - API de Fraccionamiento de Pagos
 * POST: Solicitar fraccionamiento
 * GET: Listar solicitudes de fraccionamiento
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación para solicitud de fraccionamiento
const requestInstallmentSchema = z.object({
  paymentOrderId: z.string().min(1, "Orden de pago requerida"),
  caseId: z.string().optional(), // Optional for admin creation
  numberOfInstallments: z.number().min(2).max(12, "Máximo 12 cuotas"),
  reason: z.string().min(1, "Motivo requerido"),
  firstDueDate: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  totalAmountCents: z.number().optional(), // For admin creation
  createdByAdmin: z.boolean().optional(), // Flag for admin-created plans
});

// POST - Solicitar fraccionamiento
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = requestInstallmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { paymentOrderId, numberOfInstallments, reason, firstDueDate, attachmentUrl, createdByAdmin } = validation.data;

    // Obtener la orden de pago
    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { id: paymentOrderId },
      include: {
        case: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Orden de pago no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso al caso
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role);
    const isCaseMember = paymentOrder.case.members.length > 0;

    if (!isAdmin && !isCaseMember) {
      return NextResponse.json(
        { error: "No tiene acceso a este caso" },
        { status: 403 }
      );
    }

    // If non-admin, check if party requests are enabled
    if (!isAdmin && !createdByAdmin) {
      const setting = await prisma.setting.findFirst({
        where: { key: "installments.allowPartyRequests" },
      });
      if (setting?.value !== "true") {
        return NextResponse.json(
          { error: "Las solicitudes de fraccionamiento están deshabilitadas" },
          { status: 403 }
        );
      }
    }

    // Verificar que la orden está pendiente
    if (paymentOrder.status !== "PENDING") {
      return NextResponse.json(
        { error: "Solo se pueden fraccionar órdenes de pago pendientes" },
        { status: 400 }
      );
    }

    // Verificar que no existe ya una solicitud de fraccionamiento activa
    const existingPlan = await prisma.paymentInstallmentPlan.findFirst({
      where: {
        paymentOrderId,
        status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
      },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "Ya existe una solicitud de fraccionamiento para esta orden" },
        { status: 400 }
      );
    }

    // Calcular monto por cuota
    const totalAmount = paymentOrder.totalCents;
    const installmentAmount = Math.ceil(totalAmount / numberOfInstallments);

    // Fecha de primera cuota (por defecto, 15 días desde hoy)
    const defaultFirstDue = new Date();
    defaultFirstDue.setDate(defaultFirstDue.getDate() + 15);
    const parsedFirstDueDate = firstDueDate ? new Date(firstDueDate) : defaultFirstDue;

    // Determine status - admin-created plans are auto-approved
    const planStatus = isAdmin && createdByAdmin ? "APPROVED" : "PENDING";

    // Crear la solicitud de fraccionamiento
    const installmentPlan = await prisma.paymentInstallmentPlan.create({
      data: {
        caseId: paymentOrder.caseId,
        paymentOrderId,
        requestedById: session.user.id,
        reason,
        attachmentUrl,
        totalAmountCents: totalAmount,
        numberOfInstallments,
        installmentAmountCents: installmentAmount,
        status: planStatus,
        firstDueDate: parsedFirstDueDate,
        ...(planStatus === "APPROVED" && {
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: "Plan creado directamente por administrador",
        }),
      },
    });

    // If auto-approved by admin, create the installments immediately
    if (planStatus === "APPROVED") {
      const installmentsToCreate = [];
      for (let i = 1; i <= numberOfInstallments; i++) {
        const dueDate = new Date(parsedFirstDueDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        // Last installment gets the remainder
        const amount = i === numberOfInstallments
          ? totalAmount - (installmentAmount * (numberOfInstallments - 1))
          : installmentAmount;

        installmentsToCreate.push({
          planId: installmentPlan.id,
          installmentNumber: i,
          amountCents: amount,
          currency: "PEN",
          dueAt: dueDate,
          status: "PENDING" as const,
        });
      }

      await prisma.paymentInstallment.createMany({
        data: installmentsToCreate,
      });

      // Update plan status to ACTIVE since installments are created
      await prisma.paymentInstallmentPlan.update({
        where: { id: installmentPlan.id },
        data: { status: "ACTIVE" },
      });
    }

    // Notificar a los administradores
    const admins = await prisma.user.findMany({
      where: {
        centerId: paymentOrder.case.centerId,
        role: { in: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"] },
        isActive: true,
      },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "PAYMENT" as const,
        title: "Nueva solicitud de fraccionamiento",
        message: `Se ha solicitado fraccionamiento para el caso ${paymentOrder.case.code}`,
        metadata: {
          planId: installmentPlan.id,
          caseId: paymentOrder.caseId,
          caseCode: paymentOrder.case.code,
          amount: totalAmount,
          installments: numberOfInstallments,
        },
        isRead: false,
      })),
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud de fraccionamiento enviada. Será revisada por el administrador.",
      data: {
        id: installmentPlan.id,
        status: installmentPlan.status,
        totalAmount: totalAmount / 100,
        numberOfInstallments,
        installmentAmount: installmentAmount / 100,
        firstDueDate: parsedFirstDueDate,
      },
    });
  } catch (error) {
    console.error("Error creating installment plan:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// GET - Listar solicitudes de fraccionamiento
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role);

    // Construir filtros
    const where: any = {};

    if (caseId) {
      where.caseId = caseId;
    }

    if (status) {
      where.status = status;
    }

    // Si no es admin, solo ver sus propias solicitudes
    if (!isAdmin) {
      where.requestedById = session.user.id;
    }

    const [plans, total] = await Promise.all([
      prisma.paymentInstallmentPlan.findMany({
        where,
        include: {
          case: {
            select: { id: true, code: true, title: true },
          },
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          reviewedBy: {
            select: { id: true, name: true },
          },
          installments: {
            orderBy: { installmentNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentInstallmentPlan.count({ where }),
    ]);

    return NextResponse.json({
      data: plans.map((plan) => ({
        id: plan.id,
        case: plan.case,
        requestedBy: plan.requestedBy,
        requestedAt: plan.requestedAt,
        reason: plan.reason,
        totalAmount: plan.totalAmountCents / 100,
        numberOfInstallments: plan.numberOfInstallments,
        installmentAmount: plan.installmentAmountCents / 100,
        status: plan.status,
        reviewedBy: plan.reviewedBy,
        reviewedAt: plan.reviewedAt,
        reviewNotes: plan.reviewNotes,
        rejectionReason: plan.rejectionReason,
        firstDueDate: plan.firstDueDate,
        installments: plan.installments.map((inst) => ({
          id: inst.id,
          number: inst.installmentNumber,
          amount: inst.amountCents / 100,
          dueAt: inst.dueAt,
          paidAt: inst.paidAt,
          status: inst.status,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching installment plans:", error);
    return NextResponse.json(
      { error: "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}
