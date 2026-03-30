/**
 * CAARD - API de Verificacion de Acceso a Laudos
 * GET: Verificar si el usuario actual tiene acceso a un laudo especifico
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const FULL_ACCESS_ROLES = [
  "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "ARBITRO",
];

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`laudos:access:${ip}`, RATE_LIMITS.api);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intente mas tarde." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const laudoId = searchParams.get("laudoId");

    if (!laudoId) {
      return NextResponse.json(
        { error: "Se requiere el parametro laudoId" },
        { status: 400 }
      );
    }

    // Verificar que el laudo existe
    const laudo = await prisma.laudo.findUnique({
      where: { id: laudoId },
      select: { id: true, accessLevel: true },
    });

    if (!laudo) {
      return NextResponse.json({ error: "Laudo no encontrado" }, { status: 404 });
    }

    // Laudos FREE: todos tienen acceso
    if (laudo.accessLevel === "FREE") {
      return NextResponse.json({
        hasAccess: true,
        grantType: "FREE",
      });
    }

    // Roles con acceso completo
    const userRole = session.user.role;
    if (userRole && FULL_ACCESS_ROLES.includes(userRole)) {
      return NextResponse.json({
        hasAccess: true,
        grantType: "ROLE_BASED",
      });
    }

    const userId = session.user.id;

    // Verificar acceso individual en LaudoAccess
    const access = await prisma.laudoAccess.findUnique({
      where: { userId_laudoId: { userId, laudoId } },
    });

    if (access) {
      if (!access.expiresAt || access.expiresAt > new Date()) {
        return NextResponse.json({
          hasAccess: true,
          grantType: access.grantType,
          expiresAt: access.expiresAt?.toISOString() || null,
        });
      }
    }

    // Verificar suscripcion activa
    const subscription = await prisma.laudoSubscription.findFirst({
      where: {
        userId,
        status: "SUB_ACTIVE",
        endDate: { gte: new Date() },
      },
    });

    if (subscription) {
      return NextResponse.json({
        hasAccess: true,
        grantType: "SUBSCRIPTION",
        expiresAt: subscription.endDate?.toISOString() || null,
      });
    }

    return NextResponse.json({
      hasAccess: false,
    });
  } catch (error) {
    console.error("Error checking laudo access:", error);
    return NextResponse.json(
      { error: "Error al verificar acceso" },
      { status: 500 }
    );
  }
}
