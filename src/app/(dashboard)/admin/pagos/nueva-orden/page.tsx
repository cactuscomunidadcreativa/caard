/**
 * CAARD - Crear Nueva Orden de Pago
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  Calendar,
  FileText,
  Copy,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface Case {
  id: string;
  code: string;
  title?: string;
  subject?: string;
  claimantName?: string;
  respondentName?: string;
}

const CONCEPT_OPTIONS = [
  { value: "TASA_PRESENTACION", label: "Tasa de Presentación" },
  { value: "GASTOS_ADMINISTRATIVOS", label: "Gastos Administrativos" },
  { value: "HONORARIOS_TRIBUNAL", label: "Honorarios Tribunal Arbitral" },
  { value: "HONORARIOS_ARBITRO_UNICO", label: "Honorarios Árbitro Único" },
  { value: "TASA_EMERGENCIA", label: "Tasa de Emergencia" },
  { value: "GASTOS_RECONVENCION", label: "Gastos de Reconvención" },
  { value: "RELIQUIDACION", label: "Reliquidación" },
  { value: "OTROS", label: "Otros Conceptos" },
];

export default function NewPaymentOrderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; link: string } | null>(null);

  const [formData, setFormData] = useState({
    caseId: "",
    concept: "",
    description: "",
    amount: "",
    currency: "PEN",
    dueDate: "",
    voucherType: "NONE" as "NONE" | "RHE" | "FACTURA",
    payeeType: "DEMANDANTE" as "DEMANDANTE" | "DEMANDADO" | "AMBAS_PARTES" | "ARBITRO" | "TERCERO",
    payeeMemberId: "",
    payeeName: "",
    payeeEmail: "",
  });

  const [caseMembers, setCaseMembers] = useState<any[]>([]);

  // Cálculos automáticos según tipo de comprobante
  const baseAmount = parseFloat(formData.amount || "0");
  const retention = formData.voucherType === "RHE" ? baseAmount * 0.08 : 0;
  const igv = formData.voucherType === "FACTURA" ? baseAmount * 0.18 : 0;
  const netAmount = formData.voucherType === "RHE" ? baseAmount - retention : baseAmount;
  const totalWithIgv = baseAmount + igv;

  // Cargar casos
  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch("/api/cases?pageSize=100");
        if (response.ok) {
          const data = await response.json();
          // El API devuelve 'items', no 'cases'
          setCases(data.items || []);
        } else {
          console.error("Error response:", await response.text());
        }
      } catch (error) {
        console.error("Error loading cases:", error);
      } finally {
        setLoadingCases(false);
      }
    }
    loadCases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.caseId) {
      setError("Selecciona un caso/expediente");
      return;
    }
    if (!formData.concept) {
      setError("Selecciona un concepto de pago");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Ingresa un monto válido");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: formData.caseId,
          concept: formData.concept,
          description: formData.description
            + (formData.voucherType === "RHE" ? " (RHE - Retención 8%)" : "")
            + (formData.voucherType === "FACTURA" ? " (Factura + IGV 18%)" : ""),
          amountCents: Math.round(baseAmount * 100),
          igvCents: Math.round(igv * 100),
          retentionCents: Math.round(retention * 100),
          totalCents: Math.round(totalWithIgv * 100),
          currency: formData.currency,
          dueDate: formData.dueDate || undefined,
          voucherType: formData.voucherType !== "NONE" ? formData.voucherType : undefined,
          payeeType: formData.payeeType,
          payeeMemberId: formData.payeeMemberId || undefined,
          payeeName: formData.payeeName || undefined,
          payeeEmail: formData.payeeEmail || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear la orden de pago");
      }

      const data = await response.json();
      const paymentLink = `${window.location.origin}/pago/${data.id}`;

      setCreatedOrder({ id: data.id, link: paymentLink });
      toast.success("Orden de pago creada exitosamente");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.link);
      toast.success("Link copiado al portapapeles");
    }
  };

  if (createdOrder) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/pagos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Orden de Pago Creada</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  ¡Orden creada exitosamente!
                </h2>
                <p className="text-slate-600">
                  Comparte el siguiente link con el usuario para que pueda realizar el pago.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <Label className="text-sm text-slate-500">Link de pago:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={createdOrder.link}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={createdOrder.link} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-4">
                <Button asChild variant="outline">
                  <Link href="/admin/pagos">
                    Ver todas las órdenes
                  </Link>
                </Button>
                <Button onClick={() => {
                  setCreatedOrder(null);
                  setFormData({
                    caseId: "",
                    concept: "",
                    description: "",
                    amount: "",
                    currency: "PEN",
                    dueDate: "",
                    voucherType: "NONE",
                    payeeType: "DEMANDANTE",
                    payeeMemberId: "",
                    payeeName: "",
                    payeeEmail: "",
                  });
                }}>
                  Crear otra orden
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/pagos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Orden de Pago</h1>
          <p className="text-muted-foreground">
            Genera un link de pago para un caso específico
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Datos de la Orden
            </CardTitle>
            <CardDescription>
              Completa la información para generar el link de pago
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Caso */}
            <div className="space-y-2">
              <Label htmlFor="caseId">
                <FileText className="h-4 w-4 inline mr-2" />
                Caso / Expediente *
              </Label>
              {loadingCases ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando casos...</span>
                </div>
              ) : cases.length === 0 ? (
                <div className="p-3 border rounded-md bg-yellow-50 text-yellow-800 text-sm">
                  No hay casos disponibles. Crea un caso primero desde el módulo de expedientes.
                </div>
              ) : (
                <Select
                  value={formData.caseId}
                  onValueChange={async (v) => {
                    setFormData((f) => ({ ...f, caseId: v, payeeMemberId: "", payeeName: "", payeeEmail: "" }));
                    // Cargar miembros del caso
                    try {
                      const res = await fetch(`/api/cases/${v}`);
                      if (res.ok) {
                        const { case: c } = await res.json();
                        setCaseMembers(c.members || []);
                      }
                    } catch {}
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar caso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => {
                      const description = c.title || c.subject || `${c.claimantName || ""} vs ${c.respondentName || ""}`;
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-mono">{c.code}</span>
                          {description && (
                            <span className="text-muted-foreground ml-2 text-sm">
                              - {description.slice(0, 35)}{description.length > 35 ? "..." : ""}
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Concepto */}
            <div className="space-y-2">
              <Label htmlFor="concept">Concepto de Pago *</Label>
              <Select
                value={formData.concept}
                onValueChange={(v) => setFormData((f) => ({ ...f, concept: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar concepto" />
                </SelectTrigger>
                <SelectContent>
                  {CONCEPT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destinatario de la orden */}
            <div className="space-y-2">
              <Label>Se le cobra a *</Label>
              <Select
                value={formData.payeeType}
                onValueChange={(v: any) => {
                  setFormData((f) => ({ ...f, payeeType: v, payeeMemberId: "", payeeName: "", payeeEmail: "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEMANDANTE">Demandante</SelectItem>
                  <SelectItem value="DEMANDADO">Demandado</SelectItem>
                  <SelectItem value="AMBAS_PARTES">Ambas partes (50/50)</SelectItem>
                  <SelectItem value="ARBITRO">Árbitro</SelectItem>
                  <SelectItem value="TERCERO">Tercero (externo)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Se enviará notificación al destinatario cuando se emita la orden.</p>
            </div>

            {/* Selector de persona específica del caso */}
            {formData.caseId && formData.payeeType !== "TERCERO" && formData.payeeType !== "AMBAS_PARTES" && (
              <div className="space-y-2">
                <Label>Persona específica (opcional)</Label>
                <Select
                  value={formData.payeeMemberId}
                  onValueChange={(v) => {
                    const m = caseMembers.find(x => x.id === v);
                    setFormData((f) => ({
                      ...f,
                      payeeMemberId: v,
                      payeeName: m?.displayName || "",
                      payeeEmail: m?.email || "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="(todos los que coincidan con el rol)" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseMembers
                      .filter(m => m.role === formData.payeeType || (formData.payeeType === "DEMANDANTE" && m.role === "DEMANDANTE") || (formData.payeeType === "DEMANDADO" && m.role === "DEMANDADO") || (formData.payeeType === "ARBITRO" && m.role === "ARBITRO"))
                      .map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.displayName} {m.email ? `(${m.email})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.payeeType === "TERCERO" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del tercero *</Label>
                  <Input value={formData.payeeName} onChange={e => setFormData(f => ({ ...f, payeeName: e.target.value }))} />
                </div>
                <div>
                  <Label>Email del tercero</Label>
                  <Input type="email" value={formData.payeeEmail} onChange={e => setFormData(f => ({ ...f, payeeEmail: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Detalles adicionales sobre el pago..."
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Monto y Moneda */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {formData.currency === "USD" ? "$" : "S/"}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                    className="pl-10 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">PEN (Soles)</SelectItem>
                    <SelectItem value="USD">USD (Dólares)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipo de comprobante */}
            <div className="space-y-2">
              <Label>Tipo de comprobante</Label>
              <Select
                value={formData.voucherType}
                onValueChange={(v) => setFormData((f) => ({ ...f, voucherType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin comprobante especial</SelectItem>
                  <SelectItem value="RHE">RHE (Recibo por Honorarios - Retención 8%)</SelectItem>
                  <SelectItem value="FACTURA">Factura (+ IGV 18%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desglose automático */}
            {baseAmount > 0 && formData.voucherType !== "NONE" && (
              <div className="rounded-lg border bg-slate-50 p-4 space-y-2 text-sm">
                <p className="font-semibold">Desglose:</p>
                <div className="flex justify-between">
                  <span>Monto base</span>
                  <span>{formData.currency === "USD" ? "$" : "S/."} {baseAmount.toFixed(2)}</span>
                </div>
                {formData.voucherType === "RHE" && (
                  <>
                    <div className="flex justify-between text-red-600">
                      <span>Retención IR (8%)</span>
                      <span>- {formData.currency === "USD" ? "$" : "S/."} {retention.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Neto a pagar</span>
                      <span>{formData.currency === "USD" ? "$" : "S/."} {netAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {formData.voucherType === "FACTURA" && (
                  <>
                    <div className="flex justify-between text-blue-600">
                      <span>IGV (18%)</span>
                      <span>+ {formData.currency === "USD" ? "$" : "S/."} {igv.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total con IGV</span>
                      <span>{formData.currency === "USD" ? "$" : "S/."} {totalWithIgv.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Fecha de vencimiento */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                <Calendar className="h-4 w-4 inline mr-2" />
                Fecha de vencimiento (opcional)
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Si se establece, el pago no será válido después de esta fecha
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button asChild variant="outline">
              <Link href="/admin/pagos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Crear Orden de Pago
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
