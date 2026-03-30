"use client";

/**
 * CAARD - Laudos Client Component
 * Laudo library with search, year, and subject filters
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Lock,
  Unlock,
  FileText,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LaudoData {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  accessLevel: "FREE" | "PREMIUM";
  priceCents: number | null;
  currency: string;
  year: number | null;
  subject: string | null;
  arbitrationType: string | null;
  result: string | null;
  pageCount: number | null;
  categoryName: string | null;
}

interface LaudosClientProps {
  laudos: LaudoData[];
  years: number[];
  subjects: string[];
}

function formatPrice(cents: number | null, currency: string) {
  if (!cents) return null;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function LaudoCard({ laudo }: { laudo: LaudoData }) {
  const isFree = laudo.accessLevel === "FREE";
  const priceDisplay = formatPrice(laudo.priceCents, laudo.currency);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {isFree ? (
              <Badge className="bg-emerald-600 text-white border-0">
                <Unlock className="h-3 w-3 mr-1" />
                Libre
              </Badge>
            ) : (
              <Badge className="bg-[#D66829] text-white border-0">
                <Lock className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            {laudo.year && (
              <Badge variant="outline">{laudo.year}</Badge>
            )}
          </div>
          {laudo.pageCount && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {laudo.pageCount} págs.
            </span>
          )}
        </div>

        <h3 className="font-bold text-lg mb-2 line-clamp-2">{laudo.title}</h3>

        {laudo.subject && (
          <Badge variant="secondary" className="mb-2">
            {laudo.subject}
          </Badge>
        )}

        {laudo.arbitrationType && (
          <Badge variant="outline" className="mb-2 ml-1">
            {laudo.arbitrationType}
          </Badge>
        )}

        {isFree && laudo.summary && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {laudo.summary}
          </p>
        )}

        {!isFree && laudo.summary && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">
            {laudo.summary}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          {isFree ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/laudos/${laudo.slug}`}>
                Leer laudo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3 w-full">
              {priceDisplay && (
                <span className="font-bold text-[#D66829]">
                  {priceDisplay}
                </span>
              )}
              <Button
                size="sm"
                className="ml-auto bg-[#D66829] hover:bg-[#D66829]/90"
                asChild
              >
                <Link href={`/laudos/${laudo.slug}`}>
                  <Lock className="h-3.5 w-3.5 mr-1" />
                  Comprar acceso
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LaudosClient({ laudos, years, subjects }: LaudosClientProps) {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [accessFilter, setAccessFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = laudos;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.summary?.toLowerCase().includes(q) ||
          l.subject?.toLowerCase().includes(q) ||
          l.arbitrationType?.toLowerCase().includes(q)
      );
    }

    if (yearFilter) {
      result = result.filter((l) => l.year === yearFilter);
    }

    if (subjectFilter) {
      result = result.filter((l) => l.subject === subjectFilter);
    }

    if (accessFilter) {
      result = result.filter((l) => l.accessLevel === accessFilter);
    }

    return result;
  }, [laudos, search, yearFilter, subjectFilter, accessFilter]);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <BookOpen className="h-4 w-4" />
              Biblioteca Jurídica
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Biblioteca de Laudos
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Accede a nuestra colección de laudos arbitrales anonimizados para
              investigación y referencia profesional.
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="py-[6vh] md:py-[8vh]">
        <div className="container mx-auto px-4">
          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar laudos por título, materia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="space-y-4 mb-8">
            {/* Access */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={accessFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setAccessFilter(null)}
              >
                Todos
              </Button>
              <Button
                variant={accessFilter === "FREE" ? "default" : "outline"}
                size="sm"
                onClick={() => setAccessFilter("FREE")}
              >
                <Unlock className="h-3.5 w-3.5 mr-1" />
                Gratuitos
              </Button>
              <Button
                variant={accessFilter === "PREMIUM" ? "default" : "outline"}
                size="sm"
                onClick={() => setAccessFilter("PREMIUM")}
              >
                <Lock className="h-3.5 w-3.5 mr-1" />
                Premium
              </Button>
            </div>

            {/* Year */}
            {years.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Año:</span>
                <Button
                  variant={yearFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setYearFilter(null)}
                >
                  Todos
                </Button>
                {years.slice(0, 10).map((year) => (
                  <Button
                    key={year}
                    variant={yearFilter === year ? "default" : "outline"}
                    size="sm"
                    onClick={() => setYearFilter(year)}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            )}

            {/* Subject */}
            {subjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Materia:</span>
                <Button
                  variant={subjectFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSubjectFilter(null)}
                >
                  Todas
                </Button>
                {subjects.map((subj) => (
                  <Button
                    key={subj}
                    variant={subjectFilter === subj ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSubjectFilter(subj)}
                  >
                    {subj}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((laudo) => (
                <LaudoCard key={laudo.id} laudo={laudo} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No se encontraron laudos
                </h3>
                <p className="text-muted-foreground">
                  {search
                    ? "Intenta con otros términos de búsqueda."
                    : "Pronto agregaremos nuevos laudos a la biblioteca."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
