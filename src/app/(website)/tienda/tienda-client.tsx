"use client";

/**
 * CAARD - Tienda Client Component
 * Store catalog with search, category, and type filters
 */

import { useState, useMemo } from "react";
import { Search, Store, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ProductCard,
  type ProductCardData,
} from "@/components/store/product-card";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TiendaClientProps {
  products: (ProductCardData & { categoryId: string | null })[];
  categories: Category[];
}

export function TiendaClient({ products, categories }: TiendaClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = products;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Type
    if (typeFilter) {
      result = result.filter((p) => p.type === typeFilter);
    }

    // Category
    if (categoryFilter) {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }

    return result;
  }, [products, search, typeFilter, categoryFilter]);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Store className="h-4 w-4" />
              Tienda CAARD
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Nuestra Tienda
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Productos, recursos digitales y servicios para profesionales del
              arbitraje.
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
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="space-y-4 mb-8">
            {/* Type */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={typeFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(null)}
              >
                Todos
              </Button>
              <Button
                variant={typeFilter === "DIGITAL" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("DIGITAL")}
              >
                Digital
              </Button>
              <Button
                variant={typeFilter === "PHYSICAL" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("PHYSICAL")}
              >
                Físico
              </Button>
              <Button
                variant={typeFilter === "SERVICE" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("SERVICE")}
              >
                Servicio
              </Button>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Categoría:
                </span>
                <Button
                  variant={categoryFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(null)}
                >
                  Todas
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      categoryFilter === cat.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-muted-foreground">
                  {search
                    ? "Intenta con otros términos de búsqueda."
                    : "Pronto agregaremos nuevos productos."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
