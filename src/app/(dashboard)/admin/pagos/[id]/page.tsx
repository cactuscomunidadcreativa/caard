"use client";

/**
 * CAARD - Detalle y edición de Orden de Pago
 */
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, DollarSign, Pencil, Save, X, Loader2, Check,
} from "lucide-react";

const conceptLabels: Record<string, string> = {
  GASTOS_ADMINISTRATIVOS: "Gastos Administrativos",
  TASA_PRESENTACION: "Tasa de Presentación",
  HONORARIOS_TRIBUNAL: "Honorarios del Tribunal",
  HONORARIOS_ARBITRO_UNICO: "Honorarios Árbitro Único",
  TASA_EMERGENCIA: "Tasa de Emergencia",
  OTROS: "Otros",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  PAID: { label: "Pagado", color: "bg-green-100 text-green-800" },
  OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
};

export default function PaymentOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch(`/api/payment-orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setForm({
          concept: d.concept,
          description: d.description || "",
          amountCents: d.amountCents,
          igvCents: d.igvCents || 0,
          totalCents: d.totalCents,
          currency: d.currency,
          status: d.status,
          voucherType: d.description?.includes("RHE") ? "RHE" : d.description?.includes("Factura") ? "FACTURA" : "NONE",
          arbitratorName: d.description?.replace(/^Honorarios\s*-?\s*/i, "").replace(/\s*\(.*\)/, "") || "",
          dueAt: d.dueAt ? d.dueAt.split("T")[0] : "",
          paidAt: d.paidAt ? d.paidAt.split("T")[0] : "",
        });
      })
      .catch(() => toast.error("Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

  const baseAmount = form.amountCents / 100;
  const isHonorarios = form.concept?.startsWith("HONORARIOS");

  async function handleSave() {
    setSaving(true);
    try {
      // Recalculate based on voucher type
      let amountCents = form.amountCents;
      let igvCents = 0;
      let totalCents = amountCents;

      if (form.voucherType === "FACTURA") {
        igvCents = Math.round(amountCents * 0.18);
        totalCents = amountCents + igvCents;
      } else if (form.voucherType === "RHE") {
        // RHE: retention is informational, total stays same
        igvCents = 0;
        totalCents = amountCents;
      }

      let description = form.description;
      if (isHonorarios && form.arbitratorName) {
        description = "Honorarios - " + form.arbitratorName;
      }
      if (form.voucherType === "RHE") description += " (RHE - Retención 8%)";
      if (form.voucherType === "FACTURA") description += " (Factura + IGV 18%)";

      const res = await fetch(`/api/payment-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: form.concept,
          description,
          amountCents,
          igvCents,
          totalCents,
          currency: form.currency,
          status: form.status,
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
          paidAt: form.status === "PAID" && form.paidAt ? new Date(form.paidAt).toISOString() : form.status === "PAID" ? new Date().toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("Error");
      toast.success("Orden actualizada");
      setEditing(false);
      window.location.reload();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!order) return <div className="container py-12 text-center text-muted-foreground">Orden no encontrada</div>;

  const fmt = (cents: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: order.currency || "PEN" }).format(cents / 100);
  const st = statusLabels[order.status] || { label: order.status, color: "bg-gray-100" };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/pagos">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Orden de Pago</h1>
          <p className="text-sm text-muted-foreground font-mono">{order.orderNumber}</p>
        </div>
        <Badge className={st.color}>{st.label}</Badge>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
        )}
      </div>

      {/* Expediente */}
      {order.case && (
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-[#D66829]" />
            <div>
              <Link href={`/cases/${order.case.id || order.caseId}`} className="text-[#0B2A5B] font-medium hover:underline">
                {order.case.code || order.caseCode || "Expediente"}
              </Link>
              <p className="text-xs text-muted-foreground">{order.case.title?.slice(0, 80)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{conceptLabels[order.concept] || order.concept}</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Concepto</Label>
                  <Select value={form.concept} onValueChange={(v) => setForm({ ...form, concept: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(conceptLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isHonorarios && (
                <div>
                  <Label>Nombre del árbitro</Label>
                  <Input
                    value={form.arbitratorName}
                    onChange={(e) => setForm({ ...form, arbitratorName: e.target.value })}
                    placeholder="Nombre del árbitro"
                  />
                </div>
              )}

              <div>
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Monto base</Label>
                  <Input
                    type="number" step="0.01"
                    value={(form.amountCents / 100).toFixed(2)}
                    onChange={(e) => setForm({ ...form, amountCents: Math.round(Number(e.target.value) * 100) })}
                  />
                </div>
                <div>
                  <Label>Tipo comprobante</Label>
                  <Select value={form.voucherType} onValueChange={(v) => setForm({ ...form, voucherType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin comprobante</SelectItem>
                      <SelectItem value="RHE">RHE (Ret. 8%)</SelectItem>
                      <SelectItem value="FACTURA">Factura (+IGV 18%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Moneda</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desglose */}
              {form.voucherType !== "NONE" && (
                <div className="rounded-lg bg-slate-50 border p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span>Base</span><span>{fmt(form.amountCents)}</span></div>
                  {form.voucherType === "RHE" && (
                    <>
                      <div className="flex justify-between text-red-600"><span>Retención 8%</span><span>- {fmt(Math.round(form.amountCents * 0.08))}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span>Neto a pagar</span><span>{fmt(form.amountCents - Math.round(form.amountCents * 0.08))}</span></div>
                    </>
                  )}
                  {form.voucherType === "FACTURA" && (
                    <>
                      <div className="flex justify-between text-blue-600"><span>IGV 18%</span><span>+ {fmt(Math.round(form.amountCents * 0.18))}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{fmt(form.amountCents + Math.round(form.amountCents * 0.18))}</span></div>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha vencimiento</Label>
                  <Input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
                </div>
                <div>
                  <Label>Fecha de pago</Label>
                  <Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#0B2A5B" }}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Descripción</p>
                <p className="font-medium">{order.description || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto Base</p>
                <p className="text-lg font-bold">{fmt(order.amountCents)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">IGV</p>
                <p className="text-lg">{order.igvCents > 0 ? fmt(order.igvCents) : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-[#0B2A5B]">{fmt(order.totalCents)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Moneda</p>
                <p>{order.currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vencimiento</p>
                <p>{order.dueAt ? new Date(order.dueAt).toLocaleDateString("es-PE") : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha de pago</p>
                <p>{order.paidAt ? new Date(order.paidAt).toLocaleDateString("es-PE") : "-"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
