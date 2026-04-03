"use client";

/**
 * CAARD CMS - Crear Nuevo Curso
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  BookOpen,
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ImageUploader } from "@/components/cms/image-uploader";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  durationMinutes: string;
  order: number;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  modality: string;
  category: string;
  // Online content
  lessons: Lesson[];
  // Presencial content
  startDate: string;
  endDate: string;
  location: string;
  maxCapacity: string;
  // Instructor
  instructorName: string;
  instructorBio: string;
  instructorImage: string;
  // Pricing
  isFree: boolean;
  priceCents: string;
  currency: string;
  taxIGV: boolean;
  taxDetraccion: boolean;
  taxPercepcion: boolean;
  // Status
  isPublished: boolean;
}

export default function NewCoursePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    description: "",
    coverImage: "",
    modality: "ONLINE",
    category: "",
    lessons: [],
    startDate: "",
    endDate: "",
    location: "",
    maxCapacity: "",
    instructorName: "",
    instructorBio: "",
    instructorImage: "",
    isFree: false,
    priceCents: "",
    currency: "PEN",
    taxIGV: false,
    taxDetraccion: false,
    taxPercepcion: false,
    isPublished: false,
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && autoSlug) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      videoUrl: "",
      durationMinutes: "",
      order: formData.lessons.length + 1,
    };
    updateField("lessons", [...formData.lessons, newLesson]);
  };

  const updateLesson = (id: string, field: keyof Lesson, value: string | number) => {
    updateField(
      "lessons",
      formData.lessons.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const removeLesson = (id: string) => {
    updateField(
      "lessons",
      formData.lessons.filter((l) => l.id !== id)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("El slug es requerido");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        modality: formData.modality,
        isPublished: formData.isPublished,
        isFree: formData.isFree,
        currency: formData.currency,
      };

      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.coverImage) payload.coverImage = formData.coverImage;
      if (formData.category) payload.category = formData.category;

      // Online lessons
      if (formData.modality === "ONLINE" && formData.lessons.length > 0) {
        payload.lessons = formData.lessons.map((l, i) => ({
          title: l.title,
          description: l.description,
          videoUrl: l.videoUrl,
          durationMinutes: l.durationMinutes ? parseInt(l.durationMinutes) : null,
          order: i + 1,
        }));
      }

      // Presencial details
      if (formData.modality === "PRESENCIAL" || formData.modality === "HIBRIDO") {
        if (formData.startDate) payload.startDate = new Date(formData.startDate).toISOString();
        if (formData.endDate) payload.endDate = new Date(formData.endDate).toISOString();
        if (formData.location.trim()) payload.location = formData.location.trim();
        if (formData.maxCapacity) payload.maxCapacity = parseInt(formData.maxCapacity);
      }

      // Instructor
      if (formData.instructorName.trim()) payload.instructorName = formData.instructorName.trim();
      if (formData.instructorBio.trim()) payload.instructorBio = formData.instructorBio.trim();
      if (formData.instructorImage) payload.instructorImage = formData.instructorImage;

      // Pricing
      if (!formData.isFree && formData.priceCents) {
        payload.priceCents = Math.round(parseFloat(formData.priceCents) * 100);
      }

      payload.taxConfig = {
        igv: formData.taxIGV,
        detraccion: formData.taxDetraccion,
        percepcion: formData.taxPercepcion,
      };

      const response = await fetch("/api/cms/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear curso");
      }

      toast.success("Curso creado correctamente");
      router.push("/admin/cms/courses");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al crear el curso");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cms/courses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#D66829]" />
            Nuevo Curso
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea un nuevo curso o programa de formación
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contenido">Contenido</TabsTrigger>
            <TabsTrigger value="instructor">Instructor</TabsTrigger>
            <TabsTrigger value="precios">Precios</TabsTrigger>
          </TabsList>

          {/* Tab: General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Curso *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Ej: Curso de Arbitraje Comercial Internacional"
                    maxLength={300}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug">URL (Slug) *</Label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={autoSlug}
                        onChange={(e) => setAutoSlug(e.target.checked)}
                        className="rounded"
                      />
                      Auto-generar
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/cursos/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="curso-arbitraje-comercial"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Descripción del curso..."
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 caracteres
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Modalidad</Label>
                    <Select
                      value={formData.modality}
                      onValueChange={(v) => updateField("modality", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      placeholder="Ej: Arbitraje, Mediación"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imagen de Portada</CardTitle>
                <CardDescription>Imagen principal del curso</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  value={formData.coverImage}
                  onChange={(url) => updateField("coverImage", url || "")}
                  onRemove={() => updateField("coverImage", "")}
                  aspectRatio="wide"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contenido */}
          <TabsContent value="contenido" className="space-y-6">
            {formData.modality === "ONLINE" || formData.modality === "HIBRIDO" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Lecciones
                  </CardTitle>
                  <CardDescription>Organiza el contenido del curso en lecciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.lessons.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-3">No hay lecciones aún</p>
                      <Button type="button" variant="outline" onClick={addLesson}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Lección
                      </Button>
                    </div>
                  ) : (
                    <>
                      {formData.lessons.map((lesson, idx) => (
                        <Card key={lesson.id} className="border">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs">
                                  Lección {idx + 1}
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLesson(lesson.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Título</Label>
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => updateLesson(lesson.id, "title", e.target.value)}
                                  placeholder="Título de la lección"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">URL del Video</Label>
                                <Input
                                  value={lesson.videoUrl}
                                  onChange={(e) => updateLesson(lesson.id, "videoUrl", e.target.value)}
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Descripción</Label>
                                <Input
                                  value={lesson.description}
                                  onChange={(e) =>
                                    updateLesson(lesson.id, "description", e.target.value)
                                  }
                                  placeholder="Breve descripción"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Duración (min)</Label>
                                <Input
                                  type="number"
                                  value={lesson.durationMinutes}
                                  onChange={(e) =>
                                    updateLesson(lesson.id, "durationMinutes", e.target.value)
                                  }
                                  placeholder="45"
                                  min={1}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button type="button" variant="outline" onClick={addLesson} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Lección
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {formData.modality === "PRESENCIAL" || formData.modality === "HIBRIDO" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Detalles Presenciales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha de Inicio</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => updateField("startDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Fecha de Fin</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => updateField("endDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => updateField("location", e.target.value)}
                        placeholder="Av. Javier Prado 123, San Isidro, Lima"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Capacidad Máxima</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="maxCapacity"
                        type="number"
                        value={formData.maxCapacity}
                        onChange={(e) => updateField("maxCapacity", e.target.value)}
                        placeholder="50"
                        className="pl-10"
                        min={1}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* Tab: Instructor */}
          <TabsContent value="instructor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del Instructor</CardTitle>
                <CardDescription>Datos del instructor o facilitador del curso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorName">Nombre del Instructor</Label>
                  <Input
                    id="instructorName"
                    value={formData.instructorName}
                    onChange={(e) => updateField("instructorName", e.target.value)}
                    placeholder="Dr. Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructorBio">Biografía</Label>
                  <Textarea
                    id="instructorBio"
                    value={formData.instructorBio}
                    onChange={(e) => updateField("instructorBio", e.target.value)}
                    placeholder="Breve biografía profesional del instructor..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto del Instructor</Label>
                  <ImageUploader
                    value={formData.instructorImage}
                    onChange={(url) => updateField("instructorImage", url || "")}
                    onRemove={() => updateField("instructorImage", "")}
                    aspectRatio="square"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Precios */}
          <TabsContent value="precios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Configuración de Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Curso Gratuito</p>
                    <p className="text-xs text-muted-foreground">Sin costo para los participantes</p>
                  </div>
                  <Switch
                    checked={formData.isFree}
                    onCheckedChange={(v) => updateField("isFree", v)}
                  />
                </div>

                {!formData.isFree && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="priceCents">Precio</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="priceCents"
                          type="number"
                          step="0.01"
                          value={formData.priceCents}
                          onChange={(e) => updateField("priceCents", e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                          min={0}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Precio en {formData.currency === "PEN" ? "soles" : "dólares"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Moneda</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(v) => updateField("currency", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEN">Soles (PEN)</SelectItem>
                          <SelectItem value="USD">Dólares (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración Tributaria</CardTitle>
                <CardDescription>Impuestos aplicables al precio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taxIGV"
                    checked={formData.taxIGV}
                    onCheckedChange={(v) => updateField("taxIGV", v as boolean)}
                  />
                  <Label htmlFor="taxIGV" className="text-sm font-normal">
                    IGV (18%)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taxDetraccion"
                    checked={formData.taxDetraccion}
                    onCheckedChange={(v) => updateField("taxDetraccion", v as boolean)}
                  />
                  <Label htmlFor="taxDetraccion" className="text-sm font-normal">
                    Detracción
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taxPercepcion"
                    checked={formData.taxPercepcion}
                    onCheckedChange={(v) => updateField("taxPercepcion", v as boolean)}
                  />
                  <Label htmlFor="taxPercepcion" className="text-sm font-normal">
                    Percepción
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Publish */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Publicar Curso</p>
                    <p className="text-xs text-muted-foreground">Visible en el sitio web</p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(v) => updateField("isPublished", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/cms/courses">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[#D66829] hover:bg-[#c45a22]">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Curso
          </Button>
        </div>
      </form>
    </div>
  );
}
