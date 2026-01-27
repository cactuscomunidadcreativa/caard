/**
 * CAARD - Página de Cláusula Arbitral
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { ClausulaArbitralClient } from "./clausula-arbitral-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("clausula-arbitral");
  return {
    title: page?.metaTitle || "Cláusula Arbitral - CAARD",
    description: page?.metaDescription || "Modelos de cláusulas arbitrales para incluir en sus contratos y someter controversias al arbitraje de CAARD.",
  };
}

export default async function ClausulaArbitralPage() {
  const { page, hasCmsContent } = await getCmsPage("clausula-arbitral");

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
  return <ClausulaArbitralClient />;
}
