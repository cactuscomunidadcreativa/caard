"use client";

/**
 * CAARD - Página de Presentación (Client Component)
 * Con traducciones
 */

import Link from "next/link";
import {
  Scale,
  Target,
  Eye,
  Heart,
  Users,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

export function PresentacionClient() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Shield,
      title: t.website.transparencyValue,
      description: t.website.transparencyValueDesc,
    },
    {
      icon: Zap,
      title: t.website.efficiencyValue,
      description: t.website.efficiencyValueDesc,
    },
    {
      icon: Heart,
      title: t.website.commitmentValue,
      description: t.website.commitmentValueDesc,
    },
    {
      icon: Scale,
      title: t.website.impartialityValue,
      description: t.website.impartialityValueDesc,
    },
  ];

  const stats = [
    { value: "+500", label: t.website.casesManaged, suffix: "" },
    { value: "+50", label: t.website.registeredArbitrators, suffix: "" },
    { value: "98", label: t.website.satisfaction, suffix: "%" },
    { value: "10", label: t.website.yearsExperience, suffix: "+" },
  ];

  const team = [
    {
      name: "Oswaldo Hundskopf Exebio",
      position: t.website.councilPresident,
      description:
        "Abogado graduado en la Pontificia Universidad Católica del Perú. Magister en Derecho Administrativo y Doctor en Derecho. Con amplia experiencia en arbitraje comercial y derecho empresarial.",
      image: "/team/presidente.jpg",
    },
    {
      name: "Anaís Boluarte Oneto",
      position: t.website.generalSecretary,
      description:
        "Abogada de la Universidad de Lima, con especialización en Contrataciones con el Estado y más de 8 años de experiencia en arbitraje y gestión de procesos arbitrales.",
      image: "/team/secretaria.jpg",
    },
    {
      name: "Martín Gregorio Oré Guerrero",
      position: "Miembro del Consejo Superior",
      description:
        "Reconocido profesional con amplia trayectoria en el ámbito del arbitraje y la resolución de conflictos comerciales.",
      image: "/team/miembro1.jpg",
    },
    {
      name: "Elio Otiniano Sánchez",
      position: "Miembro del Consejo Superior",
      description:
        "Profesional destacado con experiencia en arbitraje y derecho empresarial, comprometido con la excelencia institucional.",
      image: "/team/miembro2.jpg",
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
              {t.website.aboutCaard}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.presentationTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.website.presentationSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-slate-700 leading-relaxed mb-6">
                {t.website.aboutDescription1.split("CAARD")[0]}
                <strong className="text-[#D66829]">CAARD</strong>
                {t.website.aboutDescription1.split("CAARD")[1]}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t.website.aboutDescription2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision and Values */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Mission */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#D66829] to-[#c45a22]" />
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#D66829]/10 flex items-center justify-center mb-6">
                  <Target className="h-7 w-7 text-[#D66829]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {t.website.mission}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t.website.missionText}
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#0B2A5B] to-[#0d3a7a]" />
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#0B2A5B]/10 flex items-center justify-center mb-6">
                  <Eye className="h-7 w-7 text-[#0B2A5B]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {t.website.vision}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t.website.visionText}
                </p>
              </CardContent>
            </Card>

            {/* Values */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#D66829] via-[#c45a22] to-[#0B2A5B]" />
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D66829]/10 to-[#0B2A5B]/10 flex items-center justify-center mb-6">
                  <Heart className="h-7 w-7 text-[#D66829]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {t.website.values}
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#D66829]" />
                    {t.website.transparencyValue}
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#D66829]" />
                    {t.website.efficiencyValue}
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#D66829]" />
                    {t.website.impartialityValue}
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#D66829]" />
                    {t.website.confidentialityValue}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-[8vh] bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-[#D66829]">
                  {stat.value}
                  {stat.suffix}
                </p>
                <p className="text-white/80 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.ourValues}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.principlesGuide}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow group"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-[8vh] md:py-[10vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D66829]/10 text-[#D66829] text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              {t.website.ourTeam}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.meetTeam}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.teamSubtitle}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg overflow-hidden group">
                <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
                  {/* Placeholder for image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="h-20 w-20 text-slate-400" />
                  </div>
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B2A5B]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white text-sm">{member.description}</p>
                  </div>
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="font-bold text-slate-900">{member.name}</h3>
                  <p className="text-sm text-[#D66829] font-medium">
                    {member.position}
                  </p>
                </CardContent>
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
              {t.website.readyToResolveControversy}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {t.website.startArbitrationBenefit}
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
                  className="border-white text-white hover:bg-white/10"
                >
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
