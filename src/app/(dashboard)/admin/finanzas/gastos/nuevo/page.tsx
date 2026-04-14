"use client";

/**
 * CAARD - Registrar nuevo gasto/egreso
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";

const categories = [
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "PLANILLA", label: "Planilla" },
  { value: "SERVICIOS", label: "Servicios" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "COURIER", label: "Courier" },
  { value: "PERICIA", label: "Pericia" },
  { value: "HONORARIOS_EXTERNOS", label: "Honorarios Externos" },
  { value: "IMPUESTOS", label: "Impuestos" },
  { value: "OTROS", label: "Otros" },
];

export default function NuevoGastoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "PROVEEDOR",
    concept: "",
    description: "",
    vendorName: "",
    vendorRuc: "",
    amount: "",
    includeIgv: true,
    currency: "PEN",
    voucherType: "",
    voucherNumber: "",
    voucherDate: "",
    paymentMethod: "",
  });

  const base = Number(form.amount || 0);
  const igv = form.includeIgv ? base * 0.18 : 0;
  const total = base + igv;
  const sym = form.currency === "USD" ? "$" : "S/.";

  async function handleSubmit() {
    if (!form.concept || !form.amount) { toast.error("Concepto y monto son requeridos"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          concept: form.concept,
          description: form.description || null,
          vendorName: form.vendorName || null,
          vendorRuc: form.vendorRuc || null,
          amountCents: Math.round(base * 100),
          igvCents: Math.round(igv * 100),
          currency: form.currency,
          voucherType: form.voucherType || null,
          voucherNumber: form.voucherNumber || null,
          voucherDate: form.voucherDate || null,
          paymentMethod: form.paymentMethod || null,
        }),
      });
      if (!res.ok) throw new Error("Error al crear");
      toast.success("Gasto registrado");
      router.push("/admin/finanzas");
    } catch { toast.error("Error al registrar gasto"); }
    finally { setSaving(false); }
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/finanzas"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Registrar Gasto</h1>
          <p className="text-sm text-muted-foreground">Nuevo egreso o pago a tercero</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-[#D66829]" /> Datos del gasto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoría *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">PEN (Soles)</SelectItem>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Concepto *</Label>
            <Input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} placeholder="Ej: Servicio de courier mensual" />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Detalle adicional..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Proveedor</Label>
              <Input value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} placeholder="Nombre del proveedor" />
            </div>
            <div>
              <Label>RUC</Label>
              <Input value={form.vendorRuc} onChange={e => setForm({ ...form, vendorRuc: e.target.value })} placeholder="20xxxxxxxxx" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monto base (sin IGV) *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.includeIgv} onChange={e => setForm({ ...form, includeIgv: e.target.checked })} className="rounded" />
                <span className="text-sm">Incluir IGV (18%)</span>
              </label>
            </div>
          </div>

          {base > 0 && (
            <div className="rounded-lg bg-slate-50 border p-4 text-sm space-y-1">
              <div className="flex justify-between"><span>Base</span><span>{sym} {base.toFixed(2)}</span></div>
              {form.includeIgv && <div className="flex justify-between text-blue-600"><span>IGV 18%</span><span>{sym} {igv.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{sym} {total.toFixed(2)}</span></div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Tipo comprobante</Label>
              <Select value={form.voucherType} onValueChange={v => setForm({ ...form, voucherType: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                  <SelectItem value="BOLETA">Boleta</SelectItem>
                  <SelectItem value="RECIBO">Recibo</SelectItem>
                  <SelectItem value="NOTA_CREDITO">Nota de crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>N° comprobante</Label>
              <Input value={form.voucherNumber} onChange={e => setForm({ ...form, voucherNumber: e.target.value })} placeholder="F001-00123" />
            </div>
            <div>
              <Label>Fecha comprobante</Label>
              <Input type="date" value={form.voucherDate} onChange={e => setForm({ ...form, voucherDate: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Método de pago</Label>
            <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Link href="/admin/finanzas"><Button variant="outline">Cancelar</Button></Link>
            <Button onClick={handleSubmit} disabled={saving || !form.concept || !form.amount} style={{ backgroundColor: "#0B2A5B" }}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Receipt className="h-4 w-4 mr-2" />}
              Registrar Gasto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
