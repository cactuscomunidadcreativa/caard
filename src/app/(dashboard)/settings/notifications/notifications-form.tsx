/**
 * CAARD - Formulario de Preferencias de Notificaciones
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Smartphone,
  Bell,
  FileText,
  Calendar,
  CreditCard,
  Clock,
  Megaphone,
  Loader2,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  caseUpdates: boolean;
  documentNotifications: boolean;
  deadlineReminders: boolean;
  paymentAlerts: boolean;
  hearingReminders: boolean;
  marketingEmails: boolean;
}

interface NotificationsFormProps {
  initialPreferences: NotificationPreferences;
}

export function NotificationsForm({ initialPreferences }: NotificationsFormProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar preferencias");
      }

      toast({
        title: "Preferencias guardadas",
        description: "Tus preferencias de notificación han sido actualizadas.",
      });

      setHasChanges(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canales de notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Canales de notificación</CardTitle>
          <CardDescription>
            Elige cómo quieres recibir las notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="email" className="font-medium">
                  Correo electrónico
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones por email
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.emailEnabled}
              onCheckedChange={(v) => updatePreference("emailEnabled", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <Label htmlFor="sms" className="font-medium">
                  SMS
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recibe alertas importantes por mensaje de texto
                </p>
              </div>
            </div>
            <Switch
              id="sms"
              checked={preferences.smsEnabled}
              onCheckedChange={(v) => updatePreference("smsEnabled", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Label htmlFor="inApp" className="font-medium">
                  Notificaciones en la aplicación
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ver notificaciones dentro del sistema
                </p>
              </div>
            </div>
            <Switch
              id="inApp"
              checked={preferences.inAppEnabled}
              onCheckedChange={(v) => updatePreference("inAppEnabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipos de notificación</CardTitle>
          <CardDescription>
            Selecciona qué tipo de notificaciones deseas recibir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="caseUpdates" className="font-medium">
                  Actualizaciones de casos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cambios de estado, admisión, observaciones
                </p>
              </div>
            </div>
            <Switch
              id="caseUpdates"
              checked={preferences.caseUpdates}
              onCheckedChange={(v) => updatePreference("caseUpdates", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="documentNotifications" className="font-medium">
                  Documentos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Nuevos documentos subidos o actualizados
                </p>
              </div>
            </div>
            <Switch
              id="documentNotifications"
              checked={preferences.documentNotifications}
              onCheckedChange={(v) => updatePreference("documentNotifications", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="deadlineReminders" className="font-medium">
                  Recordatorios de plazos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas antes de que venzan los plazos
                </p>
              </div>
            </div>
            <Switch
              id="deadlineReminders"
              checked={preferences.deadlineReminders}
              onCheckedChange={(v) => updatePreference("deadlineReminders", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="paymentAlerts" className="font-medium">
                  Alertas de pago
                </Label>
                <p className="text-sm text-muted-foreground">
                  Pagos pendientes, confirmados o vencidos
                </p>
              </div>
            </div>
            <Switch
              id="paymentAlerts"
              checked={preferences.paymentAlerts}
              onCheckedChange={(v) => updatePreference("paymentAlerts", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="hearingReminders" className="font-medium">
                  Recordatorios de audiencias
                </Label>
                <p className="text-sm text-muted-foreground">
                  Audiencias programadas y cambios
                </p>
              </div>
            </div>
            <Switch
              id="hearingReminders"
              checked={preferences.hearingReminders}
              onCheckedChange={(v) => updatePreference("hearingReminders", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="marketingEmails" className="font-medium">
                  Comunicaciones promocionales
                </Label>
                <p className="text-sm text-muted-foreground">
                  Eventos, cursos y novedades de CAARD
                </p>
              </div>
            </div>
            <Switch
              id="marketingEmails"
              checked={preferences.marketingEmails}
              onCheckedChange={(v) => updatePreference("marketingEmails", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !hasChanges}
          className="bg-[#D66829] hover:bg-[#c45a22]"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}
