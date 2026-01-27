/**
 * CAARD - Página de Reglamentos
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { ReglamentosClient } from "./reglamentos-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("reglamentos");
  return {
    title: page?.metaTitle || "Reglamentos - CAARD",
    description: page?.metaDescription || "Descargue los reglamentos de arbitraje, aranceles, código de ética y normativas de CAARD.",
  };
}

export default async function ReglamentosPage() {
  const { page, hasCmsContent } = await getCmsPage("reglamentos");

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
  return <ReglamentosClient />;
}
