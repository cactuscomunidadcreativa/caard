/**
 * CAARD - Página del Consejo Superior de Arbitraje
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import Link from "next/link";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import {
  Users,
  Award,
  Scale,
  Shield,
  CheckCircle,
  ArrowRight,
  Gavel,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("consejo-superior");
  return {
    title: page?.metaTitle || "Consejo Superior de Arbitraje - CAARD",
    description: page?.metaDescription || "Conozca a los miembros del Consejo Superior de Arbitraje de CAARD, órgano máximo de dirección del Centro.",
  };
}

const miembros = [
  {
    name: "Oswaldo Hundskopf Exebio",
    position: "Presidente del Consejo Superior",
    description: "Abogado graduado en la Pontificia Universidad Católica del Perú. Magister en Derecho Administrativo y Doctor en Derecho por la Universidad de San Martín de Porres. Con más de 40 años de experiencia profesional, es reconocido especialista en Derecho Comercial, Societario y Arbitraje. Ha sido catedrático en diversas universidades del país y autor de numerosas publicaciones jurídicas.",
    image: "/team/presidente.jpg",
  },
  {
    name: "Martín Gregorio Oré Guerrero",
    position: "Miembro del Consejo Superior",
    description: "Abogado con amplia trayectoria en el ámbito del arbitraje y la resolución de conflictos comerciales. Especialista en Derecho Empresarial y Contrataciones del Estado. Ha participado como árbitro en numerosos procesos de arbitraje nacional e internacional.",
    image: "/team/miembro1.jpg",
  },
  {
    name: "Elio Otiniano Sánchez",
    position: "Miembro del Consejo Superior",
    description: "Profesional destacado con experiencia en arbitraje y derecho empresarial. Ha desarrollado una sólida carrera en la administración de justicia arbitral, comprometido con la excelencia institucional y los más altos estándares éticos.",
    image: "/team/miembro2.jpg",
  },
];

const funciones = [
  {
    icon: Gavel,
    title: "Dirección Institucional",
    description: "Establecer las políticas y lineamientos generales del Centro de Arbitraje.",
  },
  {
    icon: Users,
    title: "Designación de Árbitros",
    description: "Resolver las designaciones de árbitros cuando las partes no lleguen a un acuerdo.",
  },
  {
    icon: Shield,
    title: "Recusaciones",
    description: "Resolver las recusaciones planteadas contra los árbitros.",
  },
  {
    icon: Scale,
    title: "Ética Arbitral",
    description: "Velar por el cumplimiento del Código de Ética institucional.",
  },
  {
    icon: BookOpen,
    title: "Normatividad",
    description: "Aprobar y modificar los reglamentos del Centro de Arbitraje.",
  },
  {
    icon: Award,
    title: "Nómina de Árbitros",
    description: "Aprobar la incorporación de árbitros a la nómina institucional.",
  },
];

export default async function ConsejoSuperiorPage() {
  const { page, hasCmsContent } = await getCmsPage("consejo-superior");

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
              <Award className="h-4 w-4" />
              El Centro
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Consejo Superior de Arbitraje
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Órgano máximo de dirección del Centro de Arbitraje, integrado por
              profesionales de reconocida trayectoria.
            </p>
          </div>
        </div>
      </section>

      {/* Miembros */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Miembros del Consejo
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Profesionales con amplia experiencia en arbitraje y resolución de conflictos.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {miembros.map((miembro, index) => (
              <Card key={index} className="border-0 shadow-xl overflow-hidden">
                <div className="grid md:grid-cols-4">
                  {/* Imagen placeholder */}
                  <div className="bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center aspect-square md:aspect-auto">
                    <Users className="h-20 w-20 text-slate-400" />
                  </div>

                  {/* Información */}
                  <div className="md:col-span-3 p-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-slate-900">
                        {miembro.name}
                      </h3>
                      {index === 0 && (
                        <span className="px-3 py-1 rounded-full bg-[#D66829] text-white text-sm font-medium">
                          Presidente
                        </span>
                      )}
                    </div>
                    <p className="text-[#D66829] font-semibold mb-4">
                      {miembro.position}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {miembro.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Funciones del Consejo Superior
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              El Consejo Superior es responsable de las principales decisiones
              institucionales y arbitrales.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {funciones.map((funcion, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] flex items-center justify-center mb-4">
                    <funcion.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{funcion.title}</h3>
                  <p className="text-sm text-slate-600">{funcion.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compromiso */}
      <section className="py-[8vh] bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Nuestro Compromiso
            </h2>
            <p className="text-xl text-white/90 leading-relaxed mb-8">
              El Consejo Superior de Arbitraje de CAARD se compromete a garantizar
              la independencia, imparcialidad y excelencia en todos los procesos
              arbitrales, velando por los más altos estándares éticos y profesionales.
            </p>
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-4xl font-bold text-[#D66829]">3</p>
                <p className="text-white/80 text-sm">Miembros</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-[#D66829]">+80</p>
                <p className="text-white/80 text-sm">Años de experiencia combinada</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-[#D66829]">100%</p>
                <p className="text-white/80 text-sm">Compromiso</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[8vh] bg-gradient-to-br from-[#D66829] to-[#c45a22]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Conozca más sobre CAARD
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Descubra cómo podemos ayudarle a resolver sus controversias de manera
              eficiente y profesional.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/presentacion">
                <Button size="lg" className="bg-white text-[#D66829] hover:bg-slate-100">
                  Ver Presentación
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0B2A5B]">
                  Contactar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
