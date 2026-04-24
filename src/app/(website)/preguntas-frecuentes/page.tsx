/**
 * Página pública de Preguntas Frecuentes.
 * Lee secciones ACCORDION de cualquier página del CMS (se pueden editar
 * desde /admin/cms/faqs). Agrupa todas las preguntas en una sola página.
 */
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes - CAARD",
  description:
    "Respuestas a las preguntas más comunes sobre arbitraje, procesos y servicios de CAARD.",
};

export const dynamic = "force-dynamic";

interface FaqItem {
  question?: string;
  answer?: string;
  title?: string;
  content?: string;
  category?: string;
}

async function getFaqs() {
  const sections = await prisma.cmsSection.findMany({
    where: { type: "ACCORDION", isVisible: true },
    include: {
      page: { select: { slug: true, title: true, isPublished: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Sólo secciones de páginas publicadas
  const visible = sections.filter((s) => s.page?.isPublished);
  const groups = visible.map((s) => {
    const items = ((s.content as any)?.items || []) as FaqItem[];
    return {
      id: s.id,
      title: s.title || "Preguntas Frecuentes",
      subtitle: s.subtitle,
      pageTitle: s.page.title,
      pageSlug: s.page.slug,
      items: items.map((raw) => ({
        question: raw.question || raw.title || "",
        answer: raw.answer || raw.content || "",
        category: raw.category,
      })),
    };
  });
  return groups.filter((g) => g.items.length > 0);
}

export default async function PreguntasFrecuentesPage() {
  const groups = await getFaqs();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <HelpCircle className="h-4 w-4" />
              Centro de ayuda
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Preguntas Frecuentes
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Respuestas a las dudas más comunes sobre arbitraje y nuestros
              servicios.
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-[8vh]">
        <div className="container mx-auto px-4 max-w-4xl">
          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Todavía no hay preguntas publicadas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {groups.map((g) => (
                <Card key={g.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {g.title}
                      <Badge variant="outline" className="text-xs">
                        /{g.pageSlug}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {g.items.map((f, idx) => (
                        <AccordionItem key={idx} value={`${g.id}-${idx}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{f.question || "(sin pregunta)"}</span>
                              {f.category && (
                                <Badge variant="outline" className="text-[10px]">
                                  {f.category}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {f.answer || "(sin respuesta)"}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
