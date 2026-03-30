/**
 * CAARD - API de Checkout
 * POST: Crear orden desde carrito, calcular impuestos, procesar pago
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  // Info de contacto (para invitados)
  guestEmail: z.string().email().optional(),
  guestName: z.string().max(200).optional(),
  guestPhone: z.string().max(20).optional(),
  // Envío (si hay productos físicos)
  shippingAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string().default("Perú"),
    })
    .optional(),
  // Pago
  culqiToken: z.string().optional(), // Token de Culqi para tarjeta
  paymentMethod: z.enum(["CULQI", "TRANSFERENCIA", "YAPE"]).default("CULQI"),
  // Notas
  customerNotes: z.string().max(500).optional(),
});

/**
 * Genera número de orden correlativo: ORD-2026-000001
 */
async function generateOrderNumber(centerId: string): Promise<string> {
  const year = new Date().getFullYear();
  const lastOrder = await prisma.storeOrder.findFirst({
    where: {
      centerId,
      orderNumber: { startsWith: `ORD-${year}-` },
    },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let sequence = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    sequence = parseInt(parts[2] || "0") + 1;
  }

  return `ORD-${year}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Calcula impuestos para un monto dado
 */
async function calculateTaxes(
  centerId: string,
  subtotalCents: number,
  itemTypes: { hasCourses: boolean; hasProducts: boolean; hasLaudos: boolean; hasServices: boolean }
) {
  const taxConfigs = await prisma.commerceTaxConfig.findMany({
    where: { centerId, isActive: true },
  });

  let igvCents = 0;
  let detraccionCents = 0;
  let percepcionCents = 0;

  for (const tax of taxConfigs) {
    // Verificar si aplica a los tipos de items
    const applies =
      (itemTypes.hasCourses && tax.appliesToCourses) ||
      (itemTypes.hasProducts && tax.appliesToProducts) ||
      (itemTypes.hasLaudos && tax.appliesToLaudos) ||
      (itemTypes.hasServices && tax.appliesToServices);

    if (!applies) continue;

    // Verificar umbral mínimo
    if (tax.thresholdCents && subtotalCents < tax.thresholdCents) continue;

    const taxAmount = Math.round(subtotalCents * tax.rate);

    switch (tax.type) {
      case "IGV":
        igvCents += taxAmount;
        break;
      case "DETRACCION":
        detraccionCents += taxAmount;
        break;
      case "PERCEPCION":
        percepcionCents += taxAmount;
        break;
    }
  }

  return { igvCents, detraccionCents, percepcionCents };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`checkout:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espere un momento." },
        { status: 429 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id;

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que hay usuario o datos de invitado
    if (!userId && !data.guestEmail) {
      return NextResponse.json(
        { error: "Debe iniciar sesión o proporcionar un email" },
        { status: 400 }
      );
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Obtener carrito del usuario
    if (!userId) {
      return NextResponse.json(
        { error: "Debe iniciar sesión para completar la compra" },
        { status: 401 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    // Calcular subtotal y detectar tipos de items
    let subtotalCents = 0;
    const itemTypes = {
      hasCourses: false,
      hasProducts: false,
      hasLaudos: false,
      hasServices: false,
    };
    let requiresShipping = false;

    const orderItems: Array<{
      itemType: "COURSE" | "PRODUCT" | "LAUDO" | "SUBSCRIPTION";
      courseId?: string;
      productId?: string;
      laudoId?: string;
      title: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
      currency: string;
    }> = [];

    for (const item of cart.items) {
      const itemTotal = item.priceCents * item.quantity;
      subtotalCents += itemTotal;

      if (item.courseId) {
        itemTypes.hasCourses = true;
        const course = await prisma.course.findUnique({
          where: { id: item.courseId },
          select: { title: true },
        });
        orderItems.push({
          itemType: "COURSE",
          courseId: item.courseId,
          title: course?.title || "Curso",
          quantity: item.quantity,
          unitPriceCents: item.priceCents,
          totalCents: itemTotal,
          currency: item.currency,
        });
      } else if (item.productId) {
        const product = await prisma.storeProduct.findUnique({
          where: { id: item.productId },
          select: { title: true, type: true, requiresShipping: true },
        });
        if (product?.type === "SERVICE") {
          itemTypes.hasServices = true;
        } else {
          itemTypes.hasProducts = true;
        }
        if (product?.requiresShipping) requiresShipping = true;
        orderItems.push({
          itemType: "PRODUCT",
          productId: item.productId,
          title: product?.title || "Producto",
          quantity: item.quantity,
          unitPriceCents: item.priceCents,
          totalCents: itemTotal,
          currency: item.currency,
        });
      } else if (item.laudoId) {
        itemTypes.hasLaudos = true;
        const laudo = await prisma.laudo.findUnique({
          where: { id: item.laudoId },
          select: { title: true },
        });
        orderItems.push({
          itemType: "LAUDO",
          laudoId: item.laudoId,
          title: laudo?.title || "Laudo",
          quantity: 1,
          unitPriceCents: item.priceCents,
          totalCents: itemTotal,
          currency: item.currency,
        });
      }
    }

    // Calcular impuestos
    const taxes = await calculateTaxes(center.id, subtotalCents, itemTypes);

    // Calcular envío (simplificado)
    const shippingCents = requiresShipping ? 1500 : 0; // S/ 15 flat rate

    const totalCents =
      subtotalCents + taxes.igvCents + taxes.percepcionCents + shippingCents;

    // Generar número de orden
    const orderNumber = await generateOrderNumber(center.id);

    // Crear orden
    const order = await prisma.storeOrder.create({
      data: {
        centerId: center.id,
        orderNumber,
        userId,
        guestEmail: data.guestEmail,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        status: "PENDING_PAYMENT",
        subtotalCents,
        igvCents: taxes.igvCents,
        detraccionCents: taxes.detraccionCents,
        percepcionCents: taxes.percepcionCents,
        shippingCents,
        totalCents,
        currency: cart.items[0]?.currency || "PEN",
        shippingAddress: requiresShipping ? data.shippingAddress : undefined,
        paymentProvider: data.paymentMethod,
        customerNotes: data.customerNotes,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Procesar pago con Culqi si hay token
    if (data.culqiToken && data.paymentMethod === "CULQI") {
      try {
        const { createCharge, isCulqiConfigured } = await import("@/lib/culqi/client");

        if (isCulqiConfigured()) {
          const email = session?.user?.email || data.guestEmail || "";
          const chargeResult = await createCharge({
            amount: totalCents,
            currency: order.currency as "PEN" | "USD",
            email,
            sourceId: data.culqiToken,
            description: `Orden ${orderNumber} - CAARD`,
            metadata: {
              order_id: order.id,
              order_number: orderNumber,
              user_id: userId || "",
            },
          });

          if (chargeResult.success && chargeResult.charge) {
            // Actualizar orden como pagada
            await prisma.storeOrder.update({
              where: { id: order.id },
              data: {
                status: "ORDER_PAID",
                paymentStatus: "CONFIRMED",
                culqiChargeId: chargeResult.charge.id,
                culqiRaw: chargeResult.charge as any,
                paidAt: new Date(),
              },
            });

            // Crear inscripciones para cursos
            for (const item of orderItems) {
              if (item.itemType === "COURSE" && item.courseId) {
                await prisma.enrollment.upsert({
                  where: {
                    courseId_userId: { courseId: item.courseId, userId },
                  },
                  update: {
                    status: "ENROLLED",
                    orderId: order.id,
                    enrolledAt: new Date(),
                    paidAmountCents: item.totalCents,
                  },
                  create: {
                    courseId: item.courseId,
                    userId,
                    status: "ENROLLED",
                    orderId: order.id,
                    enrolledAt: new Date(),
                    paidAmountCents: item.totalCents,
                    currency: item.currency,
                  },
                });

                // Incrementar contador de inscritos
                await prisma.course.update({
                  where: { id: item.courseId },
                  data: { currentEnrolled: { increment: 1 } },
                });
              }

              // Otorgar acceso a laudos
              if (item.itemType === "LAUDO" && item.laudoId) {
                await prisma.laudoAccess.upsert({
                  where: {
                    userId_laudoId: { userId, laudoId: item.laudoId },
                  },
                  update: {
                    grantType: "PURCHASE",
                    grantedAt: new Date(),
                    orderId: order.id,
                  },
                  create: {
                    userId,
                    laudoId: item.laudoId,
                    grantType: "PURCHASE",
                    orderId: order.id,
                  },
                });
              }
            }

            // Vaciar carrito
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

            return NextResponse.json({
              success: true,
              order: {
                id: order.id,
                orderNumber,
                status: "ORDER_PAID",
                totalCents,
                currency: order.currency,
              },
              payment: {
                chargeId: chargeResult.charge.id,
                status: "CONFIRMED",
              },
            });
          } else {
            // Pago falló
            return NextResponse.json(
              {
                error: "Error al procesar el pago",
                user_message:
                  chargeResult.error?.user_message ||
                  "No se pudo completar el pago. Intente con otra tarjeta.",
                orderId: order.id,
                orderNumber,
              },
              { status: 400 }
            );
          }
        }
      } catch (paymentError) {
        console.error("Payment error:", paymentError);
      }
    }

    // Si no hay pago inmediato, retornar orden pendiente
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber,
        status: "PENDING_PAYMENT",
        subtotalCents,
        igvCents: taxes.igvCents,
        detraccionCents: taxes.detraccionCents,
        percepcionCents: taxes.percepcionCents,
        shippingCents,
        totalCents,
        currency: order.currency,
        items: orderItems,
      },
    });
  } catch (error) {
    console.error("Error in checkout:", error);
    return NextResponse.json(
      { error: "Error al procesar la compra" },
      { status: 500 }
    );
  }
}
