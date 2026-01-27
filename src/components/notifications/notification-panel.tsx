"use client";

/**
 * Panel de Notificaciones en Tiempo Real
 * =======================================
 * Muestra notificaciones del sistema con soporte para actualizaciones
 */

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  FileText,
  DollarSign,
  Gavel,
  AlertTriangle,
  Calendar,
  Mail,
  Settings,
  Trash2,
  RefreshCw,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos de notificación
type NotificationType =
  | "CASE_UPDATE"
  | "DOCUMENT"
  | "PAYMENT"
  | "DEADLINE"
  | "HEARING"
  | "EMERGENCY"
  | "SYSTEM"
  | "MESSAGE";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  caseCode?: string;
  caseId?: string;
  isRead: boolean;
  isImportant: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

// Configuración visual por tipo
const typeConfig: Record<
  NotificationType,
  { icon: any; color: string; bgColor: string }
> = {
  CASE_UPDATE: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  DOCUMENT: {
    icon: FileText,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  PAYMENT: {
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  DEADLINE: {
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  HEARING: {
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  EMERGENCY: {
    icon: Zap,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  SYSTEM: {
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  MESSAGE: {
    icon: Mail,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
  },
};

interface NotificationPanelProps {
  userId?: string;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationPanel({
  userId,
  onNotificationClick,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/user");
      if (response.ok) {
        const data = await response.json();
        setNotifications(
          data.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al abrir
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Polling para actualizaciones (cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        // Solo actualizar contador en segundo plano
        fetch("/api/notifications/count")
          .then((r) => r.json())
          .then((data) => {
            // Actualizar badge
          })
          .catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Marcar como leído
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Filtrar notificaciones
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  // Contar no leídas
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Formatear fecha relativa
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString("es-PE");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} nuevas</Badge>
              )}
            </SheetTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={loadNotifications}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Marcar todo
                </Button>
              )}
            </div>
          </div>
          <SheetDescription>
            Mantente al día con las actualizaciones de tus casos
          </SheetDescription>
        </SheetHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">
              No leídas
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 rounded-lg border transition-colors cursor-pointer",
                          !notification.isRead && "bg-primary/5 border-primary/20",
                          notification.isImportant &&
                            "border-l-4 border-l-red-500"
                        )}
                        onClick={() => {
                          markAsRead(notification.id);
                          onNotificationClick?.(notification);
                        }}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              config.bgColor
                            )}
                          >
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p
                                  className={cn(
                                    "font-medium text-sm",
                                    !notification.isRead && "font-semibold"
                                  )}
                                >
                                  {notification.title}
                                </p>
                                {notification.caseCode && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1"
                                  >
                                    {notification.caseCode}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            {notification.actionUrl && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = notification.actionUrl!;
                                }}
                              >
                                {notification.actionLabel || "Ver más"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationPanel;
