/**
 * CAARD - API para crear cargos en Culqi
 * Endpoint: POST /api/payments/culqi/charge
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCharge, isCulqiConfigured } from "@/lib/culqi/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Validar autenticación (opcional para pagos públicos)
    // if (!session?.user) {
    //   return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    // }

    const body = await req.json();
    const {
      token,
      amount,
      currency = "PEN",
      email,
      description,
      orderId,
      paymentOrderId,
      caseId,
      concept,
      metadata = {},
    } = body;

    // Validaciones
    if (!token) {
      return NextResponse.json(
        { error: "Token requerido", user_message: "Error en el proceso de pago" },
        { status: 400 }
      );
    }

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Monto inválido", user_message: "El monto mínimo es S/ 1.00" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email requerido", user_message: "Se requiere un correo electrónico" },
        { status: 400 }
      );
    }

    // Verificar configuración de Culqi
    if (!isCulqiConfigured()) {
      console.error("Culqi not configured");
      return NextResponse.json(
        {
          error: "Pasarela de pagos no configurada",
          user_message: "El sistema de pagos no está disponible en este momento"
        },
        { status: 500 }
      );
    }

    // Buscar el caso si se proporciona
    let caseData = null;
    if (caseId) {
      caseData = await prisma.case.findUnique({
        where: { id: caseId },
        select: { id: true, code: true, centerId: true },
      });
    }

    // Buscar la orden de pago si se proporciona
    let paymentOrder = null;
    if (paymentOrderId) {
      paymentOrder = await prisma.paymentOrder.findUnique({
        where: { id: paymentOrderId },
        include: { case: { select: { id: true, code: true } } },
      });

      if (!paymentOrder) {
        return NextResponse.json(
          { error: "Orden de pago no encontrada", user_message: "La orden de pago no existe" },
          { status: 404 }
        );
      }

      // Verificar que la orden no esté pagada
      if (paymentOrder.status === "PAID") {
        return NextResponse.json(
          { error: "Orden ya pagada", user_message: "Esta orden de pago ya fue procesada" },
          { status: 400 }
        );
      }

      // Verificar monto
      if (paymentOrder.totalCents !== amount) {
        return NextResponse.json(
          {
            error: "Monto no coincide",
            user_message: `El monto debe ser ${formatCurrency(paymentOrder.totalCents, paymentOrder.currency)}`
          },
          { status: 400 }
        );
      }
    }

    // Crear el cargo en Culqi
    const chargeResult = await createCharge({
      amount,
      currency: currency as "PEN" | "USD",
      email,
      sourceId: token,
      description: description || `Pago CAARD - ${concept}`,
      metadata: {
        ...metadata,
        system: "CAARD",
        order_id: orderId || "",
        payment_order_id: paymentOrderId || "",
        case_id: caseId || caseData?.id || paymentOrder?.case?.id || "",
        case_code: caseData?.code || paymentOrder?.case?.code || "",
        concept: concept || "",
        user_id: session?.user?.id || "",
      },
    });

    if (!chargeResult.success || !chargeResult.charge) {
      console.error("Culqi charge failed:", chargeResult.error);
      return NextResponse.json(
        {
          error: chargeResult.error?.merchant_message || "Error al procesar el pago",
          user_message: chargeResult.error?.user_message || "No se pudo completar el pago. Intente con otra tarjeta.",
          culqiError: chargeResult.error,
        },
        { status: 400 }
      );
    }

    const charge = chargeResult.charge;

    // Crear registro de pago en la base de datos
    const payment = await prisma.payment.create({
      data: {
        caseId: caseId || caseData?.id || paymentOrder?.caseId || "",
        provider: "CULQI",
        status: "CONFIRMED", // Culqi confirma inmediatamente si el cargo es exitoso
        currency,
        amountCents: amount,
        concept: concept || "OTROS",
        description: description,
        culqiChargeId: charge.id,
        culqiPaymentMethod: charge.source_id,
        culqiRaw: charge as any,
        paidAt: new Date(),
      },
    });

    // Actualizar la orden de pago si existe
    if (paymentOrder) {
      await prisma.paymentOrder.update({
        where: { id: paymentOrderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Actualizar estado del caso si estaba esperando pago
      if (paymentOrder.case) {
        await prisma.case.update({
          where: { id: paymentOrder.caseId },
          data: {
            status: "ADMITTED", // O el estado que corresponda después del pago
          },
        });
      }
    }

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        action: "PAYMENT_UPDATE",
        entity: "Payment",
        entityId: payment.id,
        userId: session?.user?.id || null,
        meta: {
          paymentId: payment.id,
          chargeId: charge.id,
          amount,
          currency,
          email,
          concept,
          provider: "CULQI",
          paymentOrderId,
          caseId: payment.caseId,
        },
      },
    });

    // TODO: Implementar notificaciones cuando el modelo esté disponible
    // Enviar email de confirmación de pago

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      chargeId: charge.id,
      referenceCode: charge.reference_code,
      amount,
      currency,
      status: "CONFIRMED",
      message: "Pago procesado exitosamente",
    });
  } catch (error) {
    console.error("Error processing Culqi charge:", error);
    return NextResponse.json(
      {
        error: "Error interno",
        user_message: "Ocurrió un error al procesar el pago. Intente nuevamente.",
      },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number, currency: string = "PEN"): string {
  const value = amount / 100;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(value);
}
