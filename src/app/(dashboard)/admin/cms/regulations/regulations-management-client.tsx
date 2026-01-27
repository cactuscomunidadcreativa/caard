"use client";

/**
 * CAARD - Cliente de Gestión de Reglamentos
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Download,
  Calendar,
  File,
  History,
  Archive,
  RotateCcw,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DocumentUploader } from "@/components/cms/document-uploader";

interface RegulationHistory {
  version: string;
  fileUrl: string;
  effectiveDate: string;
  expirationDate?: string;
  archivedAt: string;
  archivedBy?: string;
}

interface Regulation {
  title: string;
  description?: string;
  version?: string;
  effectiveDate?: string;
  expirationDate?: string;
  fileUrl?: string;
  fileType?: string;
  category?: string;
  isActive?: boolean;
  history?: RegulationHistory[];
}

interface RegulationSection {
  id: string;
  title: string | null;
  subtitle?: string | null;
  content: any;
  type: string;
  isVisible: boolean;
}

interface PageWithRegulations {
  id: string;
  title: string;
  slug: string;
  sections: RegulationSection[];
}

interface RegulationsManagementClientProps {
  pagesWithRegulations: PageWithRegulations[];
}

const CATEGORY_OPTIONS = [
  { value: "general", label: "Reglamento General" },
  { value: "arbitration", label: "Reglamento de Arbitraje" },
  { value: "emergency", label: "Arbitraje de Emergencia" },
  { value: "fees", label: "Tarifas y Aranceles" },
  { value: "ethics", label: "Código de Ética" },
  { value: "internal", label: "Normativa Interna" },
  { value: "other", label: "Otro" },
];

export function RegulationsManagementClient({
  pagesWithRegulations,
}: RegulationsManagementClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<{
    pageId: string;
    sectionId: string;
    regulationIndex: number;
    regulation: Regulation;
  } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    pageId: string;
    sectionId: string;
  } | null>(null);
  const [showHistory, setShowHistory] = useState<{
    regulation: Regulation;
    pageId: string;
    sectionId: string;
    index: number;
  } | null>(null);
  const [createNewVersion, setCreateNewVersion] = useState(false);

  const [formData, setFormData] = useState<Regulation>({
    title: "",
    description: "",
    version: "",
    effectiveDate: "",
    fileUrl: "",
    fileType: "pdf",
    category: "general",
    isActive: true,
  });

  const handleEdit = (
    pageId: string,
    sectionId: string,
    regulationIndex: number,
    regulation: Regulation
  ) => {
    setEditingRegulation({ pageId, sectionId, regulationIndex, regulation });
    setFormData({
      ...regulation,
      isActive: regulation.isActive !== false,
    });
    setIsAddingNew(false);
  };

  const handleAddNew = (pageId: string, sectionId: string) => {
    setSelectedSection({ pageId, sectionId });
    setFormData({
      title: "",
      description: "",
      version: "",
      effectiveDate: "",
      fileUrl: "",
      fileType: "pdf",
      category: "general",
      isActive: true,
    });
    setIsAddingNew(true);
    setEditingRegulation(null);
  };

  const handleSave = async (createNewVersion = false) => {
    setSaving(true);
    try {
      const targetSection = isAddingNew ? selectedSection : editingRegulation;
      if (!targetSection) return;

      const page = pagesWithRegulations.find((p) => p.id === targetSection.pageId);
      const section = page?.sections.find((s) => s.id === targetSection.sectionId);
      if (!section) return;

      const content = section.content || {};
      const itemsKey = content.items ? "items" : content.cards ? "cards" : "documents";
      const items: Regulation[] = content[itemsKey] || [];

      if (isAddingNew) {
        items.push({ ...formData, history: [] });
      } else if (editingRegulation) {
        const existingRegulation = items[editingRegulation.regulationIndex];

        // Si se está creando nueva versión y hay cambio de archivo
        if (createNewVersion && existingRegulation.fileUrl && existingRegulation.fileUrl !== formData.fileUrl) {
          // Archivar la versión anterior
          const historyEntry: RegulationHistory = {
            version: existingRegulation.version || "1.0",
            fileUrl: existingRegulation.fileUrl,
            effectiveDate: existingRegulation.effectiveDate || new Date().toISOString().split("T")[0],
            expirationDate: new Date().toISOString().split("T")[0],
            archivedAt: new Date().toISOString(),
          };

          const updatedHistory = [...(existingRegulation.history || []), historyEntry];

          items[editingRegulation.regulationIndex] = {
            ...formData,
            history: updatedHistory,
          };
        } else {
          // Edición normal sin crear nueva versión
          items[editingRegulation.regulationIndex] = {
            ...formData,
            history: existingRegulation.history || [],
          };
        }
      }

      const response = await fetch(`/api/cms/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, [itemsKey]: items },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      router.refresh();
      setEditingRegulation(null);
      setIsAddingNew(false);
      setSelectedSection(null);
      setShowHistory(null);
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
    regulationIndex: number
  ) => {
    setSaving(true);
    try {
      const page = pagesWithRegulations.find((p) => p.id === pageId);
      const section = page?.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const content = section.content || {};
      const itemsKey = content.items ? "items" : content.cards ? "cards" : "documents";
      const items: Regulation[] = [...(content[itemsKey] || [])];
      items.splice(regulationIndex, 1);

      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, [itemsKey]: items },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar el reglamento");
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

  const RegulationForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="space-y-2">
        <Label>Título del reglamento *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Reglamento de Arbitraje CAARD"
        />
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Breve descripción del contenido del reglamento..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Versión</Label>
          <Input
            value={formData.version}
            onChange={(e) =>
              setFormData({ ...formData, version: e.target.value })
            }
            placeholder="v2.1, 2024, etc."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fecha de vigencia</Label>
        <Input
          type="date"
          value={formData.effectiveDate}
          onChange={(e) =>
            setFormData({ ...formData, effectiveDate: e.target.value })
          }
        />
      </div>

      <DocumentUploader
        label="Documento del reglamento"
        value={formData.fileUrl}
        onChange={(url, fileInfo) => {
          setFormData({
            ...formData,
            fileUrl: url,
            fileType: fileInfo?.fileType || formData.fileType,
          });
        }}
        category="reglamentos"
        placeholder="Sube el PDF/Excel del reglamento o pega un enlace de Drive/WeTransfer"
      />

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label>Reglamento vigente</Label>
      </div>

      {/* Opción de crear nueva versión (solo al editar) */}
      {editingRegulation && editingRegulation.regulation.fileUrl && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createNewVersion"
              checked={createNewVersion}
              onCheckedChange={(checked) => setCreateNewVersion(checked as boolean)}
            />
            <Label htmlFor="createNewVersion" className="text-sm font-medium text-amber-800">
              Crear nueva versión (archivar versión anterior)
            </Label>
          </div>
          <p className="text-xs text-amber-700">
            Al activar esta opción, la versión actual del documento se guardará en el historial
            con la fecha de hoy como fecha de caducidad.
          </p>
        </div>
      )}
    </div>
  );

  // Componente para mostrar el historial
  const HistoryPanel = () => {
    if (!showHistory) return null;

    const history = showHistory.regulation.history || [];

    return (
      <Sheet open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de versiones
            </SheetTitle>
            <SheetDescription>
              {showHistory.regulation.title}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            {/* Versión actual */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Versión actual</h4>
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{showHistory.regulation.version || "Sin versión"}</p>
                      <p className="text-xs text-muted-foreground">
                        Vigente desde: {showHistory.regulation.effectiveDate
                          ? new Date(showHistory.regulation.effectiveDate).toLocaleDateString("es-PE")
                          : "No especificada"}
                      </p>
                      {showHistory.regulation.fileUrl && (
                        <a
                          href={showHistory.regulation.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <Download className="h-3 w-3" />
                          Descargar documento actual
                        </a>
                      )}
                    </div>
                    <Badge>Vigente</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-4" />

            {/* Versiones anteriores */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Versiones anteriores ({history.length})
              </h4>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay versiones anteriores</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...history].reverse().map((item, index) => (
                    <Card key={index} className="border-muted">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.version}</p>
                            <p className="text-xs text-muted-foreground">
                              Vigente: {new Date(item.effectiveDate).toLocaleDateString("es-PE")}
                              {item.expirationDate && (
                                <> - {new Date(item.expirationDate).toLocaleDateString("es-PE")}</>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Archivado: {new Date(item.archivedAt).toLocaleDateString("es-PE")}
                            </p>
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                              >
                                <Download className="h-3 w-3" />
                                Descargar versión archivada
                              </a>
                            )}
                          </div>
                          <Badge variant="secondary">Archivado</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  };

  // Get all regulations from all sections
  const getAllRegulations = (page: PageWithRegulations) => {
    const allItems: Array<{
      section: RegulationSection;
      items: Regulation[];
      itemsKey: string;
    }> = [];

    page.sections.forEach((section) => {
      const content = section.content || {};
      const itemsKey = content.items
        ? "items"
        : content.cards
        ? "cards"
        : "documents";
      const items = content[itemsKey] || [];
      if (items.length > 0 || section.type === "ACCORDION") {
        allItems.push({ section, items, itemsKey });
      }
    });

    return allItems;
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Reglamentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los reglamentos y documentos normativos
            </p>
          </div>
        </div>
      </div>

      {pagesWithRegulations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No hay secciones de reglamentos
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero debes crear la página de reglamentos en el CMS.
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
          {pagesWithRegulations.map((page) => {
            const sectionsWithItems = getAllRegulations(page);

            return (
              <div key={page.id}>
                {sectionsWithItems.map(({ section, items }) => (
                  <Card key={section.id} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {section.title || "Sección de Reglamentos"}
                            <Badge variant="outline" className="text-xs">
                              /{page.slug}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {section.subtitle || `${items.length} documentos`}
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
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Agregar Reglamento</DialogTitle>
                                <DialogDescription>
                                  Completa la información del nuevo reglamento
                                </DialogDescription>
                              </DialogHeader>
                              <RegulationForm />
                              <DialogFooter>
                                <Button
                                  onClick={() => handleSave(false)}
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
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay reglamentos en esta sección</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.map((regulation: Regulation, index: number) => (
                            <Card
                              key={index}
                              className={`relative group ${
                                regulation.isActive === false
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium">
                                        {regulation.title}
                                      </p>
                                      {regulation.version && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px]"
                                        >
                                          {regulation.version}
                                        </Badge>
                                      )}
                                      {regulation.isActive === false && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px]"
                                        >
                                          No vigente
                                        </Badge>
                                      )}
                                      {regulation.category && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px]"
                                        >
                                          {CATEGORY_OPTIONS.find(
                                            (c) => c.value === regulation.category
                                          )?.label || regulation.category}
                                        </Badge>
                                      )}
                                      {regulation.history && regulation.history.length > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] cursor-pointer"
                                          onClick={() =>
                                            setShowHistory({
                                              regulation,
                                              pageId: page.id,
                                              sectionId: section.id,
                                              index,
                                            })
                                          }
                                        >
                                          <History className="h-3 w-3 mr-1" />
                                          {regulation.history.length} versión(es) anterior(es)
                                        </Badge>
                                      )}
                                    </div>
                                    {regulation.description && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {regulation.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      {regulation.effectiveDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          Vigente desde:{" "}
                                          {new Date(
                                            regulation.effectiveDate
                                          ).toLocaleDateString("es-PE")}
                                        </span>
                                      )}
                                      {regulation.fileType && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] uppercase"
                                        >
                                          {regulation.fileType}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick actions */}
                                  {regulation.fileUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="shrink-0"
                                      onClick={() =>
                                        window.open(regulation.fileUrl, "_blank")
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Ver
                                    </Button>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  {/* History button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setShowHistory({
                                        regulation,
                                        pageId: page.id,
                                        sectionId: section.id,
                                        index,
                                      })
                                    }
                                    title="Ver historial de versiones"
                                  >
                                    <History className="h-3 w-3" />
                                  </Button>

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
                                            regulation
                                          )
                                        }
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Editar Reglamento
                                        </DialogTitle>
                                      </DialogHeader>
                                      <RegulationForm />
                                      <DialogFooter className="flex-col sm:flex-row gap-2">
                                        <Button
                                          onClick={() => handleSave(createNewVersion)}
                                          disabled={saving || !formData.title}
                                        >
                                          {saving && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          )}
                                          {createNewVersion ? "Guardar como nueva versión" : "Guardar"}
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
                                          ¿Eliminar reglamento?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará el reglamento "
                                          {regulation.title}".
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
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Panel de historial */}
      <HistoryPanel />
    </div>
  );
}
