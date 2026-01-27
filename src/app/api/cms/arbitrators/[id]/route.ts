/**
 * CAARD - API de Gestión de Árbitro Individual (CMS)
 * GET: Obtiene un árbitro
 * PUT: Actualiza un árbitro
 * DELETE: Elimina un árbitro
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const arbitrator = await prisma.arbitratorRegistry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!arbitrator) {
      return NextResponse.json({ error: "Árbitro no encontrado" }, { status: 404 });
    }

    return NextResponse.json(arbitrator);
  } catch (error) {
    console.error("Error fetching arbitrator:", error);
    return NextResponse.json(
      { error: "Error al obtener árbitro" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      email,
      phone,
      barAssociation,
      barNumber,
      specializations,
      acceptsEmergency,
      availabilityNotes,
      status,
      image,
    } = body;

    // Verificar que existe
    const existing = await prisma.arbitratorRegistry.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Árbitro no encontrado" }, { status: 404 });
    }

    // Actualizar usuario
    if (name || email || image) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(image !== undefined && { image: image || null }),
        },
      });
    }

    // Actualizar registro de árbitro
    const updateData: any = {};
    if (barAssociation !== undefined) updateData.barAssociation = barAssociation;
    if (barNumber !== undefined) updateData.barNumber = barNumber;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (acceptsEmergency !== undefined) updateData.acceptsEmergency = acceptsEmergency;
    if (availabilityNotes !== undefined) updateData.availabilityNotes = availabilityNotes;
    if (status !== undefined) {
      updateData.status = status;
      // Si se activa, establecer fecha de aprobación
      if (status === "ACTIVE" && existing.status !== "ACTIVE") {
        updateData.approvalDate = new Date();
      }
    }

    const arbitrator = await prisma.arbitratorRegistry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(arbitrator);
  } catch (error) {
    console.error("Error updating arbitrator:", error);
    return NextResponse.json(
      { error: "Error al actualizar árbitro" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que existe
    const existing = await prisma.arbitratorRegistry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Árbitro no encontrado" }, { status: 404 });
    }

    // Eliminar registro (no el usuario)
    await prisma.arbitratorRegistry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting arbitrator:", error);
    return NextResponse.json(
      { error: "Error al eliminar árbitro" },
      { status: 500 }
    );
  }
}
