"use client";

/**
 * CAARD - Calculadora de Gastos Arbitrales (Client Component)
 * Con traducciones
 */

import Link from "next/link";
import { ArbitrageCalculator } from "@/components/public/arbitrage-calculator";
import { useTranslation } from "@/lib/i18n";

export function CalculadoraClient() {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#D66829] via-[#c45a22] to-[#0B2A5B] py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t.website.calculatorPageTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            {t.website.calculatorPageSubtitle}
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-[6vh] md:py-[8vh]">
        <div className="container mx-auto px-4">
          <ArbitrageCalculator />
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-[4vh] bg-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {t.website.importantNotes}
            </h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#D66829] mt-2 shrink-0" />
                <span>{t.website.calculatorNote1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#D66829] mt-2 shrink-0" />
                <span>{t.website.calculatorNote2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#D66829] mt-2 shrink-0" />
                <span>{t.website.calculatorNote3}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#D66829] mt-2 shrink-0" />
                <span>{t.website.calculatorNote4}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#D66829] mt-2 shrink-0" />
                <span>
                  {t.website.calculatorNote5}{" "}
                  <Link
                    href="/reglamentos"
                    className="text-[#D66829] hover:underline font-medium"
                  >
                    {t.website.feesRegulation}
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
