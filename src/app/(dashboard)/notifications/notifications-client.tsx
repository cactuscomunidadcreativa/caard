"use client";

/**
 * CAARD - Cliente de Notificaciones
 * Centro de notificaciones con plazos y audiencias
 */

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Mail,
  MessageSquare,
  Smartphone,
  Filter,
  Search,
  FileText,
  Gavel,
  Timer,
  ChevronRight,
  MailOpen,
  Send,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Role, NotificationStatus, NotificationChannel, NotificationEventType } from "@prisma/client";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Roles administrativos
const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SECRETARIA"];

// Configuración de estados
const STATUS_CONFIG: Record<NotificationStatus, {
  label: string;
  color: string;
  icon: any;
}> = {
  QUEUED: {
    label: "En cola",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  SENDING: {
    label: "Enviando",
    color: "bg-yellow-100 text-yellow-700",
    icon: Loader2,
  },
  SENT: {
    label: "Enviado",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Fallido",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-700",
    icon: XCircle,
  },
};

// Configuración de canales
const CHANNEL_CONFIG: Record<NotificationChannel, {
  label: string;
  icon: any;
}> = {
  EMAIL: { label: "Email", icon: Mail },
  SMS: { label: "SMS", icon: Smartphone },
  WHATSAPP: { label: "WhatsApp", icon: MessageSquare },
  PUSH: { label: "Push", icon: Bell },
  IN_APP: { label: "En App", icon: Bell },
};

// Configuración de tipos de evento
const EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  CASE_SUBMITTED: "Caso enviado",
  CASE_OBSERVED: "Caso observado",
  CASE_ADMITTED: "Caso admitido",
  CASE_REJECTED: "Caso rechazado",
  DOCUMENT_UPLOADED: "Documento subido",
  DOCUMENT_REPLACED: "Documento reemplazado",
  DEADLINE_UPCOMING: "Plazo próximo",
  DEADLINE_OVERDUE: "Plazo vencido",
  HEARING_SCHEDULED: "Audiencia programada",
  HEARING_UPDATED: "Audiencia actualizada",
  HEARING_REMINDER: "Recordatorio audiencia",
  PAYMENT_REQUIRED: "Pago requerido",
  PAYMENT_PENDING: "Pago pendiente",
  PAYMENT_CONFIRMED: "Pago confirmado",
  PAYMENT_FAILED: "Pago fallido",
  PAYMENT_OVERDUE: "Pago vencido",
  AWARD_ISSUED: "Laudo emitido",
  CASE_CLOSED: "Caso cerrado",
};

interface Notification {
  id: string;
  caseId: string | null;
  userId: string | null;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  status: NotificationStatus;
  subject: string | null;
  body: string | null;
  toEmail: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  case: {
    id: string;
    code: string;
    title: string | null;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date;
  isCompleted: boolean;
  case: {
    id: string;
    code: string;
    title: string | null;
  };
}

interface Hearing {
  id: string;
  title: string;
  hearingAt: Date;
  location: string | null;
  meetingUrl: string | null;
  case: {
    id: string;
    code: string;
    title: string | null;
  };
}

interface NotificationsClientProps {
  notifications: Notification[];
  stats: Record<string, number>;
  upcomingDeadlines: Deadline[];
  upcomingHearings: Hearing[];
  userRole: Role;
}

export function NotificationsClient({
  notifications,
  stats,
  upcomingDeadlines,
  upcomingHearings,
  userRole,
}: NotificationsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const isAdmin = ADMIN_ROLES.includes(userRole);

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      search === "" ||
      notif.subject?.toLowerCase().includes(search.toLowerCase()) ||
      notif.case?.code.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || notif.status === statusFilter;

    const matchesChannel =
      channelFilter === "all" || notif.channel === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  // Calcular días restantes
  const getDaysRemaining = (date: Date) => {
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // Color según urgencia
  const getUrgencyColor = (days: number) => {
    if (days <= 1) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 3) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              {isAdmin ? "Centro de Notificaciones" : "Mis Notificaciones"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Gestiona todas las notificaciones del sistema"
                : "Tus alertas, plazos y recordatorios"}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/notification-templates">
                <Mail className="h-4 w-4 mr-2" />
                Plantillas
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/notification-settings">
                <Settings className="h-4 w-4 mr-2" />
                Configuracion
              </Link>
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Procesar Cola
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En Cola
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-blue-600">
              {stats.QUEUED || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-green-600">
              {stats.SENT || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Fallidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-red-600">
              {stats.FAILED || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Plazos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-orange-600">
              {upcomingDeadlines.length}
            </p>
            <p className="text-xs text-muted-foreground">próximos 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Audiencias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-purple-600">
              {upcomingHearings.length}
            </p>
            <p className="text-xs text-muted-foreground">próximos 14 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Plazos</span>
            {upcomingDeadlines.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {upcomingDeadlines.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hearings" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            <span className="hidden sm:inline">Audiencias</span>
            {upcomingHearings.length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 justify-center bg-purple-600">
                {upcomingHearings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Notificaciones */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por asunto o expediente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="QUEUED">En cola</SelectItem>
                    <SelectItem value="SENT">Enviados</SelectItem>
                    <SelectItem value="FAILED">Fallidos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="IN_APP">En App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MailOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No hay notificaciones</h3>
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== "all" || channelFilter !== "all"
                    ? "No se encontraron notificaciones con los filtros aplicados"
                    : "No tienes notificaciones pendientes"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredNotifications.map((notif) => {
                    const statusConfig = STATUS_CONFIG[notif.status];
                    const channelConfig = CHANNEL_CONFIG[notif.channel];
                    const StatusIcon = statusConfig.icon;
                    const ChannelIcon = channelConfig.icon;

                    return (
                      <div
                        key={notif.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${statusConfig.color}`}>
                            <ChannelIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {notif.subject || EVENT_TYPE_LABELS[notif.eventType]}
                                </p>
                                {notif.case && (
                                  <Link
                                    href={`/cases/${notif.case.id}`}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    {notif.case.code}
                                  </Link>
                                )}
                              </div>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            {notif.body && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notif.body}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {notif.toEmail && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {notif.toEmail}
                                </span>
                              )}
                              <span>
                                {formatDistanceToNow(new Date(notif.createdAt), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Plazos */}
        <TabsContent value="deadlines" className="space-y-4">
          {upcomingDeadlines.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Timer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Sin plazos próximos</h3>
                <p className="text-sm text-muted-foreground">
                  No tienes plazos por vencer en los próximos 7 días
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => {
                const daysRemaining = getDaysRemaining(deadline.dueAt);
                const urgencyColor = getUrgencyColor(daysRemaining);

                return (
                  <Card key={deadline.id} className={`border ${urgencyColor}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${urgencyColor}`}>
                            <Timer className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{deadline.title}</h3>
                            <Link
                              href={`/cases/${deadline.case.id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {deadline.case.code}
                            </Link>
                            {deadline.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {deadline.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg">
                            {daysRemaining === 0
                              ? "HOY"
                              : daysRemaining === 1
                              ? "MAÑANA"
                              : `${daysRemaining} días`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(deadline.dueAt), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Audiencias */}
        <TabsContent value="hearings" className="space-y-4">
          {upcomingHearings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Sin audiencias próximas</h3>
                <p className="text-sm text-muted-foreground">
                  No tienes audiencias programadas en los próximos 14 días
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingHearings.map((hearing) => {
                const daysRemaining = getDaysRemaining(hearing.hearingAt);

                return (
                  <Card key={hearing.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                            <Gavel className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{hearing.title}</h3>
                            <Link
                              href={`/cases/${hearing.case.id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {hearing.case.code}
                            </Link>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {hearing.location && (
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {hearing.location}
                                </Badge>
                              )}
                              {hearing.meetingUrl && (
                                <a
                                  href={hearing.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Badge className="text-xs bg-blue-600 hover:bg-blue-700">
                                    Unirse a videollamada
                                  </Badge>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg text-purple-600">
                            {daysRemaining === 0
                              ? "HOY"
                              : daysRemaining === 1
                              ? "MAÑANA"
                              : `${daysRemaining} días`}
                          </p>
                          <p className="text-sm font-medium">
                            {format(new Date(hearing.hearingAt), "HH:mm", {
                              locale: es,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(hearing.hearingAt), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Configuración:</strong> Puedes personalizar qué notificaciones recibes
            y por qué canal en{" "}
            <Link href="/settings/notifications" className="underline">
              Preferencias de Notificación
            </Link>
            .
            {isAdmin && (
              <>
                {" "}Las reglas de notificación se configuran en{" "}
                <Link href="/admin/arbitration-types" className="underline">
                  Tipos de Arbitraje
                </Link>
                .
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
