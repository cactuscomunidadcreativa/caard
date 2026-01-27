/**
 * Página: Historial de Notificaciones
 * ====================================
 * Historial completo de notificaciones del usuario
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Search,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Trash2,
  MailOpen,
  Mail,
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo
const mockNotifications = [
  {
    id: "1",
    type: "CASE_UPDATE",
    title: "Demanda admitida",
    message: "La demanda del expediente ARB-2025-0001 ha sido admitida a trámite.",
    caseCode: "ARB-2025-0001",
    caseId: "case-1",
    isRead: false,
    isImportant: false,
    createdAt: "2025-01-26T10:30:00",
  },
  {
    id: "2",
    type: "DEADLINE",
    title: "Plazo próximo a vencer",
    message: "El plazo para contestación de demanda vence en 2 días hábiles.",
    caseCode: "ARB-2025-0001",
    caseId: "case-1",
    isRead: false,
    isImportant: true,
    createdAt: "2025-01-26T09:00:00",
  },
  {
    id: "3",
    type: "PAYMENT",
    title: "Pago confirmado",
    message: "Se ha confirmado el pago de S/ 15,000 correspondiente a la orden OP-2025-0001.",
    caseCode: "ARB-2025-0001",
    caseId: "case-1",
    isRead: true,
    isImportant: false,
    createdAt: "2025-01-25T14:20:00",
  },
  {
    id: "4",
    type: "DOCUMENT",
    title: "Nuevo documento",
    message: "Se ha cargado un nuevo documento: Contestación de demanda.",
    caseCode: "ARB-2025-0002",
    caseId: "case-2",
    isRead: true,
    isImportant: false,
    createdAt: "2025-01-25T11:45:00",
  },
  {
    id: "5",
    type: "HEARING",
    title: "Audiencia programada",
    message: "Se ha programado audiencia de pruebas para el 15/02/2025 a las 10:00 AM.",
    caseCode: "ARB-2025-0001",
    caseId: "case-1",
    isRead: true,
    isImportant: true,
    createdAt: "2025-01-24T16:00:00",
  },
  {
    id: "6",
    type: "CASE_UPDATE",
    title: "Solicitud observada",
    message: "Su solicitud ha sido observada. Tiene 5 días hábiles para subsanar.",
    caseCode: "ARB-2025-0003",
    caseId: "case-3",
    isRead: true,
    isImportant: true,
    createdAt: "2025-01-23T10:30:00",
  },
  {
    id: "7",
    type: "SYSTEM",
    title: "Mantenimiento programado",
    message: "El sistema estará en mantenimiento el día 28/01/2025 de 02:00 a 04:00 AM.",
    caseCode: null,
    caseId: null,
    isRead: true,
    isImportant: false,
    createdAt: "2025-01-22T09:00:00",
  },
];

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  CASE_UPDATE: { label: "Expediente", icon: FileText, color: "bg-blue-100 text-blue-600" },
  DEADLINE: { label: "Plazo", icon: Clock, color: "bg-amber-100 text-amber-600" },
  PAYMENT: { label: "Pago", icon: DollarSign, color: "bg-green-100 text-green-600" },
  DOCUMENT: { label: "Documento", icon: FileText, color: "bg-purple-100 text-purple-600" },
  HEARING: { label: "Audiencia", icon: Calendar, color: "bg-indigo-100 text-indigo-600" },
  SYSTEM: { label: "Sistema", icon: Bell, color: "bg-gray-100 text-gray-600" },
};

export default function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notif.caseCode && notif.caseCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || notif.type === filterType;
    const matchesRead = filterRead === "all" ||
                       (filterRead === "unread" && !notif.isRead) ||
                       (filterRead === "read" && notif.isRead);
    return matchesSearch && matchesType && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "Hace menos de 1 hora";
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    } else {
      return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial de Notificaciones</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notificación(es) sin leer` : "Todas las notificaciones leídas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <MailOpen className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="CASE_UPDATE">Expediente</SelectItem>
                <SelectItem value="DEADLINE">Plazo</SelectItem>
                <SelectItem value="PAYMENT">Pago</SelectItem>
                <SelectItem value="DOCUMENT">Documento</SelectItem>
                <SelectItem value="HEARING">Audiencia</SelectItem>
                <SelectItem value="SYSTEM">Sistema</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Sin leer</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notificación(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay notificaciones que mostrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const TypeIcon = typeConfig[notification.type]?.icon || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      !notification.isRead
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white hover:bg-muted/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${typeConfig[notification.type]?.color || "bg-gray-100"}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{notification.title}</span>
                        {notification.isImportant && (
                          <Badge variant="destructive" className="text-xs">
                            Importante
                          </Badge>
                        )}
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(notification.createdAt)}</span>
                        {notification.caseCode && (
                          <>
                            <span>•</span>
                            <Link
                              href={`/cases/${notification.caseId}`}
                              className="font-mono hover:text-primary"
                            >
                              {notification.caseCode}
                            </Link>
                          </>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {typeConfig[notification.type]?.label || notification.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          title="Marcar como leída"
                        >
                          <MailOpen className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        title="Eliminar"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
