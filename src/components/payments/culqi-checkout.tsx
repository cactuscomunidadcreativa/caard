/**
 * CAARD - Componente de Checkout con Culqi
 * Integración completa con la pasarela de pagos Culqi Perú
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos
interface CulqiCheckoutProps {
  amount: number; // En céntimos (50000 = S/ 500.00)
  currency?: "PEN" | "USD";
  title: string;
  description?: string;
  orderId?: string;
  paymentOrderId?: string;
  caseId?: string;
  concept: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess?: (chargeId: string, data: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface CardFormData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  email: string;
}

// Declaración de tipos para Culqi global
declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (settings: any) => void;
      options: (options: any) => void;
      createToken: () => void;
      token?: {
        id: string;
        email: string;
        card_number: string;
        last_four: string;
        iin?: {
          card_brand: string;
          card_type: string;
        };
      };
      error?: {
        merchant_message: string;
        user_message: string;
      };
    };
    culpiToken?: any;
  }
}

// Función para formatear moneda
function formatCurrency(amount: number, currency: string = "PEN"): string {
  const value = amount / 100;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(value);
}

// Función para formatear número de tarjeta
function formatCardNumber(value: string): string {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  if (parts.length) {
    return parts.join(" ");
  } else {
    return value;
  }
}

// Detectar tipo de tarjeta
function getCardType(number: string): string {
  const cleanNumber = number.replace(/\s/g, "");
  if (/^4/.test(cleanNumber)) return "visa";
  if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
  if (/^3[47]/.test(cleanNumber)) return "amex";
  if (/^6(?:011|5)/.test(cleanNumber)) return "discover";
  if (/^(?:2131|1800|35)/.test(cleanNumber)) return "jcb";
  return "unknown";
}

export function CulqiCheckout({
  amount,
  currency = "PEN",
  title,
  description,
  orderId,
  paymentOrderId,
  caseId,
  concept,
  customerEmail = "",
  customerName = "",
  onSuccess,
  onError,
  onCancel,
  className,
}: CulqiCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [culqiLoaded, setCulqiLoaded] = useState(false);

  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
    email: customerEmail,
  });

  const [cardType, setCardType] = useState<string>("unknown");

  // Cargar script de Culqi
  useEffect(() => {
    const loadCulqiScript = () => {
      if (document.getElementById("culqi-js")) {
        setCulqiLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.id = "culqi-js";
      script.src = "https://checkout.culqi.com/js/v4";
      script.async = true;
      script.onload = () => {
        setCulqiLoaded(true);
      };
      script.onerror = () => {
        setError("No se pudo cargar el sistema de pagos. Intente nuevamente.");
      };
      document.body.appendChild(script);
    };

    loadCulqiScript();
  }, []);

  // Actualizar tipo de tarjeta
  useEffect(() => {
    setCardType(getCardType(formData.cardNumber));
  }, [formData.cardNumber]);

  const handleInputChange = (field: keyof CardFormData, value: string) => {
    let processedValue = value;

    if (field === "cardNumber") {
      processedValue = formatCardNumber(value).substring(0, 19);
    } else if (field === "expMonth") {
      processedValue = value.replace(/\D/g, "").substring(0, 2);
      if (parseInt(processedValue) > 12) processedValue = "12";
    } else if (field === "expYear") {
      processedValue = value.replace(/\D/g, "").substring(0, 2);
    } else if (field === "cvv") {
      processedValue = value.replace(/\D/g, "").substring(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const validateForm = (): boolean => {
    const cardNumber = formData.cardNumber.replace(/\s/g, "");

    if (cardNumber.length < 13 || cardNumber.length > 19) {
      setError("Número de tarjeta inválido");
      return false;
    }

    if (!formData.expMonth || parseInt(formData.expMonth) < 1 || parseInt(formData.expMonth) > 12) {
      setError("Mes de expiración inválido");
      return false;
    }

    const currentYear = new Date().getFullYear() % 100;
    if (!formData.expYear || parseInt(formData.expYear) < currentYear) {
      setError("Año de expiración inválido");
      return false;
    }

    if (formData.cvv.length < 3) {
      setError("CVV inválido");
      return false;
    }

    if (!formData.email || !formData.email.includes("@")) {
      setError("Email inválido");
      return false;
    }

    return true;
  };

  const processPayment = async () => {
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Primero crear token con Culqi
      const tokenResponse = await fetch("/api/payments/culqi/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_number: formData.cardNumber.replace(/\s/g, ""),
          cvv: formData.cvv,
          expiration_month: formData.expMonth.padStart(2, "0"),
          expiration_year: `20${formData.expYear}`,
          email: formData.email,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.id) {
        throw new Error(tokenData.user_message || "Error al procesar la tarjeta");
      }

      // Luego crear el cargo
      const chargeResponse = await fetch("/api/payments/culqi/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenData.id,
          amount,
          currency,
          email: formData.email,
          description: `${concept} - ${title}`,
          orderId,
          paymentOrderId,
          caseId,
          concept,
          metadata: {
            order_id: orderId || "",
            payment_order_id: paymentOrderId || "",
            case_id: caseId || "",
            concept,
            customer_name: customerName,
          },
        }),
      });

      const chargeData = await chargeResponse.json();

      if (!chargeResponse.ok) {
        throw new Error(chargeData.user_message || chargeData.error || "Error al procesar el pago");
      }

      setSuccess(true);
      setChargeId(chargeData.chargeId);
      onSuccess?.(chargeData.chargeId, chargeData);
    } catch (err: any) {
      const errorMessage = err.message || "Error al procesar el pago";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className={cn("max-w-md mx-auto", className)}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-800">¡Pago Exitoso!</h3>
            <p className="text-slate-600">
              Tu pago de {formatCurrency(amount, currency)} ha sido procesado correctamente.
            </p>
            {chargeId && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Número de operación</p>
                <p className="font-mono font-semibold text-slate-800">{chargeId}</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Receipt className="h-4 w-4" />
              <span>Recibirás un comprobante en tu correo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("max-w-md mx-auto", className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant="secondary" className="font-mono text-lg">
            {formatCurrency(amount, currency)}
          </Badge>
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resumen del pago */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Concepto:</span>
            <span className="font-medium">{concept}</span>
          </div>
          {orderId && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Orden:</span>
              <span className="font-mono">{orderId}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total a pagar:</span>
            <span className="text-[#D66829]">{formatCurrency(amount, currency)}</span>
          </div>
        </div>

        {/* Formulario de tarjeta */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número de tarjeta</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="4111 1111 1111 1111"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                className="pl-10 font-mono"
                disabled={isLoading}
              />
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              {cardType !== "unknown" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-xs font-semibold uppercase text-slate-500">
                    {cardType}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expMonth">Mes</Label>
              <Input
                id="expMonth"
                placeholder="MM"
                value={formData.expMonth}
                onChange={(e) => handleInputChange("expMonth", e.target.value)}
                className="text-center font-mono"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expYear">Año</Label>
              <Input
                id="expYear"
                placeholder="AA"
                value={formData.expYear}
                onChange={(e) => handleInputChange("expYear", e.target.value)}
                className="text-center font-mono"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                placeholder="***"
                value={formData.cvv}
                onChange={(e) => handleInputChange("cvv", e.target.value)}
                className="text-center font-mono"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500">
              Recibirás el comprobante de pago en este correo
            </p>
          </div>
        </div>

        {/* Seguridad */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Pago seguro procesado por Culqi. Tus datos están protegidos.</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          onClick={processPayment}
          disabled={isLoading || !culqiLoaded}
          className="w-full h-12 bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Pagar {formatCurrency(amount, currency)}
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full"
          >
            Cancelar
          </Button>
        )}

        <div className="flex items-center justify-center gap-4 pt-2">
          <img
            src="https://culqi.com/wp-content/uploads/2021/03/logo-culqi.svg"
            alt="Culqi"
            className="h-6 opacity-60"
          />
          <div className="flex gap-1">
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">VISA</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">MC</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">AMEX</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Componente para modal de pago
export function CulqiPaymentModal({
  isOpen,
  onClose,
  ...props
}: CulqiCheckoutProps & { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4">
        <CulqiCheckout
          {...props}
          onCancel={onClose}
          onSuccess={(chargeId, data) => {
            props.onSuccess?.(chargeId, data);
            setTimeout(onClose, 3000);
          }}
        />
      </div>
    </div>
  );
}

export default CulqiCheckout;
