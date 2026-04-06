"use client";

/**
 * CAARD - Página de Servicios de Arbitraje (Client Component)
 * Con traducciones
 */

import Link from "next/link";
import {
  Scale,
  Shield,
  Clock,
  Zap,
  CheckCircle,
  ArrowRight,
  FileText,
  Users,
  Gavel,
  Building2,
  Calculator,
  Phone,
  BookOpen,
  Target,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

export function ArbitrajeClient() {
  const { t } = useTranslation();

  const tiposArbitraje = [
    {
      id: "comercial",
      title: t.website.nationalCommercialArbitration,
      description: t.website.nationalCommercialArbitrationDesc,
      features: [
        t.website.determinedUndeterminedAmount,
        t.website.confidentialEfficient,
        t.website.commercialLawSpecialists,
        t.website.reducedDeadlines,
      ],
      icon: Scale,
    },
    {
      id: "internacional",
      title: t.website.internationalCommercialArbitration,
      description: t.website.internationalCommercialArbitrationDesc,
      features: [
        t.website.internationalRegulationsApply,
        t.website.internationalExperienceArbitrators,
        t.website.procedureLanguageFlexibility,
        t.website.newYorkConventionCompatibility,
      ],
      icon: Building2,
    },
    {
      id: "contrataciones",
      title: t.website.stateContractingArbitration,
      description: t.website.stateContractingArbitrationDesc,
      features: [
        t.website.stateContractingLawCompliance,
        t.website.osceRegisteredArbitrators,
        t.website.publicContractsExperience,
        t.website.specializedProcedures,
      ],
      icon: Gavel,
    },
  ];

  const procesoArbitral = [
    {
      step: 1,
      title: t.website.step1Title,
      description: t.website.step1Desc,
    },
    {
      step: 2,
      title: t.website.step2Title,
      description: t.website.step2Desc,
    },
    {
      step: 3,
      title: t.website.step3Title,
      description: t.website.step3Desc,
    },
    {
      step: 4,
      title: t.website.step4Title,
      description: t.website.step4Desc,
    },
    {
      step: 5,
      title: t.website.step5Title,
      description: t.website.step5Desc,
    },
  ];

  const ventajas = [
    {
      icon: Clock,
      title: t.website.speed,
      description: t.website.speedDesc,
    },
    {
      icon: Shield,
      title: t.website.confidentialityTitle,
      description: t.website.confidentialityFullDesc,
    },
    {
      icon: Zap,
      title: t.website.specialization,
      description: t.website.specializationDesc,
    },
    {
      icon: Target,
      title: t.website.flexibility,
      description: t.website.flexibilityDesc,
    },
    {
      icon: Award,
      title: t.website.enforceability,
      description: t.website.enforceabilityDesc,
    },
    {
      icon: Users,
      title: t.website.impartialityFull,
      description: t.website.impartialityFullDesc,
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
              <Scale className="h-4 w-4" />
              {t.website.arbitrationServices}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.commercialAndStateArbitration}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8">
              {t.website.arbitrationPageSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/solicitud-arbitral">
                <Button
                  size="lg"
                  className="bg-[#D66829] hover:bg-[#c45a22] text-white"
                >
                  {t.website.requestArbitrationBtn}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/calculadora">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0B2A5B]"
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  {t.website.calculateCosts}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-[6vh] bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {ventajas.map((ventaja, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-3">
                  <ventaja.icon className="h-7 w-7 text-[#D66829]" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{ventaja.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{ventaja.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arbitration Types */}
      <section className="py-[8vh] md:py-[10vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D66829]/10 text-[#D66829] text-sm font-medium mb-4">
              <Gavel className="h-4 w-4" />
              {t.website.arbitrationTypes}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.specializedServices}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.differentModalitiesDesc}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {tiposArbitraje.map((tipo) => (
              <Card
                key={tipo.id}
                className="border-0 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center mb-4">
                    <tipo.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{tipo.title}</CardTitle>
                  <CardDescription className="text-base">
                    {tipo.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tipo.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
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

      {/* Arbitration Process */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B2A5B]/10 text-[#0B2A5B] text-sm font-medium mb-4">
              <FileText className="h-4 w-4" />
              {t.website.theProcess}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.howArbitrationWorks}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.mainStagesDesc}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D66829] to-[#0B2A5B] hidden md:block" />

              <div className="space-y-6">
                {procesoArbitral.map((etapa) => (
                  <div
                    key={etapa.step}
                    className="relative flex gap-6 items-start"
                  >
                    {/* Step number */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center shrink-0 z-10">
                      <span className="text-2xl font-bold text-white">
                        {etapa.step}
                      </span>
                    </div>

                    {/* Content */}
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

      {/* Resources */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                {t.website.usefulResources}
              </h2>
              <p className="text-slate-600">{t.website.resourcesDesc}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/reglamentos">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-4 group-hover:bg-[#D66829] transition-colors">
                      <BookOpen className="h-6 w-6 text-[#D66829] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">
                      {t.website.regulationsResource}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {t.website.regulationsResourceDesc}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/calculadora">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-4 group-hover:bg-[#D66829] transition-colors">
                      <Calculator className="h-6 w-6 text-[#D66829] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">
                      {t.website.calculatorResource}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {t.website.calculatorResourceDesc}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/clausula-arbitral">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-4 group-hover:bg-[#D66829] transition-colors">
                      <FileText className="h-6 w-6 text-[#D66829] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">
                      {t.website.arbitrationClauseResource}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {t.website.arbitrationClauseResourceDesc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section className="py-[8vh]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {t.website.otherArbitrationServices}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Link href="/arbitraje-emergencia">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all group cursor-pointer h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Gavel className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-[#D66829] transition-colors">
                      {t.website.emergencyArbitrationService}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {t.website.emergencyArbitrationServiceDesc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/servicios-ad-hoc">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all group cursor-pointer h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-[#D66829] transition-colors">
                      {t.website.adHocServicesTitle}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {t.website.adHocServicesFullDesc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-[8vh] bg-gradient-to-br from-[#D66829] to-[#c45a22]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.website.readyToStartArbitration}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {t.website.teamAvailableToHelp}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/solicitud-arbitral">
                <Button
                  size="lg"
                  className="bg-white text-[#D66829] hover:bg-slate-100"
                >
                  {t.website.requestArbitrationBtn}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#0B2A5B]"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  {t.website.contact}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
