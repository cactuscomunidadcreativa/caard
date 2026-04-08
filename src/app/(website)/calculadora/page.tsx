/**
 * CAARD - Página pública Calculadora de Gastos
 * Siempre usa el engine oficial (6 tablas); el CMS no puede sobreescribirla
 * para evitar dos versiones en paralelo.
 */
import { Metadata } from "next";
import { CalculadoraClient } from "./calculadora-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calculadora de Gastos Arbitrales - CAARD",
  description:
    "Calcule honorarios del árbitro/tribunal y gastos del centro según el reglamento oficial CAARD.",
};

export default function CalculadoraPage() {
  return <CalculadoraClient />;
}
