"use client";

/**
 * CAARD - Cliente de Gestión de Sedes
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Clock,
  Building2,
  Map,
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

interface Location {
  title: string;
  description?: string;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  hours?: string;
  mapUrl?: string;
  image?: string;
  isMainOffice?: boolean;
}

interface LocationSection {
  id: string;
  title: string | null;
  subtitle?: string | null;
  content: any;
  type: string;
  isVisible: boolean;
}

interface PageWithLocations {
  id: string;
  title: string;
  slug: string;
  sections: LocationSection[];
}

interface LocationsManagementClientProps {
  pagesWithLocations: PageWithLocations[];
}

export function LocationsManagementClient({
  pagesWithLocations,
}: LocationsManagementClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState<{
    pageId: string;
    sectionId: string;
    locationIndex: number;
    location: Location;
  } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    pageId: string;
    sectionId: string;
  } | null>(null);

  const [formData, setFormData] = useState<Location>({
    title: "",
    description: "",
    address: "",
    city: "",
    country: "Perú",
    phone: "",
    email: "",
    hours: "",
    mapUrl: "",
    image: "",
    isMainOffice: false,
  });

  const handleEdit = (
    pageId: string,
    sectionId: string,
    locationIndex: number,
    location: Location
  ) => {
    setEditingLocation({ pageId, sectionId, locationIndex, location });
    setFormData({ ...location });
    setIsAddingNew(false);
  };

  const handleAddNew = (pageId: string, sectionId: string) => {
    setSelectedSection({ pageId, sectionId });
    setFormData({
      title: "",
      description: "",
      address: "",
      city: "",
      country: "Perú",
      phone: "",
      email: "",
      hours: "",
      mapUrl: "",
      image: "",
      isMainOffice: false,
    });
    setIsAddingNew(true);
    setEditingLocation(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetSection = isAddingNew ? selectedSection : editingLocation;
      if (!targetSection) return;

      const page = pagesWithLocations.find((p) => p.id === targetSection.pageId);
      const section = page?.sections.find((s) => s.id === targetSection.sectionId);
      if (!section) return;

      const content = section.content || {};
      const cards: Location[] = content.cards || [];

      if (isAddingNew) {
        cards.push(formData);
      } else if (editingLocation) {
        cards[editingLocation.locationIndex] = formData;
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
      setEditingLocation(null);
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
    locationIndex: number
  ) => {
    setSaving(true);
    try {
      const page = pagesWithLocations.find((p) => p.id === pageId);
      const section = page?.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const content = section.content || {};
      const cards: Location[] = [...(content.cards || [])];
      cards.splice(locationIndex, 1);

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
      alert("Error al eliminar la sede");
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

  const LocationForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre de la sede *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Sede Principal Lima"
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.isMainOffice}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isMainOffice: checked })
            }
          />
          <Label>Es la sede principal</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Breve descripción de la sede..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Dirección *</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Av. Ejemplo 123, Piso 5, Oficina 501"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Lima"
          />
        </div>
        <div className="space-y-2">
          <Label>País</Label>
          <Input
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Perú"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+51 1 234 5678"
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="sede@caard.org"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Horario de atención</Label>
        <Input
          value={formData.hours}
          onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
          placeholder="Lunes a Viernes: 9:00 - 18:00"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>URL del mapa (Google Maps embed)</Label>
          <Input
            value={formData.mapUrl}
            onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
            placeholder="https://www.google.com/maps/embed?..."
          />
        </div>
        <div className="space-y-2">
          <Label>URL de imagen</Label>
          <Input
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">Sedes</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las sedes y ubicaciones del centro
            </p>
          </div>
        </div>
      </div>

      {pagesWithLocations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay secciones de sedes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero debes crear la página de sedes en el CMS.
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
          {pagesWithLocations.map((page) => (
            <div key={page.id}>
              {page.sections
                .filter((s) => s.type === "CARDS")
                .map((section) => {
                  const content = section.content || {};
                  const cards: Location[] = content.cards || [];

                  return (
                    <Card key={section.id} className="mb-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {section.title || "Sección de Sedes"}
                              <Badge variant="outline" className="text-xs">
                                /{page.slug}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {section.subtitle || `${cards.length} sedes`}
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
                                  <DialogTitle>Agregar Sede</DialogTitle>
                                  <DialogDescription>
                                    Completa la información de la nueva sede
                                  </DialogDescription>
                                </DialogHeader>
                                <LocationForm />
                                <DialogFooter>
                                  <Button
                                    onClick={handleSave}
                                    disabled={
                                      saving || !formData.title || !formData.address
                                    }
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
                            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No hay sedes en esta sección</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {cards.map((location, index) => (
                              <Card key={index} className="relative group">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                      <Building2 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">
                                          {location.title}
                                        </p>
                                        {location.isMainOffice && (
                                          <Badge className="text-[10px]">
                                            Principal
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">
                                          {location.address}
                                          {location.city && `, ${location.city}`}
                                        </span>
                                      </p>
                                      {location.phone && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                          <Phone className="h-3 w-3" />
                                          {location.phone}
                                        </p>
                                      )}
                                      {location.email && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {location.email}
                                        </p>
                                      )}
                                      {location.hours && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {location.hours}
                                        </p>
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
                                              location
                                            )
                                          }
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>Editar Sede</DialogTitle>
                                        </DialogHeader>
                                        <LocationForm />
                                        <DialogFooter>
                                          <Button
                                            onClick={handleSave}
                                            disabled={
                                              saving ||
                                              !formData.title ||
                                              !formData.address
                                            }
                                          >
                                            {saving && (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            )}
                                            Guardar
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>

                                    {location.mapUrl && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          window.open(location.mapUrl, "_blank")
                                        }
                                      >
                                        <Map className="h-3 w-3" />
                                      </Button>
                                    )}

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
                                            ¿Eliminar sede?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción eliminará la sede{" "}
                                            {location.title}.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancelar
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDelete(page.id, section.id, index)
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
