/**
 * CAARD - API para Revisar Fraccionamiento (Admin)
 * POST: Aprobar o rechazar solicitud de fraccionamiento
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  // Si se aprueba, se pueden ajustar los parámetros
  adjustedInstallments: z.number().min(2).max(12).optional(),
  adjustedFirstDueDate: z.string().datetime().optional(),
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo admins pueden revisar
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action, notes, rejectionReason, adjustedInstallments, adjustedFirstDueDate } = validation.data;

    // Obtener la solicitud
    const plan = await prisma.paymentInstallmentPlan.findUnique({
      where: { id },
      include: {
        case: true,
        requestedBy: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que está pendiente
    if (plan.status !== "PENDING") {
      return NextResponse.json(
        { error: "Esta solicitud ya fue revisada" },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      // Rechazar la solicitud
      const updatedPlan = await prisma.paymentInstallmentPlan.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
          rejectionReason: rejectionReason || "Solicitud rechazada por el administrador",
        },
      });

      // Notificar al solicitante
      await prisma.notification.create({
        data: {
          userId: plan.requestedById,
          type: "PAYMENT",
          title: "Solicitud de fraccionamiento rechazada",
          message: `Su solicitud de fraccionamiento para el caso ${plan.case.code} ha sido rechazada.${rejectionReason ? ` Motivo: ${rejectionReason}` : ""}`,
          metadata: {
            planId: plan.id,
            caseId: plan.caseId,
          },
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Solicitud rechazada",
        data: {
          id: updatedPlan.id,
          status: updatedPlan.status,
          rejectionReason: updatedPlan.rejectionReason,
        },
      });
    }

    // APROBAR - Crear las cuotas
    const numberOfInstallments = adjustedInstallments || plan.numberOfInstallments;
    const totalAmount = plan.totalAmountCents;
    const baseInstallmentAmount = Math.floor(totalAmount / numberOfInstallments);
    const remainder = totalAmount - baseInstallmentAmount * numberOfInstallments;

    const firstDueDate = adjustedFirstDueDate
      ? new Date(adjustedFirstDueDate)
      : plan.firstDueDate;

    // Crear las cuotas individuales
    const installmentsData = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      // La última cuota absorbe el resto para que sume exactamente el total
      const amount = i === numberOfInstallments - 1
        ? baseInstallmentAmount + remainder
        : baseInstallmentAmount;

      // Calcular fecha de vencimiento (cada 30 días)
      const dueDate = new Date(firstDueDate);
      dueDate.setDate(dueDate.getDate() + i * 30);

      installmentsData.push({
        planId: plan.id,
        installmentNumber: i + 1,
        amountCents: amount,
        currency: "PEN",
        dueAt: dueDate,
        status: "PENDING" as const,
      });
    }

    // Actualizar el plan y crear cuotas en una transacción
    const [updatedPlan] = await prisma.$transaction([
      prisma.paymentInstallmentPlan.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
          numberOfInstallments,
          installmentAmountCents: baseInstallmentAmount,
          firstDueDate,
        },
      }),
      prisma.paymentInstallment.createMany({
        data: installmentsData,
      }),
      // Actualizar la orden de pago original para indicar que está fraccionada
      prisma.paymentOrder.update({
        where: { id: plan.paymentOrderId },
        data: {
          metadata: {
            ...(typeof plan.case === "object" ? {} : {}),
            installmentPlanId: plan.id,
            isInstallment: true,
          },
        },
      }),
    ]);

    // Activar el plan
    await prisma.paymentInstallmentPlan.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    // Notificar al solicitante
    await prisma.notification.create({
      data: {
        userId: plan.requestedById,
        type: "PAYMENT",
        title: "Solicitud de fraccionamiento aprobada",
        message: `Su solicitud de fraccionamiento para el caso ${plan.case.code} ha sido aprobada. Se han generado ${numberOfInstallments} cuotas.`,
        metadata: {
          planId: plan.id,
          caseId: plan.caseId,
          installments: numberOfInstallments,
        },
        isRead: false,
      },
    });

    // Obtener las cuotas creadas
    const installments = await prisma.paymentInstallment.findMany({
      where: { planId: plan.id },
      orderBy: { installmentNumber: "asc" },
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud aprobada. Se han generado las cuotas.",
      data: {
        id: updatedPlan.id,
        status: "ACTIVE",
        numberOfInstallments,
        installments: installments.map((inst) => ({
          id: inst.id,
          number: inst.installmentNumber,
          amount: inst.amountCents / 100,
          dueAt: inst.dueAt,
          status: inst.status,
        })),
      },
    });
  } catch (error) {
    console.error("Error reviewing installment plan:", error);
    return NextResponse.json(
      { error: "Error al procesar la revisión" },
      { status: 500 }
    );
  }
}
