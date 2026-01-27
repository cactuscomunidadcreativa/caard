/**
 * Dashboard: Abogado
 * ===================
 * Panel principal para el rol ABOGADO
 * Incluye: casos representados, documentos, plazos, asistente IA
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
  Upload,
  Users,
  ArrowRight,
  AlertTriangle,
  Bell,
  MessageSquare,
  FolderOpen,
  Scale,
  Download,
} from "lucide-react";
import Link from "next/link";

// Componente de caso del abogado
function LawyerCaseCard({ caseData }: { caseData: any }) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    OBSERVED: "bg-orange-100 text-orange-800",
    ADMITTED: "bg-green-100 text-green-800",
    IN_PROCESS: "bg-blue-100 text-blue-800",
    AWAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{caseData.case.code}</CardTitle>
          <Badge
            className={statusColors[caseData.case.status] || "bg-gray-100"}
          >
            {caseData.case.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {caseData.case.title || "Sin título"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Representa a:</span>
            <Badge variant="outline">{caseData.representationType}</Badge>
          </div>
          {caseData.representedMember && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">
                {caseData.representedMember.displayName}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Etapa:</span>
            <span className="font-medium">
              {caseData.case.currentStage?.replace(/_/g, " ") || "—"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/cases/${caseData.caseId}`}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Expediente
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/cases/${caseData.caseId}/documents`}>
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de documentos recientes
async function RecentDocuments({ lawyerId }: { lawyerId: string }) {
  // Obtener casos del abogado
  const lawyerCases = await prisma.caseLawyer.findMany({
    where: { lawyerId, isActive: true },
    select: { caseId: true },
  });

  const caseIds = lawyerCases.map((c) => c.caseId);

  const documents = await prisma.caseDocument.findMany({
    where: {
      caseId: { in: caseIds },
      status: "ACTIVE",
    },
    include: {
      case: {
        select: { code: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay documentos recientes
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium line-clamp-1">{doc.originalFileName}</p>
              <p className="text-sm text-muted-foreground">
                {doc.case.code} • {doc.documentType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(doc.createdAt).toLocaleDateString("es-PE")}
            </span>
            {doc.driveWebViewLink && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={doc.driveWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de plazos del abogado
async function LawyerDeadlines({ lawyerId }: { lawyerId: string }) {
  const lawyerCases = await prisma.caseLawyer.findMany({
    where: { lawyerId, isActive: true },
    select: { caseId: true },
  });

  const caseIds = lawyerCases.map((c) => c.caseId);

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
        No hay plazos próximos en sus casos
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
                {deadline.case.code} - {deadline.case.title}
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

// Componente de notificaciones
async function LawyerNotifications({ userId }: { userId: string }) {
  const notifications = await prisma.notificationQueue.findMany({
    where: {
      userId,
      status: "SENT",
    },
    include: {
      case: {
        select: { code: true },
      },
    },
    orderBy: { sentAt: "desc" },
    take: 10,
  });

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay notificaciones recientes
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="flex items-start gap-3 p-3 rounded-lg border"
        >
          <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{notif.subject || notif.eventType}</p>
            {notif.case && (
              <p className="text-sm text-muted-foreground">
                {notif.case.code}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {notif.sentAt
                ? new Date(notif.sentAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AbogadoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });

  if (!user || !["SUPER_ADMIN", "ADMIN", "ABOGADO"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Obtener casos donde es abogado
  const lawyerCases = await prisma.caseLawyer.findMany({
    where: {
      lawyerId: session.user.id,
      isActive: true,
    },
    include: {
      case: true,
      representedMember: {
        select: {
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Estadísticas
  const casesInProgress = lawyerCases.filter(
    (c) =>
      c.case.status !== "CLOSED" &&
      c.case.status !== "ARCHIVED" &&
      c.case.status !== "REJECTED"
  ).length;

  const caseIds = lawyerCases.map((c) => c.caseId);

  const [pendingDeadlines, unreadNotifications] = await Promise.all([
    prisma.processDeadline.count({
      where: {
        caseId: { in: caseIds },
        status: "ACTIVE",
        dueAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.notificationQueue.count({
      where: {
        userId: session.user.id,
        status: "QUEUED",
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel del Abogado</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user.name || "Abogado"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/abogado/documentos/subir">
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Link>
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {pendingDeadlines > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="font-semibold text-orange-700 dark:text-orange-400">
                  {pendingDeadlines} plazo{pendingDeadlines !== 1 ? "s" : ""}{" "}
                  próximo{pendingDeadlines !== 1 ? "s" : ""} a vencer
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-500">
                  Revise los plazos de sus casos en los próximos 7 días
                </p>
              </div>
              <Button variant="outline" className="ml-auto" asChild>
                <Link href="#plazos">Ver plazos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/abogado/escritos/nuevo">
                <FileText className="h-5 w-5 text-[#D66829]" />
                <span className="font-medium">Presentar Escrito</span>
                <span className="text-xs text-muted-foreground">Demanda, contestación</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/abogado/documentos/subir">
                <Upload className="h-5 w-5 text-[#0B2A5B]" />
                <span className="font-medium">Subir Pruebas</span>
                <span className="text-xs text-muted-foreground">Documentales</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/abogado/casos/consultar">
                <FolderOpen className="h-5 w-5 text-green-600" />
                <span className="font-medium">Consultar Estado</span>
                <span className="text-xs text-muted-foreground">Ver actuados</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/abogado/pagos">
                <Scale className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Ver Pagos</span>
                <span className="text-xs text-muted-foreground">Pendientes y realizados</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Casos Activos
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{casesInProgress}</div>
            <p className="text-xs text-muted-foreground">
              De {lawyerCases.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Demandantes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                lawyerCases.filter((c) => c.representationType === "DEMANDANTE")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Demandados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                lawyerCases.filter((c) => c.representationType === "DEMANDADO")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plazos Próximos
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeadlines}</div>
            <p className="text-xs text-muted-foreground">En 7 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de contenido */}
      <Tabs defaultValue="casos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="casos">
            <Scale className="h-4 w-4 mr-2" />
            Mis Casos ({lawyerCases.length})
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileText className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="plazos" id="plazos">
            <Clock className="h-4 w-4 mr-2" />
            Plazos
            {pendingDeadlines > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingDeadlines}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="casos" className="space-y-4">
          {lawyerCases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tiene casos asignados actualmente
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lawyerCases.map((caseData) => (
                <LawyerCaseCard key={caseData.id} caseData={caseData} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos Recientes</CardTitle>
                <CardDescription>
                  Últimos documentos en sus casos
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/abogado/documentos/subir">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse h-40" />}>
                <RecentDocuments lawyerId={session.user.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plazos">
          <Card>
            <CardHeader>
              <CardTitle>Plazos de Mis Casos</CardTitle>
              <CardDescription>Próximos 14 días</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse h-40" />}>
                <LawyerDeadlines lawyerId={session.user.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Actualizaciones de sus casos</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse h-40" />}>
                <LawyerNotifications userId={session.user.id} />
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
            Asistente IA Legal
          </CardTitle>
          <CardDescription>
            Analice documentos, obtenga resúmenes y consultas legales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/abogado/asistente">
                Abrir asistente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/abogado/asistente/analizar">
                <FileText className="h-4 w-4 mr-2" />
                Analizar documento
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
