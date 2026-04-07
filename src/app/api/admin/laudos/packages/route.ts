/**
 * CAARD - API de Paquetes de Laudos
 * GET: Listar paquetes
 * POST: Crear paquete
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  laudoCount: z.number().int().min(1).default(1),
  priceCents: z.number().int().min(0),
  currency: z.string().default("PEN"),
  validDays: z.number().int().min(1).default(365),
  discountPercent: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
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

    const where = session.user.centerId ? { centerId: session.user.centerId } : {};

    const packages = await prisma.laudoPackage.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: packages.length,
      active: packages.filter((p) => p.isActive).length,
      sales: 0,
    };

    return NextResponse.json({ data: packages, stats });
  } catch (error) {
    console.error("Error fetching laudo packages:", error);
    return NextResponse.json({ error: "Error al obtener paquetes" }, { status: 500 });
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

    if (!session.user.centerId) {
      return NextResponse.json({ error: "Usuario sin centro asignado" }, { status: 400 });
    }

    const body = await request.json();
    const validation = createPackageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const pkg = await prisma.laudoPackage.create({
      data: {
        centerId: session.user.centerId,
        name: data.name,
        description: data.description,
        laudoCount: data.laudoCount,
        priceCents: data.priceCents,
        currency: data.currency,
        validDays: data.validDays,
        discountPercent: data.discountPercent,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error creating laudo package:", error);
    return NextResponse.json({ error: "Error al crear paquete" }, { status: 500 });
  }
}
