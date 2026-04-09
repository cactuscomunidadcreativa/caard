"use client";

/**
 * CAARD - Configuración de Tarifas
 * Muestra las 6 tablas de tarifas oficiales + calculadora inline
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calculator, DollarSign } from "lucide-react";
import {
  calculateCaardFees,
  formatCurrency,
  TRIBUNAL_NACIONAL,
  ARBITRO_UNICO_NACIONAL,
  GASTOS_CENTRO_NACIONAL,
  EMERGENCIA_NACIONAL,
  TRIBUNAL_INTERNACIONAL,
  INTERNACIONAL_PERCENT,
} from "@/lib/fees/caard-tariffs";

export default function FeesPage() {
  const [amount, setAmount] = useState("");
  const parsed = Number((amount || "0").replace(/[^\d.]/g, ""));

  const tables = [
    { name: "Tribunal Arbitral Nacional (S/.)", data: TRIBUNAL_NACIONAL, currency: "S/." },
    { name: "Árbitro Único Nacional (S/.)", data: ARBITRO_UNICO_NACIONAL, currency: "S/." },
    { name: "Gastos del Centro Nacional (S/.)", data: GASTOS_CENTRO_NACIONAL, currency: "S/." },
    { name: "Emergencia Nacional (S/.)", data: EMERGENCIA_NACIONAL, currency: "S/." },
    { name: "Tribunal Arbitral Internacional ($)", data: TRIBUNAL_INTERNACIONAL, currency: "$" },
  ];

  const calcResults = parsed > 0 ? [
    { label: "Tribunal Nacional", ...calculateCaardFees({ scope: "NACIONAL", mode: "TRIBUNAL_3", amount: parsed }) },
    { label: "Árbitro Único Nacional", ...calculateCaardFees({ scope: "NACIONAL", mode: "SOLE_ARBITRATOR", amount: parsed }) },
    { label: "Emergencia Nacional", ...calculateCaardFees({ scope: "NACIONAL", mode: "SOLE_ARBITRATOR", procedureType: "EMERGENCY", amount: parsed }) },
    { label: "Internacional", ...calculateCaardFees({ scope: "INTERNACIONAL", mode: "TRIBUNAL_3", amount: parsed }) },
  ] : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Tarifas</h1>
        <p className="text-muted-foreground">
          Tarifas oficiales del centro según reglamento vigente
        </p>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="tables">
            <DollarSign className="h-4 w-4 mr-2" />
            Tablas de Tarifas
          </TabsTrigger>
        </TabsList>

        {/* Calculadora */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Gastos Arbitrales</CardTitle>
              <CardDescription>
                Ingrese la cuantía para ver el desglose completo por modalidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-sm">
                <Label>Cuantía de la controversia</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg h-12 mt-1"
                />
              </div>

              {calcResults.length > 0 && (
                <div className="space-y-4">
                  {calcResults.map((r, i) => (
                    <div key={i} className="rounded-lg border overflow-hidden">
                      <div className="bg-[#0B2A5B] text-white px-4 py-2 font-semibold text-sm">
                        {r.label}
                      </div>
                      <div className="grid grid-cols-3 divide-x p-4">
                        <div className="px-3">
                          <p className="text-xs text-muted-foreground uppercase">Honorarios</p>
                          <p className="text-lg font-bold text-[#0B2A5B]">
                            {formatCurrency(r.arbitratorFee, r.currency)}
                          </p>
                        </div>
                        <div className="px-3">
                          <p className="text-xs text-muted-foreground uppercase">Gastos Centro</p>
                          <p className="text-lg font-bold text-[#D66829]">
                            {formatCurrency(r.centerFee, r.currency)}
                          </p>
                        </div>
                        <div className="px-3">
                          <p className="text-xs text-muted-foreground uppercase">Total</p>
                          <p className="text-lg font-bold text-emerald-700">
                            {formatCurrency(r.total, r.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tablas */}
        <TabsContent value="tables">
          <div className="space-y-4">
            {tables.map((t) => (
              <Card key={t.name}>
                <CardHeader className="bg-[#0B2A5B] text-white rounded-t-lg py-3">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Desde</TableHead>
                        <TableHead>Hasta</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Sobre excedente de</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {t.data.map((b: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{t.currency} {b.minAmount.toLocaleString()}</TableCell>
                          <TableCell>{b.maxAmount ? `${t.currency} ${b.maxAmount.toLocaleString()}` : "∞"}</TableCell>
                          <TableCell className="font-medium">{t.currency} {b.baseFee.toLocaleString()}</TableCell>
                          <TableCell>{b.percent ? `${(b.percent * 100).toFixed(2)}%` : b.flat ? "Fijo" : "-"}</TableCell>
                          <TableCell>{b.over ? `${t.currency} ${b.over.toLocaleString()}` : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-900">
                  <strong>Internacional (porcentaje plano):</strong> Honorarios{" "}
                  <Badge variant="secondary">{(INTERNACIONAL_PERCENT.tribunal * 100).toFixed(1)}%</Badge> + Gastos del Centro{" "}
                  <Badge variant="secondary">{(INTERNACIONAL_PERCENT.gastosCentro * 100).toFixed(1)}%</Badge> sobre el monto del contrato.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
