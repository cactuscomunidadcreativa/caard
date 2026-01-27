"use client";

/**
 * CAARD - Configuración de Notificaciones Client
 * SMS, WhatsApp y Email configuration
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Phone,
  Mail,
  Settings,
  Save,
  Loader2,
  Check,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface NotificationConfig {
  // SMS
  smsEnabled: boolean;
  smsProvider: "twilio" | "aws-sns";
  smsAccountSid: string;
  smsAuthToken: string;
  smsFromNumber: string;
  // WhatsApp
  whatsappEnabled: boolean;
  whatsappProvider: "twilio" | "meta";
  whatsappAccountSid: string;
  whatsappAuthToken: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappFromNumber: string;
  // Email (reference)
  emailConfigured: boolean;
}

export function NotificationsConfigClient() {
  const router = useRouter();
  const [config, setConfig] = useState<NotificationConfig>({
    smsEnabled: false,
    smsProvider: "twilio",
    smsAccountSid: "",
    smsAuthToken: "",
    smsFromNumber: "",
    whatsappEnabled: false,
    whatsappProvider: "twilio",
    whatsappAccountSid: "",
    whatsappAuthToken: "",
    whatsappPhoneNumberId: "",
    whatsappAccessToken: "",
    whatsappFromNumber: "",
    emailConfigured: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<{ channel: string; success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/settings/notifications");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: "sms" | "whatsapp") => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, config }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar configuración");
      }

      setTestResult({
        channel: section.toUpperCase(),
        success: true,
        message: "Configuración guardada correctamente",
      });
    } catch (error: any) {
      setTestResult({
        channel: section.toUpperCase(),
        success: false,
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel: "sms" | "whatsapp") => {
    if (!testPhone) {
      setTestResult({
        channel: channel.toUpperCase(),
        success: false,
        message: "Ingrese un número de teléfono para la prueba",
      });
      return;
    }

    setTesting(channel);
    setTestResult(null);

    try {
      const response = await fetch("/api/settings/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, phone: testPhone }),
      });

      const data = await response.json();

      setTestResult({
        channel: channel.toUpperCase(),
        success: data.success,
        message: data.success ? "Mensaje de prueba enviado correctamente" : data.error,
      });
    } catch (error: any) {
      setTestResult({
        channel: channel.toUpperCase(),
        success: false,
        message: error.message,
      });
    } finally {
      setTesting(null);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#D66829]" />
            Configuración de Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Configure los canales de notificación: SMS, WhatsApp y Email
          </p>
        </div>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          {testResult.success ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{testResult.channel}</AlertTitle>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Test Phone Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="testPhone">Teléfono para pruebas</Label>
              <Input
                id="testPhone"
                placeholder="+51 999 999 999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Use este número para enviar mensajes de prueba
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sms" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* SMS Configuration */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Configuración SMS
                  </CardTitle>
                  <CardDescription>
                    Configure Twilio u otro proveedor para envío de SMS
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="smsEnabled">Habilitado</Label>
                  <Switch
                    id="smsEnabled"
                    checked={config.smsEnabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, smsEnabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select
                    value={config.smsProvider}
                    onValueChange={(v: any) =>
                      setConfig({ ...config, smsProvider: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="aws-sns">AWS SNS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número de Origen</Label>
                  <Input
                    placeholder="+15551234567"
                    value={config.smsFromNumber}
                    onChange={(e) =>
                      setConfig({ ...config, smsFromNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              {config.smsProvider === "twilio" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Account SID</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.smsAccountSid ? "text" : "password"}
                        placeholder="ACxxxxxxxxxx"
                        value={config.smsAccountSid}
                        onChange={(e) =>
                          setConfig({ ...config, smsAccountSid: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecret("smsAccountSid")}
                      >
                        {showSecrets.smsAccountSid ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Auth Token</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.smsAuthToken ? "text" : "password"}
                        placeholder="xxxxxxxxxx"
                        value={config.smsAuthToken}
                        onChange={(e) =>
                          setConfig({ ...config, smsAuthToken: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecret("smsAuthToken")}
                      >
                        {showSecrets.smsAuthToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleTest("sms")}
                  disabled={testing === "sms" || !config.smsEnabled}
                >
                  {testing === "sms" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar Prueba
                </Button>

                <Button
                  onClick={() => handleSave("sms")}
                  disabled={saving}
                  className="bg-[#D66829] hover:bg-[#c45a22]"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Configuration */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Configuración WhatsApp Business
                  </CardTitle>
                  <CardDescription>
                    Configure Twilio o Meta WhatsApp Business API
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="whatsappEnabled">Habilitado</Label>
                  <Switch
                    id="whatsappEnabled"
                    checked={config.whatsappEnabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, whatsappEnabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select
                    value={config.whatsappProvider}
                    onValueChange={(v: any) =>
                      setConfig({ ...config, whatsappProvider: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="meta">Meta (Facebook)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número WhatsApp Business</Label>
                  <Input
                    placeholder="+15551234567"
                    value={config.whatsappFromNumber}
                    onChange={(e) =>
                      setConfig({ ...config, whatsappFromNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              {config.whatsappProvider === "twilio" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Account SID</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.waAccountSid ? "text" : "password"}
                        placeholder="ACxxxxxxxxxx"
                        value={config.whatsappAccountSid}
                        onChange={(e) =>
                          setConfig({ ...config, whatsappAccountSid: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecret("waAccountSid")}
                      >
                        {showSecrets.waAccountSid ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Auth Token</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.waAuthToken ? "text" : "password"}
                        placeholder="xxxxxxxxxx"
                        value={config.whatsappAuthToken}
                        onChange={(e) =>
                          setConfig({ ...config, whatsappAuthToken: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecret("waAuthToken")}
                      >
                        {showSecrets.waAuthToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {config.whatsappProvider === "meta" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phone Number ID</Label>
                    <Input
                      placeholder="123456789012345"
                      value={config.whatsappPhoneNumberId}
                      onChange={(e) =>
                        setConfig({ ...config, whatsappPhoneNumberId: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.waAccessToken ? "text" : "password"}
                        placeholder="EAAxxxxxxxxxx"
                        value={config.whatsappAccessToken}
                        onChange={(e) =>
                          setConfig({ ...config, whatsappAccessToken: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecret("waAccessToken")}
                      >
                        {showSecrets.waAccessToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleTest("whatsapp")}
                  disabled={testing === "whatsapp" || !config.whatsappEnabled}
                >
                  {testing === "whatsapp" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar Prueba
                </Button>

                <Button
                  onClick={() => handleSave("whatsapp")}
                  disabled={saving}
                  className="bg-[#D66829] hover:bg-[#c45a22]"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Reference */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuración Email
              </CardTitle>
              <CardDescription>
                La configuración de email se realiza en la sección del Centro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Estado del Email</p>
                  <p className="text-sm text-muted-foreground">
                    {config.emailConfigured
                      ? "Email configurado correctamente"
                      : "Email no configurado"}
                  </p>
                </div>
                <Badge
                  variant={config.emailConfigured ? "default" : "destructive"}
                >
                  {config.emailConfigured ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="mt-4">
                <Button variant="outline" asChild>
                  <a href="/admin/configuracion/centro">
                    <Settings className="mr-2 h-4 w-4" />
                    Ir a Configuración del Centro
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2">
            Información sobre Notificaciones
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Las notificaciones se envían según las preferencias del usuario</li>
            <li>• Los códigos OTP se envían preferiblemente por WhatsApp o SMS</li>
            <li>• Las notificaciones urgentes usan todos los canales disponibles</li>
            <li>• Twilio requiere una cuenta verificada para envíos en producción</li>
            <li>• Meta WhatsApp Business API requiere verificación de negocio</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
