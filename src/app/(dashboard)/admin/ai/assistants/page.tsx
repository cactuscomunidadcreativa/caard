/**
 * CAARD - Panel de Asistentes de IA
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Bot, Plus, MessageSquare, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Asistentes de IA | CAARD",
  description: "Gestiona los asistentes de IA del sistema",
};

async function getAssistants() {
  return prisma.aIAssistant.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          roleAssignments: true,
          conversations: true,
        },
      },
    },
  });
}

export default async function AIAssistantsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const assistants = await getAssistants();

  const totalAssistants = assistants.length;
  const activeAssistants = assistants.filter((a) => a.isActive).length;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">Asistentes de IA</h1>
            <p className="text-sm text-muted-foreground">
              {activeAssistants} de {totalAssistants} asistentes activos
            </p>
          </div>
        </div>

        <Link href="/admin/ai/assistants/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            Crear Asistente
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{totalAssistants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{activeAssistants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Inactivos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{totalAssistants - activeAssistants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {assistants.reduce((acc, a) => acc + a._count.conversations, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas de asistentes */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Lista de Asistentes</CardTitle>
          <CardDescription className="text-sm">
            Asistentes de IA con prompts personalizados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {assistants.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Bot className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay asistentes configurados</p>
              <p className="text-sm text-muted-foreground">Crea tu primer asistente de IA para comenzar</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assistants.map((assistant) => (
                <Card key={assistant.id} className={`overflow-hidden ${!assistant.isActive ? "opacity-60" : ""}`}>
                  <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={assistant.isActive ? "default" : "secondary"} className="text-xs">
                        {assistant.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">/{assistant.slug}</span>
                    </div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-[#D66829] flex-shrink-0" />
                      <span className="truncate">{assistant.name}</span>
                    </CardTitle>
                    {assistant.description && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">
                        {assistant.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Temperatura</span>
                          <span className="font-medium">{assistant.temperature}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Max Tokens</span>
                          <span className="font-medium">{(assistant.maxTokens / 1000).toFixed(0)}K</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Roles asignados</span>
                        <Badge variant="outline" className="text-xs">{assistant._count.roleAssignments}</Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Conversaciones</span>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{assistant._count.conversations}</span>
                        </div>
                      </div>

                      {assistant.allowedContexts.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Contextos:</p>
                          <div className="flex flex-wrap gap-1">
                            {assistant.allowedContexts.slice(0, 3).map((ctx) => (
                              <Badge key={ctx} variant="secondary" className="text-xs">
                                {ctx}
                              </Badge>
                            ))}
                            {assistant.allowedContexts.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{assistant.allowedContexts.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3">
                        <strong>Prompt:</strong> {assistant.systemPrompt.slice(0, 100)}...
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Link href={`/admin/ai/assistants/${assistant.id}/edit`}>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
