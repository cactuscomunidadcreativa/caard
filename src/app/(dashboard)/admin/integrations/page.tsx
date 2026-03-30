"use client";

/**
 * CAARD - Panel de Integraciones del Sistema
 * ==========================================
 * Configuración de integraciones externas, APIs, dominios y servicios
 */

import { useState, useEffect } from "react";
import {
  Settings,
  Mail,
  MessageSquare,
  Calendar,
  Video,
  Cloud,
  CreditCard,
  Key,
  Globe,
  Webhook,
  BarChart3,
  Bot,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  TestTube,
  ExternalLink,
  Plus,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Tipos de integraciones disponibles
const INTEGRATION_CATEGORIES = [
  {
    id: "google-workspace",
    name: "Google Workspace",
    description: "Gmail, Calendar, Drive unificado",
    icon: Cloud,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "email",
    name: "Email",
    description: "Configuracion de correo electronico",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "sms",
    name: "SMS",
    description: "Servicios de mensajeria SMS",
    icon: MessageSquare,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "calendar",
    name: "Calendario",
    description: "Google Calendar y eventos",
    icon: Calendar,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "meeting",
    name: "Reuniones",
    description: "Google Meet, Zoom, etc.",
    icon: Video,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "ai",
    name: "IA",
    description: "OpenAI, Anthropic, etc.",
    icon: Bot,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    id: "storage",
    name: "Almacenamiento",
    description: "Google Drive y archivos",
    icon: Cloud,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
  {
    id: "domain",
    name: "Dominios",
    description: "Configuracion de dominios",
    icon: Globe,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
  },
];

// Integraciones disponibles
const AVAILABLE_INTEGRATIONS = [
  // Email
  {
    code: "smtp-email",
    type: "EMAIL",
    name: "SMTP Email",
    description: "Configuracion de servidor SMTP para envio de correos",
    icon: Mail,
    fields: [
      { key: "host", label: "Servidor SMTP", type: "text", placeholder: "smtp.gmail.com" },
      { key: "port", label: "Puerto", type: "number", placeholder: "587" },
      { key: "secure", label: "TLS/SSL", type: "boolean" },
      { key: "user", label: "Usuario", type: "text", placeholder: "sis@caardpe.com" },
      { key: "password", label: "Contrasena", type: "password", sensitive: true },
      { key: "fromName", label: "Nombre del remitente", type: "text", placeholder: "CAARD Sistema" },
      { key: "fromEmail", label: "Email del remitente", type: "text", placeholder: "sis@caardpe.com" },
    ],
  },
  {
    code: "sendgrid",
    type: "EMAIL",
    name: "SendGrid",
    description: "API de SendGrid para envio masivo de emails",
    icon: Mail,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", sensitive: true },
      { key: "fromName", label: "Nombre del remitente", type: "text" },
      { key: "fromEmail", label: "Email del remitente", type: "text" },
    ],
  },
  // SMS
  {
    code: "twilio",
    type: "SMS",
    name: "Twilio SMS",
    description: "Servicio de SMS y WhatsApp via Twilio",
    icon: MessageSquare,
    fields: [
      { key: "accountSid", label: "Account SID", type: "text" },
      { key: "authToken", label: "Auth Token", type: "password", sensitive: true },
      { key: "phoneNumber", label: "Numero de telefono", type: "text", placeholder: "+1234567890" },
      { key: "whatsappEnabled", label: "WhatsApp habilitado", type: "boolean" },
    ],
  },
  // Calendar & Meet
  {
    code: "google-calendar",
    type: "CALENDAR",
    name: "Google Calendar",
    description: "Sincronizacion con Google Calendar para audiencias",
    icon: Calendar,
    fields: [
      { key: "clientId", label: "Client ID", type: "text" },
      { key: "clientSecret", label: "Client Secret", type: "password", sensitive: true },
      { key: "refreshToken", label: "Refresh Token", type: "password", sensitive: true },
      { key: "calendarId", label: "Calendar ID", type: "text", placeholder: "primary" },
    ],
    oauth: true,
  },
  {
    code: "google-meet",
    type: "MEETING",
    name: "Google Meet",
    description: "Crear reuniones automaticas de Google Meet",
    icon: Video,
    fields: [
      { key: "enabled", label: "Habilitado", type: "boolean" },
      { key: "defaultDuration", label: "Duracion por defecto (min)", type: "number", placeholder: "60" },
    ],
    requiresCalendar: true,
  },
  {
    code: "zoom",
    type: "MEETING",
    name: "Zoom",
    description: "Integracion con Zoom para reuniones",
    icon: Video,
    fields: [
      { key: "accountId", label: "Account ID", type: "text" },
      { key: "clientId", label: "Client ID", type: "text" },
      { key: "clientSecret", label: "Client Secret", type: "password", sensitive: true },
      { key: "defaultDuration", label: "Duracion por defecto (min)", type: "number", placeholder: "60" },
    ],
  },
  // AI
  {
    code: "openai",
    type: "AI",
    name: "OpenAI",
    description: "API de OpenAI para funciones de IA",
    icon: Bot,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", sensitive: true },
      { key: "organization", label: "Organization ID", type: "text" },
      { key: "defaultModel", label: "Modelo por defecto", type: "select", options: ["gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo"] },
    ],
  },
  {
    code: "anthropic",
    type: "AI",
    name: "Anthropic Claude",
    description: "API de Anthropic para Claude",
    icon: Bot,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", sensitive: true },
      { key: "defaultModel", label: "Modelo por defecto", type: "select", options: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"] },
    ],
  },
  // Storage - Google Drive
  {
    code: "google-drive",
    type: "STORAGE",
    name: "Google Drive",
    description: "Almacenamiento de documentos de expedientes en Google Drive",
    icon: Cloud,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Tu Google Cloud Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password", sensitive: true },
      { key: "redirectUri", label: "Redirect URI", type: "text", placeholder: "https://tudominio.com/api/integrations/google/callback" },
      { key: "refreshToken", label: "Refresh Token", type: "password", sensitive: true },
      { key: "rootFolderId", label: "ID Carpeta Raiz", type: "text", placeholder: "ID de la carpeta raiz en Drive" },
    ],
    oauth: true,
  },
  // Domains
  {
    code: "domain-config",
    type: "DOMAIN",
    name: "Dominio Principal",
    description: "Configuracion del dominio principal del sistema",
    icon: Globe,
    fields: [
      { key: "domain", label: "Dominio", type: "text", placeholder: "caardpe.com" },
      { key: "subdomain", label: "Subdominio (opcional)", type: "text", placeholder: "app" },
      { key: "sslEnabled", label: "SSL Habilitado", type: "boolean" },
    ],
  },
];

interface IntegrationConfig {
  id?: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  isConfigured: boolean;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  lastTestedAt?: string;
  lastTestStatus?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<typeof AVAILABLE_INTEGRATIONS[0] | null>(null);
  const [editingConfig, setEditingConfig] = useState<IntegrationConfig | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("google-workspace");
  const [googleStatus, setGoogleStatus] = useState<{
    configured: boolean;
    loading: boolean;
    testingEmail: boolean;
    testingCalendar: boolean;
    testEmailTo: string;
    calendarEvents: any[];
  }>({
    configured: false,
    loading: true,
    testingEmail: false,
    testingCalendar: false,
    testEmailTo: "",
    calendarEvents: [],
  });

  // Cargar integraciones existentes
  useEffect(() => {
    loadIntegrations();
    checkGoogleStatus();
  }, []);

  const checkGoogleStatus = async () => {
    try {
      const res = await fetch("/api/integrations/google/status");
      if (res.ok) {
        const data = await res.json();
        setGoogleStatus((prev) => ({ ...prev, configured: data.configured, loading: false }));
      } else {
        setGoogleStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setGoogleStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleGoogleAuthorize = async () => {
    try {
      const res = await fetch("/api/integrations/google/auth-url");
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, "_blank");
      } else {
        toast.error("Error al generar URL de autorizacion. Verifica GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.");
      }
    } catch {
      toast.error("Error al conectar con Google");
    }
  };

  const handleTestGmailEmail = async () => {
    if (!googleStatus.testEmailTo) {
      toast.error("Ingresa un email destinatario");
      return;
    }
    setGoogleStatus((prev) => ({ ...prev, testingEmail: true }));
    try {
      const res = await fetch("/api/integrations/google/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: googleStatus.testEmailTo }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Correo de prueba enviado a ${googleStatus.testEmailTo}`);
      } else {
        toast.error(data.error || "Error al enviar correo de prueba");
      }
    } catch {
      toast.error("Error al enviar correo de prueba");
    } finally {
      setGoogleStatus((prev) => ({ ...prev, testingEmail: false }));
    }
  };

  const handleTestCalendar = async () => {
    setGoogleStatus((prev) => ({ ...prev, testingCalendar: true }));
    try {
      const res = await fetch("/api/calendar/events?calendarId=primary");
      if (res.ok) {
        const data = await res.json();
        setGoogleStatus((prev) => ({ ...prev, calendarEvents: data.events || [] }));
        toast.success(`Se encontraron ${data.events?.length || 0} eventos en el calendario`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al obtener eventos");
      }
    } catch {
      toast.error("Error al conectar con Google Calendar");
    } finally {
      setGoogleStatus((prev) => ({ ...prev, testingCalendar: false }));
    }
  };

  const loadIntegrations = async () => {
    try {
      const response = await fetch("/api/system/integrations");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureIntegration = (integration: typeof AVAILABLE_INTEGRATIONS[0]) => {
    const existing = integrations.find((i) => i.code === integration.code);
    setSelectedIntegration(integration);
    setEditingConfig(
      existing || {
        code: integration.code,
        name: integration.name,
        type: integration.type,
        isActive: false,
        isConfigured: false,
        credentials: {},
        settings: {},
      }
    );
  };

  const handleSaveIntegration = async () => {
    if (!editingConfig || !selectedIntegration) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/system/integrations", {
        method: editingConfig.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingConfig,
          id: editingConfig.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar la configuracion");
      }

      toast.success("Configuracion guardada correctamente");
      loadIntegrations();
      setSelectedIntegration(null);
      setEditingConfig(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar la configuracion");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestIntegration = async () => {
    if (!editingConfig) return;

    setIsTesting(true);
    try {
      const response = await fetch("/api/system/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingConfig),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Conexion exitosa!");
      } else {
        toast.error(result.error || "Error en la prueba de conexion");
      }
    } catch (error) {
      toast.error("Error al probar la conexion");
    } finally {
      setIsTesting(false);
    }
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateCredential = (key: string, value: any) => {
    if (!editingConfig) return;
    setEditingConfig({
      ...editingConfig,
      credentials: { ...editingConfig.credentials, [key]: value },
    });
  };

  const getIntegrationStatus = (code: string) => {
    const config = integrations.find((i) => i.code === code);
    if (!config) return "not_configured";
    if (!config.isConfigured) return "incomplete";
    if (!config.isActive) return "inactive";
    return "active";
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Activo
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Inactivo
          </Badge>
        );
      case "incomplete":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Incompleto
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Settings className="h-3 w-3 mr-1" />
            No configurado
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D66829] to-[#0B2A5B] flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Integraciones del Sistema</h1>
            <p className="text-sm text-muted-foreground">
              Configura APIs, servicios externos y credenciales
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadIntegrations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Alerta de seguridad */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Informacion Sensible</p>
            <p className="text-sm text-yellow-700">
              Las credenciales y API keys se almacenan de forma encriptada. Solo usuarios con rol SUPER_ADMIN pueden acceder a esta seccion.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de categorías */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          {INTEGRATION_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                <Icon className={`h-4 w-4 ${cat.color}`} />
                {cat.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Google Workspace - Custom tab content */}
        <TabsContent value="google-workspace">
          <div className="space-y-6">
            {/* Connection status */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <Cloud className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Google Workspace</CardTitle>
                      <CardDescription>
                        Integracion unificada: Gmail API, Google Calendar, Google Drive
                      </CardDescription>
                    </div>
                  </div>
                  {googleStatus.loading ? (
                    <Badge variant="outline">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Verificando...
                    </Badge>
                  ) : googleStatus.configured ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      No conectado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scopes */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Scopes solicitados</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Mail className="h-3 w-3" />
                      gmail.send
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      calendar
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Cloud className="h-3 w-3" />
                      drive.file
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Key className="h-3 w-3" />
                      userinfo.email
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Authorize button */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleGoogleAuthorize}
                    className="bg-[#D66829] hover:bg-[#c45a22] gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {googleStatus.configured ? "Re-autorizar con Google" : "Autorizar con Google"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {googleStatus.configured
                      ? "Puedes re-autorizar para actualizar los permisos o cambiar la cuenta."
                      : "Conecta una cuenta de Google Workspace (@caardpe.com) para habilitar Gmail, Calendar y Drive."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test: Send email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Gmail API - Enviar correo de prueba
                </CardTitle>
                <CardDescription>
                  Verifica que la integracion con Gmail API funciona correctamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="test-email-to">Email destinatario</Label>
                    <Input
                      id="test-email-to"
                      type="email"
                      placeholder="tu@email.com"
                      value={googleStatus.testEmailTo}
                      onChange={(e) =>
                        setGoogleStatus((prev) => ({ ...prev, testEmailTo: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    onClick={handleTestGmailEmail}
                    disabled={googleStatus.testingEmail || !googleStatus.configured}
                    variant="outline"
                    className="gap-2"
                  >
                    {googleStatus.testingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Enviar correo de prueba
                  </Button>
                </div>
                {!googleStatus.configured && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Autoriza con Google primero para poder enviar correos de prueba.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Test: Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Google Calendar - Ver calendario
                </CardTitle>
                <CardDescription>
                  Verifica la conexion con Google Calendar listando los proximos eventos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleTestCalendar}
                  disabled={googleStatus.testingCalendar || !googleStatus.configured}
                  variant="outline"
                  className="gap-2"
                >
                  {googleStatus.testingCalendar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  Ver calendario
                </Button>
                {!googleStatus.configured && (
                  <p className="text-sm text-yellow-600">
                    Autoriza con Google primero para poder ver el calendario.
                  </p>
                )}
                {googleStatus.calendarEvents.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {googleStatus.calendarEvents.slice(0, 10).map((event: any) => (
                      <div key={event.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{event.summary}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.start).toLocaleString("es-PE", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        {event.meetLink && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Video className="h-3 w-3" />
                            Meet
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {INTEGRATION_CATEGORIES.filter((c) => c.id !== "google-workspace").map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {AVAILABLE_INTEGRATIONS.filter(
                (int) => int.type.toLowerCase() === category.id
              ).map((integration) => {
                const Icon = integration.icon;
                const status = getIntegrationStatus(integration.code);

                return (
                  <Card
                    key={integration.code}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleConfigureIntegration(integration)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${category.bgColor}`}>
                          <Icon className={`h-5 w-5 ${category.color}`} />
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <CardTitle className="text-lg mt-3">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {AVAILABLE_INTEGRATIONS.filter(
              (int) => int.type.toLowerCase() === category.id
            ).length === 0 && (
              <div className="text-center py-12">
                <category.icon className={`h-12 w-12 mx-auto mb-4 ${category.color} opacity-50`} />
                <p className="text-muted-foreground">
                  No hay integraciones disponibles en esta categoria
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal de configuración */}
      <Dialog open={!!selectedIntegration} onOpenChange={() => {
        setSelectedIntegration(null);
        setEditingConfig(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  <selectedIntegration.icon className="h-5 w-5 text-[#D66829]" />
                  Configurar {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>

          {editingConfig && selectedIntegration && (
            <div className="space-y-6 py-4">
              {/* Estado */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Integracion Activa</p>
                  <p className="text-sm text-muted-foreground">
                    Habilitar o deshabilitar esta integracion
                  </p>
                </div>
                <Switch
                  checked={editingConfig.isActive}
                  onCheckedChange={(v) => setEditingConfig({ ...editingConfig, isActive: v })}
                />
              </div>

              <Separator />

              {/* Campos de configuración */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Credenciales</Label>
                {selectedIntegration.fields.map((field: any) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.type === "boolean" ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          id={field.key}
                          checked={editingConfig.credentials[field.key] || false}
                          onCheckedChange={(v) => updateCredential(field.key, v)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {editingConfig.credentials[field.key] ? "Habilitado" : "Deshabilitado"}
                        </span>
                      </div>
                    ) : field.type === "select" && field.options ? (
                      <Select
                        value={editingConfig.credentials[field.key] || ""}
                        onValueChange={(v) => updateCredential(field.key, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt: string) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === "password" ? (
                      <div className="relative">
                        <Input
                          id={field.key}
                          type={showPasswords[field.key] ? "text" : "password"}
                          value={editingConfig.credentials[field.key] || ""}
                          onChange={(e) => updateCredential(field.key, e.target.value)}
                          placeholder={field.placeholder || ""}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => togglePasswordVisibility(field.key)}
                        >
                          {showPasswords[field.key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={editingConfig.credentials[field.key] || ""}
                        onChange={(e) => updateCredential(field.key, e.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    )}
                    {field.sensitive && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Este valor se almacena de forma encriptada
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {(selectedIntegration as any).oauth && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <p className="font-medium text-blue-700 mb-2">Autenticacion OAuth</p>
                  <p className="text-sm text-blue-600 mb-3">
                    Esta integracion requiere autenticacion OAuth. Primero guarda las credenciales (Client ID y Client Secret), luego haz clic en &quot;Autorizar con Google&quot; para obtener el Refresh Token automaticamente.
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/integrations/google/auth-url");
                        const data = await res.json();
                        if (data.authUrl) {
                          window.open(data.authUrl, "_blank");
                        } else {
                          toast.error("Configura Client ID y Client Secret primero");
                        }
                      } catch {
                        toast.error("Error al generar URL de autorizacion. Guarda las credenciales primero.");
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Autorizar con Google
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleTestIntegration}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Probar Conexion
            </Button>
            <Button
              onClick={handleSaveIntegration}
              disabled={isSaving}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Configuracion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
