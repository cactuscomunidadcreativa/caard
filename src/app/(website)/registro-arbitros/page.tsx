/**
 * CAARD - Página de Registro de Árbitros
 * CMS-first con fallback estático traducible
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { RegistroArbitrosClient } from "./registro-arbitros-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("registro-arbitros");
  return {
    title: page?.metaTitle || "Registro de Árbitros - CAARD",
    description: page?.metaDescription || "Información para profesionales interesados en formar parte de la nómina de árbitros de CAARD.",
  };
}

export default async function RegistroArbitrosPage() {
  const { page, hasCmsContent } = await getCmsPage("registro-arbitros");

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
  return <RegistroArbitrosClient />;
}
