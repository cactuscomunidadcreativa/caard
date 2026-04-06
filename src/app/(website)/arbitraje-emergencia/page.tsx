/**
 * CAARD - Página de Arbitraje de Emergencia
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import Link from "next/link";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import {
  Zap,
  Clock,
  Shield,
  Gavel,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  FileText,
  Scale,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("arbitraje-emergencia");
  return {
    title: page?.metaTitle || "Arbitraje de Emergencia - CAARD",
    description: page?.metaDescription || "Medidas cautelares urgentes antes de la constitución del tribunal arbitral. Procedimiento rápido y eficaz.",
  };
}

const caracteristicas = [
  {
    icon: Clock,
    title: "Rapidez",
    description: "Designación del árbitro de emergencia en 24 horas.",
  },
  {
    icon: Zap,
    title: "Urgencia",
    description: "Decisión sobre medidas cautelares en plazo expedito.",
  },
  {
    icon: Shield,
    title: "Protección",
    description: "Tutela inmediata de derechos ante situaciones de urgencia.",
  },
  {
    icon: Gavel,
    title: "Ejecutabilidad",
    description: "Decisiones vinculantes y ejecutables.",
  },
];

const procedimiento = [
  {
    step: 1,
    title: "Solicitud de Emergencia",
    description: "Presentación de la solicitud con descripción de la urgencia y las medidas requeridas.",
    time: "Día 0",
  },
  {
    step: 2,
    title: "Designación del Árbitro",
    description: "CAARD designa al árbitro de emergencia de su nómina especializada.",
    time: "24 horas",
  },
  {
    step: 3,
    title: "Traslado a la Contraparte",
    description: "Notificación a la parte contraria para que presente su posición.",
    time: "Inmediato",
  },
  {
    step: 4,
    title: "Audiencia (opcional)",
    description: "El árbitro puede convocar a una audiencia virtual o presencial si lo considera necesario.",
    time: "2-3 días",
  },
  {
    step: 5,
    title: "Decisión de Emergencia",
    description: "Emisión de la orden de emergencia otorgando o denegando las medidas solicitadas.",
    time: "5-7 días",
  },
];

const medidasCautelares = [
  "Medidas de no innovar",
  "Embargo preventivo",
  "Secuestro conservativo",
  "Prohibición de celebrar actos o contratos",
  "Orden de preservación de pruebas",
  "Medidas anticipadas",
  "Otras medidas urgentes necesarias para proteger derechos",
];

export default async function ArbitrajeEmergenciaPage() {
  const { page, hasCmsContent } = await getCmsPage("arbitraje-emergencia");

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

  // Fallback: Contenido estático
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Zap className="h-4 w-4" />
              Procedimiento Urgente
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Arbitraje de Emergencia
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8">
              Medidas cautelares urgentes cuando no puede esperar a la constitución
              del tribunal arbitral.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/solicitud-arbitral">
                <Button size="lg" className="bg-[#D66829] hover:bg-[#c45a22] text-white">
                  Solicitar Emergencia
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/reglamentos">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0B2A5B]">
                  <FileText className="mr-2 h-5 w-5" />
                  Ver Reglamento
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-[6vh] bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {caracteristicas.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-3">
                  <item.icon className="h-7 w-7 text-[#D66829]" />
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Qué es? */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  ¿Qué es el Arbitraje de Emergencia?
                </h2>
                <p className="text-lg text-slate-600 mb-4">
                  Es un procedimiento especial que permite a las partes obtener medidas
                  cautelares urgentes <strong>antes</strong> de que se constituya el tribunal
                  arbitral que conocerá el fondo de la controversia.
                </p>
                <p className="text-slate-600 mb-6">
                  Un árbitro de emergencia es designado específicamente para resolver
                  sobre las medidas urgentes requeridas, garantizando una tutela
                  inmediata cuando el tiempo es un factor crítico.
                </p>
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Importante:</strong> El procedimiento de emergencia no sustituye
                    al proceso arbitral principal, sino que lo complementa para situaciones
                    de urgencia.
                  </p>
                </div>
              </div>
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-[#D66829] to-[#c45a22] text-white">
                  <CardTitle className="text-xl">Plazos del Procedimiento</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-slate-700">Designación del árbitro</span>
                      <Badge className="bg-[#D66829]">24 horas</Badge>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-slate-700">Traslado a contraparte</span>
                      <Badge variant="secondary">Inmediato</Badge>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-slate-700">Audiencia (si aplica)</span>
                      <Badge variant="secondary">2-3 días</Badge>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-700">Decisión de emergencia</span>
                      <Badge className="bg-[#0B2A5B]">5-7 días</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Procedimiento */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Procedimiento de Emergencia
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Pasos del procedimiento de arbitraje de emergencia en CAARD.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Línea de tiempo */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D66829] to-[#0B2A5B] hidden md:block" />

              <div className="space-y-6">
                {procedimiento.map((etapa, index) => (
                  <div key={etapa.step} className="relative flex gap-6 items-start">
                    {/* Número y tiempo */}
                    <div className="flex flex-col items-center shrink-0 z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{etapa.step}</span>
                      </div>
                      <span className="text-xs font-medium text-[#D66829] mt-2 bg-[#D66829]/10 px-2 py-1 rounded">
                        {etapa.time}
                      </span>
                    </div>

                    {/* Contenido */}
                    <Card className="flex-1 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {etapa.title}
                        </h3>
                        <p className="text-slate-600">{etapa.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medidas Cautelares */}
      <section className="py-[8vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Medidas Cautelares Disponibles
              </h2>
              <p className="text-slate-600">
                El árbitro de emergencia puede ordenar diversas medidas según la naturaleza
                de la urgencia.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {medidasCautelares.map((medida, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border">
                  <CheckCircle className="h-5 w-5 text-[#D66829] shrink-0 mt-0.5" />
                  <span className="text-slate-700">{medida}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Costos */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-[#D66829]" />
                  Costos del Procedimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  Los costos del arbitraje de emergencia son independientes de los gastos
                  del proceso arbitral principal y deben ser pagados al momento de presentar
                  la solicitud.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/calculadora">
                    <Button className="bg-[#D66829] hover:bg-[#c45a22]">
                      Calcular Costos
                    </Button>
                  </Link>
                  <Link href="/reglamentos">
                    <Button variant="outline">
                      Ver Tarifas en Reglamento
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[8vh] bg-gradient-to-br from-[#D66829] to-[#c45a22]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Necesita medidas urgentes?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Contáctenos inmediatamente para iniciar el procedimiento de emergencia.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/solicitud-arbitral">
                <Button size="lg" className="bg-white text-[#D66829] hover:bg-slate-100">
                  Solicitar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:+51913755003">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0B2A5B]">
                  <Phone className="mr-2 h-5 w-5" />
                  Llamar Urgente
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
