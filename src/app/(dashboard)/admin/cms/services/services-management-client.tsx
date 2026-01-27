"use client";

/**
 * CAARD - Cliente de Gestión de Servicios
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  title: string;
  description?: string;
  shortDescription?: string;
  icon?: string;
  price?: string;
  duration?: string;
  features?: string[];
  link?: string;
  linkText?: string;
  isHighlighted?: boolean;
  category?: string;
}

interface ServiceSection {
  id: string;
  title: string | null;
  subtitle?: string | null;
  content: any;
  isVisible: boolean;
}

interface PageWithServices {
  id: string;
  title: string;
  slug: string;
  sections: ServiceSection[];
}

interface ServicesManagementClientProps {
  pagesWithServices: PageWithServices[];
}

const ICON_OPTIONS = [
  { value: "scale", label: "Balanza" },
  { value: "gavel", label: "Martillo" },
  { value: "file-text", label: "Documento" },
  { value: "clock", label: "Reloj" },
  { value: "shield", label: "Escudo" },
  { value: "users", label: "Usuarios" },
  { value: "briefcase", label: "Maletín" },
  { value: "zap", label: "Rayo" },
  { value: "check-circle", label: "Check" },
  { value: "settings", label: "Configuración" },
];

export function ServicesManagementClient({
  pagesWithServices,
}: ServicesManagementClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<{
    pageId: string;
    sectionId: string;
    serviceIndex: number;
    service: Service;
  } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    pageId: string;
    sectionId: string;
  } | null>(null);

  const [formData, setFormData] = useState<Service>({
    title: "",
    description: "",
    shortDescription: "",
    icon: "scale",
    price: "",
    duration: "",
    features: [],
    link: "",
    linkText: "Más información",
    isHighlighted: false,
    category: "",
  });

  const [newFeature, setNewFeature] = useState("");

  const handleEdit = (
    pageId: string,
    sectionId: string,
    serviceIndex: number,
    service: Service
  ) => {
    setEditingService({ pageId, sectionId, serviceIndex, service });
    setFormData({
      ...service,
      features: service.features || [],
      icon: service.icon || "scale",
    });
    setIsAddingNew(false);
  };

  const handleAddNew = (pageId: string, sectionId: string) => {
    setSelectedSection({ pageId, sectionId });
    setFormData({
      title: "",
      description: "",
      shortDescription: "",
      icon: "scale",
      price: "",
      duration: "",
      features: [],
      link: "",
      linkText: "Más información",
      isHighlighted: false,
      category: "",
    });
    setIsAddingNew(true);
    setEditingService(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetSection = isAddingNew ? selectedSection : editingService;
      if (!targetSection) return;

      const page = pagesWithServices.find((p) => p.id === targetSection.pageId);
      const section = page?.sections.find((s) => s.id === targetSection.sectionId);
      if (!section) return;

      const content = section.content || {};
      const cards: Service[] = content.cards || [];

      if (isAddingNew) {
        cards.push(formData);
      } else if (editingService) {
        cards[editingService.serviceIndex] = formData;
      }

      const response = await fetch(`/api/cms/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, cards },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      router.refresh();
      setEditingService(null);
      setIsAddingNew(false);
      setSelectedSection(null);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    pageId: string,
    sectionId: string,
    serviceIndex: number
  ) => {
    setSaving(true);
    try {
      const page = pagesWithServices.find((p) => p.id === pageId);
      const section = page?.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const content = section.content || {};
      const cards: Service[] = [...(content.cards || [])];
      cards.splice(serviceIndex, 1);

      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, cards },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar el servicio");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (sectionId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVisible: !currentVisibility,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar visibilidad");
      }

      router.refresh();
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    const updated = [...(formData.features || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, features: updated });
  };

  const ServiceForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre del servicio *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Arbitraje Comercial"
          />
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Arbitraje, Mediación, etc."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción corta</Label>
        <Input
          value={formData.shortDescription}
          onChange={(e) =>
            setFormData({ ...formData, shortDescription: e.target.value })
          }
          placeholder="Breve resumen del servicio..."
        />
      </div>

      <div className="space-y-2">
        <Label>Descripción completa</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Descripción detallada del servicio..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Icono</Label>
          <Select
            value={formData.icon}
            onValueChange={(value) => setFormData({ ...formData, icon: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((icon) => (
                <SelectItem key={icon.value} value={icon.value}>
                  {icon.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Precio / Tarifa</Label>
          <Input
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="S/ 500.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Duración estimada</Label>
          <Input
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="30-60 días"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Enlace</Label>
          <Input
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="/servicios/arbitraje-comercial"
          />
        </div>
        <div className="space-y-2">
          <Label>Texto del enlace</Label>
          <Input
            value={formData.linkText}
            onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
            placeholder="Más información"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isHighlighted}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isHighlighted: checked })
          }
        />
        <Label>Destacar este servicio</Label>
      </div>

      {/* Características */}
      <div className="space-y-2">
        <Label>Características / Beneficios</Label>
        <div className="flex gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="Ej: Resolución rápida de conflictos"
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addFeature())
            }
          />
          <Button type="button" size="sm" onClick={addFeature}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.features && formData.features.length > 0 && (
          <div className="space-y-1 mt-2">
            {formData.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted px-3 py-1 rounded text-sm"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {feature}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Servicios
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los servicios del centro de arbitraje
            </p>
          </div>
        </div>
      </div>

      {pagesWithServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No hay secciones de servicios
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero debes crear páginas de servicios en el CMS.
            </p>
            <Link href="/admin/cms/pages">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ir a Páginas
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pagesWithServices.map((page) => (
            <div key={page.id}>
              {page.sections.map((section) => {
                const content = section.content || {};
                const cards: Service[] = content.cards || [];

                return (
                  <Card key={section.id} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {section.title || "Sección de Servicios"}
                            <Badge variant="outline" className="text-xs">
                              /{page.slug}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {section.subtitle || `${cards.length} servicios`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleVisibility(section.id, section.isVisible)
                            }
                          >
                            {section.isVisible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/${page.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => handleAddNew(page.id, section.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Agregar Servicio</DialogTitle>
                                <DialogDescription>
                                  Completa la información del nuevo servicio
                                </DialogDescription>
                              </DialogHeader>
                              <ServiceForm />
                              <DialogFooter>
                                <Button
                                  onClick={handleSave}
                                  disabled={saving || !formData.title}
                                >
                                  {saving && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  )}
                                  Guardar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {cards.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay servicios en esta sección</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {cards.map((service, index) => (
                            <Card
                              key={index}
                              className={`relative group ${
                                service.isHighlighted
                                  ? "ring-2 ring-primary"
                                  : ""
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium truncate">
                                        {service.title}
                                      </p>
                                      {service.isHighlighted && (
                                        <Badge className="text-[10px]">
                                          Destacado
                                        </Badge>
                                      )}
                                    </div>
                                    {service.category && (
                                      <Badge variant="outline" className="text-[10px] mt-1">
                                        {service.category}
                                      </Badge>
                                    )}
                                    {service.shortDescription && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {service.shortDescription}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      {service.price && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          {service.price}
                                        </span>
                                      )}
                                      {service.duration && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {service.duration}
                                        </span>
                                      )}
                                    </div>
                                    {service.features &&
                                      service.features.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs text-muted-foreground">
                                            {service.features.length}{" "}
                                            características
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleEdit(
                                            page.id,
                                            section.id,
                                            index,
                                            service
                                          )
                                        }
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Editar Servicio</DialogTitle>
                                      </DialogHeader>
                                      <ServiceForm />
                                      <DialogFooter>
                                        <Button
                                          onClick={handleSave}
                                          disabled={saving || !formData.title}
                                        >
                                          {saving && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          )}
                                          Guardar
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          ¿Eliminar servicio?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará el servicio{" "}
                                          {service.title}.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDelete(
                                              page.id,
                                              section.id,
                                              index
                                            )
                                          }
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
