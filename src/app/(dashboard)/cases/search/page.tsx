/**
 * Página: Búsqueda de Expedientes
 * ================================
 * Búsqueda avanzada de casos con filtros múltiples
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, FileText, Calendar, Users, DollarSign } from "lucide-react";

export default function CaseSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    stage: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filters.status) params.set("status", filters.status);
      params.set("pageSize", "50");

      const res = await fetch(`/api/cases?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      stage: "",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Búsqueda de Expedientes</h1>
        <p className="text-muted-foreground">
          Encuentra expedientes por código, partes, árbitro o criterios avanzados
        </p>
      </div>

      {/* Búsqueda Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda Rápida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por código, nombre de parte, árbitro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Avanzados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avanzados
          </CardTitle>
          <CardDescription>
            Refina tu búsqueda con criterios específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters({ ...filters, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="SUBMITTED">Presentado</SelectItem>
                  <SelectItem value="OBSERVED">Observado</SelectItem>
                  <SelectItem value="ADMITTED">Admitido</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                  <SelectItem value="IN_PROCESS">En Proceso</SelectItem>
                  <SelectItem value="AWARD_ISSUED">Laudo Emitido</SelectItem>
                  <SelectItem value="CLOSED">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Etapa Procesal</Label>
              <Select
                value={filters.stage}
                onValueChange={(v) => setFilters({ ...filters, stage: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las etapas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLICITUD">Solicitud</SelectItem>
                  <SelectItem value="ADMISION">Admisión</SelectItem>
                  <SelectItem value="DESIGNACION_ARBITRO">Designación de Árbitro</SelectItem>
                  <SelectItem value="INSTALACION">Instalación</SelectItem>
                  <SelectItem value="CONTESTACION">Contestación</SelectItem>
                  <SelectItem value="AUDIENCIAS">Audiencias</SelectItem>
                  <SelectItem value="ALEGATOS">Alegatos</SelectItem>
                  <SelectItem value="LAUDO">Laudo</SelectItem>
                  <SelectItem value="EJECUCION">Ejecución</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cuantía Mínima (S/)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.amountMin}
                onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cuantía Máxima (S/)</Label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={filters.amountMax}
                onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
            <Button onClick={handleSearch}>
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resultados
          </CardTitle>
          <CardDescription>
            {results.length} expediente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Realiza una búsqueda para ver resultados</p>
              <p className="text-sm">
                Puedes buscar por código, nombre de las partes o usar los filtros avanzados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/cases/${result.id}`}
                  className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0B2A5B]">{result.code}</div>
                      <div className="text-sm text-muted-foreground">{result.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.claimantName} vs. {result.respondentName}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge>{result.status}</Badge>
                      {result.arbitrationType && (
                        <div className="text-xs text-muted-foreground mt-1">{result.arbitrationType.name}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
