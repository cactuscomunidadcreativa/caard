/**
 * CAARD - Cliente de Integraciones
 * UI para configurar Google Drive, Email, AI y otras integraciones
 */

"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Settings,
  Key,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  HardDrive,
  Link2,
  Unlink,
  Mail,
  Bot,
  Sparkles,
  MessageSquare,
  Save,
  TestTube,
  Zap,
  Brain,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IntegrationsClientProps {
  initialData: {
    center: {
      id: string;
      code: string;
      name: string;
      driveRootFolderId: string | null;
      driveSharedDriveId: string | null;
    } | null;
    googleDrive: {
      isConfigured: boolean;
      isConnected: boolean;
      rootFolderId: string | null;
      sharedDriveId: string | null;
    };
  };
}

interface AIProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  envKeys: string[];
  models: string[];
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    icon: <Bot className="h-5 w-5" />,
    description: "GPT-4, GPT-3.5 Turbo y modelos de embedding",
    envKeys: ["OPENAI_API_KEY", "OPENAI_ORG_ID"],
    models: ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Claude 3 Opus, Sonnet y Haiku",
    envKeys: ["ANTHROPIC_API_KEY"],
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  },
  {
    id: "google",
    name: "Google (Gemini)",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Gemini Pro y Gemini Ultra",
    envKeys: ["GOOGLE_AI_API_KEY"],
    models: ["gemini-pro", "gemini-ultra"],
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    icon: <Cloud className="h-5 w-5" />,
    description: "OpenAI en infraestructura de Azure",
    envKeys: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
    models: ["gpt-4", "gpt-35-turbo"],
  },
];

export function IntegrationsClient({ initialData }: IntegrationsClientProps) {
  // Google Drive state
  const [driveConfig, setDriveConfig] = useState({
    rootFolderId: initialData.googleDrive.rootFolderId || "",
    sharedDriveId: initialData.googleDrive.sharedDriveId || "",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Email state
  const [emailConfig, setEmailConfig] = useState({
    provider: "smtp",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    smtpFrom: "",
    smtpFromName: "CAARD",
    smtpSecure: true,
  });
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // AI state
  const [aiConfigs, setAiConfigs] = useState<Record<string, {
    enabled: boolean;
    apiKey: string;
    orgId?: string;
    endpoint?: string;
    defaultModel: string;
  }>>({
    openai: { enabled: false, apiKey: "", orgId: "", defaultModel: "gpt-4-turbo" },
    anthropic: { enabled: false, apiKey: "", defaultModel: "claude-3-sonnet" },
    google: { enabled: false, apiKey: "", defaultModel: "gemini-pro" },
    azure: { enabled: false, apiKey: "", endpoint: "", defaultModel: "gpt-4" },
  });
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  // Load saved configs on mount
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch("/api/integrations/config");
      if (response.ok) {
        const data = await response.json();
        if (data.email) setEmailConfig(prev => ({ ...prev, ...data.email }));
        if (data.ai) setAiConfigs(prev => ({ ...prev, ...data.ai }));
      }
    } catch (error) {
      console.error("Error loading configs:", error);
    }
  };

  // Google Drive handlers
  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/integrations/google/auth-url");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la conexión con Google",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch("/api/integrations/google/test");
      const data = await response.json();
      if (data.success) {
        toast({ title: "Conexión exitosa", description: `Conectado como ${data.email}` });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: "Error de conexión", variant: "destructive" });
    }
  };

  const handleSaveDriveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/integrations/google/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driveConfig),
      });
      if (response.ok) {
        toast({ title: "Configuración guardada" });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Email handlers
  const handleSaveEmailConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/integrations/email/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailConfig),
      });
      if (response.ok) {
        toast({ title: "Configuración de email guardada" });
      }
    } catch (error) {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const response = await fetch("/api/integrations/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...emailConfig, testEmail: emailConfig.smtpUser }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Email de prueba enviado" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error al enviar email",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  // AI handlers
  const handleSaveAIConfig = async (provider: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/integrations/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config: aiConfigs[provider] }),
      });
      if (response.ok) {
        toast({ title: `Configuración de ${provider} guardada` });
      }
    } catch (error) {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async (provider: string) => {
    try {
      const response = await fetch("/api/integrations/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config: aiConfigs[provider] }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Conexión exitosa", description: data.message });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado" });
  };

  const toggleShowApiKey = (provider: string) => {
    setShowApiKey(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integraciones</h1>
        <p className="text-muted-foreground">
          Configura las APIs y servicios externos del sistema
        </p>
      </div>

      <Tabs defaultValue="google-drive" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="google-drive" className="gap-2">
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Google Drive</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">.env</span>
          </TabsTrigger>
        </TabsList>

        {/* Google Drive Tab */}
        <TabsContent value="google-drive" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Cloud className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Google Drive</CardTitle>
                    <CardDescription>Almacenamiento de documentos</CardDescription>
                  </div>
                </div>
                <Badge className={initialData.googleDrive.isConnected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                  {initialData.googleDrive.isConnected ? (
                    <><CheckCircle2 className="mr-1 h-3 w-3" /> Conectado</>
                  ) : (
                    <><AlertTriangle className="mr-1 h-3 w-3" /> Pendiente</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!initialData.googleDrive.isConfigured && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Credenciales no configuradas</AlertTitle>
                  <AlertDescription>
                    Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env
                  </AlertDescription>
                </Alert>
              )}

              {initialData.googleDrive.isConnected && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ID de Carpeta Raíz</Label>
                    <Input
                      value={driveConfig.rootFolderId}
                      onChange={(e) => setDriveConfig({ ...driveConfig, rootFolderId: e.target.value })}
                      placeholder="Ej: 1abc123..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Carpeta donde se guardarán los expedientes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>ID de Shared Drive (opcional)</Label>
                    <Input
                      value={driveConfig.sharedDriveId}
                      onChange={(e) => setDriveConfig({ ...driveConfig, sharedDriveId: e.target.value })}
                      placeholder="Para Google Workspace"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {initialData.googleDrive.isConnected ? (
                <>
                  <Button onClick={handleSaveDriveConfig} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={handleTestConnection}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Probar
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnectGoogle} disabled={!initialData.googleDrive.isConfigured || isConnecting}>
                  {isConnecting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  Conectar con Google
                </Button>
              )}
            </CardFooter>
          </Card>

          {initialData.googleDrive.isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  ¿Cómo obtener el ID de la carpeta?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Abre Google Drive y selecciona la carpeta</p>
                <p>2. Copia la URL: drive.google.com/drive/folders/<strong>ID_AQUÍ</strong></p>
                <p>3. Pega el ID arriba</p>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href="https://drive.google.com" target="_blank">
                    Abrir Google Drive <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Configuración de Email (SMTP)</CardTitle>
                  <CardDescription>Para envío de notificaciones</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Servidor SMTP</Label>
                  <Input
                    value={emailConfig.smtpHost}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Puerto</Label>
                  <Select
                    value={emailConfig.smtpPort}
                    onValueChange={(v) => setEmailConfig({ ...emailConfig, smtpPort: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="587">587 (TLS)</SelectItem>
                      <SelectItem value="465">465 (SSL)</SelectItem>
                      <SelectItem value="25">25 (Sin cifrar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Usuario / Email</Label>
                  <Input
                    value={emailConfig.smtpUser}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                    placeholder="notificaciones@tudominio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña / App Password</Label>
                  <Input
                    type="password"
                    value={emailConfig.smtpPassword}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email remitente</Label>
                  <Input
                    value={emailConfig.smtpFrom}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpFrom: e.target.value })}
                    placeholder="noreply@caard.pe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre remitente</Label>
                  <Input
                    value={emailConfig.smtpFromName}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpFromName: e.target.value })}
                    placeholder="CAARD Notificaciones"
                  />
                </div>
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>Gmail</AlertTitle>
                <AlertDescription>
                  Usa smtp.gmail.com:587 y genera una{" "}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline">
                    contraseña de aplicación
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={handleSaveEmailConfig} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={handleTestEmail} disabled={isTestingEmail}>
                {isTestingEmail ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
                Enviar prueba
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {AI_PROVIDERS.map((provider) => (
              <Card key={provider.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        {provider.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                        <CardDescription className="text-xs">{provider.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={aiConfigs[provider.id]?.enabled || false}
                      onCheckedChange={(checked) =>
                        setAiConfigs(prev => ({
                          ...prev,
                          [provider.id]: { ...prev[provider.id], enabled: checked },
                        }))
                      }
                    />
                  </div>
                </CardHeader>
                {aiConfigs[provider.id]?.enabled && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <Label className="text-xs">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showApiKey[provider.id] ? "text" : "password"}
                          value={aiConfigs[provider.id]?.apiKey || ""}
                          onChange={(e) =>
                            setAiConfigs(prev => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], apiKey: e.target.value },
                            }))
                          }
                          placeholder="sk-..."
                          className="text-xs"
                        />
                        <Button variant="outline" size="icon" onClick={() => toggleShowApiKey(provider.id)}>
                          {showApiKey[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {provider.id === "openai" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Organization ID (opcional)</Label>
                        <Input
                          value={aiConfigs[provider.id]?.orgId || ""}
                          onChange={(e) =>
                            setAiConfigs(prev => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], orgId: e.target.value },
                            }))
                          }
                          placeholder="org-..."
                          className="text-xs"
                        />
                      </div>
                    )}

                    {provider.id === "azure" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Endpoint</Label>
                        <Input
                          value={aiConfigs[provider.id]?.endpoint || ""}
                          onChange={(e) =>
                            setAiConfigs(prev => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], endpoint: e.target.value },
                            }))
                          }
                          placeholder="https://tu-recurso.openai.azure.com/"
                          className="text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs">Modelo por defecto</Label>
                      <Select
                        value={aiConfigs[provider.id]?.defaultModel}
                        onValueChange={(v) =>
                          setAiConfigs(prev => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], defaultModel: v },
                          }))
                        }
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {provider.models.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => handleSaveAIConfig(provider.id)} disabled={isSaving}>
                        <Save className="mr-1 h-3 w-3" /> Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleTestAI(provider.id)}>
                        <Zap className="mr-1 h-3 w-3" /> Probar
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plantilla de Variables de Entorno</CardTitle>
              <CardDescription>Copia y configura en tu archivo .env</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-slate-950 p-4 overflow-x-auto">
                <pre className="text-xs text-slate-50 font-mono whitespace-pre">
{`# ==========================================
# CAARD - Variables de Entorno
# ==========================================

# Base de datos
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
NEXTAUTH_URL="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}"
NEXTAUTH_SECRET="tu-secret-aqui"

# ==========================================
# Google Drive
# ==========================================
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_REDIRECT_URI="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/integrations/google/callback"
GOOGLE_REFRESH_TOKEN=""

# ==========================================
# Email (SMTP)
# ==========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notificaciones@tudominio.com"
SMTP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
SMTP_FROM="noreply@caard.pe"
SMTP_FROM_NAME="CAARD"

# ==========================================
# Inteligencia Artificial
# ==========================================
OPENAI_API_KEY="sk-..."
OPENAI_ORG_ID=""
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."
AZURE_OPENAI_API_KEY="..."
AZURE_OPENAI_ENDPOINT="https://xxx.openai.azure.com/"

# ==========================================
# Backup
# ==========================================
BACKUP_DIR="/var/backups/caard"`}
                </pre>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => copyToClipboard("# Plantilla copiada")}>
                <Copy className="mr-2 h-4 w-4" /> Copiar plantilla
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enlaces útiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Google Cloud Console", url: "https://console.cloud.google.com" },
                { name: "OpenAI API Keys", url: "https://platform.openai.com/api-keys" },
                { name: "Anthropic Console", url: "https://console.anthropic.com" },
                { name: "Google AI Studio", url: "https://aistudio.google.com/app/apikey" },
              ].map((link) => (
                <Button key={link.name} variant="link" className="h-auto p-0 block" asChild>
                  <a href={link.url} target="_blank">
                    {link.name} <ExternalLink className="ml-1 h-3 w-3 inline" />
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
