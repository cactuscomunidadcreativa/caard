"use client";

/**
 * Calculadora interactiva de tarifas (admin).
 * Las fórmulas viven server-side; este componente solo hace fetch.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  type FeeBreakdown,
  type Scope,
  type TribunalMode,
  type ProcedureType,
} from "@/lib/fees/caard-tariffs-shared";

type Row = FeeBreakdown & { label: string; currency: "PEN" | "USD" };

const VARIANTS: {
  label: string;
  scope: Scope;
  mode: TribunalMode;
  procedureType: ProcedureType;
  currency: "PEN" | "USD";
}[] = [
  { label: "Tribunal Nacional",      scope: "NACIONAL",      mode: "TRIBUNAL_3",       procedureType: "REGULAR",   currency: "PEN" },
  { label: "Árbitro Único Nacional", scope: "NACIONAL",      mode: "SOLE_ARBITRATOR",  procedureType: "REGULAR",   currency: "PEN" },
  { label: "Emergencia Nacional",    scope: "NACIONAL",      mode: "SOLE_ARBITRATOR",  procedureType: "EMERGENCY", currency: "PEN" },
  { label: "Internacional",          scope: "INTERNACIONAL", mode: "TRIBUNAL_3",       procedureType: "REGULAR",   currency: "USD" },
];

export function FeesCalculator() {
  const [amount, setAmount] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const parsed = Number((amount || "0").replace(/[^\d.]/g, ""));

  useEffect(() => {
    if (!parsed || parsed <= 0) {
      setRows([]);
      return;
    }
    const ctrl = new AbortController();
    Promise.all(
      VARIANTS.map((v) =>
        fetch("/api/public/fees/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: v.scope,
            mode: v.mode,
            procedureType: v.procedureType,
            amount: parsed,
          }),
          signal: ctrl.signal,
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data: FeeBreakdown | null) =>
            data ? { ...data, label: v.label, currency: v.currency } : null
          )
      )
    )
      .then((results) => setRows(results.filter((r): r is Row => r !== null)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [parsed]);

  return (
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

        {rows.length > 0 && (
          <div className="space-y-4">
            {rows.map((r, i) => (
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
  );
}
