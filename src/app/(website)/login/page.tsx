"use client";

/**
 * CAARD - Página de Login con OTP
 * Flujo: Email → Enviar código OTP por Gmail → Verificar código → Login
 */

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Lock, Mail, KeyRound, ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

type LoginStep = "email" | "otp" | "password";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { t } = useTranslation();

  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Paso 1: Enviar código OTP al email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "LOGIN", channel: "EMAIL" }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setOtpExpiresAt(data.expiresAt);
        setOtpCode(["", "", "", "", "", ""]);
        // Cooldown de 60 segundos para reenvío
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "Error al enviar código");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Verificar OTP y hacer login
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpCode.join("");
    if (code.length !== 6) {
      setError("Ingrese el código completo de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verificar OTP
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, type: "LOGIN" }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || "Código incorrecto");
        if (verifyData.remainingAttempts !== undefined) {
          setError(`Código incorrecto. ${verifyData.remainingAttempts} intentos restantes.`);
        }
        setIsLoading(false);
        return;
      }

      // OTP válido → hacer login con credentials (password bypass con OTP verificado)
      // Usamos signIn con credentials ya que OTP fue verificado
      const result = await signIn("credentials", {
        email,
        password: `__OTP_VERIFIED__${code}`,
        redirect: false,
      });

      if (result?.error) {
        // Si falla con OTP token, intentar pedir contraseña como fallback
        setStep("password");
        setError("");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // Login con contraseña (fallback)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales incorrectas");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar input de OTP (auto-focus al siguiente)
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Si pegan el código completo
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...otpCode];
      digits.forEach((digit, i) => {
        if (index + i < 6) newCode[index + i] = digit;
      });
      setOtpCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      // Auto-submit si se completó
      if (newCode.every((d) => d !== "")) {
        setTimeout(() => handleVerifyOtp(), 100);
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newCode = [...otpCode];
    newCode[index] = digit;
    setOtpCode(newCode);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit al completar
    if (digit && index === 5 && newCode.every((d) => d !== "")) {
      setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B2A5B]">
          {step === "otp" ? (
            <ShieldCheck className="h-7 w-7 text-white" />
          ) : (
            <Lock className="h-7 w-7 text-white" />
          )}
        </div>
        <CardTitle className="text-2xl text-[#0B2A5B]">
          {step === "email" && "Acceso al Sistema"}
          {step === "otp" && "Verificar Código"}
          {step === "password" && "Ingrese su Contraseña"}
        </CardTitle>
        <CardDescription>
          {step === "email" && "Ingrese su correo para recibir un código de acceso"}
          {step === "otp" && (
            <>Enviamos un código de 6 dígitos a <strong>{email}</strong></>
          )}
          {step === "password" && "Ingrese su contraseña para continuar"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#D66829] hover:bg-[#c45a22] text-white"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Enviar código de acceso
                </>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!email) {
                  setError("Ingrese su correo primero");
                  return;
                }
                setStep("password");
                setError("");
              }}
            >
              <Lock className="mr-2 h-4 w-4" />
              Ingresar con contraseña
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-300 hover:bg-slate-50"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                await signIn("google", { callbackUrl });
              }}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </Button>
          </form>
        )}

        {/* Step 2: OTP Code */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otpCode.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-[#D66829] focus:ring-[#D66829]"
                  autoFocus={index === 0}
                  disabled={isLoading}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#D66829] hover:bg-[#c45a22] text-white"
              disabled={isLoading || otpCode.some((d) => !d)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verificar y entrar
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); }}
                className="flex items-center text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Cambiar correo
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={resendCooldown > 0 || isLoading}
                className={`${
                  resendCooldown > 0
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-[#D66829] hover:underline"
                }`}
              >
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar código"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Password fallback */}
        {step === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-sm text-slate-600 mb-2">
                <Mail className="h-4 w-4" />
                {email}
              </div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#D66829] hover:bg-[#c45a22] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>

            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground w-full justify-center"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Volver
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function LoginFormFallback() {
  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B2A5B]">
          <Lock className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-2xl text-[#0B2A5B]">Acceso al Sistema</CardTitle>
        <CardDescription>Cargando...</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
