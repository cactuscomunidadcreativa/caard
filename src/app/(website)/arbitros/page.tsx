/**
 * CAARD - Página de Árbitros
 * Directorio público de perfiles de árbitros
 */

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  Search,
  Users,
  Award,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Directorio de Árbitros | CAARD",
  description:
    "Conoce a nuestros árbitros certificados: perfiles profesionales, especialidades y experiencia.",
};

async function getArbitrators() {
  const profiles = await prisma.arbitratorProfile.findMany({
    where: {
      isPublished: true,
    },
    orderBy: [{ isFeatured: "desc" }, { displayName: "asc" }],
    include: {
      registry: {
        select: {
          specializations: true,
          casesCompleted: true,
          status: true,
        },
      },
    },
  });

  return profiles.map((p) => ({
    id: p.id,
    slug: p.slug,
    displayName: p.displayName,
    title: p.title,
    photoUrl: p.photoUrl,
    biography: p.biography,
    yearsExperience: p.yearsExperience,
    laudosCount: p.laudosCount,
    specializations: p.registry.specializations ?? [],
    casesCompleted: p.registry.casesCompleted,
    isFeatured: p.isFeatured,
  }));
}

export default async function ArbitrosPage() {
  const arbitrators = await getArbitrators();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Users className="h-4 w-4" />
              Nuestro Equipo
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Directorio de Árbitros
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Profesionales certificados con amplia experiencia en resolución de
              controversias.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-[6vh] md:py-[8vh]">
        <div className="container mx-auto px-4">
          {arbitrators.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {arbitrators.map((arb) => (
                <Link key={arb.id} href={`/arbitros/${arb.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Photo */}
                        <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {arb.photoUrl ? (
                            <Image
                              src={arb.photoUrl}
                              alt={arb.displayName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-[#0B2A5B] to-[#D66829] flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">
                                {arb.displayName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg group-hover:text-[#0B2A5B] transition-colors">
                            {arb.displayName}
                          </h3>
                          {arb.title && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {arb.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Specializations */}
                      {arb.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {arb.specializations.slice(0, 3).map((spec) => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                          {arb.specializations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{arb.specializations.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                        {arb.yearsExperience && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-[#D66829]" />
                            <span>{arb.yearsExperience} años exp.</span>
                          </div>
                        )}
                        {arb.casesCompleted > 0 && (
                          <div className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-[#D66829]" />
                            <span>{arb.casesCompleted} casos</span>
                          </div>
                        )}
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/50 group-hover:text-[#D66829] transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No hay perfiles publicados
                </h3>
                <p className="text-muted-foreground">
                  Pronto agregaremos los perfiles de nuestros árbitros.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
