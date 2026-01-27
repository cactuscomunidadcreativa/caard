/**
 * CAARD - Página de Contacto
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { ContactoClient } from "./contacto-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("contacto");
  return {
    title: page?.metaTitle || "Contacto - CAARD",
    description: page?.metaDescription || "Contáctenos para consultas sobre arbitraje, solicitudes o información general. Estamos para servirle.",
  };
}

export default async function ContactoPage() {
  const { page, hasCmsContent } = await getCmsPage("contacto");

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
  return <ContactoClient />;
}
