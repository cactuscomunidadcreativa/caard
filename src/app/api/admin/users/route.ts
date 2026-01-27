/**
 * CAARD - API de Gestión de Usuarios (Admin)
 * GET: Listar usuarios con filtros y paginación
 * POST: Crear nuevo usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "SECRETARIA"];

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),
  role: z.nativeEnum(Role),
  phoneE164: z.string().max(20).optional().nullable(),
  centerId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET /api/admin/users - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario es admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, centerId: true },
    });

    if (!currentUser || !ADMIN_ROLES.includes(currentUser.role)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as Role | null;
    const isActive = searchParams.get("isActive");

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Si es SECRETARIA, solo ver usuarios de su centro
    if (currentUser.role === "SECRETARIA" && currentUser.centerId) {
      where.centerId = currentUser.centerId;
    }

    // Obtener usuarios y conteo total
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          phoneE164: true,
          role: true,
          isActive: true,
          createdAt: true,
          center: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/users - Crear usuario
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que es SUPER_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN puede crear usuarios" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        role: validatedData.role,
        phoneE164: validatedData.phoneE164 || null,
        centerId: validatedData.centerId || null,
        isActive: validatedData.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        center: {
          select: { id: true, name: true },
        },
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_USER",
        entity: "User",
        entityId: newUser.id,
        meta: { email: newUser.email, role: newUser.role },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al crear usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
