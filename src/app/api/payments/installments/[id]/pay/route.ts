/**
 * CAARD - API para Pagar Cuota de Fraccionamiento
 * POST: Registrar pago de una cuota
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const payInstallmentSchema = z.object({
  installmentId: z.string().min(1, "ID de cuota requerido"),
  paymentMethod: z.enum(["VOUCHER", "ONLINE"]).default("VOUCHER"),
  voucherUrl: z.string().url().optional(),
  transactionId: z.string().optional(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// POST - Registrar pago de cuota
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: planId } = await params;
    const body = await request.json();
    const validation = payInstallmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { installmentId, paymentMethod, voucherUrl, transactionId } = validation.data;

    // Obtener el plan de fraccionamiento
    const plan = await prisma.paymentInstallmentPlan.findUnique({
      where: { id: planId },
      include: {
        case: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        installments: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan de fraccionamiento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar acceso
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role);
    const isCaseMember = plan.case.members.length > 0;
    const isRequester = plan.requestedById === session.user.id;

    if (!isAdmin && !isCaseMember && !isRequester) {
      return NextResponse.json(
        { error: "No tiene acceso a este fraccionamiento" },
        { status: 403 }
      );
    }

    // Verificar que el plan está activo
    if (plan.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "El plan de fraccionamiento no está activo" },
        { status: 400 }
      );
    }

    // Obtener la cuota
    const installment = plan.installments.find((i) => i.id === installmentId);
    if (!installment) {
      return NextResponse.json(
        { error: "Cuota no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la cuota no está pagada
    if (installment.status === "PAID") {
      return NextResponse.json(
        { error: "Esta cuota ya fue pagada" },
        { status: 400 }
      );
    }

    // Verificar que se pagan las cuotas en orden
    const unpaidPreviousInstallments = plan.installments.filter(
      (i) =>
        i.installmentNumber < installment.installmentNumber &&
        i.status !== "PAID"
    );

    if (unpaidPreviousInstallments.length > 0) {
      return NextResponse.json(
        {
          error: "Debe pagar las cuotas anteriores primero",
          pendingInstallments: unpaidPreviousInstallments.map((i) => i.installmentNumber),
        },
        { status: 400 }
      );
    }

    // Para pago con voucher, requerir URL
    if (paymentMethod === "VOUCHER" && !voucherUrl) {
      return NextResponse.json(
        { error: "Debe adjuntar el comprobante de pago" },
        { status: 400 }
      );
    }

    // Actualizar la cuota
    const updatedInstallment = await prisma.paymentInstallment.update({
      where: { id: installmentId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        voucherUrl,
        paymentId: transactionId,
      },
    });

    // Verificar si todas las cuotas están pagadas
    const allPaid = plan.installments.every(
      (i) => i.id === installmentId || i.status === "PAID"
    );

    if (allPaid) {
      // Marcar el plan como completado
      await prisma.paymentInstallmentPlan.update({
        where: { id: planId },
        data: { status: "COMPLETED" },
      });

      // Actualizar la orden de pago original como pagada
      await prisma.paymentOrder.update({
        where: { id: plan.paymentOrderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Notificar al solicitante
      await prisma.notification.create({
        data: {
          userId: plan.requestedById,
          type: "PAYMENT",
          title: "Fraccionamiento completado",
          message: `Ha completado el pago de todas las cuotas para el caso ${plan.case.code}.`,
          metadata: {
            planId: plan.id,
            caseId: plan.caseId,
          },
          isRead: false,
        },
      });
    }

    // Calcular cuotas restantes
    const remainingInstallments = plan.installments.filter(
      (i) => i.id !== installmentId && i.status !== "PAID"
    ).length;

    return NextResponse.json({
      success: true,
      message: paymentMethod === "VOUCHER"
        ? "Comprobante registrado. Será verificado por el administrador."
        : "Pago registrado exitosamente.",
      data: {
        installmentId: updatedInstallment.id,
        installmentNumber: installment.installmentNumber,
        amount: installment.amountCents / 100,
        status: updatedInstallment.status,
        paidAt: updatedInstallment.paidAt,
        remainingInstallments,
        planCompleted: allPaid,
      },
    });
  } catch (error) {
    console.error("Error paying installment:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
