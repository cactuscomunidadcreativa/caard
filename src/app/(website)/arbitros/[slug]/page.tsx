/**
 * CAARD - Perfil de Árbitro
 * Página de perfil público individual de un árbitro
 */

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize-html";
import {
  ArrowLeft,
  Briefcase,
  Award,
  GraduationCap,
  Globe,
  BookOpen,
  Linkedin,
  Mail,
  Scale,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EducationEntry {
  degree: string;
  institution: string;
  year?: number | string;
}

interface ExperienceEntry {
  position: string;
  organization: string;
  period?: string;
}

interface PublicationEntry {
  title: string;
  publisher?: string;
  year?: number | string;
  url?: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArbitratorProfile(slug: string) {
  const profile = await prisma.arbitratorProfile.findUnique({
    where: { slug },
    include: {
      registry: {
        select: {
          specializations: true,
          casesAssigned: true,
          casesCompleted: true,
          casesInProgress: true,
          status: true,
          approvalDate: true,
        },
      },
    },
  });

  if (!profile || !profile.isPublished) return null;
  return profile;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getArbitratorProfile(slug);
  if (!profile) return { title: "Árbitro no encontrado | CAARD" };

  return {
    title: `${profile.displayName} | Árbitros CAARD`,
    description: profile.title || `Perfil profesional de ${profile.displayName} en CAARD.`,
  };
}

export default async function ArbitratorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getArbitratorProfile(slug);

  if (!profile) notFound();

  const education = (profile.education as EducationEntry[] | null) ?? [];
  const experience = (profile.experience as ExperienceEntry[] | null) ?? [];
  const publications = (profile.publications as PublicationEntry[] | null) ?? [];
  const languages = (profile.languages as string[] | null) ?? [];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[14vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Back link */}
            <Link
              href="/arbitros"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white transition-colors mb-8 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al directorio
            </Link>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Photo */}
              <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden ring-4 ring-white/20 flex-shrink-0">
                {profile.photoUrl ? (
                  <Image
                    src={profile.photoUrl}
                    alt={profile.displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">
                      {profile.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  </div>
                )}
              </div>

              {/* Name & Title */}
              <div className="text-center md:text-left text-white">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                  {profile.displayName}
                </h1>
                {profile.title && (
                  <p className="text-lg md:text-xl text-white/80 mb-4">
                    {profile.title}
                  </p>
                )}

                {/* Quick stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  {profile.yearsExperience && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      <span>{profile.yearsExperience} años de experiencia</span>
                    </div>
                  )}
                  {profile.registry.casesCompleted > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm">
                      <Scale className="h-4 w-4" />
                      <span>{profile.registry.casesCompleted} casos resueltos</span>
                    </div>
                  )}
                  {profile.laudosCount > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm">
                      <BookOpen className="h-4 w-4" />
                      <span>{profile.laudosCount} laudos</span>
                    </div>
                  )}
                </div>

                {/* Contact links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                  {profile.linkedinUrl && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                      asChild
                    >
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-4 w-4 mr-1" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile.contactEmail && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                      asChild
                    >
                      <a href={`mailto:${profile.contactEmail}`}>
                        <Mail className="h-4 w-4 mr-1" />
                        Contactar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-[6vh] md:py-[8vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-3">
            {/* Main content (2 cols) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Biography */}
              {profile.biography && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#0B2A5B]">
                      <Award className="h-5 w-5 text-[#D66829]" />
                      Biografía
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(profile.biography) }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {education.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#0B2A5B]">
                      <GraduationCap className="h-5 w-5 text-[#D66829]" />
                      Formación Académica
                    </h2>
                    <div className="space-y-4">
                      {education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#D66829]"
                        >
                          <p className="font-medium">{edu.degree}</p>
                          <p className="text-sm text-muted-foreground">
                            {edu.institution}
                          </p>
                          {edu.year && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {edu.year}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#0B2A5B]">
                      <Briefcase className="h-5 w-5 text-[#D66829]" />
                      Experiencia Profesional
                    </h2>
                    <div className="space-y-4">
                      {experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#0B2A5B]"
                        >
                          <p className="font-medium">{exp.position}</p>
                          <p className="text-sm text-muted-foreground">
                            {exp.organization}
                          </p>
                          {exp.period && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {exp.period}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Publications */}
              {publications.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#0B2A5B]">
                      <BookOpen className="h-5 w-5 text-[#D66829]" />
                      Publicaciones
                    </h2>
                    <div className="space-y-3">
                      {publications.map((pub, idx) => (
                        <div key={idx} className="py-2 border-b last:border-0">
                          {pub.url ? (
                            <a
                              href={pub.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#0B2A5B] hover:underline"
                            >
                              {pub.title}
                            </a>
                          ) : (
                            <p className="font-medium">{pub.title}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            {pub.publisher && <span>{pub.publisher}</span>}
                            {pub.publisher && pub.year && <span>&middot;</span>}
                            {pub.year && <span>{pub.year}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Specializations */}
              {profile.registry.specializations.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-3 text-[#0B2A5B]">
                      Especialidades
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.registry.specializations.map((spec) => (
                        <Badge key={spec} className="bg-[#0B2A5B]/10 text-[#0B2A5B] border-0">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-[#0B2A5B]">
                      <Globe className="h-4 w-4 text-[#D66829]" />
                      Idiomas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Statistics */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 text-[#0B2A5B]">
                    Estadísticas
                  </h3>
                  <div className="space-y-3">
                    {profile.yearsExperience && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Años de experiencia
                        </span>
                        <span className="font-bold text-[#0B2A5B]">
                          {profile.yearsExperience}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Casos completados
                      </span>
                      <span className="font-bold text-[#0B2A5B]">
                        {profile.registry.casesCompleted}
                      </span>
                    </div>
                    {profile.laudosCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Laudos emitidos
                        </span>
                        <span className="font-bold text-[#0B2A5B]">
                          {profile.laudosCount}
                        </span>
                      </div>
                    )}
                    {profile.registry.approvalDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Registrado desde
                        </span>
                        <span className="font-bold text-[#0B2A5B]">
                          {new Date(
                            profile.registry.approvalDate
                          ).getFullYear()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-[#0B2A5B] to-[#0B2A5B]/90 text-white">
                <CardContent className="p-6 text-center">
                  <Scale className="h-10 w-10 mx-auto mb-3 text-[#D66829]" />
                  <h3 className="font-bold mb-2">
                    ¿Necesitas un árbitro?
                  </h3>
                  <p className="text-sm text-white/80 mb-4">
                    Contáctanos para solicitar la designación de un árbitro para
                    tu caso.
                  </p>
                  <Button
                    className="w-full bg-[#D66829] hover:bg-[#D66829]/90"
                    asChild
                  >
                    <Link href="/contacto">Contactar CAARD</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
