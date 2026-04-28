/**
 * Dashboard: Secretaría Arbitral
 * ===============================
 * Panel principal para el rol SECRETARIA
 * Incluye: expedientes, plazos, emergencias, notificaciones
 */

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
import {
  FileText,
  Clock,
  AlertTriangle,
  Bell,
  DollarSign,
  Users,
  ArrowRight,
  Calendar,
  Zap,
  Inbox,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

// Componentes de estadísticas
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
  variant = "default",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: any;
  trend?: { value: number; positive: boolean };
  href?: string;
  variant?: "default" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "",
    warning: "border-amber-200 bg-amber-50",
    danger: "border-red-200 bg-red-50",
  };

  const content = (
    <Card className={`relative overflow-hidden ${variantStyles[variant]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={`text-xs ${
              trend.positive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.positive ? "+" : "-"}
            {trend.value}% vs mes anterior
          </p>
        )}
      </CardContent>
      {href && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
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


// Componente de plazos próximos
async function UpcomingDeadlines() {
  let deadlines: { id: string; case: { code: string; title: string | null }; dueAt: Date; description: string | null }[] = [];
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    deadlines = await prisma.caseDeadline.findMany({
      where: {
        dueAt: { lte: sevenDaysFromNow },
        isCompleted: false,
      },
      include: { case: { select: { code: true, title: true } } },
      orderBy: { dueAt: "asc" },
      take: 5,
    });
  } catch {
    // Deadline table may not exist yet
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Plazos Próximos a Vencer
        </CardTitle>
        <CardDescription>Próximos 7 días</CardDescription>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay plazos próximos a vencer
          </p>
        ) : (
          <div className="space-y-4">
            {deadlines.map((deadline) => {
              const now = new Date();
              const daysRemaining = Math.ceil((deadline.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysRemaining <= 2;

              return (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{deadline.description || "Plazo procesal"}</p>
                    <p className="text-sm text-muted-foreground">
                      {deadline.case.code} - {deadline.case.title || "Sin título"}
                    </p>
                  </div>
                  <Badge variant={isUrgent ? "destructive" : "secondary"}>
                    {daysRemaining <= 0
                      ? "HOY"
                      : daysRemaining === 1
                      ? "MAÑANA"
                      : `${daysRemaining} días`}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/secretaria/plazos">Ver todos los plazos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente de emergencias activas
async function ActiveEmergencies() {
  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    REQUESTED: { label: "Nueva", variant: "destructive" },
    PENDING_VERIFICATION: { label: "Por verificar", variant: "destructive" },
    PENDING_PAYMENT: { label: "Pendiente pago", variant: "secondary" },
    PENDING_DESIGNATION: { label: "Por asignar", variant: "default" },
    PENDING_ACCEPTANCE: { label: "Por aceptar", variant: "secondary" },
    IN_PROCESS: { label: "En proceso", variant: "outline" },
  };

  let emergencies: any[] = [];
  try {
    emergencies = await prisma.emergencyRequest.findMany({
      where: {
        status: { in: ["REQUESTED", "PENDING_VERIFICATION", "PENDING_PAYMENT", "PENDING_DESIGNATION", "PENDING_ACCEPTANCE", "IN_PROCESS"] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch {
    // Table may not exist yet
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Emergencias Activas
        </CardTitle>
        <CardDescription>Requieren atención inmediata</CardDescription>
      </CardHeader>
      <CardContent>
        {emergencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay emergencias activas
          </p>
        ) : (
          <div className="space-y-4">
            {emergencies.map((emergency: any) => {
              const statusInfo = statusLabels[emergency.status] || {
                label: emergency.status,
                variant: "secondary" as const,
              };

              return (
                <div
                  key={emergency.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{emergency.requestNumber || emergency.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {emergency.title || emergency.urgencyReason || "Solicitud de emergencia"}
                    </p>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/secretaria/emergencias">Ver todas las emergencias</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente: Audiencias sugeridas por árbitros (pendientes de programar)
async function SuggestedHearings() {
  let suggestions: any[] = [];
  try {
    suggestions = await prisma.caseHearing.findMany({
      where: { status: "SUGGESTED" as any },
      include: {
        case: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    // tabla puede no existir aún
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Audiencias Sugeridas
        </CardTitle>
        <CardDescription>
          Sugerencias de árbitros pendientes de programar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay audiencias sugeridas pendientes
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const opciones = Array.isArray(s.suggestedDates)
                ? s.suggestedDates.length
                : 1;
              return (
                <Link
                  key={s.id}
                  href={`/secretaria/audiencias/${s.id}/programar`}
                  className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium truncate">
                      {s.case?.code} — {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {opciones} opción(es) · primera tentativa:{" "}
                      {new Date(s.hearingAt).toLocaleString("es-PE", {
                        timeZone: "America/Lima",
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-blue-600 shrink-0 ml-2">
                    Programar
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/secretaria/audiencias">Ver todas</Link>
          </Button>
          <Button className="w-full" asChild>
            <Link href="/staff/audiencias/programar">
              <CheckCircle className="h-4 w-4 mr-2" />
              Nueva
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de pagos pendientes
async function PendingPayments() {
  let payments: any[] = [];
  try {
    payments = await prisma.paymentOrder.findMany({
      where: {
        status: { in: ["PENDING", "OVERDUE"] },
      },
      include: { case: { select: { code: true } } },
      orderBy: { issuedAt: "desc" },
      take: 5,
    });
  } catch {
    // Table may not exist yet
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Pagos Pendientes
        </CardTitle>
        <CardDescription>Órdenes de pago por confirmar</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay pagos pendientes
          </p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment: any) => {
              const isOverdue = payment.status === "OVERDUE";

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{payment.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.case?.code || "—"} - S/ {(payment.totalCents / 100).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue ? "VENCIDO" : "Pendiente"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/payments/orders">Ver todos los pagos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente principal
export default async function SecretariaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar rol - usando el rol de la sesión directamente
  const userRole = (session.user as any).role || "DEMANDANTE";

  if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(userRole)) {
    redirect("/dashboard");
  }

  // Obtener estadísticas de casos (esta tabla sí existe)
  let totalCases = 0;
  let casesInProgress = 0;
  let pendingCases = 0;

  try {
    totalCases = await prisma.case.count();
    casesInProgress = await prisma.case.count({
      where: { status: "IN_PROCESS" },
    });
    pendingCases = await prisma.case.count({
      where: { status: "SUBMITTED" },
    });
  } catch (error) {
    // Si hay error con la base de datos, usar valores por defecto
    console.log("Error fetching case stats:", error);
  }

  // Fetch real stats from DB (gracefully handle missing tables)
  let pendingDeadlines = 0;
  let activeEmergencies = 0;
  let pendingPaymentsCount = 0;
  let suggestedHearingsCount = 0;

  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    pendingDeadlines = await prisma.caseDeadline.count({
      where: { dueAt: { lte: threeDaysFromNow }, isCompleted: false },
    });
  } catch { /* table may not exist */ }

  try {
    activeEmergencies = await prisma.emergencyRequest.count({
      where: { status: { in: ["REQUESTED", "PENDING_VERIFICATION", "IN_PROCESS"] } },
    });
  } catch { /* table may not exist */ }

  try {
    pendingPaymentsCount = await prisma.paymentOrder.count({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
    });
  } catch { /* table may not exist */ }

  try {
    suggestedHearingsCount = await prisma.caseHearing.count({
      where: { status: "SUGGESTED" as any },
    });
  } catch { /* table may not exist */ }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Secretaría</h1>
          <p className="text-muted-foreground">
            Gestión de expedientes, plazos y procesos arbitrales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/secretaria/solicitudes">
              <Inbox className="h-4 w-4 mr-2" />
              Solicitudes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/secretaria/notificaciones">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </Link>
          </Button>
          <Button asChild>
            <Link href="/cases/quick-new">
              <FileText className="h-4 w-4 mr-2" />
              Nuevo Expediente
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Expedientes"
          value={totalCases}
          icon={FileText}
          href="/cases"
        />
        <StatCard
          title="En Proceso"
          value={casesInProgress}
          icon={Users}
          href="/cases?status=IN_PROCESS"
        />
        <StatCard
          title="Plazos Próximos"
          value={pendingDeadlines}
          description="En los próximos 3 días"
          icon={Clock}
          href="/secretaria/plazos"
          variant={pendingDeadlines > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Emergencias"
          value={activeEmergencies}
          icon={Zap}
          href="/secretaria/emergencias"
          variant={activeEmergencies > 0 ? "danger" : "default"}
        />
        <StatCard
          title="Pagos Pendientes"
          value={pendingPaymentsCount}
          icon={DollarSign}
          href="/payments/orders"
        />
      </div>

      {/* Alertas urgentes */}
      {(pendingDeadlines > 0 || activeEmergencies > 0 || suggestedHearingsCount > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alertas que Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {suggestedHearingsCount > 0 && (
              <Link
                href="/secretaria#audiencias-sugeridas"
                className="flex items-center gap-2 text-orange-700 hover:underline"
              >
                <Calendar className="h-4 w-4" />
                <span>{suggestedHearingsCount} audiencia(s) sugerida(s) por confirmar</span>
              </Link>
            )}
            {pendingDeadlines > 0 && (
              <Link
                href="/secretaria/plazos"
                className="flex items-center gap-2 text-orange-700 hover:underline"
              >
                <Clock className="h-4 w-4" />
                <span>{pendingDeadlines} plazos por vencer en 3 días</span>
              </Link>
            )}
            {activeEmergencies > 0 && (
              <Link
                href="/secretaria/emergencias"
                className="flex items-center gap-2 text-orange-700 hover:underline"
              >
                <Zap className="h-4 w-4" />
                <span>{activeEmergencies} emergencias activas</span>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audiencias sugeridas + Plazos + Emergencias */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SuggestedHearings />
        <UpcomingDeadlines />
        <ActiveEmergencies />
      </div>

      {/* Pagos */}
      <div className="grid gap-6">
        <PendingPayments />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/cases/quick-new" className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Nuevo Expediente</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/staff/audiencias/programar" className="flex flex-col items-center gap-2">
                <Calendar className="h-6 w-6" />
                <span>Programar Audiencia</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/secretaria/emergencias" className="flex flex-col items-center gap-2">
                <Zap className="h-6 w-6" />
                <span>Ver Emergencias</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/secretaria/plazos" className="flex flex-col items-center gap-2">
                <Clock className="h-6 w-6" />
                <span>Gestionar Plazos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/secretaria/notificaciones/nueva" className="flex flex-col items-center gap-2">
                <Bell className="h-6 w-6" />
                <span>Correr Traslado</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/secretaria/arbitros" className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Registro de Árbitros</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
