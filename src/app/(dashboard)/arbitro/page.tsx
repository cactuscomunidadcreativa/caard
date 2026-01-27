/**
 * Dashboard: Árbitro
 * ===================
 * Panel principal para el rol ARBITRO
 * Incluye: casos asignados, emergencias, documentos, resoluciones
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Clock,
  Zap,
  Gavel,
  Calendar,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

// Componente de caso asignado
function CaseCard({
  caseData,
  role,
}: {
  caseData: any;
  role: string;
}) {
  const statusColors: Record<string, string> = {
    IN_PROCESS: "bg-blue-100 text-blue-800",
    AWAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
    SUSPENDED: "bg-orange-100 text-orange-800",
    CLOSED: "bg-gray-100 text-gray-800",
    EMERGENCY_IN_PROCESS: "bg-red-100 text-red-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{caseData.code}</CardTitle>
          <Badge className={statusColors[caseData.status] || "bg-gray-100"}>
            {caseData.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {caseData.title || "Sin título"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Demandante:</span>
            <span className="font-medium">{caseData.claimantName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Demandado:</span>
            <span className="font-medium">{caseData.respondentName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Etapa:</span>
            <span className="font-medium">
              {caseData.currentStage?.replace(/_/g, " ") || "—"}
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href={`/cases/${caseData.id}`}>
            Ver expediente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente de emergencias asignadas
async function AssignedEmergencies({ userId }: { userId: string }) {
  const emergencies = await prisma.emergencyRequest.findMany({
    where: {
      emergencyArbitratorId: userId,
      status: { in: ["PENDING_ACCEPTANCE", "IN_PROCESS"] },
    },
    orderBy: { requestedAt: "desc" },
  });

  if (emergencies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tiene emergencias asignadas
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emergencies.map((emergency) => {
        const isPendingAcceptance = emergency.status === "PENDING_ACCEPTANCE";
        const daysToResolve = emergency.resolutionDueAt
          ? Math.ceil(
              (new Date(emergency.resolutionDueAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return (
          <Card
            key={emergency.id}
            className={
              isPendingAcceptance
                ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20"
                : ""
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  {emergency.requestNumber}
                </CardTitle>
                <Badge
                  variant={isPendingAcceptance ? "destructive" : "secondary"}
                >
                  {isPendingAcceptance
                    ? "PENDIENTE ACEPTACIÓN"
                    : "EN PROCESO"}
                </Badge>
              </div>
              <CardDescription>{emergency.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {emergency.description}
              </p>

              {daysToResolve !== null && daysToResolve > 0 && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <Clock className="h-4 w-4" />
                  <span>
                    {daysToResolve} día{daysToResolve !== 1 ? "s" : ""} para
                    resolver
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                {isPendingAcceptance ? (
                  <>
                    <Button className="flex-1" asChild>
                      <Link href={`/arbitro/emergencias/${emergency.id}/aceptar`}>
                        Aceptar designación
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/arbitro/emergencias/${emergency.id}/rechazar`}>
                        Rechazar
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href={`/arbitro/emergencias/${emergency.id}`}>
                      Ver detalles y resolver
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Componente de plazos del árbitro
async function ArbitratorDeadlines({ userId }: { userId: string }) {
  // Obtener casos del árbitro
  const arbitratorCases = await prisma.caseMember.findMany({
    where: {
      userId,
      role: "ARBITRO",
    },
    select: { caseId: true },
  });

  const caseIds = arbitratorCases.map((c) => c.caseId);

  const deadlines = await prisma.processDeadline.findMany({
    where: {
      caseId: { in: caseIds },
      status: "ACTIVE",
      dueAt: { lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    },
    include: {
      case: {
        select: { code: true, title: true },
      },
    },
    orderBy: { dueAt: "asc" },
    take: 10,
  });

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay plazos próximos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deadlines.map((deadline) => {
        const daysRemaining = Math.ceil(
          (new Date(deadline.dueAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
        const isUrgent = daysRemaining <= 3;

        return (
          <div
            key={deadline.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isUrgent ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""
            }`}
          >
            <div className="space-y-1">
              <p className="font-medium">{deadline.title}</p>
              <p className="text-sm text-muted-foreground">
                {deadline.case.code}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={isUrgent ? "destructive" : "secondary"}>
                {daysRemaining <= 0
                  ? "HOY"
                  : daysRemaining === 1
                  ? "MAÑANA"
                  : `${daysRemaining} días`}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(deadline.dueAt).toLocaleDateString("es-PE")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function ArbitroPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });

  if (!user || !["SUPER_ADMIN", "ADMIN", "ARBITRO"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Obtener casos asignados como árbitro
  const assignedCases = await prisma.case.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
          role: "ARBITRO",
        },
      },
      status: { notIn: ["CLOSED", "ARCHIVED", "REJECTED"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Contar estadísticas
  const [
    totalCases,
    casesInProgress,
    emergenciesPending,
    resolutionsPending,
  ] = await Promise.all([
    prisma.caseMember.count({
      where: {
        userId: session.user.id,
        role: "ARBITRO",
      },
    }),
    prisma.case.count({
      where: {
        members: {
          some: { userId: session.user.id, role: "ARBITRO" },
        },
        status: "IN_PROCESS",
      },
    }),
    prisma.emergencyRequest.count({
      where: {
        emergencyArbitratorId: session.user.id,
        status: { in: ["PENDING_ACCEPTANCE", "IN_PROCESS"] },
      },
    }),
    prisma.case.count({
      where: {
        members: {
          some: { userId: session.user.id, role: "ARBITRO" },
        },
        currentStage: "LAUDO",
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Panel del Árbitro</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user.name || "Árbitro"}
        </p>
      </div>

      {/* Alerta de emergencias pendientes */}
      {emergenciesPending > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Zap className="h-8 w-8 text-orange-500" />
              <div>
                <p className="font-semibold text-orange-700 dark:text-orange-400">
                  Tiene {emergenciesPending} emergencia
                  {emergenciesPending !== 1 ? "s" : ""} pendiente
                  {emergenciesPending !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-500">
                  Requieren atención inmediata según plazos del reglamento
                </p>
              </div>
              <Button className="ml-auto" asChild>
                <Link href="#emergencias">Ver emergencias</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Casos Asignados
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCases}</div>
            <p className="text-xs text-muted-foreground">Total histórico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{casesInProgress}</div>
            <p className="text-xs text-muted-foreground">Casos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergencias</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emergenciesPending}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Laudos Pendientes
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionsPending}</div>
            <p className="text-xs text-muted-foreground">Por emitir</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/arbitro/resoluciones/nueva">
                <Gavel className="h-5 w-5 text-[#D66829]" />
                <span className="font-medium">Emitir Resolución</span>
                <span className="text-xs text-muted-foreground">Providencia o laudo</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/arbitro/actos/subir">
                <FileText className="h-5 w-5 text-[#0B2A5B]" />
                <span className="font-medium">Subir Acto</span>
                <span className="text-xs text-muted-foreground">Documento procesal</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/arbitro/audiencias/programar">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="font-medium">Programar Audiencia</span>
                <span className="text-xs text-muted-foreground">Virtual o presencial</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/arbitro/notificaciones">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Enviar Notificación</span>
                <span className="text-xs text-muted-foreground">A las partes</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de contenido */}
      <Tabs defaultValue="casos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="casos">
            <FileText className="h-4 w-4 mr-2" />
            Mis Casos ({assignedCases.length})
          </TabsTrigger>
          <TabsTrigger value="emergencias" id="emergencias">
            <Zap className="h-4 w-4 mr-2" />
            Emergencias
            {emergenciesPending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {emergenciesPending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="plazos">
            <Calendar className="h-4 w-4 mr-2" />
            Plazos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="casos" className="space-y-4">
          {assignedCases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tiene casos asignados actualmente
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedCases.map((caseData) => (
                <CaseCard
                  key={caseData.id}
                  caseData={caseData}
                  role="ARBITRO"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="emergencias">
          <Suspense
            fallback={
              <Card className="animate-pulse h-40" />
            }
          >
            <AssignedEmergencies userId={session.user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="plazos">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Plazos</CardTitle>
              <CardDescription>
                Plazos de sus casos en los próximos 14 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={<div className="animate-pulse h-40" />}
              >
                <ArbitratorDeadlines userId={session.user.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Asistente IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Asistente IA
          </CardTitle>
          <CardDescription>
            Consulte sobre jurisprudencia, análisis de documentos y más
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/arbitro/asistente">
              Abrir asistente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
