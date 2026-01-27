/**
 * CAARD - Búsqueda Global (Staff)
 * Página de búsqueda de casos, partes, documentos
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  Users,
  FolderOpen,
  Loader2,
  ExternalLink,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  type: "case" | "party" | "document";
  title: string;
  subtitle: string;
  date?: string;
  status?: string;
  url: string;
}

export default function StaffBuscarPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = activeTab === "all"
    ? results
    : results.filter((r) => r.type === activeTab);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "case":
        return <FolderOpen className="h-5 w-5 text-blue-500" />;
      case "party":
        return <Users className="h-5 w-5 text-green-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "case":
        return <Badge className="bg-blue-100 text-blue-700">Caso</Badge>;
      case "party":
        return <Badge className="bg-green-100 text-green-700">Parte</Badge>;
      case "document":
        return <Badge className="bg-orange-100 text-orange-700">Documento</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const counts = {
    all: results.length,
    case: results.filter((r) => r.type === "case").length,
    party: results.filter((r) => r.type === "party").length,
    document: results.filter((r) => r.type === "document").length,
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="h-8 w-8" />
          Búsqueda Global
        </h1>
        <p className="text-muted-foreground">
          Busque casos, partes o documentos en el sistema
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por número de caso, nombre, documento..."
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resultados */}
      {searched && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              {loading
                ? "Buscando..."
                : `Se encontraron ${results.length} resultado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron resultados para "{query}"</p>
                <p className="text-sm mt-2">
                  Intente con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">
                    Todos ({counts.all})
                  </TabsTrigger>
                  <TabsTrigger value="case">
                    Casos ({counts.case})
                  </TabsTrigger>
                  <TabsTrigger value="party">
                    Partes ({counts.party})
                  </TabsTrigger>
                  <TabsTrigger value="document">
                    Documentos ({counts.document})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  <div className="space-y-3">
                    {filteredResults.map((result) => (
                      <Link key={result.id} href={result.url}>
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="p-2 bg-muted rounded-lg">
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">
                                {result.title}
                              </h4>
                              {getTypeBadge(result.type)}
                              {result.status && (
                                <Badge variant="outline">{result.status}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                            {result.date && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(result.date).toLocaleDateString("es-PE")}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Búsquedas rápidas */}
      {!searched && (
        <Card>
          <CardHeader>
            <CardTitle>Búsquedas Rápidas</CardTitle>
            <CardDescription>
              Accesos directos a información frecuente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/staff/expedientes">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <FolderOpen className="h-8 w-8 text-blue-500 mb-2" />
                  <h4 className="font-medium">Todos los Casos</h4>
                  <p className="text-sm text-muted-foreground">
                    Ver lista completa de expedientes
                  </p>
                </div>
              </Link>
              <Link href="/staff/usuarios">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <Users className="h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-medium">Usuarios</h4>
                  <p className="text-sm text-muted-foreground">
                    Buscar usuarios del sistema
                  </p>
                </div>
              </Link>
              <Link href="/staff/pagos">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 text-orange-500 mb-2" />
                  <h4 className="font-medium">Pagos</h4>
                  <p className="text-sm text-muted-foreground">
                    Gestión de pagos y facturación
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
