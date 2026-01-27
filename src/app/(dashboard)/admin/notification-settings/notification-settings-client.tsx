"use client";

/**
 * CAARD - Configuración de Notificaciones del Centro
 * Panel para configurar canales SMS, WhatsApp y Email
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Phone,
  MessageSquare,
  Settings2,
  Bell,
  Save,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";

interface NotificationSettings {
  // Email settings
  emailEnabled: boolean;
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  emailFrom: string;
  emailFromName: string;

  // SMS settings
  smsEnabled: boolean;
  smsProvider: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;

  // WhatsApp settings
  whatsappEnabled: boolean;
  whatsappProvider: string;
  whatsappApiKey: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;

  // General settings
  defaultChannels: string[];
  sendWelcomeNotifications: boolean;
  sendCaseUpdates: boolean;
  sendDeadlineReminders: boolean;
  sendPaymentReminders: boolean;
  reminderDaysBefore: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  emailProvider: "smtp",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpSecure: true,
  emailFrom: "",
  emailFromName: "",

  smsEnabled: false,
  smsProvider: "twilio",
  twilioAccountSid: "",
  twilioAuthToken: "",
  twilioPhoneNumber: "",

  whatsappEnabled: false,
  whatsappProvider: "twilio",
  whatsappApiKey: "",
  whatsappPhoneNumberId: "",
  whatsappBusinessAccountId: "",

  defaultChannels: ["EMAIL"],
  sendWelcomeNotifications: true,
  sendCaseUpdates: true,
  sendDeadlineReminders: true,
  sendPaymentReminders: true,
  reminderDaysBefore: 3,
};

export function NotificationSettingsClient() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    email: "unknown" | "success" | "error";
    sms: "unknown" | "success" | "error";
    whatsapp: "unknown" | "success" | "error";
  }>({
    email: "unknown",
    sms: "unknown",
    whatsapp: "unknown",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/notification-settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "Los cambios se han guardado correctamente",
        });
      } else {
        throw new Error("Error saving settings");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    setTestingEmail(true);
    try {
      const response = await fetch("/api/admin/notification-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "email", settings }),
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatus((prev) => ({ ...prev, email: "success" }));
        toast({
          title: "Conexion exitosa",
          description: "El servidor de correo esta configurado correctamente",
        });
      } else {
        setConnectionStatus((prev) => ({ ...prev, email: "error" }));
        toast({
          title: "Error de conexion",
          description: data.error || "No se pudo conectar al servidor de correo",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus((prev) => ({ ...prev, email: "error" }));
      toast({
        title: "Error",
        description: "Error al probar la conexion",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const testSmsConnection = async () => {
    setTestingSms(true);
    try {
      const response = await fetch("/api/admin/notification-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "sms", settings }),
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatus((prev) => ({ ...prev, sms: "success" }));
        toast({
          title: "Conexion exitosa",
          description: "El servicio de SMS esta configurado correctamente",
        });
      } else {
        setConnectionStatus((prev) => ({ ...prev, sms: "error" }));
        toast({
          title: "Error de conexion",
          description: data.error || "No se pudo conectar al servicio de SMS",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus((prev) => ({ ...prev, sms: "error" }));
      toast({
        title: "Error",
        description: "Error al probar la conexion",
        variant: "destructive",
      });
    } finally {
      setTestingSms(false);
    }
  };

  const testWhatsappConnection = async () => {
    setTestingWhatsapp(true);
    try {
      const response = await fetch("/api/admin/notification-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whatsapp", settings }),
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatus((prev) => ({ ...prev, whatsapp: "success" }));
        toast({
          title: "Conexion exitosa",
          description: "WhatsApp Business esta configurado correctamente",
        });
      } else {
        setConnectionStatus((prev) => ({ ...prev, whatsapp: "error" }));
        toast({
          title: "Error de conexion",
          description: data.error || "No se pudo conectar a WhatsApp Business",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus((prev) => ({ ...prev, whatsapp: "error" }));
      toast({
        title: "Error",
        description: "Error al probar la conexion",
        variant: "destructive",
      });
    } finally {
      setTestingWhatsapp(false);
    }
  };

  const getStatusIcon = (status: "unknown" | "success" | "error") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Configuracion de Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Configure los canales de notificacion del centro: Email, SMS y WhatsApp
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`p-3 rounded-full ${settings.emailEnabled ? "bg-green-100" : "bg-gray-100"}`}>
              <Mail className={`h-5 w-5 ${settings.emailEnabled ? "text-green-600" : "text-gray-400"}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {settings.emailEnabled ? "Activo" : "Inactivo"}
              </p>
            </div>
            {getStatusIcon(connectionStatus.email)}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`p-3 rounded-full ${settings.smsEnabled ? "bg-blue-100" : "bg-gray-100"}`}>
              <Phone className={`h-5 w-5 ${settings.smsEnabled ? "text-blue-600" : "text-gray-400"}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">SMS</p>
              <p className="text-sm text-muted-foreground">
                {settings.smsEnabled ? "Activo" : "Inactivo"}
              </p>
            </div>
            {getStatusIcon(connectionStatus.sms)}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`p-3 rounded-full ${settings.whatsappEnabled ? "bg-green-100" : "bg-gray-100"}`}>
              <MessageSquare className={`h-5 w-5 ${settings.whatsappEnabled ? "text-green-600" : "text-gray-400"}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                {settings.whatsappEnabled ? "Activo" : "Inactivo"}
              </p>
            </div>
            {getStatusIcon(connectionStatus.whatsapp)}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configuracion de Email
                  </CardTitle>
                  <CardDescription>
                    Configure el servidor SMTP para enviar correos electronicos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="emailEnabled">Habilitar Email</Label>
                  <Switch
                    id="emailEnabled"
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailEnabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailProvider">Proveedor</Label>
                  <Select
                    value={settings.emailProvider}
                    onValueChange={(value) =>
                      setSettings({ ...settings, emailProvider: value })
                    }
                  >
                    <SelectTrigger id="emailProvider">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP Personalizado</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpHost: e.target.value })
                    }
                    placeholder="smtp.ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Puerto</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })
                    }
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2 flex items-center gap-4 pt-6">
                  <Switch
                    id="smtpSecure"
                    checked={settings.smtpSecure}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, smtpSecure: checked })
                    }
                  />
                  <Label htmlFor="smtpSecure">Usar SSL/TLS</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Usuario</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpUser: e.target.value })
                    }
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Contrasena</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) =>
                      setSettings({ ...settings, smtpPassword: e.target.value })
                    }
                    placeholder="********"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFrom">Email Remitente</Label>
                  <Input
                    id="emailFrom"
                    type="email"
                    value={settings.emailFrom}
                    onChange={(e) =>
                      setSettings({ ...settings, emailFrom: e.target.value })
                    }
                    placeholder="notificaciones@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFromName">Nombre Remitente</Label>
                  <Input
                    id="emailFromName"
                    value={settings.emailFromName}
                    onChange={(e) =>
                      setSettings({ ...settings, emailFromName: e.target.value })
                    }
                    placeholder="Centro de Arbitraje"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={testEmailConnection}
                  disabled={testingEmail || !settings.emailEnabled}
                >
                  {testingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Probar Conexion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Configuracion de SMS
                  </CardTitle>
                  <CardDescription>
                    Configure el servicio de SMS usando Twilio
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="smsEnabled">Habilitar SMS</Label>
                  <Switch
                    id="smsEnabled"
                    checked={settings.smsEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, smsEnabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Requisitos de Twilio</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Necesita una cuenta de Twilio con credenciales y un numero de telefono verificado.
                    </p>
                    <a
                      href="https://www.twilio.com/console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      Ir a la consola de Twilio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smsProvider">Proveedor</Label>
                  <Select
                    value={settings.smsProvider}
                    onValueChange={(value) =>
                      setSettings({ ...settings, smsProvider: value })
                    }
                  >
                    <SelectTrigger id="smsProvider">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioAccountSid">Account SID</Label>
                  <Input
                    id="twilioAccountSid"
                    value={settings.twilioAccountSid}
                    onChange={(e) =>
                      setSettings({ ...settings, twilioAccountSid: e.target.value })
                    }
                    placeholder="AC..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioAuthToken">Auth Token</Label>
                  <Input
                    id="twilioAuthToken"
                    type="password"
                    value={settings.twilioAuthToken}
                    onChange={(e) =>
                      setSettings({ ...settings, twilioAuthToken: e.target.value })
                    }
                    placeholder="********"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioPhoneNumber">Numero de Telefono</Label>
                  <Input
                    id="twilioPhoneNumber"
                    value={settings.twilioPhoneNumber}
                    onChange={(e) =>
                      setSettings({ ...settings, twilioPhoneNumber: e.target.value })
                    }
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={testSmsConnection}
                  disabled={testingSms || !settings.smsEnabled}
                >
                  {testingSms ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Probar Conexion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Configuracion de WhatsApp Business
                  </CardTitle>
                  <CardDescription>
                    Configure la integracion con WhatsApp Business API
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="whatsappEnabled">Habilitar WhatsApp</Label>
                  <Switch
                    id="whatsappEnabled"
                    checked={settings.whatsappEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, whatsappEnabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">WhatsApp Business API</p>
                    <p className="text-sm text-green-700 mt-1">
                      Puede usar la API oficial de Meta (WhatsApp Business) o Twilio para WhatsApp.
                    </p>
                    <a
                      href="https://developers.facebook.com/docs/whatsapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline mt-2"
                    >
                      Documentacion de WhatsApp Business API
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsappProvider">Proveedor</Label>
                  <Select
                    value={settings.whatsappProvider}
                    onValueChange={(value) =>
                      setSettings({ ...settings, whatsappProvider: value })
                    }
                  >
                    <SelectTrigger id="whatsappProvider">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio WhatsApp</SelectItem>
                      <SelectItem value="meta">Meta Business API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappApiKey">API Key / Access Token</Label>
                  <Input
                    id="whatsappApiKey"
                    type="password"
                    value={settings.whatsappApiKey}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappApiKey: e.target.value })
                    }
                    placeholder="EAA..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
                  <Input
                    id="whatsappPhoneNumberId"
                    value={settings.whatsappPhoneNumberId}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappPhoneNumberId: e.target.value })
                    }
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappBusinessAccountId">Business Account ID</Label>
                  <Input
                    id="whatsappBusinessAccountId"
                    value={settings.whatsappBusinessAccountId}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappBusinessAccountId: e.target.value })
                    }
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={testWhatsappConnection}
                  disabled={testingWhatsapp || !settings.whatsappEnabled}
                >
                  {testingWhatsapp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Probar Conexion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuracion General de Notificaciones
              </CardTitle>
              <CardDescription>
                Configure cuando y como se envian las notificaciones automaticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Canales por Defecto</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Seleccione los canales que se usaran por defecto para las notificaciones
                </p>
                <div className="flex flex-wrap gap-4">
                  {["EMAIL", "SMS", "WHATSAPP"].map((channel) => (
                    <div key={channel} className="flex items-center gap-2">
                      <Switch
                        id={`default-${channel}`}
                        checked={settings.defaultChannels.includes(channel)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSettings({
                              ...settings,
                              defaultChannels: [...settings.defaultChannels, channel],
                            });
                          } else {
                            setSettings({
                              ...settings,
                              defaultChannels: settings.defaultChannels.filter(
                                (c) => c !== channel
                              ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`default-${channel}`}>{channel}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-3">Tipos de Notificaciones Automaticas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sendWelcome">Notificaciones de Bienvenida</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar correo de bienvenida a nuevos usuarios
                      </p>
                    </div>
                    <Switch
                      id="sendWelcome"
                      checked={settings.sendWelcomeNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, sendWelcomeNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sendCaseUpdates">Actualizaciones de Expediente</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar cambios de estado y actualizaciones
                      </p>
                    </div>
                    <Switch
                      id="sendCaseUpdates"
                      checked={settings.sendCaseUpdates}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, sendCaseUpdates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sendDeadline">Recordatorios de Plazos</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar recordatorios antes del vencimiento de plazos
                      </p>
                    </div>
                    <Switch
                      id="sendDeadline"
                      checked={settings.sendDeadlineReminders}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, sendDeadlineReminders: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sendPayment">Recordatorios de Pago</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar pagos pendientes y vencimientos
                      </p>
                    </div>
                    <Switch
                      id="sendPayment"
                      checked={settings.sendPaymentReminders}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, sendPaymentReminders: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-3">Configuracion de Recordatorios</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">Dias antes del vencimiento</Label>
                    <Input
                      id="reminderDays"
                      type="number"
                      min={1}
                      max={30}
                      value={settings.reminderDaysBefore}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          reminderDaysBefore: parseInt(e.target.value) || 3,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Los recordatorios se enviaran este numero de dias antes del vencimiento
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
