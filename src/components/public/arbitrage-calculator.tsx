"use client";

/**
 * CAARD - Componente Calculadora de Gastos Arbitrales
 * Calcula gastos administrativos y honorarios de árbitros
 * CON TRADUCCIONES i18n
 */

import { useState, useMemo } from "react";
import {
  Calculator,
  Users,
  DollarSign,
  Scale,
  FileText,
  Info,
  ChevronDown,
  Download,
  Printer,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n";

// Tabla de tarifas administrativas (porcentaje sobre cuantía)
const ADMIN_FEE_TIERS = [
  { min: 0, max: 50000, rate: 3.0, minFee: 1500 },
  { min: 50000, max: 100000, rate: 2.5, minFee: 1500 },
  { min: 100000, max: 250000, rate: 2.0, minFee: 2500 },
  { min: 250000, max: 500000, rate: 1.5, minFee: 5000 },
  { min: 500000, max: 1000000, rate: 1.0, minFee: 7500 },
  { min: 1000000, max: 5000000, rate: 0.75, minFee: 10000 },
  { min: 5000000, max: Infinity, rate: 0.5, minFee: 37500 },
];

// Tabla de honorarios de árbitros (porcentaje sobre cuantía)
const ARBITRATOR_FEE_TIERS = [
  { min: 0, max: 50000, rate: 8.0, minFee: 4000 },
  { min: 50000, max: 100000, rate: 6.0, minFee: 4000 },
  { min: 100000, max: 250000, rate: 5.0, minFee: 6000 },
  { min: 250000, max: 500000, rate: 4.0, minFee: 12500 },
  { min: 500000, max: 1000000, rate: 3.0, minFee: 20000 },
  { min: 1000000, max: 5000000, rate: 2.0, minFee: 30000 },
  { min: 5000000, max: Infinity, rate: 1.5, minFee: 100000 },
];

// Gastos adicionales
const ADDITIONAL_FEES = {
  registrationFee: 500, // Tasa de registro
  notificationFee: 150, // Gastos de notificación por parte
  audiencePerHour: 200, // Gastos por hora de audiencia
  emergencyFee: 1800, // Tasa fija de arbitraje de emergencia (sin IGV)
};

// Tipos de arbitraje con sus mínimos
const ARBITRATION_TYPE_MIN_FEES: Record<string, number> = {
  civil_comercial: 3000,
  contratacion_publica: 5000,
  laboral: 2500,
  consumidor: 1500,
};

interface CalculationResult {
  registrationFee: number;
  adminFee: number;
  arbitratorFee: number;
  notificationFee: number;
  emergencyFee: number;
  subtotal: number;
  igv: number;
  total: number;
  perParty: number;
  adminTierRate: number;
  adminTierMinFee: number;
  arbTierRate: number;
  arbTierMinFee: number;
}

function calculateFees(
  amount: number,
  numberOfArbitrators: number,
  arbitrationType: string,
  isEmergency: boolean,
  numberOfParties: number
): CalculationResult {
  // Encontrar tarifa administrativa
  const adminTier = ADMIN_FEE_TIERS.find(
    (tier) => amount >= tier.min && amount < tier.max
  ) || ADMIN_FEE_TIERS[ADMIN_FEE_TIERS.length - 1];

  const adminFee = Math.max(amount * (adminTier.rate / 100), adminTier.minFee);

  // Encontrar honorarios de árbitros
  const arbTier = ARBITRATOR_FEE_TIERS.find(
    (tier) => amount >= tier.min && amount < tier.max
  ) || ARBITRATOR_FEE_TIERS[ARBITRATOR_FEE_TIERS.length - 1];

  let arbitratorFee = Math.max(amount * (arbTier.rate / 100), arbTier.minFee);

  // Multiplicar por número de árbitros
  arbitratorFee = arbitratorFee * numberOfArbitrators;

  // Tasa de arbitraje de emergencia (S/ 1800 + IGV, es tasa fija)
  const emergencyFee = isEmergency ? ADDITIONAL_FEES.emergencyFee : 0;

  // Gastos fijos
  const registrationFee = ADDITIONAL_FEES.registrationFee;
  const notificationFee = ADDITIONAL_FEES.notificationFee * numberOfParties;

  // Calcular subtotal
  const subtotal = registrationFee + adminFee + arbitratorFee + notificationFee + emergencyFee;

  // IGV (18%)
  const igv = subtotal * 0.18;

  // Total
  const total = subtotal + igv;

  // Por parte (dividido entre el número de partes)
  const perParty = total / numberOfParties;

  return {
    registrationFee,
    adminFee,
    arbitratorFee,
    notificationFee,
    emergencyFee,
    subtotal,
    igv,
    total,
    perParty,
    adminTierRate: adminTier.rate,
    adminTierMinFee: adminTier.minFee,
    arbTierRate: arbTier.rate,
    arbTierMinFee: arbTier.minFee,
  };
}

export function ArbitrageCalculator() {
  const { t } = useTranslation();

  // Estado del formulario
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [arbitrationType, setArbitrationType] = useState("civil_comercial");
  const [numberOfArbitrators, setNumberOfArbitrators] = useState(1);
  const [numberOfParties, setNumberOfParties] = useState(2);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  // Tipos de arbitraje con traducciones
  const ARBITRATION_TYPES = [
    { value: "civil_comercial", label: t.calculator.civilCommercial },
    { value: "contratacion_publica", label: t.calculator.publicContracting },
    { value: "laboral", label: t.calculator.labor },
    { value: "consumidor", label: t.calculator.consumer },
  ];

  // Calcular resultado
  const result = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/,/g, "")) || 0;

    // Para cuantía indeterminada, usar mínimo del tipo de arbitraje
    const effectiveAmount = isIndeterminate
      ? ARBITRATION_TYPE_MIN_FEES[arbitrationType] || 50000
      : numAmount;

    if (effectiveAmount <= 0 && !isIndeterminate) return null;

    // Si es USD, convertir a PEN (tipo de cambio referencial)
    const amountInPEN = currency === "USD" ? effectiveAmount * 3.7 : effectiveAmount;

    return calculateFees(
      amountInPEN,
      numberOfArbitrators,
      arbitrationType,
      isEmergency,
      numberOfParties
    );
  }, [amount, currency, arbitrationType, numberOfArbitrators, numberOfParties, isEmergency, isIndeterminate]);

  // Formatear número
  const formatCurrency = (value: number, curr: string = "PEN") => {
    const symbol = curr === "USD" ? "$" : "S/";
    return `${symbol} ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Limpiar formulario
  const handleReset = () => {
    setAmount("");
    setCurrency("PEN");
    setArbitrationType("civil_comercial");
    setNumberOfArbitrators(1);
    setNumberOfParties(2);
    setIsEmergency(false);
    setIsIndeterminate(false);
  };

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-slate-200">
              <CardHeader className="bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {t.calculator.dataTitle}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {t.calculator.dataSubtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Tipo de arbitraje */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#D66829]" />
                    {t.calculator.arbitrationType}
                  </Label>
                  <Select value={arbitrationType} onValueChange={setArbitrationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARBITRATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cuantía indeterminada */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-500" />
                    <Label htmlFor="indeterminate" className="text-sm">
                      {t.calculator.indeterminateAmount}
                    </Label>
                  </div>
                  <Switch
                    id="indeterminate"
                    checked={isIndeterminate}
                    onCheckedChange={setIsIndeterminate}
                  />
                </div>

                {/* Cuantía */}
                {!isIndeterminate && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#D66829]" />
                      {t.calculator.disputeAmount}
                    </Label>
                    <div className="flex gap-2">
                      <Select value={currency} onValueChange={(v) => setCurrency(v as "PEN" | "USD")}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEN">S/</SelectItem>
                          <SelectItem value="USD">$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.,]/g, "");
                          setAmount(value);
                        }}
                        className="flex-1 text-right font-mono text-lg"
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Número de árbitros */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#D66829]" />
                    {t.calculator.numberOfArbitrators}
                  </Label>
                  <div className="flex gap-2">
                    {[1, 3].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant={numberOfArbitrators === num ? "default" : "outline"}
                        className={`flex-1 ${numberOfArbitrators === num ? "bg-[#D66829] hover:bg-[#c45a22]" : ""}`}
                        onClick={() => setNumberOfArbitrators(num)}
                      >
                        {num === 1 ? t.calculator.oneArbitrator : t.calculator.threeArbitrators}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Número de partes */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#D66829]" />
                    {t.calculator.numberOfParties}
                  </Label>
                  <Select
                    value={String(numberOfParties)}
                    onValueChange={(v) => setNumberOfParties(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">{t.calculator.twoParties}</SelectItem>
                      <SelectItem value="3">{t.calculator.threeParties}</SelectItem>
                      <SelectItem value="4">{t.calculator.fourParties}</SelectItem>
                      <SelectItem value="5">{t.calculator.fiveOrMoreParties}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Arbitraje de emergencia */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div>
                    <Label htmlFor="emergency" className="text-sm font-medium text-orange-900">
                      {t.calculator.emergencyArbitration}
                    </Label>
                    <p className="text-xs text-orange-700">Tasa adicional de S/ 1,800 + IGV</p>
                  </div>
                  <Switch
                    id="emergency"
                    checked={isEmergency}
                    onCheckedChange={setIsEmergency}
                  />
                </div>

                {/* Botón reset */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleReset}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t.calculator.clearCalculation}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-slate-200 h-full">
              <CardHeader className="bg-gradient-to-br from-[#D66829] to-[#c45a22] text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t.calculator.resultsTitle}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {t.calculator.resultsSubtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {result ? (
                  <div className="space-y-6">
                    {/* Total destacado */}
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border">
                      <p className="text-sm text-slate-600 mb-2">{t.calculator.totalEstimated}</p>
                      <p className="text-4xl md:text-5xl font-bold text-[#D66829]">
                        {formatCurrency(result.total)}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        {formatCurrency(result.perParty)} {t.calculator.perParty} ({numberOfParties} {t.calculator.parties})
                      </p>
                    </div>

                    {/* Desglose */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-900">{t.calculator.breakdown}</h3>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">{t.calculator.registrationFee}</p>
                          <p className="text-xs text-slate-500">{t.calculator.registrationFeeDesc}</p>
                        </div>
                        <p className="font-mono font-semibold text-slate-900">
                          {formatCurrency(result.registrationFee)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">{t.calculator.adminFees}</p>
                          <p className="text-xs text-slate-500">
                            {result.adminTierRate}% {t.calculator.adminFeesDesc} S/ {result.adminTierMinFee.toLocaleString()})
                          </p>
                        </div>
                        <p className="font-mono font-semibold text-slate-900">
                          {formatCurrency(result.adminFee)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">
                            {numberOfArbitrators > 1 ? t.calculator.arbitratorFeesPlural : t.calculator.arbitratorFees} ({numberOfArbitrators})
                          </p>
                          <p className="text-xs text-slate-500">
                            {result.arbTierRate}% {t.calculator.arbitratorFeesDesc} {numberOfArbitrators} {numberOfArbitrators > 1 ? t.calculator.arbitrators : t.calculator.arbitrator}
                          </p>
                        </div>
                        <p className="font-mono font-semibold text-slate-900">
                          {formatCurrency(result.arbitratorFee)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">{t.calculator.notificationFees}</p>
                          <p className="text-xs text-slate-500">
                            S/ {ADDITIONAL_FEES.notificationFee} x {numberOfParties} {t.calculator.notificationFeesDesc}
                          </p>
                        </div>
                        <p className="font-mono font-semibold text-slate-900">
                          {formatCurrency(result.notificationFee)}
                        </p>
                      </div>

                      {/* Tasa de emergencia */}
                      {result.emergencyFee > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                          <div>
                            <p className="font-medium text-orange-900">Tasa de Árbitro de Emergencia</p>
                            <p className="text-xs text-orange-700">Tasa fija por procedimiento de emergencia</p>
                          </div>
                          <p className="font-mono font-semibold text-orange-900">
                            {formatCurrency(result.emergencyFee)}
                          </p>
                        </div>
                      )}

                      <Separator className="my-4" />

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
                        <p className="font-medium text-slate-700">{t.calculator.subtotal}</p>
                        <p className="font-mono font-semibold text-slate-900">
                          {formatCurrency(result.subtotal)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
                        <p className="font-medium text-slate-700">{t.calculator.igv}</p>
                        <p className="font-mono font-semibold text-slate-900">
                          {formatCurrency(result.igv)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-[#D66829]/10 border-2 border-[#D66829]/20">
                        <p className="font-bold text-[#D66829]">{t.calculator.total}</p>
                        <p className="font-mono text-xl font-bold text-[#D66829]">
                          {formatCurrency(result.total)}
                        </p>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        {t.calculator.print}
                      </Button>
                      <Button className="flex-1 bg-[#0B2A5B] hover:bg-[#0d3a7a]">
                        <FileText className="h-4 w-4 mr-2" />
                        {t.calculator.requestArbitration}
                      </Button>
                    </div>

                    {/* Aviso */}
                    {isEmergency && (
                      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                        <p className="text-sm text-orange-800">
                          <strong>Nota:</strong> {t.calculator.emergencyNote}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Calculator className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {t.calculator.enterDataTitle}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {t.calculator.enterDataDesc}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8">
          <Accordion type="single" collapsible className="bg-white rounded-xl shadow-lg border">
            <AccordionItem value="tabla-administrativa" className="border-b">
              <AccordionTrigger className="px-6 hover:no-underline">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#D66829]" />
                  {t.calculator.adminFeesTable}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-3 font-semibold">{t.calculator.amountRange} (S/)</th>
                        <th className="text-center p-3 font-semibold">{t.calculator.percentage}</th>
                        <th className="text-right p-3 font-semibold">{t.calculator.minimum}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ADMIN_FEE_TIERS.map((tier, index) => (
                        <tr key={index} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            {tier.max === Infinity
                              ? `${t.calculator.moreThan} ${tier.min.toLocaleString()}`
                              : `${tier.min.toLocaleString()} - ${tier.max.toLocaleString()}`}
                          </td>
                          <td className="text-center p-3">{tier.rate}%</td>
                          <td className="text-right p-3 font-mono">S/ {tier.minFee.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tabla-honorarios">
              <AccordionTrigger className="px-6 hover:no-underline">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#D66829]" />
                  {t.calculator.arbitratorFeesTable}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-3 font-semibold">{t.calculator.amountRange} (S/)</th>
                        <th className="text-center p-3 font-semibold">{t.calculator.percentage}</th>
                        <th className="text-right p-3 font-semibold">{t.calculator.minimumPerArbitrator}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ARBITRATOR_FEE_TIERS.map((tier, index) => (
                        <tr key={index} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            {tier.max === Infinity
                              ? `${t.calculator.moreThan} ${tier.min.toLocaleString()}`
                              : `${tier.min.toLocaleString()} - ${tier.max.toLocaleString()}`}
                          </td>
                          <td className="text-center p-3">{tier.rate}%</td>
                          <td className="text-right p-3 font-mono">S/ {tier.minFee.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </TooltipProvider>
  );
}
