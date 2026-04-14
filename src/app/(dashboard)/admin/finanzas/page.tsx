"use client";

/**
 * CAARD - Dashboard Financiero
 * Resumen / Ingresos / Egresos / Estado Financiero
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Loader2, FileText, Receipt, Wallet,
} from "lucide-react";

const fmt = (cents: number, currency = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(cents / 100);

const conceptLabels: Record<string, string> = {
  GASTOS_ADMINISTRATIVOS: "Gastos Administrativos",
  TASA_PRESENTACION: "Tasa de Presentación",
  HONORARIOS_TRIBUNAL: "Honorarios Tribunal",
  HONORARIOS_ARBITRO_UNICO: "Honorarios Árbitro Único",
  TASA_EMERGENCIA: "Tasa Emergencia",
  OTROS: "Otros",
};

const catLabels: Record<string, string> = {
  PROVEEDOR: "Proveedores",
  PLANILLA: "Planilla",
  SERVICIOS: "Servicios",
  ALQUILER: "Alquiler",
  COURIER: "Courier",
  PERICIA: "Pericias",
  HONORARIOS_EXTERNOS: "Honorarios Ext.",
  IMPUESTOS: "Impuestos",
  OTROS: "Otros",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function FinanzasPage() {
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/financial-summary").then(r => r.json()),
      fetch("/api/admin/expenses?limit=100").then(r => r.json()),
    ]).then(([sum, exp]) => {
      setSummary(sum);
      setExpenses(exp.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const t = summary?.totals || { ingresos: 0, egresos: 0, balance: 0, pendingIngresos: 0, pendingEgresos: 0 };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted-foreground">Estado financiero del centro de arbitraje</p>
        </div>
        <Link href="/admin/finanzas/gastos/nuevo">
          <Button style={{ backgroundColor: "#D66829" }}>
            <Plus className="h-4 w-4 mr-2" /> Registrar Gasto
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Ingresos cobrados</p>
                <p className="text-xl font-bold text-green-700">{fmt(t.ingresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50"><TrendingDown className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Egresos pagados</p>
                <p className="text-xl font-bold text-red-700">{fmt(t.egresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={t.balance >= 0 ? "border-blue-200" : "border-amber-200"}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${t.balance >= 0 ? "bg-blue-50" : "bg-amber-50"}`}>
                <Wallet className={`h-5 w-5 ${t.balance >= 0 ? "text-blue-600" : "text-amber-600"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`text-xl font-bold ${t.balance >= 0 ? "text-blue-700" : "text-amber-700"}`}>{fmt(t.balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50"><Receipt className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Por cobrar</p>
                <p className="text-xl font-bold text-amber-700">{fmt(t.pendingIngresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="egresos">Egresos ({expenses.length})</TabsTrigger>
          <TabsTrigger value="estado">Estado Financiero</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="resumen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Ingresos por concepto</CardTitle></CardHeader>
              <CardContent>
                {(summary?.byConcepto || []).map((c: any) => (
                  <div key={c.concept} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{conceptLabels[c.concept] || c.concept}</span>
                    <span className="font-medium text-green-700">{fmt(c.total)}</span>
                  </div>
                ))}
                {(!summary?.byConcepto || summary.byConcepto.length === 0) && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Egresos por categoría</CardTitle></CardHeader>
              <CardContent>
                {(summary?.byCategoria || []).map((c: any) => (
                  <div key={c.category} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{catLabels[c.category] || c.category}</span>
                    <span className="font-medium text-red-700">{fmt(c.total)}</span>
                  </div>
                ))}
                {(!summary?.byCategoria || summary.byCategoria.length === 0) && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sin gastos registrados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ingresos */}
        <TabsContent value="ingresos">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por concepto</CardTitle>
              <CardDescription>PaymentOrders cobradas</CardDescription>
            </CardHeader>
            <CardContent>
              {(summary?.byConcepto || []).map((c: any) => (
                <div key={c.concept} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50"><ArrowUpRight className="h-4 w-4 text-green-600" /></div>
                    <span className="font-medium">{conceptLabels[c.concept] || c.concept}</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">{fmt(c.total)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-4 border-t-2 mt-2">
                <span className="font-bold">Total ingresos</span>
                <span className="text-xl font-bold text-green-800">{fmt(t.ingresos)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Egresos */}
        <TabsContent value="egresos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gastos y Egresos</CardTitle>
                <CardDescription>{expenses.length} registros</CardDescription>
              </div>
              <Link href="/admin/finanzas/gastos/nuevo">
                <Button size="sm" style={{ backgroundColor: "#D66829" }}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No hay gastos registrados.</p>
                  <Link href="/admin/finanzas/gastos/nuevo"><Button variant="outline" className="mt-3">Registrar primer gasto</Button></Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          {e.concept}
                          {e.description && <span className="block text-xs text-muted-foreground">{e.description}</span>}
                        </TableCell>
                        <TableCell>{e.vendorName || "-"}<br /><span className="text-xs text-muted-foreground">{e.vendorRuc || ""}</span></TableCell>
                        <TableCell><Badge variant="outline">{catLabels[e.category] || e.category}</Badge></TableCell>
                        <TableCell className="font-medium">{fmt(e.totalCents, e.currency)}</TableCell>
                        <TableCell><Badge className={statusColors[e.status] || ""}>{e.status}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{e.createdAt?.split("T")[0]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estado Financiero */}
        <TabsContent value="estado">
          <Card>
            <CardHeader>
              <CardTitle>Estado Financiero Mensual</CardTitle>
              <CardDescription>Últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0B2A5B] text-white">
                    <TableHead className="text-white">Mes</TableHead>
                    <TableHead className="text-white text-right">Ingresos</TableHead>
                    <TableHead className="text-white text-right">Egresos</TableHead>
                    <TableHead className="text-white text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.monthly || []).map((m: any) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-mono">{m.month}</TableCell>
                      <TableCell className="text-right text-green-700 font-medium">{m.ingresos > 0 ? fmt(m.ingresos) : "-"}</TableCell>
                      <TableCell className="text-right text-red-700 font-medium">{m.egresos > 0 ? fmt(m.egresos) : "-"}</TableCell>
                      <TableCell className={`text-right font-bold ${m.balance >= 0 ? "text-blue-700" : "text-amber-700"}`}>
                        {m.ingresos > 0 || m.egresos > 0 ? fmt(m.balance) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right text-green-800">{fmt(t.ingresos)}</TableCell>
                    <TableCell className="text-right text-red-800">{fmt(t.egresos)}</TableCell>
                    <TableCell className={`text-right ${t.balance >= 0 ? "text-blue-800" : "text-amber-800"}`}>{fmt(t.balance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
