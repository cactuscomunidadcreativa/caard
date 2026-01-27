/**
 * CAARD - Panel de Modelos de IA
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Cpu, Plus, Pencil } from "lucide-react";
import { AIProvider } from "@prisma/client";

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
  title: "Modelos de IA | CAARD",
  description: "Gestiona los modelos de IA del sistema",
};

const PROVIDER_LABELS: Record<AIProvider, string> = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google",
  AZURE_OPENAI: "Azure OpenAI",
  CUSTOM: "Personalizado",
};

const PROVIDER_COLORS: Record<AIProvider, string> = {
  OPENAI: "bg-green-100 text-green-700",
  ANTHROPIC: "bg-orange-100 text-orange-700",
  GOOGLE: "bg-blue-100 text-blue-700",
  AZURE_OPENAI: "bg-cyan-100 text-cyan-700",
  CUSTOM: "bg-gray-100 text-gray-700",
};

async function getModels() {
  return prisma.aIModel.findMany({
    orderBy: [{ provider: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          roleAssignments: true,
          usageLogs: true,
        },
      },
    },
  });
}

export default async function AIModelsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const models = await getModels();

  // Calcular totales
  const totalModels = models.length;
  const activeModels = models.filter((m) => m.isActive).length;
  const defaultModel = models.find((m) => m.isDefault);

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Cpu className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">Modelos de IA</h1>
            <p className="text-sm text-muted-foreground">
              {activeModels} de {totalModels} modelos activos
            </p>
          </div>
        </div>

        <Link href="/admin/ai/models/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Modelo
          </Button>
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{totalModels}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{activeModels}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Por Defecto</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm sm:text-base font-medium truncate">{defaultModel?.name || "Ninguno"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Proveedores</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              {new Set(models.map((m) => m.provider)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de modelos */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Modelos Configurados</CardTitle>
          <CardDescription className="text-sm">
            Lista de todos los modelos de IA disponibles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {models.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Cpu className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay modelos configurados</p>
              <p className="text-sm text-muted-foreground">Agrega tu primer modelo de IA para comenzar</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block lg:hidden space-y-3">
                {models.map((model) => (
                  <Card key={model.id} className={`p-4 ${!model.isActive ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{model.name}</h3>
                          {model.isDefault && (
                            <Badge variant="secondary" className="text-xs">Por defecto</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{model.modelId}</p>
                      </div>
                      <Badge variant={model.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {model.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={`${PROVIDER_COLORS[model.provider]} text-xs`}>
                        {PROVIDER_LABELS[model.provider]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {model._count.roleAssignments} roles
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground">Input/1K</p>
                        <p className="font-medium">${(model.inputCostPer1k / 100).toFixed(4)}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground">Output/1K</p>
                        <p className="font-medium">${(model.outputCostPer1k / 100).toFixed(4)}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground">Max Tok.</p>
                        <p className="font-medium">{(model.maxTokens / 1000).toFixed(0)}K</p>
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
                      <TableHead>Modelo</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Costo/1K (Input)</TableHead>
                      <TableHead className="text-right">Costo/1K (Output)</TableHead>
                      <TableHead className="text-center">Max Tokens</TableHead>
                      <TableHead className="text-center">Asignaciones</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id} className={!model.isActive ? "opacity-60" : ""}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {model.name}
                              {model.isDefault && (
                                <Badge variant="secondary" className="text-xs">Por defecto</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{model.modelId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={PROVIDER_COLORS[model.provider]}>
                            {PROVIDER_LABELS[model.provider]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${(model.inputCostPer1k / 100).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(model.outputCostPer1k / 100).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-center">
                          {model.maxTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {model._count.roleAssignments}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={model.isActive ? "default" : "secondary"}>
                            {model.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/admin/ai/models/${model.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
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
    </div>
  );
}
