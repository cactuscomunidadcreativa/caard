/**
 * CAARD - API para Verificar Confirmación de Pago
 * POST: Verificar o rechazar una confirmación de pago
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifySchema = z.object({
  action: z.enum(["VERIFY", "REJECT"]),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
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

    // Solo admins pueden verificar
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action, notes, rejectionReason } = validation.data;

    // Obtener la confirmación
    const confirmation = await prisma.paymentConfirmation.findUnique({
      where: { id },
    });

    if (!confirmation) {
      return NextResponse.json(
        { error: "Confirmación no encontrada" },
        { status: 404 }
      );
    }

    if (confirmation.status !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: "Esta confirmación ya fue procesada" },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      const updated = await prisma.paymentConfirmation.update({
        where: { id },
        data: {
          status: "REJECTED",
          verificationNotes: notes,
          rejectionReason: rejectionReason || "Rechazado por el administrador",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Confirmación rechazada",
        data: {
          id: updated.id,
          status: updated.status,
        },
      });
    }

    // Verificar el pago
    const updated = await prisma.paymentConfirmation.update({
      where: { id },
      data: {
        status: "VERIFIED",
        voucherVerified: true,
        voucherVerifiedAt: new Date(),
        voucherVerifiedById: session.user.id,
        verificationNotes: notes,
      },
    });

    // Actualizar la orden de pago si corresponde
    if (confirmation.paymentOrderId) {
      await prisma.paymentOrder.update({
        where: { id: confirmation.paymentOrderId },
        data: {
          status: confirmation.differenceType === "EXACT" || confirmation.differenceType === "OVERPAYMENT"
            ? "PAID"
            : "PARTIAL",
          paidAt: confirmation.transactionDate,
        },
      });

      // Si es un pago de cuota de fraccionamiento
      if (confirmation.installmentId) {
        await prisma.paymentInstallment.update({
          where: { id: confirmation.installmentId },
          data: {
            status: "PAID",
            paidAt: confirmation.transactionDate,
            voucherUrl: confirmation.voucherUrl,
            voucherVerifiedAt: new Date(),
            voucherVerifiedById: session.user.id,
          },
        });

        // Verificar si todas las cuotas están pagadas
        const installment = await prisma.paymentInstallment.findUnique({
          where: { id: confirmation.installmentId },
          include: {
            plan: {
              include: {
                installments: true,
              },
            },
          },
        });

        if (installment) {
          const allPaid = installment.plan.installments.every(
            (i) => i.id === confirmation.installmentId || i.status === "PAID"
          );

          if (allPaid) {
            await prisma.paymentInstallmentPlan.update({
              where: { id: installment.planId },
              data: { status: "COMPLETED" },
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago verificado exitosamente",
      data: {
        id: updated.id,
        status: updated.status,
        voucherVerified: updated.voucherVerified,
      },
    });
  } catch (error) {
    console.error("Error verifying payment confirmation:", error);
    return NextResponse.json(
      { error: "Error al verificar pago" },
      { status: 500 }
    );
  }
}
