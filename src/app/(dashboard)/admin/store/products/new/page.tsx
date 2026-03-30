"use client";

/**
 * CAARD - Crear Nuevo Producto
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  ShoppingBag,
  DollarSign,
  Package,
  FileDigit,
  Wrench,
  Link as LinkIcon,
  Weight,
  Clock,
  Truck,
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

interface FormData {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  type: string;
  // Digital
  digitalFileUrl: string;
  digitalFileType: string;
  // Physical
  stock: string;
  weight: string;
  requiresShipping: boolean;
  // Service
  serviceDurationMinutes: string;
  serviceBookingUrl: string;
  // Pricing
  priceCents: string;
  comparePriceCents: string;
  currency: string;
  taxIGV: boolean;
  taxDetraccion: boolean;
  taxPercepcion: boolean;
  // Status
  isPublished: boolean;
}

const PRODUCT_TYPES = [
  { value: "DIGITAL", label: "Digital", icon: FileDigit, color: "bg-blue-100 text-blue-700" },
  { value: "PHYSICAL", label: "F\u00edsico", icon: Package, color: "bg-green-100 text-green-700" },
  { value: "SERVICE", label: "Servicio", icon: Wrench, color: "bg-purple-100 text-purple-700" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    description: "",
    coverImage: "",
    type: "DIGITAL",
    digitalFileUrl: "",
    digitalFileType: "",
    stock: "",
    weight: "",
    requiresShipping: false,
    serviceDurationMinutes: "",
    serviceBookingUrl: "",
    priceCents: "",
    comparePriceCents: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El t\u00edtulo es requerido");
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
        type: formData.type,
        isPublished: formData.isPublished,
        currency: formData.currency,
      };

      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.coverImage) payload.coverImage = formData.coverImage;

      // Type-specific fields
      if (formData.type === "DIGITAL") {
        if (formData.digitalFileUrl.trim()) payload.digitalFileUrl = formData.digitalFileUrl.trim();
        if (formData.digitalFileType.trim()) payload.digitalFileType = formData.digitalFileType.trim();
      }

      if (formData.type === "PHYSICAL") {
        if (formData.stock) payload.stock = parseInt(formData.stock);
        if (formData.weight) payload.weight = parseFloat(formData.weight);
        payload.requiresShipping = formData.requiresShipping;
      }

      if (formData.type === "SERVICE") {
        if (formData.serviceDurationMinutes)
          payload.serviceDurationMinutes = parseInt(formData.serviceDurationMinutes);
        if (formData.serviceBookingUrl.trim())
          payload.serviceBookingUrl = formData.serviceBookingUrl.trim();
      }

      // Pricing
      if (formData.priceCents) {
        payload.priceCents = Math.round(parseFloat(formData.priceCents) * 100);
      }
      if (formData.comparePriceCents) {
        payload.comparePriceCents = Math.round(parseFloat(formData.comparePriceCents) * 100);
      }

      payload.taxConfig = {
        igv: formData.taxIGV,
        detraccion: formData.taxDetraccion,
        percepcion: formData.taxPercepcion,
      };

      const response = await fetch("/api/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear producto");
      }

      toast.success("Producto creado correctamente");
      router.push("/admin/store");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al crear el producto");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/store">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-[#D66829]" />
            Nuevo Producto
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea un nuevo producto para la tienda
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="detalles">Detalles</TabsTrigger>
            <TabsTrigger value="precios">Precios</TabsTrigger>
          </TabsList>

          {/* Tab: General */}
          <TabsContent value="general" className="space-y-6">
            {/* Product Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {PRODUCT_TYPES.map((pt) => {
                    const Icon = pt.icon;
                    const isSelected = formData.type === pt.value;
                    return (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => updateField("type", pt.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${pt.color} border-current`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{pt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informaci\u00f3n B\u00e1sica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">T\u00edtulo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Ej: Libro de Arbitraje Comercial"
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
                    <span className="text-sm text-muted-foreground">/tienda/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="libro-arbitraje-comercial"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripci\u00f3n</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Descripci\u00f3n del producto..."
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 caracteres
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imagen de Portada</CardTitle>
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

          {/* Tab: Detalles */}
          <TabsContent value="detalles" className="space-y-6">
            {formData.type === "DIGITAL" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileDigit className="h-4 w-4" />
                    Archivo Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="digitalFileUrl">URL del Archivo</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="digitalFileUrl"
                        value={formData.digitalFileUrl}
                        onChange={(e) => updateField("digitalFileUrl", e.target.value)}
                        placeholder="https://storage.example.com/file.pdf"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="digitalFileType">Tipo de Archivo</Label>
                    <Select
                      value={formData.digitalFileType}
                      onValueChange={(v) => updateField("digitalFileType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="EPUB">EPUB</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="AUDIO">Audio</SelectItem>
                        <SelectItem value="ZIP">ZIP</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.type === "PHYSICAL" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Producto F\u00edsico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => updateField("stock", e.target.value)}
                        placeholder="0"
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          value={formData.weight}
                          onChange={(e) => updateField("weight", e.target.value)}
                          placeholder="0.5"
                          className="pl-10"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Requiere Env\u00edo</p>
                        <p className="text-xs text-muted-foreground">Producto necesita despacho f\u00edsico</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.requiresShipping}
                      onCheckedChange={(v) => updateField("requiresShipping", v)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.type === "SERVICE" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceDurationMinutes">Duraci\u00f3n (minutos)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="serviceDurationMinutes"
                        type="number"
                        value={formData.serviceDurationMinutes}
                        onChange={(e) => updateField("serviceDurationMinutes", e.target.value)}
                        placeholder="60"
                        className="pl-10"
                        min={1}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceBookingUrl">URL de Reserva</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="serviceBookingUrl"
                        value={formData.serviceBookingUrl}
                        onChange={(e) => updateField("serviceBookingUrl", e.target.value)}
                        placeholder="https://calendly.com/..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Publish */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publicaci\u00f3n</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Publicar Producto</p>
                    <p className="text-xs text-muted-foreground">Visible en la tienda</p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(v) => updateField("isPublished", v)}
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
                  Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comparePriceCents">Precio Comparativo</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="comparePriceCents"
                        type="number"
                        step="0.01"
                        value={formData.comparePriceCents}
                        onChange={(e) => updateField("comparePriceCents", e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                        min={0}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Precio tachado original</p>
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
                        <SelectItem value="USD">D\u00f3lares (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuraci\u00f3n Tributaria</CardTitle>
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
                    Detracci\u00f3n
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taxPercepcion"
                    checked={formData.taxPercepcion}
                    onCheckedChange={(v) => updateField("taxPercepcion", v as boolean)}
                  />
                  <Label htmlFor="taxPercepcion" className="text-sm font-normal">
                    Percepci\u00f3n
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/store">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[#D66829] hover:bg-[#c45a22]">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Producto
          </Button>
        </div>
      </form>
    </div>
  );
}
