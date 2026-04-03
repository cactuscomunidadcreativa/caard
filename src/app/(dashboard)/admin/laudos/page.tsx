"use client";

/**
 * CAARD - Listado de Laudos Arbitrales
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Download,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Scale,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Laudo {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  subject: string | null;
  accessLevel: string;
  downloadCount: number;
  isPublished: boolean;
  priceCents: number | null;
  currency: string;
  createdAt: string;
}

const ACCESS_BADGE: Record<string, { label: string; className: string }> = {
  FREE: { label: "Gratis", className: "bg-green-100 text-green-700" },
  PREMIUM: { label: "Premium", className: "bg-amber-100 text-amber-700" },
  MEMBERS: { label: "Miembros", className: "bg-blue-100 text-blue-700" },
};

export default function LaudosListPage() {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");

  useEffect(() => {
    fetchLaudos();
  }, []);

  const fetchLaudos = async () => {
    try {
      const res = await fetch("/api/laudos?published=false");
      if (!res.ok) throw new Error("Error al cargar laudos");
      const data = await res.json();
      setLaudos(data.items || data.laudos || []);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar laudos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este laudo?")) return;
    try {
      const res = await fetch(`/api/laudos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Laudo eliminado");
      setLaudos((prev) => prev.filter((l) => l.id !== id));
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar laudo");
    }
  };

  const years = Array.from(new Set(laudos.map((l) => l.year).filter(Boolean))).sort(
    (a, b) => (b || 0) - (a || 0)
  );
  const subjects = Array.from(new Set(laudos.map((l) => l.subject).filter(Boolean))).sort();

  const filtered = laudos.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchesAccess = accessFilter === "ALL" || l.accessLevel === accessFilter;
    const matchesYear = yearFilter === "ALL" || String(l.year) === yearFilter;
    const matchesSubject = subjectFilter === "ALL" || l.subject === subjectFilter;
    return matchesSearch && matchesAccess && matchesYear && matchesSubject;
  });

  const total = laudos.length;
  const free = laudos.filter((l) => l.accessLevel === "FREE").length;
  const premium = laudos.filter((l) => l.accessLevel === "PREMIUM" || l.accessLevel === "MEMBERS").length;
  const totalDownloads = laudos.reduce((sum, l) => sum + (l.downloadCount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2A5B]">Laudos Arbitrales</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total !== 1 ? "laudos" : "laudo"} en total
            </p>
          </div>
        </div>

        <Link href="/admin/laudos/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            Subir Laudo
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Unlock className="h-3.5 w-3.5" /> Gratuitos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{free}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{premium}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> Descargas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalDownloads}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar laudos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={accessFilter} onValueChange={setAccessFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Acceso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="FREE">Gratis</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
                <SelectItem value="MEMBERS">Miembros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subjects.length > 0 && (
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Materia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s!}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Listado de Laudos</CardTitle>
          <CardDescription>Laudos arbitrales publicados y en borrador</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {filtered.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Scale className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No se encontraron laudos</p>
              <p className="text-sm text-muted-foreground mt-1">Sube tu primer laudo para empezar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Acceso</TableHead>
                  <TableHead>Descargas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((laudo) => {
                  const access = ACCESS_BADGE[laudo.accessLevel] || {
                    label: laudo.accessLevel,
                    className: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <TableRow key={laudo.id}>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {laudo.title}
                      </TableCell>
                      <TableCell>{laudo.year || "-"}</TableCell>
                      <TableCell>{laudo.subject || "-"}</TableCell>
                      <TableCell>
                        <Badge className={access.className}>{access.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          {laudo.downloadCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {laudo.isPublished ? (
                          <Badge className="bg-green-100 text-green-700">
                            <Eye className="h-3 w-3 mr-1" /> Publicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" /> Borrador
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/laudos/${laudo.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(laudo.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
