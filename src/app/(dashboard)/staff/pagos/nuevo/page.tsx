/**
 * /staff/pagos/nuevo — Crear nueva orden de pago
 *
 * Form mínimo para que la Secretaría genere una orden de pago asociada
 * a un expediente. POST a /api/payments/orders.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Loader2,
  CheckCircle,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CaseItem {
  id: string;
  code: string;
  title: string | null;
}

const CONCEPTOS = [
  { value: "TASA_PRESENTACION", label: "Tasa de presentación" },
  { value: "GASTOS_ADMINISTRATIVOS", label: "Gastos administrativos" },
  { value: "HONORARIOS_ARBITRO_UNICO", label: "Honorarios Árbitro Único" },
  { value: "HONORARIOS_TRIBUNAL", label: "Honorarios del Tribunal" },
  { value: "TASA_EMERGENCIA", label: "Tasa de emergencia" },
  { value: "GASTOS_RECONVENCION", label: "Gastos por reconvención" },
  { value: "RELIQUIDACION", label: "Reliquidación" },
  { value: "OTROS", label: "Otros" },
];

const DESTINATARIOS = [
  { value: "DEMANDANTE", label: "Demandante" },
  { value: "DEMANDADO", label: "Demandado" },
  { value: "AMBAS_PARTES", label: "Ambas partes" },
  { value: "TERCERO", label: "Tercero (externo)" },
];

export default function NuevaOrdenPagoPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [caseId, setCaseId] = useState("");
  const [concept, setConcept] = useState("GASTOS_ADMINISTRATIVOS");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [igv, setIgv] = useState("0");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [dueDate, setDueDate] = useState("");
  const [payeeType, setPayeeType] = useState<string>("DEMANDANTE");
  const [payeeName, setPayeeName] = useState("");
  const [payeeEmail, setPayeeEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cases?pageSize=200");
        if (r.ok) {
          const d = await r.json();
          setCases(d.items || []);
        }
      } finally {
        setLoadingCases(false);
      }
    })();
  }, []);

  const submit = async () => {
    setErr(null);
    setOk(null);
    const amt = parseFloat(amount);
    const igvVal = parseFloat(igv || "0");
    if (!caseId) return setErr("Selecciona un expediente");
    if (isNaN(amt) || amt <= 0) return setErr("Monto inválido");
    setSubmitting(true);
    try {
      const amountCents = Math.round(amt * 100);
      const igvCents = Math.round(igvVal * 100);
      const totalCents = amountCents + igvCents;
      const r = await fetch("/api/payments/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          concept,
          description: description || null,
          amountCents,
          igvCents,
          totalCents,
          currency,
          dueDate: dueDate || undefined,
          payeeType,
          payeeName: payeeType === "TERCERO" ? payeeName : undefined,
          payeeEmail: payeeType === "TERCERO" ? payeeEmail : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al crear orden");
      setOk(`Orden creada: ${d.paymentOrder?.orderNumber || ""}`);
      setTimeout(() => router.push("/staff/pagos"), 1200);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/staff/pagos">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#D66829]" />
            Nueva Orden de Pago
          </CardTitle>
          <CardDescription>
            Genera una orden de pago asociada a un expediente. Se notificará al
            destinatario por email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Expediente *</Label>
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingCases ? "Cargando..." : "Selecciona expediente"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code}
                    {c.title ? ` — ${c.title}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Concepto *</Label>
            <Select value={concept} onValueChange={setConcept}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONCEPTOS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle adicional..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>IGV</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={igv}
                onChange={(e) => setIgv(e.target.value)}
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as "PEN" | "USD")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">PEN (S/)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Vence el (opcional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si dejas vacío, vence en 5 días.
            </p>
          </div>

          <div>
            <Label>Destinatario *</Label>
            <Select value={payeeType} onValueChange={setPayeeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESTINATARIOS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {payeeType === "TERCERO" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre del destinatario</Label>
                <Input
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                />
              </div>
              <div>
                <Label>Email del destinatario</Label>
                <Input
                  type="email"
                  value={payeeEmail}
                  onChange={(e) => setPayeeEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {err && (
            <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded bg-green-50 border border-green-200 text-green-700 p-3 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {ok}
            </div>
          )}

          <Button
            onClick={submit}
            disabled={submitting || !caseId || !amount}
            className="w-full bg-[#D66829] hover:bg-[#c45a22]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Crear orden de pago
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
