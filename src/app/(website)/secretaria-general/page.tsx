/**
 * CAARD - Página de Secretaría General
 * CMS-first con fallback estático traducible
 */

import { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { SecretariaGeneralClient } from "./secretaria-client";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("secretaria-general");
  return {
    title: page?.metaTitle || "Secretaría General - CAARD",
    description: page?.metaDescription || "Conozca las funciones y servicios de la Secretaría General del Centro de Arbitraje CAARD.",
  };
}

export default async function SecretariaGeneralPage() {
  const { page, hasCmsContent } = await getCmsPage("secretaria-general");

  if (hasCmsContent && page) {
    return (
      <>
        {page.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </>
    );
  }

  return <SecretariaGeneralClient />;
}
