"use client";

/**
 * CAARD - Página de Reglamentos (Client Component)
 * Con traducciones
 */

import Link from "next/link";
import {
  FileText,
  Download,
  Scale,
  Book,
  Shield,
  Gavel,
  DollarSign,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

export function ReglamentosClient() {
  const { t } = useTranslation();

  const reglamentos = [
    {
      id: "arbitraje",
      title: t.website.arbitrationRegulation,
      description: t.website.arbitrationRegulationDesc,
      icon: Scale,
      downloadUrl: "/documents/reglamento-arbitraje.pdf",
      version: "2024",
      updatedAt: "Enero 2024",
      pages: 45,
      highlights: [
        t.website.fullArbitrationProcedure,
        t.website.deadlinesAndTerms,
        t.website.tribunalConstitution,
        t.website.awardIssuance,
      ],
    },
    {
      id: "aranceles",
      title: t.website.feesRegulation,
      description: t.website.feesRegulationDesc,
      icon: DollarSign,
      downloadUrl: "/documents/reglamento-aranceles.pdf",
      version: "2024",
      updatedAt: "Enero 2024",
      pages: 15,
      highlights: [
        t.website.administrativeFeesTable,
        t.payments.conceptArbitratorFee,
        t.website.paymentMethods,
        t.website.refunds,
      ],
    },
    {
      id: "interno",
      title: t.website.internalRegulation,
      description: t.website.internalRegulationDesc,
      icon: Book,
      downloadUrl: "/documents/reglamento-interno.pdf",
      version: "2023",
      updatedAt: "Diciembre 2023",
      pages: 25,
      highlights: [
        t.website.organizationalStructure,
        t.website.staffFunctions,
        t.website.internalProcedures,
        t.website.documentManagement,
      ],
    },
    {
      id: "emergencia",
      title: t.website.emergencyRegulation,
      description: t.website.emergencyRegulationDesc,
      icon: Gavel,
      downloadUrl: "/documents/reglamento-emergencia.pdf",
      version: "2024",
      updatedAt: "Febrero 2024",
      pages: 12,
      highlights: [
        t.website.precautionaryMeasures,
        t.website.expeditedDeadlines,
        t.website.arbitratorDesignation,
        t.website.simplifiedProcedure,
      ],
    },
    {
      id: "etica",
      title: t.website.ethicsCode,
      description: t.website.ethicsCodeDesc,
      icon: Shield,
      downloadUrl: "/documents/codigo-etica.pdf",
      version: "2023",
      updatedAt: "Noviembre 2023",
      pages: 18,
      highlights: [
        t.website.independenceImpartiality,
        t.website.confidentialityValue,
        t.website.conflictsOfInterest,
        t.website.disciplinarySanctions,
      ],
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <FileText className="h-4 w-4" />
              {t.website.normativeDocuments}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.regulationsPageTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.website.regulationsPageSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-[6vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-slate-600">{t.website.regulationsIntro}</p>
          </div>
        </div>
      </section>

      {/* Regulations List */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            {reglamentos.map((reglamento) => (
              <Card
                key={reglamento.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Icon */}
                  <div className="lg:w-48 bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] p-6 lg:p-8 flex items-center justify-center">
                    <reglamento.icon className="h-16 w-16 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 lg:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">
                          {reglamento.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <Badge
                            variant="secondary"
                            className="bg-[#D66829]/10 text-[#D66829]"
                          >
                            {t.website.version} {reglamento.version}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t.website.updated}: {reglamento.updatedAt}
                          </span>
                          <span>
                            {reglamento.pages} {t.website.pagesLabel}
                          </span>
                        </div>
                      </div>
                      <a href={reglamento.downloadUrl} download>
                        <Button className="bg-[#D66829] hover:bg-[#c45a22]">
                          <Download className="h-4 w-4 mr-2" />
                          {t.website.downloadPdf}
                        </Button>
                      </a>
                    </div>

                    <p className="text-slate-600 mb-4">{reglamento.description}</p>

                    {/* Highlights */}
                    <div className="grid grid-cols-2 gap-2">
                      {reglamento.highlights.map((highlight, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle className="h-4 w-4 text-[#D66829] shrink-0" />
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Note */}
      <section className="py-[6vh] bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#D66829]" />
                  {t.website.importantNote}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 space-y-4">
                <p>{t.website.regulationsDisclaimer}</p>
                <p>{t.website.regulationsContact}</p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link href="/contacto">
                    <Button variant="outline">{t.website.contactSecretary}</Button>
                  </Link>
                  <Link href="/calculadora">
                    <Button className="bg-[#D66829] hover:bg-[#c45a22]">
                      {t.website.expenseCalculator}
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
              {t.website.questionsAboutProcess}
            </h2>
            <p className="text-lg text-white/90 mb-8">{t.website.teamAvailableHelp}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/solicitud-arbitral">
                <Button
                  size="lg"
                  className="bg-white text-[#D66829] hover:bg-slate-100"
                >
                  {t.website.initiateArbitration}
                </Button>
              </Link>
              <Link href="/contacto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  {t.website.consult}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
