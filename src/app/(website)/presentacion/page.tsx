/**
 * CAARD - Página de Presentación
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { PresentacionClient } from "./presentacion-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("presentacion");
  return {
    title: page?.metaTitle || "Presentación - CAARD",
    description: page?.metaDescription || "Conozca al Centro de Administración de Arbitrajes y Resolución de Disputas, institución líder en arbitraje en Perú.",
  };
}

export default async function PresentacionPage() {
  const { page, hasCmsContent } = await getCmsPage("presentacion");

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
  return <PresentacionClient />;
}
