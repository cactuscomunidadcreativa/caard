/**
 * CAARD - API de Paquete de Laudos (Individual)
 * PUT: Actualizar paquete
 * DELETE: Eliminar paquete
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface Props {
  params: Promise<{ id: string }>;
}

const updatePackageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  laudoCount: z.number().int().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  validDays: z.number().int().min(1).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updatePackageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.laudoPackage.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating laudo package:", error);
    return NextResponse.json({ error: "Error al actualizar paquete" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    await prisma.laudoPackage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting laudo package:", error);
    return NextResponse.json({ error: "Error al eliminar paquete" }, { status: 500 });
  }
}
