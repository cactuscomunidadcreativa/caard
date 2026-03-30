/**
 * Dashboard: Center Staff
 * ========================
 * Panel para personal administrativo del centro
 * Funciones de soporte: verificación de pagos, atención al usuario, reportes
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
  DollarSign,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  BarChart3,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Send,
  CalendarClock,
  FileCheck,
  AlertTriangle,
  ClipboardList,
  UserPlus,
  History,
} from "lucide-react";
import Link from "next/link";

// Componente de pagos por verificar
async function PaymentsToVerify() {
  const payments = await prisma.paymentOrder.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      case: {
        select: {
          code: true,
          title: true,
          claimantName: true,
        },
      },
    },
    orderBy: { issuedAt: "desc" },
    take: 10,
  });

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>No hay pagos pendientes de verificación</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-4 rounded-lg border"
        >
          <div className="space-y-1">
            <p className="font-medium">{payment.orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              {payment.case.code} • {payment.case.claimantName || "—"}
            </p>
            <p className="text-sm">{payment.description}</p>
          </div>
          <div className="text-right space-y-2">
            <p className="text-lg font-bold">
              S/ {(payment.totalCents / 100).toFixed(2)}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/staff/pagos/${payment.id}`}>
                  Verificar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de expedientes recientes
async function RecentCases() {
  const cases = await prisma.case.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW", "OBSERVED"] },
    },
    orderBy: { submittedAt: "desc" },
    take: 10,
  });

  if (cases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay expedientes pendientes de revisión
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    SUBMITTED: { label: "Enviado", variant: "default" },
    UNDER_REVIEW: { label: "En revisión", variant: "secondary" },
    OBSERVED: { label: "Observado", variant: "destructive" },
  };

  return (
    <div className="space-y-3">
      {cases.map((caseItem) => {
        const status = statusLabels[caseItem.status] || {
          label: caseItem.status,
          variant: "secondary" as const,
        };

        return (
          <div
            key={caseItem.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{caseItem.code}</p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {caseItem.title || "Sin título"}
              </p>
              <p className="text-xs text-muted-foreground">
                {caseItem.claimantName} vs {caseItem.respondentName || "—"}
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/cases/${caseItem.id}`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// Componente de consultas de usuarios (placeholder - no ticket system yet)
async function UserQueries() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
      <p>No hay consultas pendientes</p>
      <p className="text-xs mt-1">Las consultas de usuarios aparecerán aquí cuando estén disponibles</p>
    </div>
  );
}

// Stats Card
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: any;
  href?: string;
}) {
  const content = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-transform hover:scale-[1.02]">
        {content}
      </Link>
    );
  }

  return content;
}

export default async function StaffPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, centerId: true },
  });

  if (
    !user ||
    !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(user.role)
  ) {
    redirect("/dashboard");
  }

  // Estadísticas
  const where = user.centerId ? { centerId: user.centerId } : {};

  const [
    totalCases,
    pendingReview,
    pendingPayments,
    todaySubmissions,
  ] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.count({
      where: {
        ...where,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "OBSERVED"] },
      },
    }),
    prisma.paymentOrder.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.case.count({
      where: {
        ...where,
        submittedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Staff</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user.name || "Staff"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/staff/buscar">
              <Search className="h-4 w-4 mr-2" />
              Buscar expediente
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Expedientes"
          value={totalCases}
          icon={FileText}
        />
        <StatCard
          title="Pendientes Revisión"
          value={pendingReview}
          description="Requieren atención"
          icon={Clock}
          href="/staff/expedientes"
        />
        <StatCard
          title="Pagos por Verificar"
          value={pendingPayments}
          icon={DollarSign}
          href="/staff/pagos"
        />
        <StatCard
          title="Solicitudes Hoy"
          value={todaySubmissions}
          description="Nuevas hoy"
          icon={Users}
        />
      </div>

      {/* Tabs de contenido */}
      <Tabs defaultValue="pagos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pagos">
            <DollarSign className="h-4 w-4 mr-2" />
            Pagos por Verificar
            {pendingPayments > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingPayments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expedientes">
            <FileText className="h-4 w-4 mr-2" />
            Expedientes Pendientes
          </TabsTrigger>
          <TabsTrigger value="consultas">
            <MessageSquare className="h-4 w-4 mr-2" />
            Consultas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle>Pagos Pendientes de Verificación</CardTitle>
              <CardDescription>
                Verifique los comprobantes de pago recibidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse h-40" />}>
                <PaymentsToVerify />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expedientes">
          <Card>
            <CardHeader>
              <CardTitle>Expedientes Pendientes</CardTitle>
              <CardDescription>
                Expedientes que requieren revisión o tienen observaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse h-40" />}>
                <RecentCases />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultas">
          <Card>
            <CardHeader>
              <CardTitle>Consultas de Usuarios</CardTitle>
              <CardDescription>
                Atienda las consultas de los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse h-40" />}>
                <UserQueries />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Acciones Rápidas - Mejoradas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          <CardDescription>
            Funciones frecuentes para la gestión del centro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/staff/buscar">
                <Search className="h-5 w-5 text-[#D66829]" />
                <span className="font-medium">Buscar Expediente</span>
                <span className="text-xs text-muted-foreground">Por código o parte</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/staff/pagos">
                <DollarSign className="h-5 w-5 text-[#D66829]" />
                <span className="font-medium">Verificar Pagos</span>
                <span className="text-xs text-muted-foreground">Comprobantes pendientes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/staff/notificaciones/nueva">
                <Send className="h-5 w-5 text-[#D66829]" />
                <span className="font-medium">Enviar Notificación</span>
                <span className="text-xs text-muted-foreground">A partes o árbitros</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/staff/reportes">
                <BarChart3 className="h-5 w-5 text-[#D66829]" />
                <span className="font-medium">Ver Reportes</span>
                <span className="text-xs text-muted-foreground">Estadísticas del centro</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Segunda fila de acciones */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gestión de Solicitudes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#D66829]" />
              Gestión de Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/solicitudes/nuevas">
                <FileCheck className="h-4 w-4 mr-2" />
                <span>Revisar solicitudes nuevas</span>
                {pendingReview > 0 && (
                  <Badge variant="destructive" className="ml-auto">{pendingReview}</Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/solicitudes/observadas">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Solicitudes observadas</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/arbitraje/aprobar">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Aprobar arbitraje</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Programación y Plazos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#D66829]" />
              Plazos y Audiencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/audiencias/programar">
                <CalendarClock className="h-4 w-4 mr-2" />
                <span>Programar audiencia</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/plazos">
                <Clock className="h-4 w-4 mr-2" />
                <span>Gestionar plazos</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/plazos/vencidos">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Plazos por vencer</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Comunicaciones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#D66829]" />
              Comunicaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/notificaciones/pendientes">
                <Send className="h-4 w-4 mr-2" />
                <span>Notificaciones pendientes</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/notificaciones/historial">
                <History className="h-4 w-4 mr-2" />
                <span>Historial de envíos</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start h-auto py-2" asChild>
              <Link href="/staff/usuarios/registrar">
                <UserPlus className="h-4 w-4 mr-2" />
                <span>Registrar usuario</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-[#D66829]" />
                Actividad Reciente del Centro
              </CardTitle>
              <CardDescription>
                Últimas acciones registradas en el sistema
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/staff/actividad">
                Ver todo
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm">La actividad reciente aparecerá aquí</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
