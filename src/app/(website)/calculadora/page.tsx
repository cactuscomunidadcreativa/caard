/**
 * CAARD - Calculadora de Gastos Arbitrales
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { CalculadoraClient } from "./calculadora-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("calculadora");
  return {
    title: page?.metaTitle || "Calculadora de Gastos Arbitrales - CAARD",
    description: page?.metaDescription || "Calcule los gastos administrativos y honorarios de árbitros para su proceso de arbitraje en CAARD.",
    keywords: ["calculadora arbitraje", "gastos arbitrales", "honorarios árbitros", "costos arbitraje Perú"],
  };
}

export default async function CalculadoraPage() {
  const { page, hasCmsContent } = await getCmsPage("calculadora");

  // Si hay contenido CMS, renderizarlo
  if (hasCmsContent && page) {
    return (
      <>
        {page.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </>
    );
  }

  // Fallback: Contenido estático con traducciones
  return <CalculadoraClient />;
}
