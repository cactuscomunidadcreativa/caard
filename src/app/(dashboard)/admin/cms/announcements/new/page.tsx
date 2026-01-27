"use client";

/**
 * CAARD CMS - Crear/Editar Aviso
 * ==============================
 * Formulario para crear nuevos avisos y anuncios
 * Con soporte para banners, popups, modales y diseño visual
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Megaphone,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Newspaper,
  Eye,
  Calendar,
  Link as LinkIcon,
  Home,
  Globe,
  MessageSquare,
  Flag,
  Palette,
  Image as ImageIcon,
  Upload,
  X,
  Sparkles,
  Monitor,
  Maximize2,
  Square,
  Bell,
  MousePointer,
  Languages,
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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de anuncio
const ANNOUNCEMENT_TYPES = [
  {
    value: "INFO",
    label: "Información",
    description: "Aviso informativo general",
    icon: Info,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    bgColor: "bg-blue-50",
    defaultBg: "#EFF6FF",
    defaultText: "#1D4ED8",
  },
  {
    value: "WARNING",
    label: "Advertencia",
    description: "Alerta o advertencia importante",
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    bgColor: "bg-yellow-50",
    defaultBg: "#FEFCE8",
    defaultText: "#A16207",
  },
  {
    value: "SUCCESS",
    label: "Éxito",
    description: "Mensaje de éxito o logro",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700 border-green-200",
    bgColor: "bg-green-50",
    defaultBg: "#F0FDF4",
    defaultText: "#15803D",
  },
  {
    value: "ERROR",
    label: "Error",
    description: "Aviso de error o problema",
    icon: AlertCircle,
    color: "bg-red-100 text-red-700 border-red-200",
    bgColor: "bg-red-50",
    defaultBg: "#FEF2F2",
    defaultText: "#B91C1C",
  },
  {
    value: "NEWS",
    label: "Noticia",
    description: "Noticia o novedad",
    icon: Newspaper,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    bgColor: "bg-purple-50",
    defaultBg: "#FAF5FF",
    defaultText: "#7E22CE",
  },
];

// Formatos de visualización
const DISPLAY_FORMATS = [
  {
    value: "BANNER",
    label: "Banner",
    description: "Barra superior fija",
    icon: Flag,
  },
  {
    value: "POPUP",
    label: "Popup",
    description: "Ventana pequeña en esquina",
    icon: MessageSquare,
  },
  {
    value: "MODAL",
    label: "Modal",
    description: "Ventana central grande",
    icon: Square,
  },
  {
    value: "FULLSCREEN",
    label: "Pantalla Completa",
    description: "Modal a pantalla completa",
    icon: Maximize2,
  },
  {
    value: "FLOATING",
    label: "Flotante",
    description: "Tipo anuncio en esquina",
    icon: Bell,
  },
];

// Animaciones disponibles
const ANIMATIONS = [
  { value: "none", label: "Sin animación" },
  { value: "fade", label: "Desvanecer" },
  { value: "slide-up", label: "Deslizar arriba" },
  { value: "slide-down", label: "Deslizar abajo" },
  { value: "bounce", label: "Rebote" },
  { value: "zoom", label: "Zoom" },
];

interface FormData {
  type: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  linkUrl: string;
  linkText: string;
  displayFormat: string;
  backgroundColor: string;
  backgroundImage: string;
  textColor: string;
  buttonColor: string;
  overlayOpacity: number;
  dismissable: boolean;
  dismissCooldown: number | null;
  requireInteraction: boolean;
  animation: string;
  showOnHomepage: boolean;
  showOnAllPages: boolean;
  showAsPopup: boolean;
  showAsBanner: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
}

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    type: "INFO",
    title: "",
    titleEn: "",
    content: "",
    contentEn: "",
    linkUrl: "",
    linkText: "",
    displayFormat: "BANNER",
    backgroundColor: "",
    backgroundImage: "",
    textColor: "",
    buttonColor: "#D66829",
    overlayOpacity: 0.5,
    dismissable: true,
    dismissCooldown: null,
    requireInteraction: false,
    animation: "fade",
    showOnHomepage: true,
    showOnAllPages: false,
    showAsPopup: false,
    showAsBanner: true,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: "",
    isActive: true,
    sortOrder: 0,
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-traducir título y contenido
  const handleAutoTranslate = async () => {
    if (!formData.title.trim()) {
      toast.error("Ingresa un título primero");
      return;
    }

    setIsTranslating(true);
    try {
      const textsToTranslate = [
        { key: "title", text: formData.title },
      ];

      if (formData.content.trim()) {
        textsToTranslate.push({ key: "content", text: formData.content });
      }

      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: textsToTranslate,
          from: "es",
          to: "en",
        }),
      });

      if (!response.ok) {
        throw new Error("Error en el servicio de traducción");
      }

      const data = await response.json();

      if (data.success && data.translations) {
        for (const { key, translated } of data.translations) {
          if (key === "title") {
            updateField("titleEn", translated);
          } else if (key === "content") {
            updateField("contentEn", translated);
          }
        }
        toast.success("Traducción completada");
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (error: any) {
      console.error("Error en traducción:", error);
      toast.error(error.message || "Error al traducir");
    } finally {
      setIsTranslating(false);
    }
  };

  // Subir imagen de fondo
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("folder", "announcements");

    try {
      toast.loading("Subiendo imagen...", { id: "upload" });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Error al subir imagen");
      }

      const data = await response.json();
      updateField("backgroundImage", data.url);
      toast.success("Imagen subida correctamente", { id: "upload" });
    } catch (error) {
      toast.error("Error al subir la imagen", { id: "upload" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {
        type: formData.type,
        title: formData.title.trim(),
        titleEn: formData.titleEn.trim() || null,
        content: formData.content.trim() || null,
        contentEn: formData.contentEn.trim() || null,
        displayFormat: formData.displayFormat,
        backgroundColor: formData.backgroundColor || null,
        backgroundImage: formData.backgroundImage || null,
        textColor: formData.textColor || null,
        buttonColor: formData.buttonColor || null,
        overlayOpacity: formData.overlayOpacity,
        dismissable: formData.dismissable,
        dismissCooldown: formData.dismissCooldown,
        requireInteraction: formData.requireInteraction,
        animation: formData.animation || null,
        showOnHomepage: formData.showOnHomepage,
        showOnAllPages: formData.showOnAllPages,
        showAsPopup: formData.displayFormat === "POPUP" || formData.displayFormat === "MODAL" || formData.displayFormat === "FULLSCREEN",
        showAsBanner: formData.displayFormat === "BANNER",
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      if (formData.linkUrl.trim()) {
        payload.linkUrl = formData.linkUrl.trim();
        payload.linkText = formData.linkText.trim() || "Ver más";
      }

      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString();
      }

      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString();
      }

      const response = await fetch("/api/cms/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear aviso");
      }

      toast.success("Aviso creado correctamente");
      router.push("/admin/cms/announcements");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al crear el aviso");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedType = ANNOUNCEMENT_TYPES.find((t) => t.value === formData.type);
  const selectedFormat = DISPLAY_FORMATS.find((f) => f.value === formData.displayFormat);
  const TypeIcon = selectedType?.icon || Info;
  const FormatIcon = selectedFormat?.icon || Flag;

  // Determinar colores efectivos para preview
  const effectiveBgColor = formData.backgroundColor || selectedType?.defaultBg || "#EFF6FF";
  const effectiveTextColor = formData.textColor || selectedType?.defaultText || "#1D4ED8";

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cms/announcements">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#D66829]" />
            Nuevo Aviso
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea un aviso con diseño personalizado
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Columna principal - Formulario */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="display">Visualización</TabsTrigger>
                <TabsTrigger value="style">Estilo</TabsTrigger>
                <TabsTrigger value="settings">Ajustes</TabsTrigger>
              </TabsList>

              {/* Tab: Contenido */}
              <TabsContent value="content" className="space-y-6 mt-6">
                {/* Tipo de aviso */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tipo de Aviso</CardTitle>
                    <CardDescription>Selecciona el tipo de mensaje</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {ANNOUNCEMENT_TYPES.map((type) => {
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
                            <Icon className="h-6 w-6" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Contenido */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Contenido</CardTitle>
                        <CardDescription>Información del aviso</CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoTranslate}
                        disabled={isTranslating || !formData.title.trim()}
                      >
                        {isTranslating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Languages className="h-4 w-4 mr-2" />
                        )}
                        Auto-traducir
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título (Español) *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateField("title", e.target.value)}
                          placeholder="Ej: Nuevo horario de atención"
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.title.length}/200 caracteres
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="titleEn">
                          Título (Inglés)
                          {formData.titleEn && <Badge variant="outline" className="ml-2 text-xs">Traducido</Badge>}
                        </Label>
                        <Input
                          id="titleEn"
                          value={formData.titleEn}
                          onChange={(e) => updateField("titleEn", e.target.value)}
                          placeholder="English title"
                          maxLength={200}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="content">Descripción (Español)</Label>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) => updateField("content", e.target.value)}
                          placeholder="Descripción adicional del aviso..."
                          rows={4}
                          maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.content.length}/1000 caracteres
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contentEn">
                          Descripción (Inglés)
                          {formData.contentEn && <Badge variant="outline" className="ml-2 text-xs">Traducido</Badge>}
                        </Label>
                        <Textarea
                          id="contentEn"
                          value={formData.contentEn}
                          onChange={(e) => updateField("contentEn", e.target.value)}
                          placeholder="English description..."
                          rows={4}
                          maxLength={1000}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="linkUrl">URL de enlace (opcional)</Label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="linkUrl"
                            value={formData.linkUrl}
                            onChange={(e) => updateField("linkUrl", e.target.value)}
                            placeholder="https://..."
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkText">Texto del enlace</Label>
                        <Input
                          id="linkText"
                          value={formData.linkText}
                          onChange={(e) => updateField("linkText", e.target.value)}
                          placeholder="Ver más"
                          maxLength={50}
                          disabled={!formData.linkUrl}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Visualización */}
              <TabsContent value="display" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Formato de Visualización</CardTitle>
                    <CardDescription>Cómo se mostrará el aviso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {DISPLAY_FORMATS.map((format) => {
                        const Icon = format.icon;
                        const isSelected = formData.displayFormat === format.value;
                        return (
                          <button
                            key={format.value}
                            type="button"
                            onClick={() => updateField("displayFormat", format.value)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                              isSelected
                                ? "border-[#D66829] bg-orange-50 text-[#D66829]"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <Icon className="h-6 w-6" />
                            <span className="text-sm font-medium">{format.label}</span>
                            <span className="text-xs text-muted-foreground text-center">{format.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dónde mostrar</CardTitle>
                    <CardDescription>Selecciona las páginas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Home className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Página de inicio</p>
                            <p className="text-xs text-muted-foreground">Mostrar en la home</p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.showOnHomepage}
                          onCheckedChange={(v) => updateField("showOnHomepage", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100">
                            <Globe className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Todas las páginas</p>
                            <p className="text-xs text-muted-foreground">Mostrar en todo el sitio</p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.showOnAllPages}
                          onCheckedChange={(v) => updateField("showOnAllPages", v)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Comportamiento</CardTitle>
                    <CardDescription>Interacción del usuario</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Permitir cerrar</p>
                        <p className="text-sm text-muted-foreground">
                          El usuario puede cerrar el aviso
                        </p>
                      </div>
                      <Switch
                        checked={formData.dismissable}
                        onCheckedChange={(v) => updateField("dismissable", v)}
                      />
                    </div>

                    {formData.dismissable && (
                      <div className="space-y-2">
                        <Label htmlFor="dismissCooldown">Volver a mostrar después de (horas)</Label>
                        <Input
                          id="dismissCooldown"
                          type="number"
                          value={formData.dismissCooldown || ""}
                          onChange={(e) => updateField("dismissCooldown", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Dejar vacío para no volver a mostrar"
                          min={1}
                          max={720}
                        />
                        <p className="text-xs text-muted-foreground">
                          Si se deja vacío, no se volverá a mostrar una vez cerrado
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Requiere interacción</p>
                        <p className="text-sm text-muted-foreground">
                          El usuario debe hacer clic para cerrar
                        </p>
                      </div>
                      <Switch
                        checked={formData.requireInteraction}
                        onCheckedChange={(v) => updateField("requireInteraction", v)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Animación</Label>
                      <Select value={formData.animation} onValueChange={(v) => updateField("animation", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona animación" />
                        </SelectTrigger>
                        <SelectContent>
                          {ANIMATIONS.map((anim) => (
                            <SelectItem key={anim.value} value={anim.value}>
                              {anim.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Estilo */}
              <TabsContent value="style" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Colores
                    </CardTitle>
                    <CardDescription>Personaliza los colores del aviso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="backgroundColor">Color de fondo</Label>
                        <div className="flex gap-2">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={formData.backgroundColor || selectedType?.defaultBg || "#EFF6FF"}
                            onChange={(e) => updateField("backgroundColor", e.target.value)}
                            className="w-14 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.backgroundColor || ""}
                            onChange={(e) => updateField("backgroundColor", e.target.value)}
                            placeholder={selectedType?.defaultBg || "Por defecto"}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textColor">Color del texto</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textColor"
                            type="color"
                            value={formData.textColor || selectedType?.defaultText || "#1D4ED8"}
                            onChange={(e) => updateField("textColor", e.target.value)}
                            className="w-14 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.textColor || ""}
                            onChange={(e) => updateField("textColor", e.target.value)}
                            placeholder={selectedType?.defaultText || "Por defecto"}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttonColor">Color del botón</Label>
                      <div className="flex gap-2">
                        <Input
                          id="buttonColor"
                          type="color"
                          value={formData.buttonColor || "#D66829"}
                          onChange={(e) => updateField("buttonColor", e.target.value)}
                          className="w-14 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.buttonColor || ""}
                          onChange={(e) => updateField("buttonColor", e.target.value)}
                          placeholder="#D66829"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Imagen de Fondo
                    </CardTitle>
                    <CardDescription>Agrega una imagen de fondo personalizada</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {formData.backgroundImage ? (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={formData.backgroundImage}
                          alt="Background"
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Cambiar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => updateField("backgroundImage", "")}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Quitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[#D66829] hover:bg-orange-50/50 transition-colors"
                      >
                        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium">Subir imagen</p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG o GIF (máx. 5MB)
                        </p>
                      </div>
                    )}

                    {formData.backgroundImage && (
                      <div className="space-y-2">
                        <Label>Opacidad del overlay</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[formData.overlayOpacity * 100]}
                            onValueChange={([v]) => updateField("overlayOpacity", v / 100)}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm w-12 text-right">{Math.round(formData.overlayOpacity * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Oscurece la imagen para mejorar la legibilidad del texto
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Ajustes */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vigencia</CardTitle>
                    <CardDescription>Período de validez del aviso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Fecha de inicio</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="startDate"
                            type="datetime-local"
                            value={formData.startDate}
                            onChange={(e) => updateField("startDate", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Fecha de fin (opcional)</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="endDate"
                            type="datetime-local"
                            value={formData.endDate}
                            onChange={(e) => updateField("endDate", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dejar vacío para sin fecha de expiración
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Aviso activo</p>
                        <p className="text-sm text-muted-foreground">
                          Desactívalo para ocultarlo temporalmente
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(v) => updateField("isActive", v)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Orden de prioridad</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => updateField("sortOrder", parseInt(e.target.value) || 0)}
                        min={0}
                        max={999}
                        className="w-24"
                      />
                      <p className="text-xs text-muted-foreground">
                        Números menores aparecen primero
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Columna derecha - Vista previa */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Vista Previa
                </CardTitle>
                <CardDescription>
                  {selectedFormat?.label} - {selectedType?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Preview según formato */}
                {formData.displayFormat === "BANNER" && (
                  <div
                    className="rounded-lg p-4 border-l-4 relative overflow-hidden"
                    style={{
                      backgroundColor: effectiveBgColor,
                      borderColor: effectiveTextColor,
                    }}
                  >
                    {formData.backgroundImage && (
                      <>
                        <img
                          src={formData.backgroundImage}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(0,0,0,${formData.overlayOpacity})` }}
                        />
                      </>
                    )}
                    <div className="flex items-start gap-3 relative z-10">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: effectiveTextColor + "20",
                          color: effectiveTextColor,
                        }}
                      >
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1" style={{ color: formData.backgroundImage ? "white" : effectiveTextColor }}>
                        <Badge
                          style={{
                            backgroundColor: effectiveTextColor + "20",
                            color: formData.backgroundImage ? "white" : effectiveTextColor,
                          }}
                        >
                          {selectedType?.label}
                        </Badge>
                        <h3 className="font-semibold mt-2">
                          {formData.title || "Título del aviso"}
                        </h3>
                        {formData.content && (
                          <p className="text-sm opacity-80 mt-1">
                            {formData.content}
                          </p>
                        )}
                        {formData.linkUrl && (
                          <a
                            href="#"
                            className="inline-flex items-center gap-1 text-sm mt-2 hover:underline"
                            style={{ color: formData.buttonColor }}
                          >
                            {formData.linkText || "Ver más"}
                            <LinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {formData.dismissable && (
                        <button className="p-1 rounded hover:bg-black/10">
                          <X className="h-4 w-4" style={{ color: formData.backgroundImage ? "white" : effectiveTextColor }} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(formData.displayFormat === "POPUP" || formData.displayFormat === "FLOATING") && (
                  <div className="flex justify-end">
                    <div
                      className="w-64 rounded-lg shadow-lg border overflow-hidden relative"
                      style={{ backgroundColor: effectiveBgColor }}
                    >
                      {formData.backgroundImage && (
                        <>
                          <img
                            src={formData.backgroundImage}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: `rgba(0,0,0,${formData.overlayOpacity})` }}
                          />
                        </>
                      )}
                      <div className="p-4 relative z-10" style={{ color: formData.backgroundImage ? "white" : effectiveTextColor }}>
                        {formData.dismissable && (
                          <button className="absolute top-2 right-2 p-1 rounded hover:bg-black/10">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <TypeIcon className="h-5 w-5" />
                          <Badge variant="secondary" className="text-xs">
                            {selectedType?.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">
                          {formData.title || "Título del aviso"}
                        </h3>
                        {formData.content && (
                          <p className="text-sm opacity-80 mt-2 line-clamp-3">
                            {formData.content}
                          </p>
                        )}
                        {formData.linkUrl && (
                          <Button
                            size="sm"
                            className="mt-3 w-full"
                            style={{ backgroundColor: formData.buttonColor }}
                          >
                            {formData.linkText || "Ver más"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(formData.displayFormat === "MODAL" || formData.displayFormat === "FULLSCREEN") && (
                  <div className="bg-black/50 rounded-lg p-4">
                    <div
                      className={cn(
                        "rounded-lg shadow-xl overflow-hidden relative mx-auto",
                        formData.displayFormat === "FULLSCREEN" ? "w-full" : "max-w-sm"
                      )}
                      style={{ backgroundColor: effectiveBgColor }}
                    >
                      {formData.backgroundImage && (
                        <>
                          <img
                            src={formData.backgroundImage}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: `rgba(0,0,0,${formData.overlayOpacity})` }}
                          />
                        </>
                      )}
                      <div className="p-6 relative z-10 text-center" style={{ color: formData.backgroundImage ? "white" : effectiveTextColor }}>
                        {formData.dismissable && (
                          <button className="absolute top-3 right-3 p-1 rounded hover:bg-black/10">
                            <X className="h-5 w-5" />
                          </button>
                        )}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                          style={{ backgroundColor: effectiveTextColor + "20" }}
                        >
                          <TypeIcon className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="mb-3">
                          {selectedType?.label}
                        </Badge>
                        <h3 className="font-bold text-lg">
                          {formData.title || "Título del aviso"}
                        </h3>
                        {formData.content && (
                          <p className="opacity-80 mt-3">
                            {formData.content}
                          </p>
                        )}
                        {formData.linkUrl && (
                          <Button
                            className="mt-4"
                            style={{ backgroundColor: formData.buttonColor }}
                          >
                            {formData.linkText || "Ver más"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Info adicional */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FormatIcon className="h-4 w-4" />
                    <span>{selectedFormat?.description}</span>
                  </div>
                  {formData.titleEn && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Languages className="h-4 w-4" />
                      <span>Traducido al inglés</span>
                    </div>
                  )}
                  {formData.dismissable && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MousePointer className="h-4 w-4" />
                      <span>El usuario puede cerrar</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/cms/announcements">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[#D66829] hover:bg-[#c45a22]">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Aviso
          </Button>
        </div>
      </form>
    </div>
  );
}
