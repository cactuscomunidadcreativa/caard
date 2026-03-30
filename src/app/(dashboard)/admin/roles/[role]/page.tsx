/**
 * CAARD - Página de Edición de Rol Individual
 */

import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Shield,
  ShieldAlert,
  Building,
  ClipboardList,
  Scale,
  Briefcase,
  UserCheck,
  User,
  Users,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Role } from "@prisma/client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleEditForm } from "./role-edit-form";

export const metadata: Metadata = {
  title: "Editar Rol | CAARD",
  description: "Configura los permisos del rol",
};

// Configuración por defecto de roles
const ROLE_DEFAULTS: Record<Role, {
  displayName: string;
  description: string;
  color: string;
  icon: string;
  canAccessAdmin: boolean;
  canAccessCMS: boolean;
  canAccessAI: boolean;
  canManageUsers: boolean;
  canManageCases: boolean;
  canManageDocuments: boolean;
  canViewReports: boolean;
  sortOrder: number;
}> = {
  SUPER_ADMIN: {
    displayName: "Super Administrador",
    description: "Acceso total al sistema, gestión de centros y configuración global",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "ShieldAlert",
    canAccessAdmin: true,
    canAccessCMS: true,
    canAccessAI: true,
    canManageUsers: true,
    canManageCases: true,
    canManageDocuments: true,
    canViewReports: true,
    sortOrder: 1,
  },
  ADMIN: {
    displayName: "Administrador General",
    description: "Administración del centro, usuarios y configuración",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "Shield",
    canAccessAdmin: true,
    canAccessCMS: true,
    canAccessAI: true,
    canManageUsers: true,
    canManageCases: true,
    canManageDocuments: true,
    canViewReports: true,
    sortOrder: 2,
  },
  CENTER_STAFF: {
    displayName: "Personal del Centro",
    description: "Staff administrativo con acceso a gestión de contenido",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "Building",
    canAccessAdmin: false,
    canAccessCMS: true,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    sortOrder: 3,
  },
  SECRETARIA: {
    displayName: "Secretaría Arbitral",
    description: "Gestión de expedientes, documentos y notificaciones",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "ClipboardList",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: true,
    canManageDocuments: true,
    canViewReports: true,
    sortOrder: 4,
  },
  ARBITRO: {
    displayName: "Árbitro",
    description: "Resolución de casos asignados, emisión de laudos",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: "Scale",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: true,
    sortOrder: 5,
  },
  ABOGADO: {
    displayName: "Abogado",
    description: "Representante legal de partes en casos arbitrales",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "Briefcase",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    sortOrder: 6,
  },
  DEMANDANTE: {
    displayName: "Demandante",
    description: "Parte que inicia el proceso arbitral",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "UserCheck",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    sortOrder: 7,
  },
  DEMANDADO: {
    displayName: "Demandado",
    description: "Parte contra la cual se dirige la demanda",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "User",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    sortOrder: 8,
  },
  ESTUDIANTE: {
    displayName: "Estudiante",
    description: "Acceso a cursos, tienda y consulta básica",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    icon: "BookOpen",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: false,
    canViewReports: false,
    sortOrder: 9,
  },
};

const ROLE_ICONS: Record<string, any> = {
  ShieldAlert,
  Shield,
  Building,
  ClipboardList,
  Scale,
  Briefcase,
  UserCheck,
  User,
};

async function getRoleData(roleParam: string) {
  // Validar que el rol existe en el enum
  if (!Object.values(Role).includes(roleParam as Role)) {
    return null;
  }

  const role = roleParam as Role;
  const defaults = ROLE_DEFAULTS[role];

  // Intentar obtener configuración guardada
  let savedConfig = null;
  try {
    savedConfig = await prisma.roleConfig.findUnique({
      where: { role },
    });
  } catch {
    // Si la tabla no existe, continuar con defaults
  }

  // Contar usuarios con este rol
  const userCount = await prisma.user.count({
    where: { role },
  });

  // Obtener algunos usuarios de ejemplo
  const sampleUsers = await prisma.user.findMany({
    where: { role },
    take: 5,
    select: { id: true, name: true, email: true, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    role,
    displayName: savedConfig?.displayName || defaults?.displayName || role,
    description: savedConfig?.description || defaults?.description || "",
    color: savedConfig?.color || defaults?.color || "bg-gray-100 text-gray-700",
    icon: savedConfig?.icon || defaults?.icon || "User",
    canAccessAdmin: savedConfig?.canAccessAdmin ?? defaults?.canAccessAdmin ?? false,
    canAccessCMS: savedConfig?.canAccessCMS ?? defaults?.canAccessCMS ?? false,
    canAccessAI: savedConfig?.canAccessAI ?? defaults?.canAccessAI ?? true,
    canManageUsers: savedConfig?.canManageUsers ?? defaults?.canManageUsers ?? false,
    canManageCases: savedConfig?.canManageCases ?? defaults?.canManageCases ?? false,
    canManageDocuments: savedConfig?.canManageDocuments ?? defaults?.canManageDocuments ?? false,
    canViewReports: savedConfig?.canViewReports ?? defaults?.canViewReports ?? false,
    maxCasesAssigned: savedConfig?.maxCasesAssigned || null,
    isActive: savedConfig?.isActive ?? true,
    sortOrder: savedConfig?.sortOrder ?? defaults?.sortOrder ?? 99,
    userCount,
    sampleUsers,
  };
}

export default async function RoleEditPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const session = await auth();
  const { role: roleParam } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const roleData = await getRoleData(roleParam);

  if (!roleData) {
    notFound();
  }

  const IconComponent = ROLE_ICONS[roleData.icon] || User;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/roles">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${roleData.color} flex items-center justify-center flex-shrink-0`}>
            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">{roleData.displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {roleData.role} - {roleData.userCount} usuarios
            </p>
          </div>
        </div>

        <Badge variant={roleData.isActive ? "default" : "secondary"} className="w-fit">
          {roleData.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario de edición */}
        <div className="lg:col-span-2">
          <RoleEditForm roleData={roleData} />
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Estadísticas */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios con este rol
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-3xl font-bold text-[#D66829]">{roleData.userCount}</p>

              {roleData.sampleUsers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Usuarios recientes:</p>
                  {roleData.sampleUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{user.name || user.email}</span>
                      <Badge variant={user.isActive ? "outline" : "secondary"} className="text-xs">
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  ))}
                  {roleData.userCount > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{roleData.userCount - 5} más...
                    </p>
                  )}
                </div>
              )}

              {roleData.userCount === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No hay usuarios con este rol
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info del rol */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Código del rol:</span>
                <p className="font-mono">{roleData.role}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Orden de prioridad:</span>
                <p>{roleData.sortOrder}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Descripción:</span>
                <p>{roleData.description || "Sin descripción"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Permisos rápidos */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Permisos actuales</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                {[
                  { key: "canAccessAdmin", label: "Panel Admin" },
                  { key: "canAccessCMS", label: "Acceso CMS" },
                  { key: "canAccessAI", label: "Acceso IA" },
                  { key: "canManageUsers", label: "Gestionar Usuarios" },
                  { key: "canManageCases", label: "Gestionar Casos" },
                  { key: "canManageDocuments", label: "Gestionar Documentos" },
                  { key: "canViewReports", label: "Ver Reportes" },
                ].map((perm) => (
                  <div key={perm.key} className="flex items-center justify-between text-sm">
                    <span>{perm.label}</span>
                    <Badge
                      variant={(roleData as any)[perm.key] ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {(roleData as any)[perm.key] ? "Sí" : "No"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
