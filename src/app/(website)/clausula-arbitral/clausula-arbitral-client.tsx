"use client";

/**
 * CAARD - Página de Cláusula Arbitral (Client Component)
 * Con traducciones
 */

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Copy,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Scale,
  Shield,
  BookOpen,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";

export function ClausulaArbitralClient() {
  const { t } = useTranslation();
  const [copiedClause, setCopiedClause] = useState<string | null>(null);

  const clausulas = {
    estandar: {
      titulo: t.website.standardClauseTitle,
      texto: `Todas las controversias que deriven de este contrato o que guarden relación con éste, incluidas las relativas a su validez, interpretación, ejecución o resolución, serán resueltas mediante arbitraje de derecho, administrado por el Centro de Administración de Arbitrajes y Resolución de Disputas (CAARD), de conformidad con su Reglamento de Arbitraje vigente.

El tribunal arbitral estará conformado por un árbitro único/tres árbitros [elegir según corresponda], designado(s) conforme al Reglamento de CAARD.

La sede del arbitraje será la ciudad de Lima, Perú.

El idioma del arbitraje será el español.

El laudo arbitral será definitivo e inapelable, y tendrá el valor de cosa juzgada.`,
    },
    contrataciones: {
      titulo: t.website.contractingClauseTitle,
      texto: `Todas las controversias que surjan durante la ejecución del presente contrato, desde su suscripción hasta la conformidad de la última prestación, incluidas las que deriven de su resolución, se resolverán mediante arbitraje de derecho, administrado por el Centro de Administración de Arbitrajes y Resolución de Disputas (CAARD), de conformidad con su Reglamento de Arbitraje vigente y la Ley de Contrataciones del Estado y su Reglamento.

El arbitraje se desarrollará en la ciudad de Lima, Perú.

El tribunal arbitral estará conformado por tres (3) árbitros.

El laudo arbitral será definitivo e inapelable, tendrá el valor de cosa juzgada y se ejecutará como una sentencia.

Las partes renuncian expresamente al recurso de anulación, salvo los supuestos de nulidad insubsanable previstos en la Ley de Arbitraje.`,
    },
    internacional: {
      titulo: t.website.internationalClauseTitle,
      texto: `Any dispute, controversy or claim arising out of or relating to this contract, or the breach, termination or invalidity thereof, shall be settled by arbitration administered by the Centro de Administración de Arbitrajes y Resolución de Disputas (CAARD), in accordance with its Arbitration Rules in force.

The arbitral tribunal shall be composed of one/three arbitrator(s) [choose as applicable].

The seat of arbitration shall be Lima, Peru.

The language of the arbitration shall be Spanish/English [choose as applicable].

The law applicable to the merits of the dispute shall be [specify applicable law].

The arbitral award shall be final and binding upon the parties.

---

Toda controversia que derive del presente contrato o que guarde relación con éste será resuelta mediante arbitraje administrado por CAARD de conformidad con su Reglamento de Arbitraje vigente.

El tribunal arbitral estará conformado por uno/tres árbitro(s).

La sede del arbitraje será Lima, Perú.

El idioma del arbitraje será español/inglés.

La ley aplicable al fondo de la controversia será [especificar ley aplicable].

El laudo arbitral será definitivo y vinculante para las partes.`,
    },
    emergencia: {
      titulo: t.website.emergencyClauseTitle,
      texto: `Todas las controversias que deriven de este contrato serán resueltas mediante arbitraje administrado por el Centro de Administración de Arbitrajes y Resolución de Disputas (CAARD), de conformidad con su Reglamento de Arbitraje vigente.

Las partes acuerdan que el procedimiento de árbitro de emergencia previsto en el Reglamento de CAARD se aplicará a cualquier solicitud de medidas cautelares de emergencia.

El tribunal arbitral estará conformado por un árbitro único/tres árbitros.

La sede del arbitraje será Lima, Perú.

El idioma del arbitraje será el español.`,
    },
  };

  const recomendaciones = [
    t.website.rec1,
    t.website.rec2,
    t.website.rec3,
    t.website.rec4,
    t.website.rec5,
    t.website.rec6,
  ];

  const copyToClipboard = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedClause(key);
      setTimeout(() => setCopiedClause(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <FileText className="h-4 w-4" />
              {t.website.modelDocuments}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.arbitrationClauseTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.website.arbitrationClausePageSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-[6vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-lg border">
              <div className="w-12 h-12 rounded-xl bg-[#D66829]/10 flex items-center justify-center shrink-0">
                <Scale className="h-6 w-6 text-[#D66829]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {t.website.whatIsArbitrationClause}
                </h2>
                <p className="text-slate-600">
                  {t.website.arbitrationClauseExplanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clauses */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.website.clauseModels}
              </h2>
              <p className="text-lg text-slate-600">{t.website.selectModelDesc}</p>
            </div>

            <Tabs defaultValue="estandar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent">
                <TabsTrigger
                  value="estandar"
                  className="data-[state=active]:bg-[#D66829] data-[state=active]:text-white"
                >
                  {t.website.standardClause}
                </TabsTrigger>
                <TabsTrigger
                  value="contrataciones"
                  className="data-[state=active]:bg-[#D66829] data-[state=active]:text-white"
                >
                  {t.website.contractingClause}
                </TabsTrigger>
                <TabsTrigger
                  value="internacional"
                  className="data-[state=active]:bg-[#D66829] data-[state=active]:text-white"
                >
                  {t.website.internationalClause}
                </TabsTrigger>
                <TabsTrigger
                  value="emergencia"
                  className="data-[state=active]:bg-[#D66829] data-[state=active]:text-white"
                >
                  {t.website.emergencyClause}
                </TabsTrigger>
              </TabsList>

              {Object.entries(clausulas).map(([key, clausula]) => (
                <TabsContent key={key} value={key} className="mt-6">
                  <Card className="border-0 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-[#0B2A5B] to-[#0d3a7a] text-white">
                      <CardTitle>{clausula.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="bg-slate-50 rounded-lg p-6 mb-6">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                          {clausula.texto}
                        </pre>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          className="bg-[#D66829] hover:bg-[#c45a22]"
                          onClick={() => copyToClipboard(key, clausula.texto)}
                        >
                          {copiedClause === key ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              {t.website.clauseCopied}
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              {t.website.copyClauseBtn}
                            </>
                          )}
                        </Button>
                        <Button variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          {t.website.downloadPdfBtn}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {t.website.recommendations}
              </h2>
              <p className="text-slate-600">{t.website.recommendationsSubtitle}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {recomendaciones.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border"
                >
                  <CheckCircle className="h-5 w-5 text-[#D66829] shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Warning */}
      <section className="py-[6vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {t.website.importantNoteTitle}
                    </h3>
                    <p className="text-slate-600 mb-4">{t.website.clauseDisclaimer}</p>
                    <p className="text-slate-600">{t.website.clauseContactAdvice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-[6vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {t.website.relatedResources}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/reglamentos">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 text-[#D66829] mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900">
                      {t.website.regulationsResource}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2">
                      {t.website.regulationsResourceDesc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/arbitraje">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Scale className="h-8 w-8 text-[#D66829] mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900">
                      {t.website.servicesResource}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2">
                      {t.website.servicesResourceDesc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/calculadora">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-8 w-8 text-[#D66829] mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900">
                      {t.website.calculatorResource}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2">
                      {t.website.calculatorResourceDesc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[8vh] bg-gradient-to-br from-[#D66829] to-[#c45a22]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.website.needAdvice}
            </h2>
            <p className="text-lg text-white/90 mb-8">{t.website.adviceSubtitle}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contacto">
                <Button
                  size="lg"
                  className="bg-white text-[#D66829] hover:bg-slate-100"
                >
                  {t.website.contact}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/solicitud-arbitral">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  {t.website.requestArbitrationBtn}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
