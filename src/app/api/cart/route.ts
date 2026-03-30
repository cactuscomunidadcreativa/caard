/**
 * CAARD - API del Carrito de Compras
 * GET: Obtener carrito del usuario con items
 * POST: Agregar item al carrito
 * DELETE: Vaciar carrito completo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addItemSchema = z.object({
  itemType: z.enum(["CART_COURSE", "CART_PRODUCT", "CART_LAUDO", "CART_SUBSCRIPTION"]),
  courseId: z.string().optional(),
  productId: z.string().optional(),
  laudoId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

/**
 * Busca el precio del item segun su tipo
 */
async function lookupPrice(
  itemType: string,
  ids: { courseId?: string; productId?: string; laudoId?: string }
): Promise<{ priceCents: number; currency: string } | null> {
  switch (itemType) {
    case "CART_COURSE": {
      if (!ids.courseId) return null;
      const course = await prisma.course.findUnique({
        where: { id: ids.courseId },
        select: { priceCents: true, currency: true, isFree: true },
      });
      if (!course || course.isFree) return null;
      return { priceCents: course.priceCents || 0, currency: course.currency };
    }
    case "CART_PRODUCT": {
      if (!ids.productId) return null;
      const product = await prisma.storeProduct.findUnique({
        where: { id: ids.productId },
        select: { priceCents: true, currency: true },
      });
      if (!product) return null;
      return { priceCents: product.priceCents, currency: product.currency };
    }
    case "CART_LAUDO": {
      if (!ids.laudoId) return null;
      const laudo = await prisma.laudo.findUnique({
        where: { id: ids.laudoId },
        select: { priceCents: true, currency: true, accessLevel: true },
      });
      if (!laudo || laudo.accessLevel === "FREE" || !laudo.priceCents) return null;
      return { priceCents: laudo.priceCents, currency: laudo.currency };
    }
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({
        items: [],
        totalItems: 0,
        totalCents: 0,
      });
    }

    const totalCents = cart.items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0
    );

    return NextResponse.json({
      id: cart.id,
      items: cart.items,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      totalCents,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Error al obtener carrito" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = addItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validar que se proporcione el ID correcto segun el tipo
    if (data.itemType === "CART_COURSE" && !data.courseId) {
      return NextResponse.json(
        { error: "Se requiere courseId para items tipo CART_COURSE" },
        { status: 400 }
      );
    }
    if (data.itemType === "CART_PRODUCT" && !data.productId) {
      return NextResponse.json(
        { error: "Se requiere productId para items tipo CART_PRODUCT" },
        { status: 400 }
      );
    }
    if (data.itemType === "CART_LAUDO" && !data.laudoId) {
      return NextResponse.json(
        { error: "Se requiere laudoId para items tipo CART_LAUDO" },
        { status: 400 }
      );
    }

    // Buscar precio del item
    const priceInfo = await lookupPrice(data.itemType, {
      courseId: data.courseId,
      productId: data.productId,
      laudoId: data.laudoId,
    });

    if (!priceInfo) {
      return NextResponse.json(
        { error: "Item no encontrado o no tiene precio asignado" },
        { status: 404 }
      );
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Auto-crear carrito si no existe
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          centerId: center.id,
          userId: session.user.id,
        },
      });
    }

    // Verificar si el item ya existe en el carrito
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        itemType: data.itemType as any,
        ...(data.courseId && { courseId: data.courseId }),
        ...(data.productId && { productId: data.productId }),
        ...(data.laudoId && { laudoId: data.laudoId }),
      },
    });

    let cartItem;

    if (existingItem) {
      // Actualizar cantidad
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + data.quantity },
      });
    } else {
      // Crear nuevo item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          itemType: data.itemType as any,
          courseId: data.courseId || null,
          productId: data.productId || null,
          laudoId: data.laudoId || null,
          quantity: data.quantity,
          priceCents: priceInfo.priceCents,
          currency: priceInfo.currency,
        },
      });
    }

    return NextResponse.json(cartItem, { status: existingItem ? 200 : 201 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Error al agregar al carrito" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({ message: "Carrito ya esta vacio" });
    }

    // Eliminar todos los items del carrito
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({ message: "Carrito vaciado exitosamente" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json({ error: "Error al vaciar carrito" }, { status: 500 });
  }
}
