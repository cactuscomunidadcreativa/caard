/**
 * CAARD - API de Gestión de Árbitros Públicos (CMS)
 * GET: Lista todos los árbitros del registro
 * POST: Crea un nuevo árbitro
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Obtener el centro
    const center = await prisma.center.findFirst();
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Construir filtros
    const where: any = {
      centerId: center.id,
    };

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (status) {
      where.status = status;
    }

    // Obtener total
    const total = await prisma.arbitratorRegistry.count({ where });

    // Obtener árbitros con paginación
    const arbitrators = await prisma.arbitratorRegistry.findMany({
      where,
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
      orderBy: [{ status: "asc" }, { approvalDate: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      arbitrators,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching arbitrators:", error);
    return NextResponse.json(
      { error: "Error al obtener árbitros" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

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
      status = "ACTIVE",
      image,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    // Obtener el centro
    const center = await prisma.center.findFirst();
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar si ya existe un usuario con ese email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Si no existe, crear el usuario
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: "ARBITRO",
          image: image || null,
        },
      });
    }

    // Verificar si ya está registrado como árbitro
    const existingRegistry = await prisma.arbitratorRegistry.findFirst({
      where: {
        userId: user.id,
        centerId: center.id,
      },
    });

    if (existingRegistry) {
      return NextResponse.json(
        { error: "Este árbitro ya está registrado en el centro" },
        { status: 400 }
      );
    }

    // Crear el registro de árbitro
    const arbitrator = await prisma.arbitratorRegistry.create({
      data: {
        userId: user.id,
        centerId: center.id,
        barAssociation: barAssociation || null,
        barNumber: barNumber || null,
        specializations: specializations || [],
        status: status === "ACTIVE" ? "ACTIVE" : "PENDING_APPROVAL",
        approvalDate: status === "ACTIVE" ? new Date() : null,
      },
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

    return NextResponse.json(arbitrator, { status: 201 });
  } catch (error) {
    console.error("Error creating arbitrator:", error);
    return NextResponse.json(
      { error: "Error al crear árbitro" },
      { status: 500 }
    );
  }
}
