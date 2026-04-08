"use client";
/**
 * CAARD - Calculadora de Gastos Arbitrales
 * Usa el engine central src/lib/fees/caard-tariffs para mantener consistencia
 * con liquidaciones, órdenes de pago y admin.
 */
import { useMemo, useState } from "react";
import { Calculator, Info, RefreshCw, Scale, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  calculateCaardFees,
  formatCurrency,
  type Scope,
  type TribunalMode,
  type ProcedureType,
} from "@/lib/fees/caard-tariffs";

export function ArbitrageCalculator() {
  const [amount, setAmount] = useState<string>("");
  const [scope, setScope] = useState<Scope>("NACIONAL");
  const [mode, setMode] = useState<TribunalMode>("TRIBUNAL_3");
  const [procedureType, setProcedureType] = useState<ProcedureType>("REGULAR");

  const parsed = Number((amount || "0").replace(/[^\d.]/g, ""));

  const result = useMemo(() => {
    if (!parsed || parsed <= 0) return null;
    return calculateCaardFees({
      scope,
      mode,
      procedureType,
      amount: parsed,
    });
  }, [parsed, scope, mode, procedureType]);

  const currency: "PEN" | "USD" = scope === "INTERNACIONAL" ? "USD" : "PEN";
  const currencySymbol = currency === "USD" ? "$" : "S/.";

  const reset = () => {
    setAmount("");
    setScope("NACIONAL");
    setMode("TRIBUNAL_3");
    setProcedureType("REGULAR");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="shadow-xl border-2 border-slate-200">
        <CardHeader className="bg-gradient-to-r from-[#0B2A5B] to-[#1a4185] text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Calculator className="h-6 w-6" />
            Calculadora de Gastos Arbitrales
          </CardTitle>
          <CardDescription className="text-white/80">
            Cálculo de honorarios del árbitro/tribunal y gastos del centro
            según el reglamento oficial CAARD.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-[#D66829]" />
                Tipo de arbitraje
              </Label>
              <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NACIONAL">Nacional (Soles)</SelectItem>
                  <SelectItem value="INTERNACIONAL">
                    Internacional (Dólares)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#D66829]" />
                Procedimiento
              </Label>
              <Select
                value={procedureType}
                onValueChange={(v) => setProcedureType(v as ProcedureType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Arbitraje regular</SelectItem>
                  <SelectItem value="EMERGENCY">
                    Arbitraje de emergencia
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {procedureType !== "EMERGENCY" && (
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#D66829]" />
                  Composición del tribunal
                </Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as TribunalMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLE_ARBITRATOR">Árbitro único</SelectItem>
                    <SelectItem value="TRIBUNAL_3">
                      Tribunal arbitral (3 árbitros)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Cuantía de la controversia ({currencySymbol})</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={`Ej: ${currencySymbol} 500,000.00`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-12"
              />
              <p className="text-xs text-muted-foreground">
                Ingrese el monto total de la controversia sin IGV.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reiniciar
            </Button>
          </div>

          <Separator />

          {result ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border-2 border-[#0B2A5B]/20 bg-[#0B2A5B]/5 p-5">
                  <p className="text-xs text-[#0B2A5B]/70 uppercase tracking-wide font-semibold">
                    {procedureType === "EMERGENCY"
                      ? "Árbitro de emergencia"
                      : mode === "TRIBUNAL_3"
                      ? "Honorarios tribunal arbitral"
                      : "Honorarios árbitro único"}
                  </p>
                  <p className="text-2xl font-bold text-[#0B2A5B] mt-2">
                    {formatCurrency(result.arbitratorFee, currency)}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-[#D66829]/20 bg-[#D66829]/5 p-5">
                  <p className="text-xs text-[#D66829]/80 uppercase tracking-wide font-semibold">
                    Gastos del centro
                  </p>
                  <p className="text-2xl font-bold text-[#D66829] mt-2">
                    {formatCurrency(result.centerFee, currency)}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs text-emerald-800 uppercase tracking-wide font-semibold">
                    Total estimado
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 mt-2">
                    {formatCurrency(result.total, currency)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">
                    {scope === "INTERNACIONAL"
                      ? "Arbitraje Internacional"
                      : procedureType === "EMERGENCY"
                      ? "Arbitraje de Emergencia"
                      : `Arbitraje Nacional — ${
                          mode === "TRIBUNAL_3"
                            ? "Tribunal (3 árbitros)"
                            : "Árbitro Único"
                        }`}
                  </p>
                  <p className="text-blue-800">{result.description}</p>
                  <p className="text-xs text-blue-700 mt-2">
                    Montos sin IGV. Referencial según reglamento vigente.
                    Consulte el reglamento oficial de tarifas para condiciones
                    aplicables.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Ingrese la cuantía para ver el cálculo.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
