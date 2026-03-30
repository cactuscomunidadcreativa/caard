/**
 * CAARD - API de Configuración Tributaria Comercial
 * GET: Listar configuraciones de impuestos
 * POST: Crear nueva regla fiscal
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const taxConfigSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["IGV", "DETRACCION", "PERCEPCION", "RETENCION_4TA", "RETENCION_IGV", "IR", "EXONERADO"]),
  rate: z.number().min(0).max(1), // 0.18 = 18%
  isActive: z.boolean().default(true),
  thresholdCents: z.number().int().nonnegative().optional().nullable(),
  appliesToProducts: z.boolean().default(true),
  appliesToCourses: z.boolean().default(true),
  appliesToLaudos: z.boolean().default(true),
  appliesToServices: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    const configs = await prisma.commerceTaxConfig.findMany({
      where: { centerId: center.id },
      orderBy: { type: "asc" },
    });

    return NextResponse.json({ items: configs });
  } catch (error) {
    console.error("Error fetching tax configs:", error);
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = taxConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos", details: validation.error.flatten() }, { status: 400 });
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    const config = await prisma.commerceTaxConfig.create({
      data: { centerId: center.id, ...validation.data },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("Error creating tax config:", error);
    return NextResponse.json({ error: "Error al crear configuración" }, { status: 500 });
  }
}
