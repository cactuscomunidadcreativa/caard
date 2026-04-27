/**
 * CAARD - Cliente de página de pago
 * Componente cliente para manejar el checkout interactivo
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CulqiCheckout } from "@/components/payments/culqi-checkout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  FileText,
  Calendar,
  Building2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

interface PaymentData {
  id: string;
  amount: number;
  currency: "PEN" | "USD";
  concept: string;
  description?: string;
  caseId: string;
  caseCode?: string;
  caseSubject?: string;
  customerEmail?: string;
  customerName?: string;
  dueDate?: string;
}

interface PaymentPageClientProps {
  paymentData: PaymentData;
}

// Formatear moneda
function formatCurrency(amount: number, currency: string = "PEN"): string {
  const value = amount / 100;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(value);
}

// Mapeo de conceptos a español
const CONCEPT_LABELS: Record<string, string> = {
  REGISTRO: "Tasa de Registro",
  ARBITRAJE: "Gastos de Arbitraje",
  HONORARIOS: "Honorarios de Árbitros",
  ADMINISTRACION: "Gastos Administrativos",
  DEPOSITO: "Depósito de Garantía",
  OTROS: "Otros Conceptos",
};

export function PaymentPageClient({ paymentData }: PaymentPageClientProps) {
  const router = useRouter();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [chargeData, setChargeData] = useState<any>(null);

  const handleSuccess = (chargeId: string, data: any) => {
    setPaymentComplete(true);
    setChargeData(data);
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D66829] to-[#0B2A5B] flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-[#0B2A5B]">CAARD</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                ¡Pago Exitoso!
              </h1>

              <p className="text-lg text-slate-600 mb-6">
                Tu pago de <span className="font-bold text-[#D66829]">{formatCurrency(paymentData.amount, paymentData.currency)}</span> ha sido procesado correctamente.
              </p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Concepto:</span>
                  <span className="font-medium">{CONCEPT_LABELS[paymentData.concept] || paymentData.concept}</span>
                </div>
                {paymentData.caseCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expediente:</span>
                    <span className="font-mono font-medium">{paymentData.caseCode}</span>
                  </div>
                )}
                {chargeData?.chargeId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">N° Operación:</span>
                    <span className="font-mono font-medium text-sm">{chargeData.chargeId}</span>
                  </div>
                )}
                {chargeData?.referenceCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Referencia:</span>
                    <span className="font-mono font-medium text-sm">{chargeData.referenceCode}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-500 mb-8">
                Hemos enviado un comprobante de pago a tu correo electrónico.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-[#D66829] hover:bg-[#c45a22]">
                  <Link href="/">
                    Volver al inicio
                  </Link>
                </Button>
                {paymentData.caseCode && (
                  <Button asChild variant="outline" size="lg">
                    <Link href={`/mis-casos/${paymentData.caseId}`}>
                      Ver mi caso
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D66829] to-[#0B2A5B] flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-[#0B2A5B]">CAARD</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-slate-200" />
              <span className="hidden sm:block text-sm text-slate-500">
                Pasarela de Pagos Segura
              </span>
            </div>
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Conexión segura
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Columna izquierda - Información */}
          <div className="lg:col-span-2 space-y-6">
            {/* Volver */}
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>
            </Button>

            {/* Información del pago */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Resumen del Pago
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#D66829] mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Concepto</p>
                    <p className="font-medium">{CONCEPT_LABELS[paymentData.concept] || paymentData.concept}</p>
                    {paymentData.description && (
                      <p className="text-sm text-slate-600 mt-1">{paymentData.description}</p>
                    )}
                  </div>
                </div>

                {paymentData.caseCode && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-[#D66829] mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Expediente</p>
                      <p className="font-mono font-medium">{paymentData.caseCode}</p>
                      {paymentData.caseSubject && (
                        <p className="text-sm text-slate-600 mt-1">{paymentData.caseSubject}</p>
                      )}
                    </div>
                  </div>
                )}

                {paymentData.dueDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#D66829] mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Fecha límite de pago</p>
                      <p className="font-medium">
                        {new Date(paymentData.dueDate).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-slate-700">Total a pagar:</span>
                  <span className="text-2xl font-bold text-[#D66829]">
                    {formatCurrency(paymentData.amount, paymentData.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#0B2A5B]" />
                ¿Necesitas ayuda?
              </h3>
              <div className="space-y-3 text-sm">
                <a href="tel:+51913755003" className="flex items-center gap-2 text-slate-600 hover:text-[#D66829]">
                  <Phone className="h-4 w-4" />
                  (51) 913 755 003
                </a>
                <a href="mailto:mesadepartes@caardpe.com" className="flex items-center gap-2 text-slate-600 hover:text-[#D66829]">
                  <Mail className="h-4 w-4" />
                  mesadepartes@caardpe.com
                </a>
                <p className="flex items-start gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  Jr. Aldebarán No. 596, Oficina 1409, Edificio IQ Surco, Santiago de Surco
                </p>
              </div>
            </div>

            {/* Garantías */}
            <div className="bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">Pago 100% Seguro</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#D66829]" />
                  Encriptación SSL de 256 bits
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#D66829]" />
                  Procesado por Culqi (PCI DSS)
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#D66829]" />
                  Comprobante electrónico
                </li>
              </ul>
            </div>
          </div>

          {/* Columna derecha - Formulario de pago */}
          <div className="lg:col-span-3">
            <CulqiCheckout
              amount={paymentData.amount}
              currency={paymentData.currency}
              title="Datos de la tarjeta"
              description="Ingresa los datos de tu tarjeta para completar el pago"
              paymentOrderId={paymentData.id}
              caseId={paymentData.caseId}
              concept={paymentData.concept}
              customerEmail={paymentData.customerEmail}
              customerName={paymentData.customerName}
              onSuccess={handleSuccess}
              onError={(error) => console.error("Payment error:", error)}
              className="shadow-2xl"
            />

            {/* Tarjetas aceptadas */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 mb-3">Tarjetas aceptadas</p>
              <div className="flex justify-center gap-4">
                <div className="px-4 py-2 bg-white rounded-lg shadow border">
                  <span className="font-bold text-[#1a1f71]">VISA</span>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg shadow border">
                  <span className="font-bold text-[#eb001b]">Mastercard</span>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg shadow border">
                  <span className="font-bold text-[#006fcf]">Amex</span>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg shadow border">
                  <span className="font-bold text-[#ff5f00]">Diners</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} CAARD - Centro de Arbitraje y Resolución de Disputas</p>
          <p className="mt-1">Todos los pagos son procesados de forma segura por Culqi.</p>
        </div>
      </footer>
    </div>
  );
}
