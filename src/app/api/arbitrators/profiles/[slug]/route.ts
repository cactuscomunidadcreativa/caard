/**
 * CAARD - API de Perfil de Árbitro Individual
 * GET: Obtener perfil público
 * PUT: Actualizar perfil
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const profile = await prisma.arbitratorProfile.findUnique({
      where: { slug },
      include: {
        registry: {
          select: {
            status: true,
            specializations: true,
            casesCompleted: true,
            casesAssigned: true,
            casesInProgress: true,
            acceptsEmergency: true,
            approvalDate: true,
            user: { select: { name: true, image: true, email: true } },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    if (!profile.isPublished) {
      const session = await auth();
      if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
        return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
      }
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();

    const profile = await prisma.arbitratorProfile.findUnique({ where: { slug } });
    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Si cambia slug, verificar unicidad
    if (body.slug && body.slug !== slug) {
      const existing = await prisma.arbitratorProfile.findUnique({ where: { slug: body.slug } });
      if (existing) {
        return NextResponse.json({ error: "Slug ya en uso" }, { status: 400 });
      }
    }

    const updated = await prisma.arbitratorProfile.update({
      where: { id: profile.id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
