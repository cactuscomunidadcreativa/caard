"use client";

/**
 * CAARD - Home Page Client Component
 * Maneja traducciones para la página de inicio
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scale,
  Shield,
  Zap,
  Clock,
  Users,
  Calculator,
  ArrowRight,
  CheckCircle,
  Building2,
  Gavel,
  Phone,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function HomePageClient() {
  const { t } = useTranslation();

  const services = [
    {
      icon: Scale,
      title: t.website.commercialArbitration,
      description: t.website.commercialArbitrationDesc,
      href: "/arbitraje",
    },
    {
      icon: Gavel,
      title: t.website.emergencyArbitration,
      description: t.website.emergencyArbitrationDesc,
      href: "/arbitraje-emergencia",
    },
    {
      icon: Users,
      title: t.website.adHocServices,
      description: t.website.adHocServicesDesc,
      href: "/servicios-ad-hoc",
    },
    {
      icon: Building2,
      title: t.website.publicContracting,
      description: t.website.publicContractingDesc,
      href: "/arbitraje",
    },
  ];

  const features = [
    { icon: Shield, title: t.website.transparency, description: t.website.transparencyDesc },
    { icon: Zap, title: t.website.efficiency, description: t.website.efficiencyDesc },
    { icon: Clock, title: t.website.confidentiality, description: t.website.confidentialityDesc },
    { icon: CheckCircle, title: t.website.impartiality, description: t.website.impartialityDesc },
  ];

  const stats = [
    { value: "+500", label: t.website.casesManaged },
    { value: "+50", label: t.website.registeredArbitrators },
    { value: "98%", label: t.website.satisfaction },
    { value: "10+", label: t.website.yearsExperience },
  ];

  const team = [
    {
      name: "Oswaldo Hundskopf Exebio",
      position: t.website.councilPresident,
      description: "Abogado con amplia experiencia en arbitraje comercial.",
    },
    {
      name: "Anaís Boluarte Oneto",
      position: t.website.generalSecretary,
      description: "Especialista en contrataciones con el Estado.",
    },
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[12vh] md:py-[15vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Scale className="h-4 w-4" />
              {t.website.heroTitle}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {t.website.homeHeroSubtitle}{" "}
              <span className="text-[#D66829]">{t.website.homeHeroHighlight}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
              {t.website.homeHeroDescription}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/solicitud-arbitral">
                <Button size="lg" className="bg-[#D66829] hover:bg-[#c45a22] text-white">
                  {t.website.requestArbitration}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/calculadora">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Calculator className="mr-2 h-5 w-5" />
                  {t.website.calculateExpenses}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-[6vh] bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-3">
                  <feature.icon className="h-7 w-7 text-[#D66829]" />
                </div>
                <h3 className="font-bold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-[8vh] md:py-[10vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D66829]/10 text-[#D66829] text-sm font-medium mb-4">
              <Scale className="h-4 w-4" />
              {t.website.ourServices}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.solutionsForDisputes}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.servicesDescription}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <Link key={index} href={service.href}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <service.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#D66829] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-slate-600">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-[8vh] bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-[#D66829]">{stat.value}</p>
                <p className="text-white/80 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B2A5B]/10 text-[#0B2A5B] text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              {t.website.ourTeam}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.meetTheTeam}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-40 aspect-square bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                    <Users className="h-16 w-16 text-slate-400" />
                  </div>
                  <CardContent className="p-6 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                    <p className="text-[#D66829] font-medium mb-2">{member.position}</p>
                    <p className="text-slate-600 text-sm">{member.description}</p>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/consejo-superior">
              <Button variant="outline">
                {t.website.viewFullTeam}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-[8vh] bg-gradient-to-br from-[#D66829] to-[#c45a22]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.website.readyToResolveDispute}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {t.website.startArbitrationToday}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/solicitud-arbitral">
                <Button size="lg" className="bg-white text-[#D66829] hover:bg-slate-100">
                  {t.website.requestArbitration}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Phone className="mr-2 h-5 w-5" />
                  {t.website.contactUs}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
