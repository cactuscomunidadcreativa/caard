"use client";

/**
 * CAARD - Cursos Client Component
 * Course catalog with search and filters
 */

import { useState, useMemo } from "react";
import { Search, GraduationCap, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CourseCard, type CourseCardData } from "@/components/courses/course-card";

interface CursosClientProps {
  courses: (CourseCardData & { categoryId: string | null })[];
  categories: string[];
}

export function CursosClient({ courses, categories }: CursosClientProps) {
  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = courses;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.instructorName?.toLowerCase().includes(q)
      );
    }

    // Modality
    if (modalityFilter) {
      result = result.filter((c) => c.modality === modalityFilter);
    }

    // Price
    if (priceFilter === "free") {
      result = result.filter((c) => c.isFree);
    } else if (priceFilter === "paid") {
      result = result.filter((c) => !c.isFree);
    }

    // Category
    if (categoryFilter) {
      result = result.filter((c) => c.categoryId === categoryFilter);
    }

    return result;
  }, [courses, search, modalityFilter, priceFilter, categoryFilter]);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <GraduationCap className="h-4 w-4" />
              Formación Profesional
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Cursos y Capacitaciones
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Fortalece tus conocimientos en arbitraje con nuestros cursos
              especializados impartidos por expertos.
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
                placeholder="Buscar cursos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="space-y-4 mb-8">
            {/* Modality */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={modalityFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setModalityFilter(null)}
              >
                Todos
              </Button>
              <Button
                variant={modalityFilter === "ONLINE" ? "default" : "outline"}
                size="sm"
                onClick={() => setModalityFilter("ONLINE")}
              >
                Online
              </Button>
              <Button
                variant={modalityFilter === "PRESENCIAL" ? "default" : "outline"}
                size="sm"
                onClick={() => setModalityFilter("PRESENCIAL")}
              >
                Presencial
              </Button>
              <Button
                variant={modalityFilter === "HYBRID" ? "default" : "outline"}
                size="sm"
                onClick={() => setModalityFilter("HYBRID")}
              >
                Híbrido
              </Button>
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Precio:</span>
              <Button
                variant={priceFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceFilter(null)}
              >
                Todos
              </Button>
              <Button
                variant={priceFilter === "free" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceFilter("free")}
              >
                Gratuitos
              </Button>
              <Button
                variant={priceFilter === "paid" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceFilter("paid")}
              >
                De pago
              </Button>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Categoría:</span>
                <Button
                  variant={categoryFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(null)}
                >
                  Todas
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No se encontraron cursos
                </h3>
                <p className="text-muted-foreground">
                  {search
                    ? "Intenta con otros términos de búsqueda."
                    : "Pronto agregaremos nuevos cursos. ¡Mantente atento!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
