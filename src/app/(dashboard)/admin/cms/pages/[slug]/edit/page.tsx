"use client";

/**
 * CAARD CMS - Editor de Página con Secciones
 */

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  Type,
  Image,
  Layout,
  List,
  HelpCircle,
  Users,
  BarChart3,
  MessageSquare,
  Mail,
  Clock,
  Code,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  DollarSign,
  Grid3X3,
  SplitSquareHorizontal,
  Building2,
  FileEdit,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisualSectionEditor } from "@/components/cms/visual-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  sections: CmsSection[];
}

interface CmsSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  bgColor: string | null;
  padding: string | null;
  sortOrder: number;
  isVisible: boolean;
}

const SECTION_TYPES = [
  // Secciones principales
  { type: "HERO", label: "Banner Principal", icon: Image, description: "Imagen o video de cabecera con título y botones" },
  { type: "SLIDER", label: "Carrusel/Slider", icon: Layers, description: "Carrusel de imágenes con textos y botones" },
  { type: "BANNER", label: "Banner Múltiple", icon: Layers, description: "Banner con múltiples slides" },

  // Contenido
  { type: "TEXT", label: "Texto", icon: Type, description: "Contenido de texto enriquecido" },
  { type: "CARDS", label: "Tarjetas", icon: Layout, description: "Grid de tarjetas informativas" },
  { type: "FEATURE_GRID", label: "Grid de Características", icon: Grid3X3, description: "Características con iconos en grid" },
  { type: "SPLIT_CONTENT", label: "Contenido Dividido", icon: SplitSquareHorizontal, description: "Imagen + texto lado a lado" },

  // Media
  { type: "VIDEO", label: "Video", icon: Video, description: "Video de YouTube, Vimeo o archivo" },
  { type: "GALLERY", label: "Galería", icon: ImageIcon, description: "Galería de imágenes" },
  { type: "EMBED", label: "Embebido", icon: Code, description: "Contenido embebido (mapa, etc.)" },

  // Interactivo
  { type: "ACCORDION", label: "Acordeón/FAQ", icon: List, description: "Preguntas frecuentes expandibles" },
  { type: "CTA", label: "Llamada a Acción", icon: MessageSquare, description: "Botón con mensaje destacado" },
  { type: "STATS", label: "Estadísticas", icon: BarChart3, description: "Números destacados animados" },
  { type: "PRICING", label: "Precios/Planes", icon: DollarSign, description: "Tabla de precios con planes" },

  // Personas
  { type: "TEAM", label: "Equipo", icon: Users, description: "Miembros del equipo" },
  { type: "TESTIMONIALS", label: "Testimonios", icon: MessageSquare, description: "Opiniones de clientes" },

  // Formularios
  { type: "CONTACT_FORM", label: "Formulario Contacto", icon: Mail, description: "Formulario de contacto predefinido" },
  { type: "DYNAMIC_FORM", label: "Formulario Dinámico", icon: FileEdit, description: "Formulario personalizable" },

  // Otros
  { type: "TIMELINE", label: "Línea de Tiempo", icon: Clock, description: "Historia cronológica" },
  { type: "LOGO_CLOUD", label: "Logos/Clientes", icon: Building2, description: "Logos de clientes o partners" },
  { type: "CUSTOM", label: "Personalizado", icon: Code, description: "HTML/JSON personalizado" },
];

export default function EditCmsPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [page, setPage] = useState<CmsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal para agregar sección
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedSectionType, setSelectedSectionType] = useState<string | null>(null);

  // Sección expandida para editar
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<CmsSection | null>(null);

  useEffect(() => {
    loadPage();
  }, [slug]);

  async function loadPage() {
    try {
      // Usar edit=true para obtener TODAS las secciones, incluyendo las ocultas
      const response = await fetch(`/api/cms/pages/${slug}?edit=true`);
      if (!response.ok) {
        router.push("/admin/cms/pages");
        return;
      }
      const data = await response.json();
      setPage(data);
    } catch (error) {
      console.error("Error loading page:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function savePage() {
    if (!page) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/cms/pages/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page.title,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          isPublished: page.isPublished,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al guardar");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  }

  async function addSection(type: string) {
    if (!page) return;

    try {
      const response = await fetch("/api/cms/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          type,
          title: `Nueva sección ${type}`,
        }),
      });

      if (response.ok) {
        loadPage();
        setShowAddSection(false);
        setSelectedSectionType(null);
      }
    } catch (error) {
      console.error("Error adding section:", error);
    }
  }

  async function updateSection(sectionId: string, data: Partial<CmsSection>) {
    try {
      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        loadPage();
      }
    } catch (error) {
      console.error("Error updating section:", error);
    }
  }

  async function deleteSection(sectionId: string) {
    try {
      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadPage();
      }
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  }

  async function moveSection(sectionId: string, direction: "up" | "down") {
    if (!page) return;

    const sectionIndex = page.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return;

    const newIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
    if (newIndex < 0 || newIndex >= page.sections.length) return;

    const currentSection = page.sections[sectionIndex];
    const targetSection = page.sections[newIndex];

    // Intercambiar sortOrder
    await Promise.all([
      updateSection(currentSection.id, { sortOrder: targetSection.sortOrder }),
      updateSection(targetSection.id, { sortOrder: currentSection.sortOrder }),
    ]);

    loadPage();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return <div>Página no encontrada</div>;
  }

  const sectionTypeConfig = (type: string) =>
    SECTION_TYPES.find((t) => t.type === type) || SECTION_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/cms/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{page.title}</h1>
            <p className="text-muted-foreground">/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/${page.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver página
            </Link>
          </Button>
          <Button onClick={savePage} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Secciones */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Secciones</h2>
            <Button onClick={() => setShowAddSection(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Sección
            </Button>
          </div>

          {page.sections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layout className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Esta página no tiene secciones
                </p>
                <Button onClick={() => setShowAddSection(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primera sección
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {page.sections.map((section, index) => {
                const config = sectionTypeConfig(section.type);
                const Icon = config.icon;
                const isExpanded = expandedSection === section.id;

                return (
                  <Card key={section.id} className={!section.isVisible ? "opacity-60" : ""}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <div className="p-2 rounded bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {section.title || config.label}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {config.label}
                              </Badge>
                              {!section.isVisible && (
                                <Badge variant="secondary" className="text-xs">
                                  Oculto
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveSection(section.id, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveSection(section.id, "down")}
                            disabled={index === page.sections.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedSection(isExpanded ? null : section.id)
                            }
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateSection(section.id, { isVisible: !section.isVisible })
                            }
                          >
                            {section.isVisible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="border-t pt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Título de sección</Label>
                            <Input
                              defaultValue={section.title || ""}
                              onBlur={(e) =>
                                updateSection(section.id, { title: e.target.value || null })
                              }
                              placeholder="Título opcional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subtítulo</Label>
                            <Input
                              defaultValue={section.subtitle || ""}
                              onBlur={(e) =>
                                updateSection(section.id, { subtitle: e.target.value || null })
                              }
                              placeholder="Subtítulo opcional"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Color de fondo</Label>
                            <Input
                              defaultValue={section.bgColor || ""}
                              onBlur={(e) =>
                                updateSection(section.id, { bgColor: e.target.value || null })
                              }
                              placeholder="#ffffff"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Padding</Label>
                            <Select
                              defaultValue={section.padding || "md"}
                              onValueChange={(value) =>
                                updateSection(section.id, { padding: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sm">Pequeño</SelectItem>
                                <SelectItem value="md">Mediano</SelectItem>
                                <SelectItem value="lg">Grande</SelectItem>
                                <SelectItem value="xl">Extra grande</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Editor de contenido visual */}
                        <Tabs defaultValue="visual" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="visual">Editor Visual</TabsTrigger>
                            <TabsTrigger value="json">JSON</TabsTrigger>
                          </TabsList>
                          <TabsContent value="visual" className="mt-4">
                            <VisualSectionEditor
                              type={section.type}
                              content={section.content || {}}
                              onChange={(content) =>
                                updateSection(section.id, { content })
                              }
                            />
                          </TabsContent>
                          <TabsContent value="json" className="mt-4">
                            <div className="space-y-2">
                              <Label>Contenido (JSON)</Label>
                              <Textarea
                                className="font-mono text-sm"
                                rows={8}
                                defaultValue={JSON.stringify(section.content || {}, null, 2)}
                                onBlur={(e) => {
                                  try {
                                    const content = JSON.parse(e.target.value);
                                    updateSection(section.id, { content });
                                  } catch {
                                    // Invalid JSON, ignore
                                  }
                                }}
                                placeholder="{}"
                              />
                              <p className="text-xs text-muted-foreground">
                                Edita el contenido en formato JSON (avanzado)
                              </p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={page.title}
                  onChange={(e) => setPage({ ...page, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta título</Label>
                <Input
                  id="metaTitle"
                  value={page.metaTitle || ""}
                  onChange={(e) => setPage({ ...page, metaTitle: e.target.value })}
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta descripción</Label>
                <Textarea
                  id="metaDescription"
                  value={page.metaDescription || ""}
                  onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
                  maxLength={160}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Label htmlFor="published">Publicada</Label>
                <Switch
                  id="published"
                  checked={page.isPublished}
                  onCheckedChange={(checked) =>
                    setPage({ ...page, isPublished: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal para agregar sección */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Sección</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de sección que deseas agregar a la página
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-3 py-4">
            {SECTION_TYPES.map((sectionType) => {
              const Icon = sectionType.icon;
              const isSelected = selectedSectionType === sectionType.type;

              return (
                <button
                  key={sectionType.type}
                  onClick={() => setSelectedSectionType(sectionType.type)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{sectionType.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {sectionType.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSection(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedSectionType && addSection(selectedSectionType)}
              disabled={!selectedSectionType}
            >
              Agregar Sección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
