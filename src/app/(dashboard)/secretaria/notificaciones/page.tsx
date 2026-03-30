/**
 * CAARD - Notificaciones (Secretaría)
 * Panel de gestión de notificaciones para la Secretaría Arbitral
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Plus,
  Search,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  ArrowRight,
  Filter,
  Mail,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  createdAt: string;
  sentAt?: string;
  recipientName: string;
  recipientEmail: string;
  caseCode?: string;
}


const typeLabels: Record<string, { label: string; color: string }> = {
  INFO: { label: "Informativa", color: "bg-blue-100 text-blue-800" },
  WARNING: { label: "Advertencia", color: "bg-yellow-100 text-yellow-800" },
  URGENT: { label: "Urgente", color: "bg-red-100 text-red-800" },
  DEADLINE: { label: "Plazo", color: "bg-orange-100 text-orange-800" },
  HEARING: { label: "Audiencia", color: "bg-purple-100 text-purple-800" },
  PAYMENT: { label: "Pago", color: "bg-green-100 text-green-800" },
  DOCUMENT: { label: "Documento", color: "bg-gray-100 text-gray-800" },
};

const statusLabels: Record<string, { label: string; icon: any; color: string }> = {
  PENDING: { label: "Pendiente", icon: Clock, color: "text-yellow-600" },
  SENT: { label: "Enviado", icon: Send, color: "text-blue-600" },
  DELIVERED: { label: "Entregado", icon: CheckCircle, color: "text-green-600" },
  FAILED: { label: "Fallido", icon: AlertTriangle, color: "text-red-600" },
};

export default function SecretariaNotificacionesPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications/user");
        if (res.ok) {
          const data = await res.json();
          const items = (data.items || data.notifications || []).map((n: any) => ({
            id: n.id,
            type: n.type || "INFO",
            title: n.title || "Notificación",
            message: n.message || n.body || "",
            status: n.status || (n.sentAt ? "SENT" : "PENDING"),
            createdAt: n.createdAt || new Date().toISOString(),
            sentAt: n.sentAt,
            recipientName: n.recipientName || n.user?.name || "—",
            recipientEmail: n.recipientEmail || n.user?.email || "—",
            caseCode: n.caseCode || n.case?.code,
          }));
          setNotifications(items);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.caseCode?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && n.status === "PENDING";
    if (activeTab === "sent") return matchesSearch && (n.status === "SENT" || n.status === "DELIVERED");
    if (activeTab === "failed") return matchesSearch && n.status === "FAILED";
    return matchesSearch;
  });

  const stats = {
    total: notifications.length,
    pending: notifications.filter((n) => n.status === "PENDING").length,
    sent: notifications.filter((n) => n.status === "SENT" || n.status === "DELIVERED").length,
    failed: notifications.filter((n) => n.status === "FAILED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-[#D66829]" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Gestione las notificaciones y traslados a las partes
          </p>
        </div>
        <Button asChild className="bg-[#D66829] hover:bg-[#c45a22]">
          <Link href="/secretaria/notificaciones/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Notificación
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fallidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, destinatario o expediente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Todas ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Enviadas ({stats.sent})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Fallidas ({stats.failed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No hay notificaciones que mostrar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => {
                    const typeInfo = typeLabels[notification.type] || typeLabels.INFO;
                    const statusInfo = statusLabels[notification.status];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                            {notification.caseCode && (
                              <Badge variant="outline">{notification.caseCode}</Badge>
                            )}
                          </div>
                          <h3 className="font-medium truncate">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {notification.recipientName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.createdAt).toLocaleDateString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-1 ${statusInfo.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{statusInfo.label}</span>
                          </div>
                          {notification.status === "PENDING" && (
                            <Button size="sm" variant="outline">
                              <Send className="h-3 w-3 mr-1" />
                              Enviar
                            </Button>
                          )}
                          {notification.status === "FAILED" && (
                            <Button size="sm" variant="outline">
                              Reintentar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/secretaria/notificaciones/nueva?type=traslado">
                <FileText className="h-5 w-5 text-[#D66829]" />
                <span className="font-medium">Correr Traslado</span>
                <span className="text-xs text-muted-foreground">De escrito o documento</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/secretaria/notificaciones/nueva?type=audiencia">
                <Bell className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Citar a Audiencia</span>
                <span className="text-xs text-muted-foreground">Notificar fecha y hora</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/secretaria/notificaciones/nueva?type=resolucion">
                <Send className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Notificar Resolución</span>
                <span className="text-xs text-muted-foreground">Providencia o laudo</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-center gap-2" asChild>
              <Link href="/secretaria/notificaciones/nueva?type=plazo">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Recordar Plazo</span>
                <span className="text-xs text-muted-foreground">Vencimiento próximo</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
