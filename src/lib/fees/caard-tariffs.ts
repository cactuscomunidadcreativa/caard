/**
 * CAARD - Tarifas oficiales del Centro
 *
 * Fuente: Reglamento oficial CAARD (6 tablas de tarifas).
 * Todo en unidades enteras de moneda (S/. o $) — los wrappers *Cents() multiplican por 100.
 *
 * Tablas disponibles:
 *   - NACIONAL  · Tribunal Arbitral        (S/., por tramos con fórmula)
 *   - NACIONAL  · Árbitro Único            (S/., por tramos con fórmula)
 *   - NACIONAL  · Gastos del Centro        (S/., por tramos con fórmula)
 *   - NACIONAL  · Emergencia               (S/., tarifa plana por tramo)
 *   - INTERNAC. · Tribunal Arbitral        ($, por tramos con fórmula)
 *   - INTERNAC. · Porcentaje plano         (Honorarios 3.50%, Gastos 1.80%)
 */

export type Scope = "NACIONAL" | "INTERNACIONAL";
export type TribunalMode = "SOLE_ARBITRATOR" | "TRIBUNAL_3";
export type ProcedureType = "REGULAR" | "EMERGENCY";

/**
 * Un tramo de la tabla.
 * - minAmount / maxAmount delimitan el tramo (null = sin límite)
 * - baseFee: monto fijo base del tramo
 * - percent: % aplicable sobre el excedente de `over` (0 si no aplica)
 * - over: punto de partida del excedente (0 si aplica sobre el total del tramo)
 * - flat: si es true, baseFee es el resultado final (no hay % sobre excedente)
 */
export interface Bracket {
  minAmount: number;
  maxAmount: number | null;
  baseFee: number;
  percent: number;
  over: number;
  flat?: boolean;
}

/** Evalúa un monto contra una tabla de tramos y devuelve el honorario. */
export function applyBrackets(amount: number, brackets: Bracket[]): number {
  for (const b of brackets) {
    if (amount >= b.minAmount && (b.maxAmount === null || amount <= b.maxAmount)) {
      if (b.flat) return b.baseFee;
      if (b.percent === 0) return b.baseFee;
      const excess = Math.max(0, amount - b.over);
      return Math.round((b.baseFee + excess * b.percent) * 100) / 100;
    }
  }
  // Fuera de rango: devuelve el último tramo
  return applyBrackets(Infinity, brackets);
}

// =============================================================================
// NACIONAL · TRIBUNAL ARBITRAL (S/.)
// =============================================================================
export const TRIBUNAL_NACIONAL: Bracket[] = [
  { minAmount: 0,        maxAmount: 50_000,       baseFee: 7_500,    percent: 0,       over: 0 },
  { minAmount: 50_001,   maxAmount: 150_000,      baseFee: 15_600,   percent: 0,       over: 0 },
  { minAmount: 150_001,  maxAmount: 300_000,      baseFee: 15_600,   percent: 0.029,   over: 150_000 },
  { minAmount: 300_001,  maxAmount: 1_500_000,    baseFee: 19_950,   percent: 0.018,   over: 300_000 },
  { minAmount: 1_500_001,maxAmount: 3_000_000,    baseFee: 41_550,   percent: 0.0166,  over: 1_500_000 },
  { minAmount: 3_000_001,maxAmount: 5_000_000,    baseFee: 66_450,   percent: 0.013,   over: 3_000_000 },
  { minAmount: 5_000_001,maxAmount: 10_000_000,   baseFee: 92_450,   percent: 0.009,   over: 5_000_000 },
  { minAmount: 10_000_001,maxAmount: 15_000_000,  baseFee: 137_450,  percent: 0.007,   over: 10_000_000 },
  { minAmount: 15_000_001,maxAmount: 50_000_000,  baseFee: 172_450,  percent: 0.0067,  over: 15_000_000 },
  { minAmount: 50_000_001,maxAmount: null,        baseFee: 406_950,  percent: 0.006,   over: 50_000_000 },
];

// =============================================================================
// NACIONAL · ÁRBITRO ÚNICO (S/.)
// =============================================================================
export const ARBITRO_UNICO_NACIONAL: Bracket[] = [
  { minAmount: 0,        maxAmount: 50_000,       baseFee: 4_000,    percent: 0,       over: 0 },
  { minAmount: 50_001,   maxAmount: 150_000,      baseFee: 6_000,    percent: 0,       over: 0 },
  { minAmount: 150_001,  maxAmount: 300_000,      baseFee: 6_000,    percent: 0.019,   over: 150_000 },
  { minAmount: 300_001,  maxAmount: 1_500_000,    baseFee: 8_850,    percent: 0.009,   over: 300_000 },
  { minAmount: 1_500_001,maxAmount: 3_000_000,    baseFee: 19_650,   percent: 0.0065,  over: 1_500_000 },
  { minAmount: 3_000_001,maxAmount: 5_000_000,    baseFee: 29_400,   percent: 0.0045,  over: 3_000_000 },
  { minAmount: 5_000_001,maxAmount: 10_000_000,   baseFee: 38_400,   percent: 0.0035,  over: 5_000_000 },
  { minAmount: 10_000_001,maxAmount: 15_000_000,  baseFee: 55_900,   percent: 0.0026,  over: 10_000_000 },
  { minAmount: 15_000_001,maxAmount: 50_000_000,  baseFee: 68_900,   percent: 0.0024,  over: 15_000_000 },
  { minAmount: 50_000_001,maxAmount: null,        baseFee: 152_900,  percent: 0.0019,  over: 50_000_000 },
];

// =============================================================================
// NACIONAL · GASTOS DEL CENTRO (S/., sin IGV)
// =============================================================================
export const GASTOS_CENTRO_NACIONAL: Bracket[] = [
  { minAmount: 0,        maxAmount: 50_000,       baseFee: 3_800,    percent: 0,       over: 0 },
  { minAmount: 50_001,   maxAmount: 150_000,      baseFee: 5_000,    percent: 0,       over: 0 },
  { minAmount: 150_001,  maxAmount: 300_000,      baseFee: 5_000,    percent: 0.009,   over: 150_000 },
  { minAmount: 300_001,  maxAmount: 1_500_000,    baseFee: 6_350,    percent: 0.0055,  over: 300_000 },
  { minAmount: 1_500_001,maxAmount: 3_000_000,    baseFee: 12_950,   percent: 0.0052,  over: 1_500_000 },
  { minAmount: 3_000_001,maxAmount: 5_000_000,    baseFee: 20_750,   percent: 0.0032,  over: 3_000_000 },
  { minAmount: 5_000_001,maxAmount: 10_000_000,   baseFee: 27_150,   percent: 0.0025,  over: 5_000_000 },
  { minAmount: 10_000_001,maxAmount: 15_000_000,  baseFee: 39_650,   percent: 0.0022,  over: 10_000_000 },
  { minAmount: 15_000_001,maxAmount: 50_000_000,  baseFee: 50_650,   percent: 0.0021,  over: 15_000_000 },
  { minAmount: 50_000_001,maxAmount: null,        baseFee: 138_100,  percent: 0.0015,  over: 50_000_000 },
];

// =============================================================================
// NACIONAL · EMERGENCIA (S/. — tarifa plana árbitro + gastos centro iguales)
// =============================================================================
export const EMERGENCIA_NACIONAL: Bracket[] = [
  { minAmount: 0,          maxAmount: 300_000,    baseFee: 6_500,  percent: 0, over: 0, flat: true },
  { minAmount: 300_001,    maxAmount: 1_000_000,  baseFee: 9_000,  percent: 0, over: 0, flat: true },
  { minAmount: 1_000_001,  maxAmount: 3_000_000,  baseFee: 15_000, percent: 0, over: 0, flat: true },
  { minAmount: 3_000_001,  maxAmount: 5_000_000,  baseFee: 18_500, percent: 0, over: 0, flat: true },
  { minAmount: 5_000_001,  maxAmount: 10_000_000, baseFee: 22_000, percent: 0, over: 0, flat: true },
  { minAmount: 10_000_001, maxAmount: 15_000_000, baseFee: 26_000, percent: 0, over: 0, flat: true },
  { minAmount: 15_000_001, maxAmount: 20_000_000, baseFee: 32_000, percent: 0, over: 0, flat: true },
  { minAmount: 20_000_001, maxAmount: 25_000_000, baseFee: 40_000, percent: 0, over: 0, flat: true },
  { minAmount: 25_000_001, maxAmount: 30_000_000, baseFee: 48_000, percent: 0, over: 0, flat: true },
  { minAmount: 30_000_001, maxAmount: 35_000_000, baseFee: 55_000, percent: 0, over: 0, flat: true },
  { minAmount: 35_000_001, maxAmount: 40_000_000, baseFee: 62_000, percent: 0, over: 0, flat: true },
  { minAmount: 40_000_001, maxAmount: 45_000_000, baseFee: 70_000, percent: 0, over: 0, flat: true },
  { minAmount: 45_000_001, maxAmount: 50_000_000, baseFee: 75_000, percent: 0, over: 0, flat: true },
  { minAmount: 50_000_001, maxAmount: null,       baseFee: 75_000, percent: 0.001, over: 50_000_000 },
];

// =============================================================================
// INTERNACIONAL · TRIBUNAL ARBITRAL (USD)
// =============================================================================
export const TRIBUNAL_INTERNACIONAL: Bracket[] = [
  { minAmount: 0,          maxAmount: 150_000,     baseFee: 16_500,  percent: 0,       over: 0 },
  { minAmount: 150_001,    maxAmount: 300_000,     baseFee: 16_500,  percent: 0.029,   over: 150_000 },
  { minAmount: 300_001,    maxAmount: 1_500_000,   baseFee: 20_850,  percent: 0.018,   over: 300_000 },
  { minAmount: 1_500_001,  maxAmount: 3_000_000,   baseFee: 42_450,  percent: 0.0166,  over: 1_500_000 },
  { minAmount: 3_000_001,  maxAmount: 5_000_000,   baseFee: 67_350,  percent: 0.013,   over: 3_000_000 },
  { minAmount: 5_000_001,  maxAmount: 10_000_000,  baseFee: 93_350,  percent: 0.009,   over: 5_000_000 },
  { minAmount: 10_000_001, maxAmount: 15_000_000,  baseFee: 138_350, percent: 0.007,   over: 10_000_000 },
  { minAmount: 15_000_001, maxAmount: 50_000_000,  baseFee: 173_350, percent: 0.0067,  over: 15_000_000 },
  { minAmount: 50_000_001, maxAmount: null,        baseFee: 407_850, percent: 0.006,   over: 50_000_000 },
];

// =============================================================================
// INTERNACIONAL · Porcentajes planos
// =============================================================================
export const INTERNACIONAL_PERCENT = {
  tribunal:     0.035, // 3.50%
  arbitroUnico: 0.035,
  gastosCentro: 0.018, // 1.80%
} as const;

// =============================================================================
// Cálculo unificado
// =============================================================================
export interface FeeBreakdown {
  scope: Scope;
  mode: TribunalMode;
  procedureType: ProcedureType;
  disputeAmount: number;
  currency: "PEN" | "USD";
  /** Honorarios del tribunal o árbitro único */
  arbitratorFee: number;
  /** Gastos administrativos del centro */
  centerFee: number;
  /** Total */
  total: number;
  /** Desglose legible (para UI/emails) */
  description: string;
}

export interface CalcOptions {
  scope: Scope;
  mode: TribunalMode;
  procedureType?: ProcedureType;
  /** Monto en la moneda de la tabla (S/. o $) */
  amount: number;
}

/**
 * Calcula honorarios + gastos del centro para un caso CAARD según reglamento.
 * Devuelve valores en unidades enteras (NO céntimos).
 */
export function calculateCaardFees(opts: CalcOptions): FeeBreakdown {
  const { scope, mode, amount } = opts;
  const procedureType = opts.procedureType || "REGULAR";

  let arbitratorFee = 0;
  let centerFee = 0;
  let currency: "PEN" | "USD" = scope === "INTERNACIONAL" ? "USD" : "PEN";
  let description = "";

  if (procedureType === "EMERGENCY") {
    // Emergencia solo aplica a nacional por ahora (árbitro único)
    const v = applyBrackets(amount, EMERGENCIA_NACIONAL);
    arbitratorFee = v;
    centerFee = v;
    description = `Arbitraje de Emergencia (nacional). Árbitro S/. ${v.toLocaleString("es-PE")} + Gastos del Centro S/. ${v.toLocaleString("es-PE")}`;
    currency = "PEN";
  } else if (scope === "INTERNACIONAL") {
    // Internacional: 3.5% honorarios + 1.8% gastos sobre el monto del contrato
    arbitratorFee = Math.round(amount * INTERNACIONAL_PERCENT.tribunal * 100) / 100;
    centerFee = Math.round(amount * INTERNACIONAL_PERCENT.gastosCentro * 100) / 100;
    description = `Arbitraje Internacional. Honorarios 3.50% + Gastos del Centro 1.80% sobre el monto del contrato.`;
    currency = "USD";
  } else {
    // Nacional por tramos
    arbitratorFee =
      mode === "TRIBUNAL_3"
        ? applyBrackets(amount, TRIBUNAL_NACIONAL)
        : applyBrackets(amount, ARBITRO_UNICO_NACIONAL);
    centerFee = applyBrackets(amount, GASTOS_CENTRO_NACIONAL);
    description = `Arbitraje Nacional ${mode === "TRIBUNAL_3" ? "(Tribunal Arbitral 3 árbitros)" : "(Árbitro Único)"}. Honorarios + Gastos del Centro por tramos.`;
    currency = "PEN";
  }

  return {
    scope,
    mode,
    procedureType,
    disputeAmount: amount,
    currency,
    arbitratorFee,
    centerFee,
    total: Math.round((arbitratorFee + centerFee) * 100) / 100,
    description,
  };
}

/** Versión en céntimos para persistir en BD (BigInt). */
export function calculateCaardFeesCents(opts: CalcOptions) {
  const r = calculateCaardFees(opts);
  return {
    ...r,
    arbitratorFeeCents: Math.round(r.arbitratorFee * 100),
    centerFeeCents: Math.round(r.centerFee * 100),
    totalCents: Math.round(r.total * 100),
  };
}

export function formatCurrency(amount: number, currency: "PEN" | "USD" = "PEN") {
  const symbol = currency === "USD" ? "$" : "S/.";
  return `${symbol} ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
