/**
 * CAARD - Cálculo público de tarifas arbitrales.
 *
 * Las tablas y fórmulas viven server-side. El cliente envía
 * los parámetros y recibe únicamente el resultado del cálculo.
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateCaardFees } from "@/lib/fees/caard-tariffs";
import type {
  Scope,
  TribunalMode,
  ProcedureType,
} from "@/lib/fees/caard-tariffs-shared";

const SCOPES: Scope[] = ["NACIONAL", "INTERNACIONAL"];
const MODES: TribunalMode[] = ["SOLE_ARBITRATOR", "TRIBUNAL_3"];
const PROCS: ProcedureType[] = ["REGULAR", "EMERGENCY"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scope = body.scope as Scope;
    const mode = body.mode as TribunalMode;
    const procedureType = (body.procedureType as ProcedureType) || "REGULAR";
    const amount = Number(body.amount);

    if (!SCOPES.includes(scope)) {
      return NextResponse.json({ error: "scope inválido" }, { status: 400 });
    }
    if (!MODES.includes(mode)) {
      return NextResponse.json({ error: "mode inválido" }, { status: 400 });
    }
    if (!PROCS.includes(procedureType)) {
      return NextResponse.json({ error: "procedureType inválido" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
      return NextResponse.json({ error: "amount inválido" }, { status: 400 });
    }

    const result = calculateCaardFees({ scope, mode, procedureType, amount });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al calcular" }, { status: 500 });
  }
}
