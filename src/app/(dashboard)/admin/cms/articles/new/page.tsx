"use client";

/**
 * CAARD CMS - Crear Nuevo Artículo
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Newspaper,
  Image as ImageIcon,
  Tag,
  Star,
  Eye,
  Calendar,
  X,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageUploader } from "@/components/cms/image-uploader";

// Generar slug desde título
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

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface FormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  categoryId: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    categoryId: "",
    tags: [],
    isPublished: false,
    isFeatured: false,
  });

  // Cargar categorías
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/cms/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data || []);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    }
    loadCategories();
  }, []);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generar slug
      if (field === "title" && autoSlug) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  // Agregar tag
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      updateField("tags", [...formData.tags, tag]);
      setTagInput("");
    }
  };

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    updateField("tags", formData.tags.filter((t) => t !== tagToRemove));
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

    if (!formData.content.trim()) {
      toast.error("El contenido es requerido");
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
      };

      if (formData.excerpt.trim()) {
        payload.excerpt = formData.excerpt.trim();
      }

      if (formData.coverImage) {
        payload.coverImage = formData.coverImage;
      }

      if (formData.categoryId && formData.categoryId !== "none") {
        payload.categoryId = formData.categoryId;
      }

      if (formData.tags.length > 0) {
        payload.tags = formData.tags;
      }

      const response = await fetch("/api/cms/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear artículo");
      }

      toast.success("Artículo creado correctamente");
      router.push("/admin/cms/articles");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al crear el artículo");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cms/articles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-[#D66829]" />
            Nuevo Artículo
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea un nuevo artículo o noticia para el blog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del Artículo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Ej: Nuevo Reglamento de Arbitraje 2024"
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
                    <span className="text-sm text-muted-foreground">/noticias/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="nuevo-reglamento-arbitraje-2024"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Resumen</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    placeholder="Breve resumen del artículo (aparece en listados)..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.excerpt.length}/500 caracteres
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contenido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contenido *</CardTitle>
                <CardDescription>Texto completo del artículo</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Escribe el contenido del artículo aquí...

Puedes usar Markdown para formatear:
- **negrita**
- *cursiva*
- [enlaces](url)
- ## títulos
- - listas"
                  rows={15}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Publicación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Publicar</p>
                      <p className="text-xs text-muted-foreground">Visible en el sitio</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(v) => updateField("isPublished", v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Destacado</p>
                      <p className="text-xs text-muted-foreground">Aparece en portada</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(v) => updateField("isFeatured", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Imagen de portada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Imagen de Portada
                </CardTitle>
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

            {/* Categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => updateField("categoryId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Etiquetas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Agregar etiqueta..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    +
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#D66829] hover:bg-[#c45a22]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {formData.isPublished ? "Publicar Artículo" : "Guardar Borrador"}
              </Button>
              <Button type="button" variant="outline" asChild className="w-full">
                <Link href="/admin/cms/articles">Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
