/**
 * CAARD - Página de Servicios Ad Hoc
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import Link from "next/link";
import { getCmsPage } from "@/lib/cms";
import {
  Users,
  Briefcase,
  CheckCircle,
  ArrowRight,
  Building2,
  Scale,
  FileText,
  Shield,
  Clock,
  DollarSign,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Render dinámico: depende del contenido CMS que cambia desde admin.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("servicios-ad-hoc");
  return {
    title: page?.metaTitle || "Servicios Ad Hoc - CAARD",
    description: page?.metaDescription || "Servicios de apoyo especializado para arbitrajes no administrados. Infraestructura, secretaría técnica y más.",
  };
}

const servicios = [
  {
    icon: Building2,
    title: "Infraestructura",
    description: "Salas equipadas para audiencias presenciales y virtuales.",
    features: [
      "Salas de audiencia modernas",
      "Equipos de videoconferencia",
      "Servicios de grabación",
      "Conectividad de alta velocidad",
    ],
  },
  {
    icon: Users,
    title: "Secretaría Técnica",
    description: "Apoyo administrativo para la gestión del proceso arbitral.",
    features: [
      "Gestión de notificaciones",
      "Coordinación de audiencias",
      "Custodia de expedientes",
      "Elaboración de actas",
    ],
  },
  {
    icon: Scale,
    title: "Designación de Árbitros",
    description: "Servicio de designación de árbitros para procesos ad hoc.",
    features: [
      "Acceso a nuestra nómina de árbitros",
      "Verificación de disponibilidad",
      "Comprobación de incompatibilidades",
      "Proceso transparente",
    ],
  },
  {
    icon: Shield,
    title: "Custodia de Documentos",
    description: "Resguardo seguro y confidencial de documentación arbitral.",
    features: [
      "Archivo físico y digital",
      "Acceso controlado",
      "Confidencialidad garantizada",
      "Entrega certificada",
    ],
  },
];

const ventajas = [
  {
    icon: Clock,
    title: "Flexibilidad",
    description: "Servicios a la medida de sus necesidades específicas.",
  },
  {
    icon: DollarSign,
    title: "Costos Competitivos",
    description: "Tarifas accesibles por servicios individuales.",
  },
  {
    icon: Shield,
    title: "Confidencialidad",
    description: "Máxima reserva en todos los servicios.",
  },
  {
    icon: Briefcase,
    title: "Profesionalismo",
    description: "Personal especializado en arbitraje.",
  },
];

const procesoContratacion = [
  {
    step: 1,
    title: "Solicitud",
    description: "Envíe su solicitud indicando los servicios requeridos.",
  },
  {
    step: 2,
    title: "Cotización",
    description: "Recibirá una cotización detallada según sus necesidades.",
  },
  {
    step: 3,
    title: "Confirmación",
    description: "Confirme la contratación y realice el pago correspondiente.",
  },
  {
    step: 4,
    title: "Prestación",
    description: "Disfrute de nuestros servicios profesionales.",
  },
];

export default async function ServiciosAdHocPage() {
  const { page } = await getCmsPage("servicios-ad-hoc");

  // Leer CARDS del CMS (editable desde /admin/cms/services). Si la sección
  // "Nuestros servicios" tiene cards, sobreescriben el hardcoded.
  const cmsServiciosSection = page?.sections?.find(
    (s: any) => s.type === "CARDS"
  ) as any;
  const cmsServicios = cmsServiciosSection?.content?.cards as any[] | undefined;

  // Mantenemos los otros dos arrays (ventajas, proceso) hardcodeados por
  // ahora: son contenido poco volátil. Se pueden migrar al CMS si se
  // requiere. Si el CMS provee servicios, usamos esos; sino el fallback.
  const serviciosList = cmsServicios && cmsServicios.length > 0 ? cmsServicios : servicios;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Briefcase className="h-4 w-4" />
              Servicios Especializados
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Servicios Ad Hoc
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8">
              Apoyo especializado para arbitrajes no administrados por CAARD.
              Infraestructura, secretaría técnica y más.
            </p>
            <Link href="/contacto">
              <Button size="lg" className="bg-[#D66829] hover:bg-[#c45a22] text-white">
                Solicitar Servicios
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <section className="py-[6vh] bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {ventajas.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-3">
                  <item.icon className="h-7 w-7 text-[#D66829]" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Qué son? */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                ¿Qué son los Servicios Ad Hoc?
              </h2>
              <p className="text-lg text-slate-600">
                Son servicios de apoyo que CAARD ofrece para arbitrajes que no son
                administrados por nuestro Centro, pero que requieren infraestructura,
                apoyo técnico o servicios especializados.
              </p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="prose prose-slate max-w-none">
                  <p>
                    Muchos arbitrajes se desarrollan de forma independiente (ad hoc) sin la
                    administración de una institución arbitral. Sin embargo, las partes y los
                    árbitros pueden necesitar servicios específicos como:
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li>Un lugar adecuado para realizar las audiencias</li>
                    <li>Apoyo administrativo para la gestión del proceso</li>
                    <li>Designación de árbitros cuando las partes no llegan a un acuerdo</li>
                    <li>Custodia segura de la documentación del proceso</li>
                  </ul>
                  <p className="mt-4">
                    CAARD pone a disposición su infraestructura y experiencia para brindar
                    estos servicios de manera profesional y confidencial.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Servicios especializados para apoyar su arbitraje ad hoc.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {serviciosList.map((servicio: any, index: number) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center mb-4">
                    {/* Soporta iconos de lucide como componente (fallback) o no-icon desde CMS */}
                    {typeof servicio.icon === "function" ? (
                      <servicio.icon className="h-7 w-7 text-white" />
                    ) : (
                      <Briefcase className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{servicio.title}</CardTitle>
                  <CardDescription className="text-base">
                    {servicio.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(servicio.features || []).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-[#D66829] shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="py-[8vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                ¿Cómo contratar nuestros servicios?
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              {procesoContratacion.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tarifas */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#D66829]" />
                  Tarifas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  Las tarifas de nuestros servicios ad hoc varían según el tipo de
                  servicio y la duración requerida. Contáctenos para recibir una
                  cotización personalizada.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/contacto">
                    <Button className="bg-[#D66829] hover:bg-[#c45a22]">
                      Solicitar Cotización
                    </Button>
                  </Link>
                  <Link href="/reglamentos">
                    <Button variant="outline">
                      Ver Tarifas Referenciales
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
              ¿Necesita apoyo para su arbitraje?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Contáctenos para conocer cómo podemos ayudarle con servicios
              especializados para su proceso arbitral.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contacto">
                <Button size="lg" className="bg-white text-[#D66829] hover:bg-slate-100">
                  Contactar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:+51913755003">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0B2A5B]">
                  <Phone className="mr-2 h-5 w-5" />
                  Llamar
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
