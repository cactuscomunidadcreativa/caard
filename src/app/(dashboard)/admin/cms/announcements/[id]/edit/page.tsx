"use client";

/**
 * CAARD CMS - Editar Aviso
 * ========================
 * Formulario para editar avisos existentes
 */

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de anuncio
const ANNOUNCEMENT_TYPES = [
  {
    value: "INFO",
    label: "Informacion",
    description: "Aviso informativo general",
    icon: Info,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    bgColor: "bg-blue-50",
  },
  {
    value: "WARNING",
    label: "Advertencia",
    description: "Alerta o advertencia importante",
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    bgColor: "bg-yellow-50",
  },
  {
    value: "SUCCESS",
    label: "Exito",
    description: "Mensaje de exito o logro",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700 border-green-200",
    bgColor: "bg-green-50",
  },
  {
    value: "ERROR",
    label: "Error",
    description: "Aviso de error o problema",
    icon: AlertCircle,
    color: "bg-red-100 text-red-700 border-red-200",
    bgColor: "bg-red-50",
  },
  {
    value: "NEWS",
    label: "Noticia",
    description: "Noticia o novedad",
    icon: Newspaper,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    bgColor: "bg-purple-50",
  },
];

interface FormData {
  type: string;
  title: string;
  content: string;
  linkUrl: string;
  linkText: string;
  showOnHomepage: boolean;
  showOnAllPages: boolean;
  showAsPopup: boolean;
  showAsBanner: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
}

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const announcementId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: "INFO",
    title: "",
    content: "",
    linkUrl: "",
    linkText: "",
    showOnHomepage: true,
    showOnAllPages: false,
    showAsPopup: false,
    showAsBanner: true,
    startDate: "",
    endDate: "",
    isActive: true,
    sortOrder: 0,
  });

  // Cargar datos del anuncio
  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const response = await fetch(`/api/cms/announcements/${announcementId}`);
        if (!response.ok) {
          throw new Error("Aviso no encontrado");
        }
        const data = await response.json();

        setFormData({
          type: data.type || "INFO",
          title: data.title || "",
          content: data.content || "",
          linkUrl: data.linkUrl || "",
          linkText: data.linkText || "",
          showOnHomepage: data.showOnHomepage ?? true,
          showOnAllPages: data.showOnAllPages ?? false,
          showAsPopup: data.showAsPopup ?? false,
          showAsBanner: data.showAsBanner ?? true,
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "",
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        });
      } catch (error) {
        console.error("Error loading announcement:", error);
        toast.error("Error al cargar el aviso");
        router.push("/admin/cms/announcements");
      } finally {
        setIsLoading(false);
      }
    }

    loadAnnouncement();
  }, [announcementId, router]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El titulo es requerido");
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {
        type: formData.type,
        title: formData.title.trim(),
        showOnHomepage: formData.showOnHomepage,
        showOnAllPages: formData.showOnAllPages,
        showAsPopup: formData.showAsPopup,
        showAsBanner: formData.showAsBanner,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      if (formData.content.trim()) {
        payload.content = formData.content.trim();
      } else {
        payload.content = null;
      }

      if (formData.linkUrl.trim()) {
        payload.linkUrl = formData.linkUrl.trim();
        payload.linkText = formData.linkText.trim() || "Ver mas";
      } else {
        payload.linkUrl = null;
        payload.linkText = null;
      }

      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString();
      }

      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString();
      } else {
        payload.endDate = null;
      }

      const response = await fetch(`/api/cms/announcements/${announcementId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar aviso");
      }

      toast.success("Aviso actualizado correctamente");
      router.push("/admin/cms/announcements");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al actualizar el aviso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cms/announcements/${announcementId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el aviso");
      }

      toast.success("Aviso eliminado correctamente");
      router.push("/admin/cms/announcements");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el aviso");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedType = ANNOUNCEMENT_TYPES.find((t) => t.value === formData.type);
  const TypeIcon = selectedType?.icon || Info;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/cms/announcements">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-[#D66829]" />
              Editar Aviso
            </h1>
            <p className="text-sm text-muted-foreground">
              Modifica el aviso existente
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Aviso</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. El aviso sera eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <CardTitle className="text-base">Contenido</CardTitle>
            <CardDescription>Informacion del aviso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Ej: Nuevo horario de atencion"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Descripcion (opcional)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Descripcion adicional del aviso..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length}/1000 caracteres
              </p>
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
                  placeholder="Ver mas"
                  maxLength={50}
                  disabled={!formData.linkUrl}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donde mostrar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donde mostrar</CardTitle>
            <CardDescription>Configura la visibilidad del aviso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pagina de inicio</p>
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
                    <p className="font-medium">Todas las paginas</p>
                    <p className="text-xs text-muted-foreground">Mostrar en todo el sitio</p>
                  </div>
                </div>
                <Switch
                  checked={formData.showOnAllPages}
                  onCheckedChange={(v) => updateField("showOnAllPages", v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Flag className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Como banner</p>
                    <p className="text-xs text-muted-foreground">Barra superior fija</p>
                  </div>
                </div>
                <Switch
                  checked={formData.showAsBanner}
                  onCheckedChange={(v) => updateField("showAsBanner", v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Como popup</p>
                    <p className="text-xs text-muted-foreground">Ventana emergente</p>
                  </div>
                </div>
                <Switch
                  checked={formData.showAsPopup}
                  onCheckedChange={(v) => updateField("showAsPopup", v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vigencia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vigencia</CardTitle>
            <CardDescription>Periodo de validez del aviso</CardDescription>
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
                  Dejar vacio para sin fecha de expiracion
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Aviso activo</p>
                <p className="text-sm text-muted-foreground">
                  Desactivalo para ocultarlo temporalmente
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
                Numeros menores aparecen primero
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vista previa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("rounded-lg p-4 border-l-4", selectedType?.color)}>
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", selectedType?.color)}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Badge className={selectedType?.color}>
                    {selectedType?.label}
                  </Badge>
                  <h3 className="font-semibold mt-2">
                    {formData.title || "Titulo del aviso"}
                  </h3>
                  {formData.content && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.content}
                    </p>
                  )}
                  {formData.linkUrl && (
                    <a href="#" className="inline-flex items-center gap-1 text-sm text-[#D66829] hover:underline mt-2">
                      {formData.linkText || "Ver mas"}
                      <LinkIcon className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/cms/announcements">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[#D66829] hover:bg-[#c45a22]">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
