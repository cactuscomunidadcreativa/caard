"use client";

/**
 * CAARD - Contact Page Client Component
 * Maneja traducciones para la página de contacto
 */

import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Users,
  FileText,
  Send,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/public/contact-form";
import { useTranslation } from "@/lib/i18n";

export function ContactoClient() {
  const { t } = useTranslation();

  const contactInfo = [
    {
      icon: Users,
      title: t.website.generalSecretary,
      name: "Anaís Boluarte Oneto",
      email: "aboluarte@caardpe.com",
      description: "Consultas sobre procesos arbitrales y gestión de expedientes.",
    },
    {
      icon: Building2,
      title: t.sidebar.admin,
      email: "administracion@caardpe.com",
      phone: "+51 977 236 143",
      description: "Consultas administrativas, pagos y facturación.",
    },
    {
      icon: FileText,
      title: "Mesa de Partes Virtual",
      email: "mesadepartes@caardpe.com",
      description: "Para la presentación de solicitudes, escritos o comunicaciones enviar en archivo PDF.",
    },
  ];

  const officeHours = [
    { day: t.website.mondayToFriday, hours: "9:00 AM - 6:00 PM" },
    { day: "Sábados", hours: "Cerrado" },
    { day: "Domingos", hours: "Cerrado" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <MessageSquare className="h-4 w-4" />
              {t.website.contactSubtitle}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.contactTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.website.contactSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Información de Contacto */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-4">
                    <info.icon className="h-6 w-6 text-[#D66829]" />
                  </div>
                  <CardTitle className="text-xl">{info.title}</CardTitle>
                  {info.name && (
                    <CardDescription className="text-base font-medium text-slate-700">
                      {info.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">{info.description}</p>
                  {info.email && (
                    <a
                      href={`mailto:${info.email}`}
                      className="flex items-center gap-2 text-[#D66829] hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {info.email}
                    </a>
                  )}
                  {info.phone && (
                    <a
                      href={`tel:${info.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-[#D66829] hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {info.phone}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Grid de Formulario y Ubicación */}
          <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* Formulario */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#0B2A5B] to-[#0d3a7a] text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {t.website.contactFormTitle}
                </CardTitle>
                <CardDescription className="text-white/80">
                  Complete el formulario y le responderemos a la brevedad
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ContactForm />
              </CardContent>
            </Card>

            {/* Ubicación y Horarios */}
            <div className="space-y-6">
              {/* Ubicación */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#D66829]" />
                    {t.website.ourOffices}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.994881693088!2d-77.00280508561677!3d-12.116899991418692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c7e21e1eef5b%3A0x8d59d36d8ff7eb3!2sJr.%20Paramonga%20311%2C%20Santiago%20de%20Surco%2015039!5e0!3m2!1sen!2spe!4v1706800000000!5m2!1sen!2spe"
                      width="100%"
                      height="100%"
                      style={{ border: 0, position: "absolute", inset: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#D66829] shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Lima</p>
                      <p className="text-slate-600">
                        Jr. Paramonga 311, Oficina 702<br />
                        Santiago de Surco, Lima - Perú
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Horarios */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#D66829]" />
                    {t.website.schedule}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {officeHours.map((schedule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span className="font-medium text-slate-700">{schedule.day}</span>
                        <span className="text-slate-600">{schedule.hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp CTA */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">¿Prefiere WhatsApp?</h3>
                      <p className="text-white/90 text-sm mb-3">
                        Escríbanos directamente y le atenderemos al instante
                      </p>
                      <a
                        href="https://wa.me/51923646973"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-white text-green-600 hover:bg-white/90">
                          Abrir WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ rápido */}
      <section className="py-[6vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              ¿Necesita más información?
            </h2>
            <p className="text-slate-600 mb-6">
              Visite nuestras páginas de servicios para obtener información detallada sobre cada proceso.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" asChild>
                <a href="/reglamentos">{t.website.regulations}</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/calculadora">{t.website.expenseCalculator}</a>
              </Button>
              <Button className="bg-[#D66829] hover:bg-[#c45a22]" asChild>
                <a href="/solicitud-arbitral">{t.website.requestArbitration}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
