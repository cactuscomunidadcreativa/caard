/**
 * CAARD - Configuración de IA por Rol
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shield, Plus, Bot, Cpu, Settings2 } from "lucide-react";
import { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
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
  title: "Configuración de IA por Rol | CAARD",
  description: "Configura qué modelos y asistentes puede usar cada rol",
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin General",
  CENTER_STAFF: "Staff Centro",
  SECRETARIA: "Secretaría",
  ARBITRO: "Árbitro",
  ABOGADO: "Abogado",
  DEMANDANTE: "Demandante",
  DEMANDADO: "Demandado",
  ESTUDIANTE: "Estudiante",
};

const ROLE_COLORS: Record<Role, string> = {
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

async function getRoleConfigs() {
  return prisma.aIRoleModel.findMany({
    orderBy: [{ role: "asc" }, { priority: "desc" }],
    include: {
      model: true,
      assistant: true,
    },
  });
}

export default async function AIRolesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const roleConfigs = await getRoleConfigs();

  // Agrupar por rol
  const configsByRole = roleConfigs.reduce((acc, config) => {
    if (!acc[config.role]) acc[config.role] = [];
    acc[config.role].push(config);
    return acc;
  }, {} as Record<Role, typeof roleConfigs>);

  const rolesWithConfig = Object.keys(configsByRole).length;
  const totalConfigs = roleConfigs.length;
  const activeConfigs = roleConfigs.filter((c) => c.isActive).length;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">Configuración por Rol</h1>
            <p className="text-sm text-muted-foreground">
              {rolesWithConfig} roles, {activeConfigs} asignaciones activas
            </p>
          </div>
        </div>

        <Link href="/admin/ai/roles/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Asignación
          </Button>
        </Link>
      </div>

      {/* Resumen por rol */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-8">
        {Object.values(Role).map((role) => {
          const configs = configsByRole[role] || [];
          const activeCount = configs.filter((c) => c.isActive).length;

          return (
            <Card key={role} className={configs.length === 0 ? "opacity-60" : ""}>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <Badge className={`${ROLE_COLORS[role]} text-xs`}>{ROLE_LABELS[role]}</Badge>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-bold">{configs.length}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {activeCount} activos
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabla de configuraciones */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Asignaciones de Modelos</CardTitle>
          <CardDescription className="text-sm">
            Define qué modelos de IA y asistentes puede usar cada rol
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {totalConfigs === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Settings2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay configuraciones de rol</p>
              <p className="text-sm text-muted-foreground">Asigna modelos y asistentes a los roles</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block lg:hidden space-y-3">
                {roleConfigs.map((config) => (
                  <Card key={config.id} className={`p-4 ${!config.isActive ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Badge className={`${ROLE_COLORS[config.role]} text-xs`}>
                        {ROLE_LABELS[config.role]}
                      </Badge>
                      <Badge variant={config.isActive ? "default" : "secondary"} className="text-xs">
                        {config.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{config.model.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{config.model.modelId}</p>
                        </div>
                      </div>

                      {config.assistant && (
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{config.assistant.name}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-muted-foreground">Límite diario</p>
                          <p className="font-medium">
                            {config.maxRequestsPerDay ? `${config.maxRequestsPerDay} req` : "∞"}
                            {config.maxTokensPerDay && ` / ${(config.maxTokensPerDay / 1000).toFixed(0)}K tok`}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-muted-foreground">Límite mensual</p>
                          <p className="font-medium">
                            {config.maxTokensPerMonth ? `${(config.maxTokensPerMonth / 1000).toFixed(0)}K tok` : "∞"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rol</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Asistente</TableHead>
                      <TableHead className="text-center">Límites Diarios</TableHead>
                      <TableHead className="text-center">Límites Mensuales</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleConfigs.map((config) => (
                      <TableRow key={config.id} className={!config.isActive ? "opacity-60" : ""}>
                        <TableCell>
                          <Badge className={ROLE_COLORS[config.role]}>
                            {ROLE_LABELS[config.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{config.model.name}</div>
                              <div className="text-xs text-muted-foreground">{config.model.modelId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {config.assistant ? (
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-muted-foreground" />
                              <span>{config.assistant.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            {config.maxRequestsPerDay ? (
                              <span>{config.maxRequestsPerDay.toLocaleString()} req</span>
                            ) : (
                              <span className="text-muted-foreground">∞</span>
                            )}
                            {config.maxTokensPerDay && (
                              <span className="text-muted-foreground"> / {(config.maxTokensPerDay / 1000).toFixed(0)}K tok</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {config.maxTokensPerMonth ? (
                            <span className="text-sm">{(config.maxTokensPerMonth / 1000).toFixed(0)}K tokens</span>
                          ) : (
                            <span className="text-muted-foreground">∞</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <Card className="mt-4 sm:mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4 sm:pt-6">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Nota:</strong> Los límites configurados aquí se aplican a nivel de rol.
            Puedes establecer límites personalizados por usuario en la sección de{" "}
            <Link href="/admin/ai/quotas" className="underline">Cuotas y Límites</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
