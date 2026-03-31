"use client";

/**
 * CAARD - Secretaría General Client Component
 * Versión traducible con i18n
 */

import Link from "next/link";
import {
  Users,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Scale,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/use-translation";

export function SecretariaGeneralClient() {
  const { t } = useTranslation();

  const funciones = [
    {
      icon: FileText,
      titleKey: "functionFileManagement",
      descKey: "functionFileManagementDesc",
    },
    {
      icon: Users,
      titleKey: "functionPartyAttention",
      descKey: "functionPartyAttentionDesc",
    },
    {
      icon: Scale,
      titleKey: "functionArbitratorCoord",
      descKey: "functionArbitratorCoordDesc",
    },
    {
      icon: Clock,
      titleKey: "functionDeadlineControl",
      descKey: "functionDeadlineControlDesc",
    },
    {
      icon: Shield,
      titleKey: "functionDocumentCustody",
      descKey: "functionDocumentCustodyDesc",
    },
    {
      icon: Briefcase,
      titleKey: "functionAdminSupport",
      descKey: "functionAdminSupportDesc",
    },
  ];

  const servicios = [
    t.website.serviceArbitrationReception,
    t.website.serviceNotifications,
    t.website.serviceHearingOrg,
    t.website.serviceCertificates,
    t.website.serviceProcessInfo,
    t.website.servicePaymentMgmt,
    t.website.serviceAwardDelivery,
    t.website.serviceFileArchive,
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Users className="h-4 w-4" />
              {t.website.theCenter}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.secretaryPageTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.website.secretaryPageSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Información de la Secretaria */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="grid md:grid-cols-3">
                {/* Imagen placeholder */}
                <div className="bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center aspect-square md:aspect-auto">
                  <Users className="h-24 w-24 text-slate-400" />
                </div>

                {/* Información */}
                <div className="md:col-span-2 p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                      {t.website.secretaryName}
                    </h2>
                    <p className="text-[#D66829] font-semibold text-lg mb-4">
                      {t.website.secretaryPosition}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {t.website.secretaryBio}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-[#D66829]" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">{t.website.email}</p>
                        <a href="mailto:aboluarte@caardpe.com" className="text-[#D66829] hover:underline font-medium">
                          aboluarte@caardpe.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-[#D66829]" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">{t.website.phone}</p>
                        <a href="tel:+51913755003" className="text-[#D66829] hover:underline font-medium">
                          +51 913 755 003
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.secretaryFunctionsTitle}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.secretaryFunctionsSubtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {funciones.map((funcion, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center mb-4">
                    <funcion.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {(t.website as any)[funcion.titleKey]}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {(t.website as any)[funcion.descKey]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {t.website.servicesWeOffer}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {servicios.map((servicio, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border">
                  <CheckCircle className="h-5 w-5 text-[#D66829] shrink-0 mt-0.5" />
                  <span className="text-slate-700">{servicio}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mesa de Partes */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#0B2A5B] to-[#0d3a7a] text-white">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5" />
                  {t.website.filingOffice}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {t.website.filingOfficeChannels}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">{t.website.inPersonFilingOffice}</h3>
                    <p className="text-slate-600 mb-4">
                      Jr. Paramonga 311, Oficina 702<br />
                      Santiago de Surco, Lima
                    </p>
                    <p className="text-sm text-slate-500">
                      {t.website.schedule}: {t.website.mondayToFriday} 9:00 AM - 6:00 PM
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">{t.website.virtualFilingOffice}</h3>
                    <p className="text-slate-600 mb-4">
                      {t.website.sendDocumentsInPdf}
                    </p>
                    <a
                      href="mailto:mesadepartes@caardpe.com"
                      className="inline-flex items-center gap-2 text-[#D66829] hover:underline font-medium"
                    >
                      <Mail className="h-4 w-4" />
                      mesadepartes@caardpe.com
                    </a>
                  </div>
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
              {t.website.haveQuestion}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {t.website.secretaryAvailable}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contacto">
                <Button size="lg" className="bg-white text-[#D66829] hover:bg-slate-100">
                  {t.website.contactUs}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/solicitud-arbitral">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  {t.website.requestArbitrationBtn2}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
