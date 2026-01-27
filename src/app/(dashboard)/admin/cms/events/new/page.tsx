"use client";

/**
 * CAARD CMS - Crear Nuevo Evento
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  MapPin,
  Globe,
  Users,
  DollarSign,
  Link as LinkIcon,
  Video,
  Clock,
  Star,
  Eye,
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

// Tipos de evento
const EVENT_TYPES = [
  { value: "WEBINAR", label: "Webinar", icon: Video, color: "bg-blue-100 text-blue-700" },
  { value: "CONFERENCE", label: "Conferencia", icon: Users, color: "bg-purple-100 text-purple-700" },
  { value: "WORKSHOP", label: "Taller", icon: Users, color: "bg-green-100 text-green-700" },
  { value: "COURSE", label: "Curso", icon: Calendar, color: "bg-orange-100 text-orange-700" },
  { value: "SEMINAR", label: "Seminario", icon: Users, color: "bg-indigo-100 text-indigo-700" },
  { value: "OTHER", label: "Otro", icon: Calendar, color: "bg-gray-100 text-gray-700" },
];

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

interface FormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  coverImage: string;
  type: string;
  startDate: string;
  endDate: string;
  timezone: string;
  location: string;
  isOnline: boolean;
  onlineUrl: string;
  registrationUrl: string;
  maxAttendees: string;
  price: string;
  currency: string;
  isPublished: boolean;
  isFeatured: boolean;
}

export default function NewEventPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    description: "",
    content: "",
    coverImage: "",
    type: "WEBINAR",
    startDate: "",
    endDate: "",
    timezone: "America/Lima",
    location: "",
    isOnline: true,
    onlineUrl: "",
    registrationUrl: "",
    maxAttendees: "",
    price: "",
    currency: "PEN",
    isPublished: false,
    isFeatured: false,
  });

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

    if (!formData.startDate) {
      toast.error("La fecha de inicio es requerida");
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        startDate: new Date(formData.startDate).toISOString(),
        timezone: formData.timezone,
        isOnline: formData.isOnline,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
      };

      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      if (formData.content.trim()) {
        payload.content = formData.content.trim();
      }

      if (formData.coverImage) {
        payload.coverImage = formData.coverImage;
      }

      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString();
      }

      if (formData.location.trim()) {
        payload.location = formData.location.trim();
      }

      if (formData.onlineUrl.trim()) {
        payload.onlineUrl = formData.onlineUrl.trim();
      }

      if (formData.registrationUrl.trim()) {
        payload.registrationUrl = formData.registrationUrl.trim();
      }

      if (formData.maxAttendees) {
        payload.maxAttendees = parseInt(formData.maxAttendees);
      }

      if (formData.price) {
        payload.price = Math.round(parseFloat(formData.price) * 100); // Convertir a céntimos
        payload.currency = formData.currency;
      }

      const response = await fetch("/api/cms/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear evento");
      }

      toast.success("Evento creado correctamente");
      router.push("/admin/cms/events");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al crear el evento");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedType = EVENT_TYPES.find((t) => t.value === formData.type);

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cms/events">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#D66829]" />
            Nuevo Evento
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea un nuevo evento, webinar o conferencia
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="registration">Registro</TabsTrigger>
          </TabsList>

          {/* Tab: General */}
          <TabsContent value="general" className="space-y-6">
            {/* Tipo de evento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {EVENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateField("type", type.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                          isSelected
                            ? `${type.color} border-current`
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Evento *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Ej: Webinar sobre Arbitraje Internacional"
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
                    <span className="text-sm text-muted-foreground">/eventos/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="webinar-arbitraje-internacional"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción Corta</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Breve descripción del evento..."
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/1000 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido Completo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    placeholder="Descripción detallada, agenda, ponentes..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Imagen de portada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imagen de Portada</CardTitle>
                <CardDescription>Imagen principal del evento</CardDescription>
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
          <TabsContent value="details" className="space-y-6">
            {/* Fecha y hora */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Fecha y Hora
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha y Hora de Inicio *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => updateField("startDate", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha y Hora de Fin</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => updateField("endDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(v) => updateField("timezone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                      <SelectItem value="America/Santiago">Santiago (GMT-4)</SelectItem>
                      <SelectItem value="America/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Evento Online</p>
                      <p className="text-xs text-muted-foreground">Virtual / Webinar</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isOnline}
                    onCheckedChange={(v) => updateField("isOnline", v)}
                  />
                </div>

                {formData.isOnline ? (
                  <div className="space-y-2">
                    <Label htmlFor="onlineUrl">URL del Evento Virtual</Label>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="onlineUrl"
                        value={formData.onlineUrl}
                        onChange={(e) => updateField("onlineUrl", e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Zoom, Google Meet, Microsoft Teams, etc.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="location">Dirección del Evento</Label>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Registro */}
          <TabsContent value="registration" className="space-y-6">
            {/* Registro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Registro de Asistentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationUrl">URL de Registro</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="registrationUrl"
                      value={formData.registrationUrl}
                      onChange={(e) => updateField("registrationUrl", e.target.value)}
                      placeholder="https://..."
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Eventbrite, Google Forms, formulario propio, etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Capacidad Máxima</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="maxAttendees"
                      type="number"
                      value={formData.maxAttendees}
                      onChange={(e) => updateField("maxAttendees", e.target.value)}
                      placeholder="100"
                      className="pl-10"
                      min={1}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dejar vacío para sin límite
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Precio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => updateField("price", e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                        min={0}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dejar vacío o 0 para evento gratuito
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
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

            {/* Publicación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Eye className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Publicar Evento</p>
                      <p className="text-xs text-muted-foreground">Visible en el sitio web</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(v) => updateField("isPublished", v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100">
                      <Star className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Evento Destacado</p>
                      <p className="text-xs text-muted-foreground">Aparece en sección destacados</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(v) => updateField("isFeatured", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/cms/events">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[#D66829] hover:bg-[#c45a22]">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Evento
          </Button>
        </div>
      </form>
    </div>
  );
}
