"use client";

/**
 * CAARD - Configuración de Seguridad Client
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Smartphone,
  Mail,
  MessageSquare,
  Check,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  Phone,
  CheckCircle2,
  XCircle,
  Send,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface TwoFactorStatus {
  enabled: boolean;
  channel: string | null;
  hasPhone: boolean;
  email: string;
  phoneLastDigits: string | null;
}

interface EmailVerificationStatus {
  email: string;
  isVerified: boolean;
  verifiedAt: string | null;
}

export function SecuritySettingsClient() {
  const router = useRouter();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showEmailVerifyDialog, setShowEmailVerifyDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>("EMAIL");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  useEffect(() => {
    loadStatus();
    loadEmailStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/user/2fa");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        if (data.channel) {
          setSelectedChannel(data.channel);
        }
      }
    } catch (error) {
      console.error("Error loading 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailStatus = async () => {
    try {
      const response = await fetch("/api/user/verify-email");
      if (response.ok) {
        const data = await response.json();
        setEmailStatus(data);
      }
    } catch (error) {
      console.error("Error loading email verification status:", error);
    }
  };

  const handleSendEmailVerification = async () => {
    setSendingEmailCode(true);
    setError(null);

    try {
      const response = await fetch("/api/user/verify-email", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setShowEmailVerifyDialog(true);
      setSuccess("Se ha enviado un código de verificación a su email");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSendingEmailCode(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (emailOtpCode.length !== 6) {
      setError("Ingrese el código completo de 6 dígitos");
      return;
    }

    setVerifyingEmail(true);
    setError(null);

    try {
      const response = await fetch("/api/user/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailOtpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setShowEmailVerifyDialog(false);
      setEmailOtpCode("");
      setSuccess("Email verificado correctamente");
      loadEmailStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleToggle2FA = async (enable: boolean) => {
    setError(null);
    setSuccess(null);
    setPendingAction(enable ? "enable" : "disable");

    // Si va a habilitar y seleccionó SMS/WhatsApp sin teléfono
    if (enable && selectedChannel !== "EMAIL" && !status?.hasPhone && !phone) {
      setError("Configure un número de teléfono para usar SMS o WhatsApp");
      setPendingAction(null);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: enable ? "enable" : "disable",
          channel: selectedChannel,
          phone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      if (data.requiresVerification) {
        setShowVerifyDialog(true);
      } else {
        setSuccess(data.message);
        loadStatus();
      }
    } catch (error: any) {
      setError(error.message);
      setPendingAction(null);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) {
      setError("Ingrese el código completo de 6 dígitos");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/user/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: pendingAction,
          channel: selectedChannel,
          code: otpCode,
          phone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setShowVerifyDialog(false);
      setOtpCode("");
      setPendingAction(null);
      setSuccess(data.message);
      loadStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChannelChange = async (newChannel: string) => {
    if (!status?.enabled) {
      setSelectedChannel(newChannel);
      return;
    }

    // Si 2FA está habilitado, cambiar el canal
    setSaving(true);
    try {
      const response = await fetch("/api/user/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changeChannel",
          channel: newChannel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSelectedChannel(newChannel);
      setSuccess(data.message);
      loadStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#D66829]" />
          Seguridad de la Cuenta
        </h1>
        <p className="text-muted-foreground">
          Configure la autenticación de dos factores para mayor seguridad
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Email Verification Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#D66829]" />
                Verificación de Email
              </CardTitle>
              <CardDescription>
                Confirme su dirección de correo electrónico
              </CardDescription>
            </div>
            <Badge variant={emailStatus?.isVerified ? "default" : "secondary"}>
              {emailStatus?.isVerified ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verificado
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  No verificado
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{emailStatus?.email || status?.email}</p>
              {emailStatus?.isVerified && emailStatus?.verifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Verificado el {new Date(emailStatus.verifiedAt).toLocaleDateString("es-PE")}
                </p>
              )}
              {!emailStatus?.isVerified && (
                <p className="text-sm text-yellow-600">
                  Su email aún no ha sido verificado
                </p>
              )}
            </div>
            {!emailStatus?.isVerified && (
              <Button
                onClick={handleSendEmailVerification}
                disabled={sendingEmailCode}
                className="bg-[#D66829] hover:bg-[#c45a22]"
              >
                {sendingEmailCode ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Verificar ahora
              </Button>
            )}
          </div>

          {!emailStatus?.isVerified && (
            <p className="text-xs text-muted-foreground">
              Al verificar su email, podrá recibir notificaciones importantes sobre sus casos
              y recuperar su contraseña si la olvida.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2FA Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {status?.enabled ? (
                  <Lock className="h-5 w-5 text-green-600" />
                ) : (
                  <Unlock className="h-5 w-5 text-yellow-600" />
                )}
                Autenticación de Dos Factores (2FA)
              </CardTitle>
              <CardDescription>
                Añada una capa extra de seguridad a su cuenta
              </CardDescription>
            </div>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Canal de verificación */}
          <div className="space-y-3">
            <Label>Canal de verificación</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedChannel === "EMAIL"
                    ? "ring-2 ring-[#D66829] bg-[#D66829]/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleChannelChange("EMAIL")}
              >
                <CardContent className="p-4 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-[#D66829]" />
                  <p className="font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.email}
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedChannel === "SMS"
                    ? "ring-2 ring-[#D66829] bg-[#D66829]/5"
                    : "hover:bg-muted/50"
                } ${!status?.hasPhone && !phone ? "opacity-50" : ""}`}
                onClick={() =>
                  (status?.hasPhone || phone) && handleChannelChange("SMS")
                }
              >
                <CardContent className="p-4 text-center">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-[#D66829]" />
                  <p className="font-medium">SMS</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.phoneLastDigits || "No configurado"}
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedChannel === "WHATSAPP"
                    ? "ring-2 ring-[#D66829] bg-[#D66829]/5"
                    : "hover:bg-muted/50"
                } ${!status?.hasPhone && !phone ? "opacity-50" : ""}`}
                onClick={() =>
                  (status?.hasPhone || phone) && handleChannelChange("WHATSAPP")
                }
              >
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.phoneLastDigits || "No configurado"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Configurar teléfono si no existe */}
          {!status?.hasPhone && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Número de teléfono (para SMS/WhatsApp)
              </Label>
              <Input
                id="phone"
                placeholder="+51 999 999 999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Requerido para usar SMS o WhatsApp como canal de verificación
              </p>
            </div>
          )}

          {/* Toggle 2FA */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">
                {status?.enabled ? "Deshabilitar 2FA" : "Habilitar 2FA"}
              </p>
              <p className="text-sm text-muted-foreground">
                {status?.enabled
                  ? "Se deshabilitará la verificación en dos pasos"
                  : "Proteja su cuenta con verificación en dos pasos"}
              </p>
            </div>
            <Button
              variant={status?.enabled ? "destructive" : "default"}
              onClick={() => handleToggle2FA(!status?.enabled)}
              disabled={saving}
              className={!status?.enabled ? "bg-[#D66829] hover:bg-[#c45a22]" : ""}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : status?.enabled ? (
                <Unlock className="mr-2 h-4 w-4" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {status?.enabled ? "Deshabilitar" : "Habilitar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            ¿Por qué usar 2FA?
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Protege su cuenta incluso si su contraseña es comprometida</li>
            <li>• Reciba un código único cada vez que inicie sesión</li>
            <li>• Los códigos expiran en 5 minutos</li>
            <li>• Puede elegir recibir códigos por email, SMS o WhatsApp</li>
          </ul>
        </CardContent>
      </Card>

      {/* 2FA Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Código</DialogTitle>
            <DialogDescription>
              Ingrese el código de 6 dígitos enviado a su{" "}
              {selectedChannel === "EMAIL"
                ? "correo electrónico"
                : selectedChannel === "SMS"
                ? "teléfono por SMS"
                : "WhatsApp"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-6">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVerifyDialog(false);
                setOtpCode("");
                setPendingAction(null);
                setError(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={saving || otpCode.length !== 6}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Verification Dialog */}
      <Dialog open={showEmailVerifyDialog} onOpenChange={setShowEmailVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#D66829]" />
              Verificar Email
            </DialogTitle>
            <DialogDescription>
              Ingrese el código de 6 dígitos enviado a{" "}
              <strong>{emailStatus?.email || status?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-6">
            <InputOTP
              maxLength={6}
              value={emailOtpCode}
              onChange={(value) => setEmailOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailVerifyDialog(false);
                setEmailOtpCode("");
                setError(null);
              }}
              disabled={verifyingEmail}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerifyEmail}
              disabled={verifyingEmail || emailOtpCode.length !== 6}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {verifyingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Verificar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
