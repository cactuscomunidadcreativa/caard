/**
 * CAARD - Página de Sedes
 * CMS-first con fallback estático
 */

import { Metadata } from "next";
import Link from "next/link";
import { getCmsPage } from "@/lib/cms";
import { SectionRenderer } from "@/components/cms/section-renderer";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage("sedes");
  return {
    title: page?.metaTitle || "Sedes - CAARD",
    description: page?.metaDescription || "Encuentre la ubicación de nuestras sedes y oficinas de atención en Lima, Perú.",
  };
}

const sedes = [
  {
    id: "lima-principal",
    name: "Sede Principal - Lima",
    address: "Jr. Paramonga 311, Oficina 702",
    district: "Santiago de Surco",
    city: "Lima",
    country: "Perú",
    phone: "+51 913 755 003",
    email: "administracion@caardpe.com",
    hours: "Lun - Vie: 9:00 AM - 6:00 PM",
    isPrincipal: true,
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.994881693088!2d-77.00280508561677!3d-12.116899991418692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c7e21e1eef5b%3A0x8d59d36d8ff7eb3!2sJr.%20Paramonga%20311%2C%20Santiago%20de%20Surco%2015039!5e0!3m2!1sen!2spe!4v1706800000000!5m2!1sen!2spe",
    googleMapsLink: "https://goo.gl/maps/xxxxx",
    services: [
      "Recepción de solicitudes de arbitraje",
      "Audiencias presenciales y virtuales",
      "Atención a partes y abogados",
      "Consulta de expedientes",
      "Pagos y facturación",
    ],
  },
];

export default async function SedesPage() {
  const { page, hasCmsContent } = await getCmsPage("sedes");

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
                <Building2 className="h-4 w-4" />
                Nuestras Ubicaciones
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Sedes
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                Encuentre nuestra ubicación y visítenos para una atención personalizada.
              </p>
            </div>
          </div>
        </section>

        {/* Sedes */}
        <section className="py-[8vh] md:py-[10vh]">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {sedes.map((sede) => (
                <Card key={sede.id} className="border-0 shadow-xl overflow-hidden">
                  {/* Mapa */}
                  <div className="aspect-[21/9] relative bg-slate-100">
                    <iframe
                      src={sede.mapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0, position: "absolute", inset: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="grid md:grid-cols-2">
                    {/* Información */}
                    <CardContent className="p-8 space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-2xl font-bold text-slate-900">{sede.name}</h2>
                          {sede.isPrincipal && (
                            <Badge className="bg-[#D66829]">Principal</Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                            <MapPin className="h-5 w-5 text-[#D66829]" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">Dirección</p>
                            <p className="text-slate-600">
                              {sede.address}<br />
                              {sede.district}, {sede.city}<br />
                              {sede.country}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                            <Phone className="h-5 w-5 text-[#D66829]" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">Teléfono</p>
                            <a href={`tel:${sede.phone.replace(/\s/g, "")}`} className="text-[#D66829] hover:underline">
                              {sede.phone}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                            <Mail className="h-5 w-5 text-[#D66829]" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">Email</p>
                            <a href={`mailto:${sede.email}`} className="text-[#D66829] hover:underline">
                              {sede.email}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-[#D66829]" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">Horario</p>
                            <p className="text-slate-600">{sede.hours}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <a
                          href={sede.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="bg-[#D66829] hover:bg-[#c45a22]">
                            <Navigation className="h-4 w-4 mr-2" />
                            Cómo Llegar
                          </Button>
                        </a>
                        <Link href="/contacto">
                          <Button variant="outline">
                            Contactar
                          </Button>
                        </Link>
                      </div>
                    </CardContent>

                    {/* Servicios disponibles */}
                    <div className="p-8 bg-slate-50 border-l">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">
                        Servicios Disponibles
                      </h3>
                      <ul className="space-y-3">
                        {sede.services.map((service, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#D66829] flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">{idx + 1}</span>
                            </div>
                            <span className="text-slate-600">{service}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 p-4 bg-white rounded-xl border">
                        <h4 className="font-medium text-slate-900 mb-2">
                          Mesa de Partes Virtual
                        </h4>
                        <p className="text-sm text-slate-600 mb-3">
                          También puede presentar documentos de manera virtual a través de nuestro correo.
                        </p>
                        <a
                          href="mailto:mesadepartes@caardpe.com"
                          className="inline-flex items-center gap-2 text-sm text-[#D66829] hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          mesadepartes@caardpe.com
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-[8vh] bg-gradient-to-br from-[#D66829] to-[#c45a22]">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Necesita agendar una cita?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Contáctenos para programar una reunión presencial o virtual
                con nuestro equipo.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contacto">
                  <Button size="lg" className="bg-white text-[#D66829] hover:bg-slate-100">
                    Agendar Cita
                  </Button>
                </Link>
                <a href="tel:+51913755003">
                  <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0B2A5B]">
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar Ahora
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
