/**
 * API para gestión de configuración de roles
 * GET /api/admin/roles - Lista todas las configuraciones de roles
 * POST /api/admin/roles - Crea o actualiza configuración de rol
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

// Schema de validación
const roleConfigSchema = z.object({
  role: z.nativeEnum(Role),
  displayName: z.string().min(1).max(100),
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo SUPER_ADMIN y ADMIN pueden ver configuración de roles
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const roleConfigs = await prisma.roleConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // Contar usuarios por rol
    const userCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const userCountMap = new Map(
      userCounts.map((uc) => [uc.role, uc._count])
    );

    // Combinar datos
    const rolesWithCounts = roleConfigs.map((config) => ({
      ...config,
      userCount: userCountMap.get(config.role) || 0,
    }));

    // Agregar roles que no tienen configuración aún
    const configuredRoles = new Set(roleConfigs.map((rc) => rc.role));
    const allRoles = Object.values(Role);

    const missingRoles = allRoles
      .filter((role) => !configuredRoles.has(role))
      .map((role) => ({
        id: null,
        role,
        displayName: getDefaultDisplayName(role),
        description: null,
        color: getDefaultColor(role),
        icon: getDefaultIcon(role),
        permissions: null,
        canAccessAdmin: role === "SUPER_ADMIN" || role === "ADMIN",
        canAccessCMS: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(role),
        canAccessAI: true,
        canManageUsers: ["SUPER_ADMIN", "ADMIN"].includes(role),
        canManageCases: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(role),
        canManageDocuments: true,
        canViewReports: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(role),
        maxCasesAssigned: null,
        isActive: true,
        isSystemRole: true,
        sortOrder: getRoleSortOrder(role),
        userCount: userCountMap.get(role) || 0,
        createdAt: null,
        updatedAt: null,
      }));

    return NextResponse.json({
      roles: [...rolesWithCounts, ...missingRoles].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      ),
    });
  } catch (error) {
    console.error("Error fetching role configs:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración de roles" },
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

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = roleConfigSchema.parse(body);

    // Preparar el valor de permissions para Prisma (JSON field)
    const permissionsValue = validatedData.permissions === null
      ? undefined
      : validatedData.permissions;

    // Upsert - crear o actualizar
    const roleConfig = await prisma.roleConfig.upsert({
      where: { role: validatedData.role },
      update: {
        displayName: validatedData.displayName,
        description: validatedData.description,
        color: validatedData.color,
        icon: validatedData.icon,
        permissions: permissionsValue,
        canAccessAdmin: validatedData.canAccessAdmin,
        canAccessCMS: validatedData.canAccessCMS,
        canAccessAI: validatedData.canAccessAI,
        canManageUsers: validatedData.canManageUsers,
        canManageCases: validatedData.canManageCases,
        canManageDocuments: validatedData.canManageDocuments,
        canViewReports: validatedData.canViewReports,
        maxCasesAssigned: validatedData.maxCasesAssigned,
        isActive: validatedData.isActive,
        sortOrder: validatedData.sortOrder,
      },
      create: {
        role: validatedData.role,
        displayName: validatedData.displayName,
        description: validatedData.description,
        color: validatedData.color,
        icon: validatedData.icon,
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
        sortOrder: validatedData.sortOrder ?? getRoleSortOrder(validatedData.role),
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

    console.error("Error saving role config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración de rol" },
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
