/**
 * CAARD - Página de Solicitud Arbitral
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { SolicitudArbitralClient } from "./solicitud-arbitral-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("solicitud-arbitral");
  return {
    title: page?.metaTitle || "Solicitud de Arbitraje - CAARD",
    description: page?.metaDescription || "Inicie su proceso de arbitraje completando el formulario de solicitud arbitral.",
  };
}

export default async function SolicitudArbitralPage() {
  const { page, hasCmsContent } = await getCmsPage("solicitud-arbitral");

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
  return <SolicitudArbitralClient />;
}
