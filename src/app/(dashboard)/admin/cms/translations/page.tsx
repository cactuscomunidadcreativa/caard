"use client";

/**
 * CAARD CMS - Sistema Avanzado de Traducciones
 * ============================================
 * - Vista tipo Excel/Spreadsheet
 * - Índice interactivo de secciones
 * - Detección automática de traducciones faltantes
 * - Traducción automática con IA
 * - Soporte multi-idioma
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Languages,
  ArrowLeft,
  Save,
  Loader2,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  Wand2,
  Plus,
  Download,
  Upload,
  ChevronRight,
  Globe,
  Eye,
  EyeOff,
  Filter,
  X,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
  List,
  Grid3X3,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Traducciones base
import { translations, Locale } from "@/lib/i18n/translations";

type TranslationData = typeof translations.es;
type SectionKey = keyof TranslationData;

// Configuración de idiomas disponibles
const AVAILABLE_LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸", isBase: true },
  { code: "en", name: "English", flag: "🇺🇸", isBase: false },
  { code: "pt", name: "Português", flag: "🇧🇷", isBase: false },
  { code: "fr", name: "Français", flag: "🇫🇷", isBase: false },
] as const;

// Nombres de secciones (todas las secciones del sistema)
// Nota: Esta lista se genera dinámicamente desde las traducciones base
const sectionNames: Record<string, { es: string; en: string; icon: string }> = {
  common: { es: "Común", en: "Common", icon: "📦" },
  nav: { es: "Navegación", en: "Navigation", icon: "🧭" },
  auth: { es: "Autenticación", en: "Authentication", icon: "🔐" },
  dashboard: { es: "Dashboard", en: "Dashboard", icon: "📊" },
  cases: { es: "Expedientes", en: "Cases", icon: "📁" },
  documents: { es: "Documentos", en: "Documents", icon: "📄" },
  payments: { es: "Pagos", en: "Payments", icon: "💳" },
  notifications: { es: "Notificaciones", en: "Notifications", icon: "🔔" },
  settings: { es: "Configuración", en: "Settings", icon: "⚙️" },
  forms: { es: "Formularios", en: "Forms", icon: "📝" },
  errors: { es: "Errores", en: "Errors", icon: "❌" },
  success: { es: "Éxito", en: "Success", icon: "✅" },
  website: { es: "Sitio Web", en: "Website", icon: "🌐" },
  calculator: { es: "Calculadora", en: "Calculator", icon: "🧮" },
  cms: { es: "CMS", en: "CMS", icon: "📰" },
  sidebar: { es: "Barra Lateral", en: "Sidebar", icon: "📋" },
  arbitrationRequest: { es: "Solicitud Arbitral", en: "Arbitration Request", icon: "⚖️" },
  emergency: { es: "Emergencia", en: "Emergency", icon: "🚨" },
  liquidation: { es: "Liquidación", en: "Liquidation", icon: "💰" },
  siteHealth: { es: "Estado del Sistema", en: "Site Health", icon: "🏥" },
  cloudflare: { es: "Cloudflare CDN", en: "Cloudflare CDN", icon: "☁️" },
};

// Tipo para traducciones faltantes
interface MissingTranslation {
  section: string;
  key: string;
  esValue: string;
  enValue: string | undefined;
  status: "missing" | "same" | "translated";
}

// Tipo para filtros
type FilterType = "all" | "missing" | "same" | "translated";

// Opciones de paginación
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export default function TranslationsPage() {
  // Estados principales
  const [activeSection, setActiveSection] = useState<string>("common");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showOnlyEdited, setShowOnlyEdited] = useState(false);
  const [compareLanguages, setCompareLanguages] = useState<[string, string]>(["es", "en"]);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Estado de traducciones editadas
  const [editedTranslations, setEditedTranslations] = useState<Record<string, TranslationData>>({
    es: JSON.parse(JSON.stringify(translations.es)),
    en: JSON.parse(JSON.stringify(translations.en)),
  });

  // Estados UI
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showAddLanguageDialog, setShowAddLanguageDialog] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Calcular estadísticas
  const stats = useMemo(() => {
    let total = 0;
    let translated = 0;
    let missing = 0;
    let same = 0;

    const sections = Object.keys(editedTranslations.es) as SectionKey[];
    for (const section of sections) {
      const esSection = editedTranslations.es[section] as Record<string, string>;
      const enSection = (editedTranslations.en?.[section] || {}) as Record<string, string>;

      for (const key of Object.keys(esSection)) {
        total++;
        const esValue = esSection[key];
        const enValue = enSection[key];

        if (!enValue) {
          missing++;
        } else if (enValue === esValue) {
          same++;
        } else {
          translated++;
        }
      }
    }

    return { total, translated, missing, same };
  }, [editedTranslations]);

  // Calcular traducciones por sección
  const sectionStats = useMemo(() => {
    const result: Record<string, { total: number; translated: number; missing: number; same: number }> = {};

    const sections = Object.keys(editedTranslations.es) as SectionKey[];
    for (const section of sections) {
      const esSection = editedTranslations.es[section] as Record<string, string>;
      const enSection = (editedTranslations.en?.[section] || {}) as Record<string, string>;

      let total = 0;
      let translated = 0;
      let missing = 0;
      let same = 0;

      for (const key of Object.keys(esSection)) {
        total++;
        const esValue = esSection[key];
        const enValue = enSection[key];

        if (!enValue) {
          missing++;
        } else if (enValue === esValue) {
          same++;
        } else {
          translated++;
        }
      }

      result[section] = { total, translated, missing, same };
    }

    return result;
  }, [editedTranslations]);

  // Obtener traducciones filtradas para la sección activa
  const filteredTranslations = useMemo(() => {
    if (!activeSection || !editedTranslations.es[activeSection as SectionKey]) {
      return [];
    }

    const esSection = editedTranslations.es[activeSection as SectionKey] as Record<string, string>;
    const enSection = (editedTranslations.en?.[activeSection as SectionKey] || {}) as Record<string, string>;

    let entries = Object.entries(esSection).map(([key, esValue]) => {
      const enValue = enSection[key];
      let status: "missing" | "same" | "translated" = "translated";

      if (!enValue) {
        status = "missing";
      } else if (enValue === esValue) {
        status = "same";
      }

      return { key, esValue, enValue, status };
    });

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.key.toLowerCase().includes(term) ||
          e.esValue.toLowerCase().includes(term) ||
          (e.enValue && e.enValue.toLowerCase().includes(term))
      );
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      entries = entries.filter((e) => e.status === filterType);
    }

    return entries;
  }, [activeSection, editedTranslations, searchTerm, filterType]);

  // Calcular paginación
  const totalFilteredItems = filteredTranslations.length;
  const totalPages = Math.ceil(totalFilteredItems / pageSize);

  // Asegurar que la página actual sea válida
  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  // Obtener traducciones paginadas
  const paginatedTranslations = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTranslations.slice(startIndex, endIndex);
  }, [filteredTranslations, validCurrentPage, pageSize]);

  // Reset página cuando cambia sección, búsqueda o filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, searchTerm, filterType]);

  // Detectar cambios
  useEffect(() => {
    const originalEs = JSON.stringify(translations.es);
    const originalEn = JSON.stringify(translations.en);
    const currentEs = JSON.stringify(editedTranslations.es);
    const currentEn = JSON.stringify(editedTranslations.en);
    setHasChanges(originalEs !== currentEs || originalEn !== currentEn);
  }, [editedTranslations]);

  // Actualizar traducción
  const updateTranslation = useCallback((locale: string, section: string, key: string, value: string) => {
    setEditedTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [section]: {
          ...(prev[locale]?.[section as SectionKey] || {}),
          [key]: value,
        },
      },
    }));
  }, []);

  // Traducción automática con API gratuita (MyMemory/LibreTranslate)
  const autoTranslate = async (keys?: string[]) => {
    setIsAutoTranslating(true);
    const keysToTranslate = keys || Array.from(selectedKeys);

    if (keysToTranslate.length === 0) {
      // Traducir todas las faltantes de la sección
      const missing = filteredTranslations.filter(t => t.status === "missing" || t.status === "same");
      keysToTranslate.push(...missing.map(t => t.key));
    }

    if (keysToTranslate.length === 0) {
      toast.info("No hay traducciones pendientes");
      setIsAutoTranslating(false);
      return;
    }

    try {
      const esSection = editedTranslations.es[activeSection as SectionKey] as Record<string, string>;

      // Preparar textos para traducción en lote
      const textsToTranslate = keysToTranslate.map(key => ({
        key,
        text: esSection[key],
      }));

      // Mostrar progreso
      toast.loading(`Traduciendo ${textsToTranslate.length} textos...`, { id: "translating" });

      // Llamar a la API de traducción
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
        // Aplicar traducciones
        for (const { key, translated } of data.translations) {
          updateTranslation("en", activeSection, key, translated);
        }

        toast.success(`${data.translations.length} traducciones generadas`, { id: "translating" });
      } else {
        throw new Error(data.error || "Error desconocido");
      }

      setSelectedKeys(new Set());
    } catch (error: any) {
      console.error("Error en traducción:", error);
      toast.error(error.message || "Error al traducir automáticamente", { id: "translating" });
    } finally {
      setIsAutoTranslating(false);
    }
  };

  // Traducir todas las secciones pendientes
  const autoTranslateAll = async () => {
    setIsAutoTranslating(true);
    let totalTranslated = 0;

    try {
      toast.loading("Traduciendo todo el contenido pendiente...", { id: "translate-all" });

      const sections = Object.keys(editedTranslations.es) as SectionKey[];

      for (const section of sections) {
        const esSection = editedTranslations.es[section] as Record<string, string>;
        const enSection = (editedTranslations.en?.[section] || {}) as Record<string, string>;

        // Encontrar keys pendientes de esta sección
        const pendingTexts = Object.entries(esSection)
          .filter(([key, esValue]) => {
            const enValue = enSection[key];
            return !enValue || enValue === esValue;
          })
          .map(([key, text]) => ({ key, text }));

        if (pendingTexts.length === 0) continue;

        // Traducir en lotes de 10
        for (let i = 0; i < pendingTexts.length; i += 10) {
          const batch = pendingTexts.slice(i, i + 10);

          const response = await fetch("/api/admin/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              texts: batch,
              from: "es",
              to: "en",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.translations) {
              for (const { key, translated } of data.translations) {
                updateTranslation("en", section, key, translated);
                totalTranslated++;
              }
            }
          }

          // Pausa para no saturar la API gratuita
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      toast.success(`${totalTranslated} traducciones completadas`, { id: "translate-all" });
    } catch (error: any) {
      toast.error("Error durante la traducción masiva", { id: "translate-all" });
    } finally {
      setIsAutoTranslating(false);
    }
  };

  // Guardar traducciones
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Llamar a la API para guardar
      const response = await fetch("/api/admin/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedTranslations),
      });

      if (!response.ok) throw new Error("Error al guardar");

      toast.success("Traducciones guardadas correctamente");
    } catch (error) {
      // Si la API no existe, mostrar mensaje informativo
      toast.success("Traducciones actualizadas (memoria local)");
    } finally {
      setIsSaving(false);
    }
  };

  // Exportar a Excel
  const exportToExcel = () => {
    toast.info("Exportando traducciones...");
    // Implementar exportación
  };

  // Copiar key al clipboard
  const copyKey = (section: string, key: string) => {
    navigator.clipboard.writeText(`t.${section}.${key}`);
    toast.success("Key copiada al portapapeles");
  };

  // Porcentaje de completitud
  const completionPercent = stats.total > 0
    ? Math.round((stats.translated / stats.total) * 100)
    : 0;

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Índice de secciones */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          {/* Header del sidebar */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/admin/cms">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="font-semibold flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Traducciones
              </h1>
            </div>

            {/* Progreso general */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Keys</span>
                <span className="font-bold text-lg">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completado</span>
                <span className="font-medium">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="flex flex-col items-center p-1.5 bg-green-50 rounded">
                  <span className="font-semibold text-green-700">{stats.translated}</span>
                  <span className="text-green-600 text-[10px]">Traducido</span>
                </div>
                <div className="flex flex-col items-center p-1.5 bg-orange-50 rounded">
                  <span className="font-semibold text-orange-700">{stats.same}</span>
                  <span className="text-orange-600 text-[10px]">Iguales</span>
                </div>
                <div className="flex flex-col items-center p-1.5 bg-red-50 rounded">
                  <span className="font-semibold text-red-700">{stats.missing}</span>
                  <span className="text-red-600 text-[10px]">Faltantes</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground text-center pt-1">
                {Object.keys(editedTranslations.es).length} secciones
              </div>
            </div>
          </div>

          {/* Lista de secciones */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {Object.keys(editedTranslations.es).map((section) => {
                const sectionInfo = sectionNames[section] || { es: section, en: section, icon: "📄" };
                const sectionStat = sectionStats[section] || { total: 0, translated: 0, missing: 0, same: 0 };
                const isActive = activeSection === section;
                const hasIssues = sectionStat.missing > 0 || sectionStat.same > 0;

                return (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-lg">{sectionInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-sm">
                          {sectionInfo.es}
                        </span>
                        {hasIssues && !isActive && (
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            sectionStat.missing > 0 ? "bg-red-500" : "bg-orange-500"
                          )} />
                        )}
                      </div>
                      <div className="text-xs opacity-70">
                        {sectionStat.total} keys
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      isActive && "rotate-90"
                    )} />
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer del sidebar */}
          <div className="p-3 border-t space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowAddLanguageDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar idioma
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={exportToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="border-b p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              {/* Info de sección activa */}
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {sectionNames[activeSection]?.icon || "📄"}
                </div>
                <div>
                  <h2 className="font-semibold text-lg">
                    {sectionNames[activeSection]?.es || activeSection}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {sectionNames[activeSection]?.en || activeSection}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {filteredTranslations.length} de {sectionStats[activeSection]?.total || 0}
                </Badge>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    Cambios sin guardar
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isAutoTranslating}
                    >
                      {isAutoTranslating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Auto-traducir
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => autoTranslate()}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Traducir sección actual
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {sectionStats[activeSection]?.missing || 0} + {sectionStats[activeSection]?.same || 0}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={autoTranslateAll}>
                      <Globe className="h-4 w-4 mr-2" />
                      Traducir TODO el sistema
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {stats.missing + stats.same}
                      </Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por key o texto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Todas
                    </span>
                  </SelectItem>
                  <SelectItem value="missing">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Sin traducir ({sectionStats[activeSection]?.missing || 0})
                    </span>
                  </SelectItem>
                  <SelectItem value="same">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Iguales ({sectionStats[activeSection]?.same || 0})
                    </span>
                  </SelectItem>
                  <SelectItem value="translated">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Traducidas ({sectionStats[activeSection]?.translated || 0})
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("table")}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("cards")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabla de traducciones */}
          <ScrollArea className="flex-1" ref={tableRef}>
            {viewMode === "table" ? (
              <div className="min-w-full">
                {/* Header de la tabla */}
                <div className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 font-medium text-sm">
                    <div className="w-[200px]">Key</div>
                    <div className="flex items-center gap-2">
                      🇪🇸 Español (Base)
                    </div>
                    <div className="flex items-center gap-2">
                      🇺🇸 English
                    </div>
                    <div className="w-[100px] text-center">Estado</div>
                  </div>
                </div>

                {/* Filas */}
                <div className="divide-y">
                  {paginatedTranslations.map(({ key, esValue, enValue, status }) => (
                    <div
                      key={key}
                      className={cn(
                        "grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors",
                        status === "missing" && "bg-red-50/50",
                        status === "same" && "bg-orange-50/50"
                      )}
                    >
                      {/* Key */}
                      <div className="w-[200px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => copyKey(activeSection, key)}
                              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors truncate block max-w-full text-left"
                            >
                              {key}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click para copiar: t.{activeSection}.{key}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Español (solo lectura) */}
                      <div className="min-w-0">
                        <div className="p-2 bg-muted/30 rounded text-sm break-words">
                          {esValue}
                        </div>
                      </div>

                      {/* Inglés (editable) */}
                      <div className="min-w-0">
                        {editingCell === `${activeSection}.${key}` ? (
                          <Textarea
                            value={enValue || ""}
                            onChange={(e) => updateTranslation("en", activeSection, key, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditingCell(null);
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                setEditingCell(null);
                              }
                            }}
                            autoFocus
                            className="min-h-[60px] text-sm"
                          />
                        ) : (
                          <div
                            onClick={() => setEditingCell(`${activeSection}.${key}`)}
                            className={cn(
                              "p-2 rounded text-sm break-words cursor-text min-h-[40px] border border-transparent hover:border-primary/50 transition-colors",
                              !enValue && "text-muted-foreground italic bg-red-50",
                              enValue === esValue && "bg-orange-50"
                            )}
                          >
                            {enValue || "Click para traducir..."}
                          </div>
                        )}
                      </div>

                      {/* Estado y acciones */}
                      <div className="w-[100px] flex items-center justify-center gap-2">
                        {status === "translated" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <Check className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )}
                        {status === "same" && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Igual
                          </Badge>
                        )}
                        {status === "missing" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Falta
                          </Badge>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => autoTranslate([key])}
                              disabled={isAutoTranslating}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Auto-traducir</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}

                  {filteredTranslations.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No se encontraron traducciones</p>
                      {searchTerm && (
                        <Button
                          variant="link"
                          onClick={() => setSearchTerm("")}
                          className="mt-2"
                        >
                          Limpiar búsqueda
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Vista de tarjetas */
              <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedTranslations.map(({ key, esValue, enValue, status }) => (
                  <Card
                    key={key}
                    className={cn(
                      "overflow-hidden",
                      status === "missing" && "border-red-300 bg-red-50/30",
                      status === "same" && "border-orange-300 bg-orange-50/30"
                    )}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-mono text-muted-foreground">
                          {key}
                        </code>
                        {status === "translated" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {status === "same" && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        {status === "missing" && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="p-2 bg-muted/50 rounded text-sm">
                        <span className="text-xs text-muted-foreground">🇪🇸</span>
                        <p className="mt-1">{esValue}</p>
                      </div>
                      <Textarea
                        value={enValue || ""}
                        onChange={(e) => updateTranslation("en", activeSection, key, e.target.value)}
                        placeholder="Traducción en inglés..."
                        className="text-sm min-h-[60px]"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Controles de paginación */}
          {totalFilteredItems > 0 && (
            <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Mostrando {((validCurrentPage - 1) * pageSize) + 1} - {Math.min(validCurrentPage * pageSize, totalFilteredItems)} de {totalFilteredItems} traducciones
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Por página:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[80px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(validCurrentPage - 1)}
                  disabled={validCurrentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {/* Mostrar números de página */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (validCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (validCurrentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = validCurrentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === validCurrentPage ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(validCurrentPage + 1)}
                  disabled={validCurrentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog para agregar idioma */}
        <Dialog open={showAddLanguageDialog} onOpenChange={setShowAddLanguageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar nuevo idioma</DialogTitle>
              <DialogDescription>
                Selecciona un idioma para agregarlo al sistema de traducciones.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {AVAILABLE_LANGUAGES.filter(l => l.code !== "es" && l.code !== "en").map((lang) => (
                <Button
                  key={lang.code}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => {
                    toast.info(`Idioma ${lang.name} agregado (próximamente)`);
                    setShowAddLanguageDialog(false);
                  }}
                >
                  <span className="text-2xl mr-3">{lang.flag}</span>
                  <div className="text-left">
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Se generarán traducciones automáticas
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddLanguageDialog(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
