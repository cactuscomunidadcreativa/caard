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

// Datos de ejemplo para plazos (mientras no exista la tabla)
const mockDeadlines = [
  {
    id: "1",
    title: "Contestación de demanda",
    caseCode: "ARB-2025-0001",
    caseTitle: "Controversia contractual",
    daysRemaining: 2,
  },
  {
    id: "2",
    title: "Subsanación de observaciones",
    caseCode: "ARB-2025-0002",
    caseTitle: "Disputa comercial",
    daysRemaining: 1,
  },
  {
    id: "3",
    title: "Presentación de pruebas",
    caseCode: "ARB-2025-0003",
    caseTitle: "Incumplimiento contractual",
    daysRemaining: 5,
  },
];

// Datos de ejemplo para emergencias
const mockEmergencies = [
  {
    id: "1",
    requestNumber: "EMR-2025-0001",
    title: "Medida cautelar urgente",
    status: "PENDING_VERIFICATION",
  },
  {
    id: "2",
    requestNumber: "EMR-2025-0002",
    title: "Preservación de evidencia",
    status: "IN_PROCESS",
  },
];

// Datos de ejemplo para pagos
const mockPayments = [
  {
    id: "1",
    orderNumber: "OP-2025-0001",
    caseCode: "ARB-2025-0001",
    amount: 15000,
    status: "PENDING",
  },
  {
    id: "2",
    orderNumber: "OP-2025-0002",
    caseCode: "ARB-2025-0002",
    amount: 8500,
    status: "OVERDUE",
  },
];

// Componente de plazos próximos
function UpcomingDeadlines() {
  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING_VERIFICATION: { label: "Por verificar", variant: "destructive" },
    IN_PROCESS: { label: "En proceso", variant: "default" },
  };

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
        {mockDeadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay plazos próximos a vencer
          </p>
        ) : (
          <div className="space-y-4">
            {mockDeadlines.map((deadline) => {
              const isUrgent = deadline.daysRemaining <= 2;

              return (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{deadline.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {deadline.caseCode} - {deadline.caseTitle}
                    </p>
                  </div>
                  <Badge variant={isUrgent ? "destructive" : "secondary"}>
                    {deadline.daysRemaining <= 0
                      ? "HOY"
                      : deadline.daysRemaining === 1
                      ? "MAÑANA"
                      : `${deadline.daysRemaining} días`}
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
function ActiveEmergencies() {
  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    REQUESTED: { label: "Nueva", variant: "destructive" },
    PENDING_VERIFICATION: { label: "Por verificar", variant: "destructive" },
    PENDING_PAYMENT: { label: "Pendiente pago", variant: "secondary" },
    PENDING_DESIGNATION: { label: "Por asignar", variant: "default" },
    PENDING_ACCEPTANCE: { label: "Por aceptar", variant: "secondary" },
    IN_PROCESS: { label: "En proceso", variant: "outline" },
  };

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
        {mockEmergencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay emergencias activas
          </p>
        ) : (
          <div className="space-y-4">
            {mockEmergencies.map((emergency) => {
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
                    <p className="font-medium">{emergency.requestNumber}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {emergency.title}
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

// Componente de pagos pendientes
function PendingPayments() {
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
        {mockPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay pagos pendientes
          </p>
        ) : (
          <div className="space-y-4">
            {mockPayments.map((payment) => {
              const isOverdue = payment.status === "OVERDUE";

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{payment.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.caseCode} - S/ {payment.amount.toLocaleString()}
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

  // Valores mock para estadísticas que dependen de tablas no migradas
  const pendingDeadlines = mockDeadlines.filter(d => d.daysRemaining <= 3).length;
  const activeEmergencies = mockEmergencies.length;
  const pendingPaymentsCount = mockPayments.length;

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
          <Button asChild>
            <Link href="/cases/new">
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
      {(pendingDeadlines > 0 || activeEmergencies > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alertas que Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <UpcomingDeadlines />
        <ActiveEmergencies />
        <PendingPayments />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/cases/new" className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Nuevo Expediente</span>
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
                <Calendar className="h-6 w-6" />
                <span>Gestionar Plazos</span>
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

      {/* Info sobre migración pendiente */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Datos de demostración</p>
              <p className="text-sm text-blue-700">
                Los plazos, emergencias y pagos mostrados son datos de ejemplo.
                Para habilitar las funciones completas, ejecute la migración de base de datos:
              </p>
              <code className="block mt-2 p-2 bg-blue-100 rounded text-xs font-mono text-blue-800">
                npx prisma migrate dev --name add_rules_system
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
