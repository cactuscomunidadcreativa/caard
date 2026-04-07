/**
 * CAARD - API de Suscripciones a Biblioteca de Laudos
 * GET: Listar suscripciones con datos de usuario
 * POST: Crear nueva suscripción
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  userId: z.string().min(1),
  period: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
  priceCents: z.number().int().min(0),
  currency: z.string().default("PEN"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  autoRenew: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const subscriptions = await prisma.laudoSubscription.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeCount = subscriptions.filter((s) => s.status === "SUB_ACTIVE").length;
    const expiredCount = subscriptions.filter((s) => s.status === "SUB_EXPIRED").length;
    const revenue = subscriptions
      .filter((s) => s.status === "SUB_ACTIVE")
      .reduce((sum, s) => sum + s.priceCents, 0);

    return NextResponse.json({
      data: subscriptions,
      stats: {
        total: subscriptions.length,
        active: activeCount,
        expired: expiredCount,
        revenueCents: revenue,
      },
    });
  } catch (error) {
    console.error("Error fetching laudo subscriptions:", error);
    return NextResponse.json({ error: "Error al obtener suscripciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const sub = await prisma.laudoSubscription.create({
      data: {
        userId: data.userId,
        period: data.period,
        status: "SUB_ACTIVE",
        priceCents: data.priceCents,
        currency: data.currency,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        autoRenew: data.autoRenew ?? false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: sub });
  } catch (error) {
    console.error("Error creating laudo subscription:", error);
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 });
  }
}
