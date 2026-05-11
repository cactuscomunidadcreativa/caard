/**
 * CAARD - Tipos y helpers compartidos de tarifas.
 *
 * Este archivo SÍ puede importarse desde componentes cliente.
 * Las tablas y la lógica de cálculo viven en `caard-tariffs.ts`
 * (server-only) y solo se exponen al cliente vía API.
 */

export type Scope = "NACIONAL" | "INTERNACIONAL";
export type TribunalMode = "SOLE_ARBITRATOR" | "TRIBUNAL_3";
export type ProcedureType = "REGULAR" | "EMERGENCY";

export interface FeeBreakdown {
  arbitratorFee: number;
  centerFee: number;
  total: number;
  description: string;
}

export function formatCurrency(amount: number, currency: "PEN" | "USD" = "PEN") {
  const symbol = currency === "USD" ? "$" : "S/.";
  return `${symbol} ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
