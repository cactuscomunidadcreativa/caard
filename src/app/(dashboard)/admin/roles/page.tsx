/**
 * CAARD - Panel de Gestión de Roles
 * Incluye: SUPER_ADMIN, ADMIN, CENTER_STAFF, SECRETARIA, ARBITRO, ABOGADO, DEMANDANTE, DEMANDADO
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
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
  Settings,
  Check,
  X
} from "lucide-react";
import { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gestión de Roles | CAARD",
  description: "Administra los roles y permisos del sistema",
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
    sortOrder: 8,
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

async function getRolesData() {
  // Obtener configuraciones de roles guardadas
  let roleConfigs: any[] = [];
  try {
    roleConfigs = await prisma.roleConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    // Si la tabla no existe aún, continuamos con defaults
  }

  // Contar usuarios por rol
  const userCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  const userCountMap = new Map(
    userCounts.map((uc) => [uc.role, uc._count])
  );

  // Combinar configuraciones guardadas con defaults
  const configMap = new Map(roleConfigs.map((rc: any) => [rc.role, rc]));

  const allRoleValues = Object.values(Role);

  const roles = allRoleValues.map((role) => {
    const savedConfig = configMap.get(role);
    const defaults = ROLE_DEFAULTS[role];

    if (!defaults) {
      return {
        role,
        displayName: role,
        description: "",
        color: "bg-gray-100 text-gray-700",
        icon: "User",
        canAccessAdmin: false,
        canAccessCMS: false,
        canAccessAI: true,
        canManageUsers: false,
        canManageCases: false,
        isActive: true,
        userCount: userCountMap.get(role) || 0,
        sortOrder: 99,
      };
    }

    return {
      role,
      displayName: savedConfig?.displayName || defaults.displayName,
      description: savedConfig?.description || defaults.description,
      color: savedConfig?.color || defaults.color,
      icon: savedConfig?.icon || defaults.icon,
      canAccessAdmin: savedConfig?.canAccessAdmin ?? defaults.canAccessAdmin,
      canAccessCMS: savedConfig?.canAccessCMS ?? defaults.canAccessCMS,
      canAccessAI: savedConfig?.canAccessAI ?? defaults.canAccessAI,
      canManageUsers: savedConfig?.canManageUsers ?? defaults.canManageUsers,
      canManageCases: savedConfig?.canManageCases ?? defaults.canManageCases,
      isActive: savedConfig?.isActive ?? true,
      userCount: userCountMap.get(role) || 0,
      sortOrder: savedConfig?.sortOrder ?? defaults.sortOrder,
    };
  });

  return roles.sort((a, b) => a.sortOrder - b.sortOrder);
}

export default async function RolesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    redirect("/dashboard");
  }

  const roles = await getRolesData();
  const totalUsers = roles.reduce((acc, r) => acc + r.userCount, 0);
  const activeRoles = roles.filter((r) => r.isActive).length;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">Gestión de Roles</h1>
            <p className="text-sm text-muted-foreground">
              {activeRoles} roles activos, {totalUsers} usuarios totales
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Total Roles</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{roles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Roles Activos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{activeRoles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Administrativos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              {roles.filter((r) => r.canAccessAdmin).reduce((acc, r) => acc + r.userCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roles Grid - Mobile Cards */}
      <Card className="lg:hidden mb-6">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Roles del Sistema</CardTitle>
          <CardDescription className="text-sm">
            Toca un rol para ver detalles y editar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {roles.map((role) => {
            const IconComponent = ROLE_ICONS[role.icon] || User;

            return (
              <Link href={`/admin/roles/${role.role}`} key={role.role}>
                <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${!role.isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${role.color} flex-shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{role.displayName}</h3>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          <Users className="h-3 w-3 mr-1" />
                          {role.userCount}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.canAccessAdmin && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                        {role.canAccessCMS && (
                          <Badge variant="secondary" className="text-xs">CMS</Badge>
                        )}
                        {role.canAccessAI && (
                          <Badge variant="secondary" className="text-xs">IA</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Roles Table - Desktop */}
      <Card className="hidden lg:block">
        <CardHeader className="p-6">
          <CardTitle className="text-lg">Roles del Sistema</CardTitle>
          <CardDescription>
            Configura permisos y accesos para cada tipo de usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Usuarios</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center">CMS</TableHead>
                  <TableHead className="text-center">IA</TableHead>
                  <TableHead className="text-center">Gestión Usuarios</TableHead>
                  <TableHead className="text-center">Gestión Casos</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => {
                  const IconComponent = ROLE_ICONS[role.icon] || User;

                  return (
                    <TableRow key={role.role} className={!role.isActive ? "opacity-60" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${role.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{role.displayName}</p>
                            <p className="text-xs text-muted-foreground">{role.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">{role.description}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {role.userCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {role.canAccessAdmin ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {role.canAccessCMS ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {role.canAccessAI ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {role.canManageUsers ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {role.canManageCases ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/admin/roles/${role.role}`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                            <Settings className="h-3 w-3 mr-1" />
                            Editar
                          </Badge>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="mt-4 sm:mt-6 space-y-3">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 sm:pt-6">
            <p className="text-xs sm:text-sm text-amber-800">
              <strong>Sistema de Roles Fijos:</strong> Los 8 roles del sistema están definidos según la normativa
              de arbitraje y no pueden agregarse o eliminarse. Sin embargo, puedes <strong>editar los permisos</strong> de
              cada rol haciendo clic en "Editar" para personalizar qué acciones puede realizar cada tipo de usuario.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 sm:pt-6">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>Nota:</strong> El rol <strong>Abogado</strong> puede representar tanto a demandantes como
              demandados en diferentes casos. La asignación de abogados a casos se realiza en la sección de expedientes.
              Puedes desactivar roles que no uses estableciendo "Rol activo" en falso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
