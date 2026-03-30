/**
 * CAARD - API de Laudo individual
 * GET: Obtener laudo por slug (control de acceso PREMIUM)
 * PUT: Actualizar laudo (requiere autenticacion)
 * DELETE: Eliminar laudo (requiere autenticacion)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const FULL_ACCESS_ROLES = [
  "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "ARBITRO",
];

const updateLaudoSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(500).optional(),
  summary: z.string().max(2000).optional().nullable(),
  fullPdfUrl: z.string().url().optional().nullable(),
  accessLevel: z.enum(["FREE", "PREMIUM"]).optional(),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).optional(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  arbitrationType: z.string().max(200).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  claimAmountRange: z.string().max(100).optional().nullable(),
  result: z.string().max(200).optional().nullable(),
  arbitratorCount: z.number().int().min(1).max(5).optional().nullable(),
  isAnonymized: z.boolean().optional(),
  pageCount: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

/**
 * Verifica si el usuario tiene acceso a un laudo PREMIUM
 */
async function checkLaudoAccess(
  userId: string | undefined,
  userRole: string | undefined,
  laudoId: string
): Promise<{ hasAccess: boolean; grantType?: string }> {
  // Roles con acceso completo
  if (userRole && FULL_ACCESS_ROLES.includes(userRole)) {
    return { hasAccess: true, grantType: "ROLE_BASED" };
  }

  if (!userId) {
    return { hasAccess: false };
  }

  // Verificar acceso individual en LaudoAccess
  const access = await prisma.laudoAccess.findUnique({
    where: { userId_laudoId: { userId, laudoId } },
  });

  if (access) {
    // Verificar si no ha expirado
    if (!access.expiresAt || access.expiresAt > new Date()) {
      return { hasAccess: true, grantType: access.grantType };
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
    return { hasAccess: true, grantType: "SUBSCRIPTION" };
  }

  return { hasAccess: false };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`laudos:get:${ip}`, RATE_LIMITS.api);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intente mas tarde." },
        { status: 429 }
      );
    }

    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const laudo = await prisma.laudo.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!laudo) {
      return NextResponse.json({ error: "Laudo no encontrado" }, { status: 404 });
    }

    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    // Si no esta publicado, solo roles con acceso pueden verlo
    if (!laudo.isPublished && !FULL_ACCESS_ROLES.includes(userRole || "")) {
      return NextResponse.json({ error: "Laudo no encontrado" }, { status: 404 });
    }

    // Control de acceso para laudos PREMIUM
    if (laudo.accessLevel === "PREMIUM") {
      const { hasAccess, grantType } = await checkLaudoAccess(userId, userRole, laudo.id);

      if (!hasAccess) {
        // Retornar laudo sin PDF completo
        const { fullPdfUrl, ...publicData } = laudo;
        return NextResponse.json({
          ...publicData,
          hasAccess: false,
          accessRequired: "PREMIUM",
          priceCents: laudo.priceCents,
        });
      }

      return NextResponse.json({
        ...laudo,
        hasAccess: true,
        grantType,
      });
    }

    // Laudo FREE: acceso completo
    return NextResponse.json({ ...laudo, hasAccess: true });
  } catch (error) {
    console.error("Error fetching laudo:", error);
    return NextResponse.json({ error: "Error al obtener laudo" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      !["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role || "")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validation = updateLaudoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const existing = await prisma.laudo.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Laudo no encontrado" }, { status: 404 });
    }

    const data = validation.data;

    // Si cambia el slug, verificar unicidad
    if (data.slug && data.slug !== slug) {
      const slugConflict = await prisma.laudo.findUnique({
        where: { centerId_slug: { centerId: center.id, slug: data.slug } },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: "Ya existe un laudo con ese slug" },
          { status: 400 }
        );
      }
    }

    const laudo = await prisma.laudo.update({
      where: { id: existing.id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(laudo);
  } catch (error) {
    console.error("Error updating laudo:", error);
    return NextResponse.json({ error: "Error al actualizar laudo" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      !["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role || "")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const existing = await prisma.laudo.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Laudo no encontrado" }, { status: 404 });
    }

    await prisma.laudo.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "Laudo eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting laudo:", error);
    return NextResponse.json({ error: "Error al eliminar laudo" }, { status: 500 });
  }
}
