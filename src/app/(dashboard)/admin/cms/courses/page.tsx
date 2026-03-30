"use client";

/**
 * CAARD CMS - Listado de Cursos
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Users,
  DollarSign,
  Loader2,
  Edit,
  Trash2,
  Monitor,
  MapPin,
  GraduationCap,
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

interface Course {
  id: string;
  title: string;
  slug: string;
  modality: string;
  isPublished: boolean;
  priceCents: number | null;
  currency: string;
  isFree: boolean;
  enrollmentsCount: number;
  coverImage: string | null;
  category: string | null;
  createdAt: string;
}

const MODALITY_BADGE: Record<string, { label: string; className: string }> = {
  ONLINE: { label: "Online", className: "bg-blue-100 text-blue-700" },
  PRESENCIAL: { label: "Presencial", className: "bg-green-100 text-green-700" },
  HIBRIDO: { label: "H\u00edbrido", className: "bg-purple-100 text-purple-700" },
};

export default function CoursesListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalityFilter, setModalityFilter] = useState("ALL");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/cms/courses");
      if (!res.ok) throw new Error("Error al cargar cursos");
      const data = await res.json();
      setCourses(data.courses || data || []);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar cursos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("\u00bfEst\u00e1s seguro de eliminar este curso?")) return;
    try {
      const res = await fetch(`/api/cms/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Curso eliminado");
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar curso");
    }
  };

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && c.isPublished) ||
      (statusFilter === "DRAFT" && !c.isPublished);
    const matchesModality = modalityFilter === "ALL" || c.modality === modalityFilter;
    return matchesSearch && matchesStatus && matchesModality;
  });

  const total = courses.length;
  const published = courses.filter((c) => c.isPublished).length;
  const draft = courses.filter((c) => !c.isPublished).length;
  const enrolled = courses.reduce((sum, c) => sum + (c.enrollmentsCount || 0), 0);

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
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[#D66829]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2A5B]">Cursos</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total !== 1 ? "cursos" : "curso"} en total
            </p>
          </div>
        </div>

        <Link href="/admin/cms/courses/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Publicados</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Borrador</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Inscritos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{enrolled}</p>
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
                placeholder="Buscar cursos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PUBLISHED">Publicados</SelectItem>
                <SelectItem value="DRAFT">Borrador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                <SelectItem value="HIBRIDO">H\u00edbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Listado de Cursos</CardTitle>
          <CardDescription>Gestiona los cursos y programas de formaci\u00f3n</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {filtered.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No se encontraron cursos</p>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primer curso para empezar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>T\u00edtulo</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Inscritos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((course) => {
                  const modality = MODALITY_BADGE[course.modality] || {
                    label: course.modality,
                    className: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {course.title}
                      </TableCell>
                      <TableCell>
                        <Badge className={modality.className}>{modality.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {course.isPublished ? (
                          <Badge className="bg-green-100 text-green-700">Publicado</Badge>
                        ) : (
                          <Badge variant="secondary">Borrador</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.isFree ? (
                          <span className="text-green-600 font-medium">Gratis</span>
                        ) : course.priceCents ? (
                          <span className="font-medium">
                            {course.currency === "USD" ? "$" : "S/"}{" "}
                            {(course.priceCents / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {course.enrollmentsCount || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/cms/courses/${course.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(course.id)}
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
