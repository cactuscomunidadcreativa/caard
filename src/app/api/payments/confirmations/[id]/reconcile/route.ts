/**
 * CAARD - API para Reconciliación Contable de una Confirmación de Pago
 *
 * Segunda etapa del flujo de doble verificación:
 *   1. Staff pre-verifica el voucher → status = VERIFIED
 *   2. Finanzas reconcilia contra el estado de cuenta → status = RECONCILED
 *
 * Solo roles FINANZAS, ADMIN y SUPER_ADMIN pueden reconciliar.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reconcileSchema = z.object({
  accountingRef: z.string().min(1, "La referencia contable es obligatoria").max(100),
  notes: z.string().optional(),
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

    // Solo finanzas (o admins) pueden reconciliar
    if (!["SUPER_ADMIN", "ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Solo el personal de finanzas puede reconciliar pagos" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = reconcileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const confirmation = await prisma.paymentConfirmation.findUnique({
      where: { id },
    });
    if (!confirmation) {
      return NextResponse.json({ error: "Confirmación no encontrada" }, { status: 404 });
    }

    // Para reconciliar, primero debe estar verificada por staff.
    if (confirmation.status !== "VERIFIED") {
      return NextResponse.json(
        {
          error:
            confirmation.status === "PENDING_VERIFICATION"
              ? "El voucher aún no fue pre-verificado por la secretaría/staff"
              : `No se puede reconciliar una confirmación en estado ${confirmation.status}`,
        },
        { status: 400 }
      );
    }

    const { accountingRef, notes } = validation.data;

    const updated = await prisma.paymentConfirmation.update({
      where: { id },
      data: {
        status: "RECONCILED",
        reconciledAt: new Date(),
        reconciledById: session.user.id,
        accountingRef,
        // Append a las notas previas, no reemplazar.
        verificationNotes: notes
          ? `${confirmation.verificationNotes || ""}\n[Finanzas ${new Date().toLocaleDateString("es-PE")}] ${notes}`.trim()
          : confirmation.verificationNotes,
      },
    });

    // Audit log
    await prisma.auditLog
      .create({
        data: {
          centerId: confirmation.centerId,
          userId: session.user.id,
          action: "UPDATE",
          entity: "PaymentConfirmation",
          entityId: id,
          meta: {
            transition: "VERIFIED → RECONCILED",
            accountingRef,
          },
        },
      })
      .catch(() => null); // audit log no debe bloquear la operación

    return NextResponse.json({
      success: true,
      message: "Pago reconciliado contablemente",
      data: {
        id: updated.id,
        status: updated.status,
        reconciledAt: updated.reconciledAt,
        accountingRef: updated.accountingRef,
      },
    });
  } catch (error: any) {
    console.error("Error reconciling payment confirmation:", error);
    return NextResponse.json(
      { error: error?.message || "Error al reconciliar" },
      { status: 500 }
    );
  }
}
