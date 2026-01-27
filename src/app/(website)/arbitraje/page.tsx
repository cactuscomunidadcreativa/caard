/**
 * CAARD - Página de Servicios de Arbitraje
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { ArbitrajeClient } from "./arbitraje-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("arbitraje");

  return {
    title: page?.metaTitle || "Servicios de Arbitraje - CAARD",
    description: page?.metaDescription || "Servicios de arbitraje comercial y de contratación pública. Resolución eficaz, confidencial y rápida de controversias.",
  };
}

export default async function ArbitrajePage() {
  const { page, hasCmsContent } = await getCmsPage("arbitraje");

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
  return <ArbitrajeClient />;
}
