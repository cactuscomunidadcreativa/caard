"use client";

/**
 * CAARD - Crear Nuevo Laudo Arbitral
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Scale,
  FileText,
  DollarSign,
  Tag,
  Upload,
  Link as LinkIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

interface FormData {
  // General
  title: string;
  slug: string;
  summary: string;
  accessLevel: string;
  isPublished: boolean;
  // Document
  fullPdfUrl: string;
  pageCount: string;
  // Metadata
  year: string;
  arbitrationType: string;
  subject: string;
  claimAmountRange: string;
  result: string;
  arbitratorCount: string;
  isAnonymized: boolean;
  tags: string;
  // Price
  priceCents: string;
  currency: string;
}

export default function NewLaudoPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    summary: "",
    accessLevel: "FREE",
    isPublished: false,
    fullPdfUrl: "",
    pageCount: "",
    year: "",
    arbitrationType: "",
    subject: "",
    claimAmountRange: "",
    result: "",
    arbitratorCount: "",
    isAnonymized: true,
    tags: "",
    priceCents: "",
    currency: "PEN",
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
        accessLevel: formData.accessLevel,
        isPublished: formData.isPublished,
        isAnonymized: formData.isAnonymized,
        currency: formData.currency,
      };

      if (formData.summary.trim()) payload.summary = formData.summary.trim();
      if (formData.fullPdfUrl.trim()) payload.fullPdfUrl = formData.fullPdfUrl.trim();
      if (formData.pageCount) payload.pageCount = parseInt(formData.pageCount);
      if (formData.year) payload.year = parseInt(formData.year);
      if (formData.arbitrationType) payload.arbitrationType = formData.arbitrationType;
      if (formData.subject.trim()) payload.subject = formData.subject.trim();
      if (formData.claimAmountRange.trim()) payload.claimAmountRange = formData.claimAmountRange.trim();
      if (formData.result) payload.result = formData.result;
      if (formData.arbitratorCount) payload.arbitratorCount = parseInt(formData.arbitratorCount);

      if (formData.tags.trim()) {
        payload.tags = formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      if (formData.priceCents) {
        payload.priceCents = Math.round(parseFloat(formData.priceCents) * 100);
      }

      const response = await fetch("/api/laudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear laudo");
      }

      toast.success("Laudo creado correctamente");
      router.push("/admin/laudos");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al crear el laudo");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/laudos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-[#D66829]" />
            Nuevo Laudo
          </h1>
          <p className="text-sm text-muted-foreground">
            Sube un nuevo laudo arbitral
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="documento">Documento</TabsTrigger>
            <TabsTrigger value="metadatos">Metadatos</TabsTrigger>
            <TabsTrigger value="precio">Precio</TabsTrigger>
          </TabsList>

          {/* Tab: General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Laudo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Ej: Laudo Arbitral - Caso N\u00b0 2024-001"
                    maxLength={500}
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
                    <span className="text-sm text-muted-foreground">/laudos/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="laudo-caso-2024-001"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Resumen</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => updateField("summary", e.target.value)}
                    placeholder="Resumen del laudo arbitral..."
                    rows={5}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.summary.length}/5000 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nivel de Acceso</Label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={(v) => updateField("accessLevel", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Gratuito</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="MEMBERS">Solo Miembros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Publicar Laudo</p>
                    <p className="text-xs text-muted-foreground">Visible en la biblioteca de laudos</p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(v) => updateField("isPublished", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Documento */}
          <TabsContent value="documento" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Archivo del Laudo
                </CardTitle>
                <CardDescription>Sube o enlaza el PDF del laudo completo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullPdfUrl">URL del PDF</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullPdfUrl"
                      value={formData.fullPdfUrl}
                      onChange={(e) => updateField("fullPdfUrl", e.target.value)}
                      placeholder="https://storage.example.com/laudos/laudo-001.pdf"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL directa al archivo PDF del laudo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageCount">Número de Páginas</Label>
                  <Input
                    id="pageCount"
                    type="number"
                    value={formData.pageCount}
                    onChange={(e) => updateField("pageCount", e.target.value)}
                    placeholder="25"
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Metadatos */}
          <TabsContent value="metadatos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Información del Caso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => updateField("year", e.target.value)}
                      placeholder="2024"
                      min={1990}
                      max={2099}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Arbitraje</Label>
                    <Select
                      value={formData.arbitrationType}
                      onValueChange={(v) => updateField("arbitrationType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMERCIAL">Comercial</SelectItem>
                        <SelectItem value="INVERSION">Inversión</SelectItem>
                        <SelectItem value="CONTRATACION_PUBLICA">Contratación Pública</SelectItem>
                        <SelectItem value="CONSTRUCCION">Construcción</SelectItem>
                        <SelectItem value="LABORAL">Laboral</SelectItem>
                        <SelectItem value="CONSUMO">Consumo</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Materia</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => updateField("subject", e.target.value)}
                    placeholder="Ej: Incumplimiento contractual, Indemnización"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="claimAmountRange">Rango de Cuantía</Label>
                    <Select
                      value={formData.claimAmountRange}
                      onValueChange={(v) => updateField("claimAmountRange", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-50000">Hasta S/ 50,000</SelectItem>
                        <SelectItem value="50000-200000">S/ 50,000 - S/ 200,000</SelectItem>
                        <SelectItem value="200000-1000000">S/ 200,000 - S/ 1,000,000</SelectItem>
                        <SelectItem value="1000000+">Más de S/ 1,000,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resultado</Label>
                    <Select
                      value={formData.result}
                      onValueChange={(v) => updateField("result", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FAVORABLE_DEMANDANTE">Favorable al Demandante</SelectItem>
                        <SelectItem value="FAVORABLE_DEMANDADO">Favorable al Demandado</SelectItem>
                        <SelectItem value="PARCIAL">Parcialmente Favorable</SelectItem>
                        <SelectItem value="CONCILIACION">Conciliación</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arbitratorCount">Número de Árbitros</Label>
                  <Select
                    value={formData.arbitratorCount}
                    onValueChange={(v) => updateField("arbitratorCount", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Árbitro Único</SelectItem>
                      <SelectItem value="3">Tribunal (3 árbitros)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Anonimizado</p>
                    <p className="text-xs text-muted-foreground">
                      Datos de las partes han sido reemplazados
                    </p>
                  </div>
                  <Switch
                    checked={formData.isAnonymized}
                    onCheckedChange={(v) => updateField("isAnonymized", v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiquetas</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => updateField("tags", e.target.value)}
                    placeholder="arbitraje, comercial, indemnización (separar con comas)"
                  />
                  <p className="text-xs text-muted-foreground">Separar con comas</p>
                  {formData.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Precio */}
          <TabsContent value="precio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Precio de Compra Individual
                </CardTitle>
                <CardDescription>
                  Precio para usuarios que no son miembros (solo si el acceso es Premium)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      Precio en {formData.currency === "PEN" ? "soles" : "dólares"}. Dejar vacío si es gratuito.
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/laudos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[#D66829] hover:bg-[#c45a22]">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Laudo
          </Button>
        </div>
      </form>
    </div>
  );
}
