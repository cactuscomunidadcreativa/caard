/**
 * CAARD - API de Landing Page Individual
 * GET: Obtener landing page con secciones
 * PUT: Actualizar landing page
 * DELETE: Eliminar landing page
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
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    const page = await prisma.landingPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: {
        sections: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Landing page no encontrada" }, { status: 404 });
    }

    // Si no está publicada, solo admin puede verla
    if (!page.isPublished) {
      const session = await auth();
      if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
        return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
      }
    }

    // Incrementar contador de vistas (solo para público)
    if (page.isPublished) {
      await prisma.landingPage.update({
        where: { id: page.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error fetching landing page:", error);
    return NextResponse.json({ error: "Error al obtener landing page" }, { status: 500 });
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
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    const existing = await prisma.landingPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Landing page no encontrada" }, { status: 404 });
    }

    const page = await prisma.landingPage.update({
      where: { id: existing.id },
      data: {
        ...body,
        ...(body.isPublished && !existing.isPublished && { publishedAt: new Date() }),
        ...(body.expiresAt && { expiresAt: new Date(body.expiresAt) }),
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error updating landing page:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });

    const existing = await prisma.landingPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    await prisma.landingPage.delete({ where: { id: existing.id } });
    return NextResponse.json({ message: "Landing page eliminada" });
  } catch (error) {
    console.error("Error deleting landing page:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
