/**
 * API para gestión individual de roles
 * GET /api/admin/roles/[role] - Obtiene configuración de un rol
 * PATCH /api/admin/roles/[role] - Actualiza configuración de un rol
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const updateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(100).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  permissions: z.array(z.string()).optional().nullable(),
  canAccessAdmin: z.boolean().optional(),
  canAccessCMS: z.boolean().optional(),
  canAccessAI: z.boolean().optional(),
  canManageUsers: z.boolean().optional(),
  canManageCases: z.boolean().optional(),
  canManageDocuments: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  maxCasesAssigned: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const session = await auth();
    const { role } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Validar que el rol existe
    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    const roleConfig = await prisma.roleConfig.findUnique({
      where: { role: role as Role },
    });

    // Contar usuarios con este rol
    const userCount = await prisma.user.count({
      where: { role: role as Role },
    });

    if (roleConfig) {
      return NextResponse.json({
        roleConfig: { ...roleConfig, userCount },
      });
    }

    // Retornar configuración por defecto si no existe
    return NextResponse.json({
      roleConfig: {
        id: null,
        role: role as Role,
        displayName: getDefaultDisplayName(role as Role),
        description: null,
        color: getDefaultColor(role as Role),
        icon: getDefaultIcon(role as Role),
        permissions: null,
        canAccessAdmin: ["SUPER_ADMIN", "ADMIN"].includes(role),
        canAccessCMS: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(role),
        canAccessAI: true,
        canManageUsers: ["SUPER_ADMIN", "ADMIN"].includes(role),
        canManageCases: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(role),
        canManageDocuments: true,
        canViewReports: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(role),
        maxCasesAssigned: null,
        isActive: true,
        isSystemRole: true,
        sortOrder: getRoleSortOrder(role as Role),
        userCount,
        createdAt: null,
        updatedAt: null,
      },
    });
  } catch (error) {
    console.error("Error fetching role config:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración del rol" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const session = await auth();
    const { role } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Preparar el valor de permissions para Prisma (JSON field)
    // Excluimos permissions de validatedData si es null para evitar errores de tipo
    const { permissions, ...restData } = validatedData;
    const permissionsValue = permissions === null ? undefined : permissions;

    const updateData = {
      ...restData,
      ...(permissionsValue !== undefined && { permissions: permissionsValue }),
    };

    // Upsert la configuración
    const roleConfig = await prisma.roleConfig.upsert({
      where: { role: role as Role },
      update: updateData,
      create: {
        role: role as Role,
        displayName: validatedData.displayName || getDefaultDisplayName(role as Role),
        description: validatedData.description,
        color: validatedData.color || getDefaultColor(role as Role),
        icon: validatedData.icon || getDefaultIcon(role as Role),
        permissions: permissionsValue,
        canAccessAdmin: validatedData.canAccessAdmin ?? false,
        canAccessCMS: validatedData.canAccessCMS ?? false,
        canAccessAI: validatedData.canAccessAI ?? true,
        canManageUsers: validatedData.canManageUsers ?? false,
        canManageCases: validatedData.canManageCases ?? false,
        canManageDocuments: validatedData.canManageDocuments ?? false,
        canViewReports: validatedData.canViewReports ?? false,
        maxCasesAssigned: validatedData.maxCasesAssigned,
        isActive: validatedData.isActive ?? true,
        isSystemRole: true,
        sortOrder: validatedData.sortOrder ?? getRoleSortOrder(role as Role),
      },
    });

    return NextResponse.json({ roleConfig });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating role config:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración del rol" },
      { status: 500 }
    );
  }
}

// Helper functions
function getDefaultDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    SUPER_ADMIN: "Super Administrador",
    ADMIN: "Administrador General",
    CENTER_STAFF: "Personal del Centro",
    SECRETARIA: "Secretaría Arbitral",
    ARBITRO: "Árbitro",
    ABOGADO: "Abogado",
    DEMANDANTE: "Demandante",
    DEMANDADO: "Demandado",
  ESTUDIANTE: "Estudiante",
  };
  return names[role] || role;
}

function getDefaultColor(role: Role): string {
  const colors: Record<Role, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-700",
    ADMIN: "bg-purple-100 text-purple-700",
    CENTER_STAFF: "bg-indigo-100 text-indigo-700",
    SECRETARIA: "bg-blue-100 text-blue-700",
    ARBITRO: "bg-cyan-100 text-cyan-700",
    ABOGADO: "bg-amber-100 text-amber-700",
    DEMANDANTE: "bg-green-100 text-green-700",
    DEMANDADO: "bg-orange-100 text-orange-700",
  ESTUDIANTE: "bg-teal-100 text-teal-700",
  };
  return colors[role] || "bg-gray-100 text-gray-700";
}

function getDefaultIcon(role: Role): string {
  const icons: Record<Role, string> = {
    SUPER_ADMIN: "ShieldAlert",
    ADMIN: "Shield",
    CENTER_STAFF: "Building",
    SECRETARIA: "ClipboardList",
    ARBITRO: "Scale",
    ABOGADO: "Briefcase",
    DEMANDANTE: "UserCheck",
    DEMANDADO: "User",
    ESTUDIANTE: "BookOpen",
  };
  return icons[role] || "User";
}

function getRoleSortOrder(role: Role): number {
  const order: Record<Role, number> = {
    SUPER_ADMIN: 1,
    ADMIN: 2,
    CENTER_STAFF: 3,
    SECRETARIA: 4,
    ARBITRO: 5,
    ABOGADO: 6,
    DEMANDANTE: 7,
    DEMANDADO: 8,
    ESTUDIANTE: 9,
  };
  return order[role] || 99;
}
