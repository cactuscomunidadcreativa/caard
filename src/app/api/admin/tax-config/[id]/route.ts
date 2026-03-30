/**
 * CAARD - API de Config Tributaria Individual
 * PUT: Actualizar regla fiscal
 * DELETE: Eliminar regla fiscal
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rate: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
  thresholdCents: z.number().int().nonnegative().optional().nullable(),
  appliesToProducts: z.boolean().optional(),
  appliesToCourses: z.boolean().optional(),
  appliesToLaudos: z.boolean().optional(),
  appliesToServices: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const config = await prisma.commerceTaxConfig.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating tax config:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.commerceTaxConfig.delete({ where: { id } });

    return NextResponse.json({ message: "Configuración eliminada" });
  } catch (error) {
    console.error("Error deleting tax config:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
