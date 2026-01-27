"use client";

/**
 * CAARD CMS - Panel de Configuración del Sitio
 * ============================================
 * Configuración de colores, logos, fuentes, teléfonos, etc.
 * Estilo WordPress/Elementor
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Settings,
  Palette,
  Type,
  Phone,
  Mail,
  MapPin,
  Globe,
  Image as ImageIcon,
  Save,
  Loader2,
  Eye,
  RefreshCw,
  Undo,
  ArrowLeft,
  Languages,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  CheckCircle,
  Upload,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImageUploader } from "@/components/cms/image-uploader";

// Tipos
interface SiteConfig {
  // General
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  favicon: string;

  // Branding
  logo: string;
  logoDark: string;
  logoWidth: number;
  logoHeight: number;

  // Colores
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;

  // Tipografía
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;

  // Contacto
  phone: string;
  phoneSecondary: string;
  whatsapp: string;
  email: string;
  emailSecondary: string;
  address: string;
  city: string;
  country: string;

  // Redes Sociales
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;

  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;

  // Horarios
  schedule: string;

  // Footer
  footerText: string;
  showSocialInFooter: boolean;

  // Idiomas
  defaultLocale: string;
  enabledLocales: string[];
}

// Configuración por defecto
const defaultConfig: SiteConfig = {
  siteName: "CAARD",
  siteTagline: "Centro de Arbitraje y Resolución de Disputas",
  siteDescription: "Soluciones eficientes y especializadas en resolución de conflictos comerciales y civiles.",
  favicon: "/favicon.ico",

  logo: "/logo-caard.png",
  logoDark: "/logo-caard-dark.png",
  logoWidth: 180,
  logoHeight: 60,

  primaryColor: "#D66829",
  secondaryColor: "#1a365d",
  accentColor: "#eab308",
  backgroundColor: "#ffffff",
  textColor: "#171717",

  headingFont: "Poppins",
  bodyFont: "Inter",
  baseFontSize: 16,

  phone: "+51 1 710 8888",
  phoneSecondary: "+51 1 710 8889",
  whatsapp: "+51 999 999 999",
  email: "consultas@caard.pe",
  emailSecondary: "arbitraje@caard.pe",
  address: "Av. Del Parque Sur 415, Of. 301",
  city: "San Isidro, Lima",
  country: "Perú",

  facebook: "https://facebook.com/caard",
  instagram: "https://instagram.com/caard",
  linkedin: "https://linkedin.com/company/caard",
  twitter: "https://twitter.com/caard",
  youtube: "https://youtube.com/caard",

  metaTitle: "CAARD | Centro de Arbitraje",
  metaDescription: "Centro de Arbitraje y Resolución de Disputas - Soluciones especializadas en conflictos comerciales y civiles.",
  metaKeywords: "arbitraje, mediación, resolución de conflictos, disputas comerciales",
  ogImage: "/og-image.png",

  schedule: "Lunes a Viernes: 9:00 AM - 6:00 PM",

  footerText: "© 2025 CAARD - Centro de Arbitraje y Resolución de Disputas. Todos los derechos reservados.",
  showSocialInFooter: true,

  defaultLocale: "es",
  enabledLocales: ["es", "en"],
};

// Fuentes disponibles
const availableFonts = [
  "Inter",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Lato",
  "Source Sans Pro",
  "Nunito",
  "Raleway",
  "Work Sans",
];

export default function CmsConfigPage() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] = useState<SiteConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Cargar configuración
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/cms/config");
        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
            setConfig({ ...defaultConfig, ...data });
            setOriginalConfig({ ...defaultConfig, ...data });
          }
        }
      } catch (error) {
        console.error("Error loading config:", error);
        toast.error("Error al cargar la configuración");
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, []);

  // Detectar cambios
  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
  }, [config, originalConfig]);

  // Actualizar campo
  const updateConfig = (field: keyof SiteConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Guardar configuración
  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/cms/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setOriginalConfig(config);
        toast.success("Configuración guardada correctamente");
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear cambios
  const resetChanges = () => {
    setConfig(originalConfig);
    toast.info("Cambios descartados");
  };

  // Resetear a valores por defecto
  const resetToDefaults = () => {
    setConfig(defaultConfig);
    toast.info("Valores restaurados a los predeterminados");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/cms">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configuración del Sitio
            </h1>
            <p className="text-muted-foreground">
              Personaliza la apariencia y datos de contacto
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Cambios sin guardar
            </Badge>
          )}
          <Button variant="outline" asChild>
            <Link href="/" target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Ver Sitio
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={resetChanges}
            disabled={!hasChanges}
          >
            <Undo className="h-4 w-4 mr-2" />
            Descartar
          </Button>
          <Button
            onClick={saveConfig}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Tabs de Configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Colores</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Tipografía</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Contacto</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Redes</span>
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Footer</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Datos básicos del sitio web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input
                    id="siteName"
                    value={config.siteName}
                    onChange={(e) => updateConfig("siteName", e.target.value)}
                    placeholder="CAARD"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteTagline">Eslogan</Label>
                  <Input
                    id="siteTagline"
                    value={config.siteTagline}
                    onChange={(e) => updateConfig("siteTagline", e.target.value)}
                    placeholder="Centro de Arbitraje..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descripción</Label>
                <Textarea
                  id="siteDescription"
                  value={config.siteDescription}
                  onChange={(e) => updateConfig("siteDescription", e.target.value)}
                  rows={3}
                  placeholder="Descripción del sitio..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO y Metadatos</CardTitle>
              <CardDescription>
                Optimización para motores de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Título Meta</Label>
                <Input
                  id="metaTitle"
                  value={config.metaTitle}
                  onChange={(e) => updateConfig("metaTitle", e.target.value)}
                  placeholder="CAARD | Centro de Arbitraje"
                />
                <p className="text-xs text-muted-foreground">
                  Aparece en la pestaña del navegador y resultados de búsqueda
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Descripción Meta</Label>
                <Textarea
                  id="metaDescription"
                  value={config.metaDescription}
                  onChange={(e) => updateConfig("metaDescription", e.target.value)}
                  rows={2}
                  placeholder="Descripción para buscadores..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Palabras Clave</Label>
                <Input
                  id="metaKeywords"
                  value={config.metaKeywords}
                  onChange={(e) => updateConfig("metaKeywords", e.target.value)}
                  placeholder="arbitraje, mediación, disputas..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Idiomas</CardTitle>
              <CardDescription>
                Configuración de internacionalización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label>Idioma Predeterminado</Label>
                  <Select
                    value={config.defaultLocale}
                    onValueChange={(v) => updateConfig("defaultLocale", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.enabledLocales.includes("es")}
                    disabled
                  />
                  <Label>Español</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.enabledLocales.includes("en")}
                    onCheckedChange={(checked) => {
                      const locales = checked
                        ? [...config.enabledLocales, "en"]
                        : config.enabledLocales.filter((l) => l !== "en");
                      updateConfig("enabledLocales", locales);
                    }}
                  />
                  <Label>English</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Branding */}
        <TabsContent value="branding" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logos</CardTitle>
              <CardDescription>
                Logos para modo claro y oscuro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <ImageUploader
                  label="Logo Principal (Modo Claro)"
                  description="Logo para fondos claros"
                  value={config.logo}
                  onChange={(url) => updateConfig("logo", url)}
                  onRemove={() => updateConfig("logo", "")}
                  aspectRatio="wide"
                  maxSize={5}
                />

                <ImageUploader
                  label="Logo (Modo Oscuro)"
                  description="Logo para fondos oscuros"
                  value={config.logoDark}
                  onChange={(url) => updateConfig("logoDark", url)}
                  onRemove={() => updateConfig("logoDark", "")}
                  aspectRatio="wide"
                  maxSize={5}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoWidth">Ancho del Logo (px)</Label>
                  <Input
                    id="logoWidth"
                    type="number"
                    value={config.logoWidth}
                    onChange={(e) => updateConfig("logoWidth", parseInt(e.target.value))}
                    min={50}
                    max={400}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoHeight">Alto del Logo (px)</Label>
                  <Input
                    id="logoHeight"
                    type="number"
                    value={config.logoHeight}
                    onChange={(e) => updateConfig("logoHeight", parseInt(e.target.value))}
                    min={20}
                    max={200}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Favicon</CardTitle>
              <CardDescription>
                Icono que aparece en la pestaña del navegador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                label="Favicon"
                description="Recomendado: 32x32 o 64x64 píxeles"
                value={config.favicon}
                onChange={(url) => updateConfig("favicon", url)}
                onRemove={() => updateConfig("favicon", "")}
                aspectRatio="square"
                maxSize={1}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Colores */}
        <TabsContent value="colors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Paleta de Colores</CardTitle>
              <CardDescription>
                Define los colores principales del sitio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <Label>Color Primario</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig("primaryColor", e.target.value)}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => updateConfig("primaryColor", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Botones, enlaces, acentos principales
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Color Secundario</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Headers, fondos secundarios
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Color de Acento</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => updateConfig("accentColor", e.target.value)}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={config.accentColor}
                      onChange={(e) => updateConfig("accentColor", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Destacados, badges, alertas
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Color de Fondo</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={config.backgroundColor}
                      onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Color de Texto</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => updateConfig("textColor", e.target.value)}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={config.textColor}
                      onChange={(e) => updateConfig("textColor", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Vista Previa</Label>
                <div
                  className="rounded-lg p-6 border"
                  style={{ backgroundColor: config.backgroundColor }}
                >
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: config.primaryColor }}
                  >
                    Título de Ejemplo
                  </h3>
                  <p style={{ color: config.textColor }}>
                    Este es un texto de ejemplo para ver cómo se verán los colores en el sitio.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      style={{ backgroundColor: config.primaryColor }}
                      className="text-white"
                    >
                      Botón Primario
                    </Button>
                    <Button
                      style={{ backgroundColor: config.secondaryColor }}
                      className="text-white"
                    >
                      Botón Secundario
                    </Button>
                    <Badge style={{ backgroundColor: config.accentColor }}>
                      Etiqueta
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tipografía */}
        <TabsContent value="typography" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipografía</CardTitle>
              <CardDescription>
                Configura las fuentes del sitio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Fuente de Títulos</Label>
                  <Select
                    value={config.headingFont}
                    onValueChange={(v) => updateConfig("headingFont", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    className="p-4 border rounded-lg"
                    style={{ fontFamily: config.headingFont }}
                  >
                    <h2 className="text-2xl font-bold">Título de Ejemplo</h2>
                    <h3 className="text-xl font-semibold">Subtítulo de Ejemplo</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Fuente de Cuerpo</Label>
                  <Select
                    value={config.bodyFont}
                    onValueChange={(v) => updateConfig("bodyFont", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    className="p-4 border rounded-lg"
                    style={{ fontFamily: config.bodyFont }}
                  >
                    <p>
                      Este es un párrafo de ejemplo para mostrar cómo se verá el texto
                      del cuerpo en el sitio web.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Tamaño Base de Fuente (px)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={config.baseFontSize}
                    onChange={(e) => updateConfig("baseFontSize", parseInt(e.target.value))}
                    min={12}
                    max={20}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Recomendado: 14-18px
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Contacto */}
        <TabsContent value="contact" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>
                Teléfonos, correos y dirección
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono Principal</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={config.phone}
                      onChange={(e) => updateConfig("phone", e.target.value)}
                      className="pl-10"
                      placeholder="+51 1 000 0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneSecondary">Teléfono Secundario</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneSecondary"
                      value={config.phoneSecondary}
                      onChange={(e) => updateConfig("phoneSecondary", e.target.value)}
                      className="pl-10"
                      placeholder="+51 1 000 0001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={config.whatsapp}
                    onChange={(e) => updateConfig("whatsapp", e.target.value)}
                    placeholder="+51 999 999 999"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Principal</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={config.email}
                      onChange={(e) => updateConfig("email", e.target.value)}
                      className="pl-10"
                      placeholder="consultas@ejemplo.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSecondary">Email Secundario</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="emailSecondary"
                      type="email"
                      value={config.emailSecondary}
                      onChange={(e) => updateConfig("emailSecondary", e.target.value)}
                      className="pl-10"
                      placeholder="arbitraje@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      value={config.address}
                      onChange={(e) => updateConfig("address", e.target.value)}
                      className="pl-10"
                      rows={2}
                      placeholder="Av. Ejemplo 123, Of. 456"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={config.city}
                      onChange={(e) => updateConfig("city", e.target.value)}
                      placeholder="Lima"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={config.country}
                      onChange={(e) => updateConfig("country", e.target.value)}
                      placeholder="Perú"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="schedule">Horario de Atención</Label>
                <Input
                  id="schedule"
                  value={config.schedule}
                  onChange={(e) => updateConfig("schedule", e.target.value)}
                  placeholder="Lunes a Viernes: 9:00 AM - 6:00 PM"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Redes Sociales */}
        <TabsContent value="social" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>
                Enlaces a tus perfiles en redes sociales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Facebook className="h-5 w-5 text-white" />
                  </div>
                  <Input
                    value={config.facebook}
                    onChange={(e) => updateConfig("facebook", e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                  <Input
                    value={config.instagram}
                    onChange={(e) => updateConfig("instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center">
                    <Linkedin className="h-5 w-5 text-white" />
                  </div>
                  <Input
                    value={config.linkedin}
                    onChange={(e) => updateConfig("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                    <Twitter className="h-5 w-5 text-white" />
                  </div>
                  <Input
                    value={config.twitter}
                    onChange={(e) => updateConfig("twitter", e.target.value)}
                    placeholder="https://twitter.com/..."
                    className="flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                    <Youtube className="h-5 w-5 text-white" />
                  </div>
                  <Input
                    value={config.youtube}
                    onChange={(e) => updateConfig("youtube", e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="flex-1"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar en Footer</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar iconos de redes sociales en el pie de página
                  </p>
                </div>
                <Switch
                  checked={config.showSocialInFooter}
                  onCheckedChange={(v) => updateConfig("showSocialInFooter", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texto del Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.footerText}
                onChange={(e) => updateConfig("footerText", e.target.value)}
                rows={2}
                placeholder="© 2025 CAARD. Todos los derechos reservados."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Footer */}
        <TabsContent value="footer" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Footer</CardTitle>
              <CardDescription>
                Personaliza el pie de página del sitio web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="footerText">Texto del Copyright</Label>
                <Textarea
                  id="footerText"
                  value={config.footerText}
                  onChange={(e) => updateConfig("footerText", e.target.value)}
                  rows={2}
                  placeholder="© 2025 CAARD. Todos los derechos reservados."
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Información de Contacto en Footer</Label>
                <p className="text-sm text-muted-foreground">
                  Esta información se muestra en el footer del sitio. Los datos se toman de la pestaña "Contacto".
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{config.phone || "No configurado"}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{config.email || "No configurado"}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/50 md:col-span-2">
                    <p className="text-sm font-medium">Dirección</p>
                    <p className="text-sm text-muted-foreground">
                      {config.address ? `${config.address}, ${config.city}, ${config.country}` : "No configurada"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Redes Sociales</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar iconos de redes sociales en el footer
                  </p>
                </div>
                <Switch
                  checked={config.showSocialInFooter}
                  onCheckedChange={(v) => updateConfig("showSocialInFooter", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links del Footer</CardTitle>
              <CardDescription>
                Los links del footer se gestionan desde el menú de navegación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  El footer actual muestra los siguientes enlaces fijos:
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">El Centro</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      <li>• Presentación</li>
                      <li>• Secretaría General</li>
                      <li>• Consejo Superior</li>
                      <li>• Sedes</li>
                    </ul>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">Servicios</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      <li>• Arbitraje</li>
                      <li>• Reglamentos</li>
                      <li>• Calculadora de Gastos</li>
                      <li>• Solicitud Arbitral</li>
                    </ul>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/cms/menu">
                    Gestionar Menú de Navegación
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vista Previa del Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0B2A5B] text-white p-6 rounded-lg">
                <div className="grid gap-6 md:grid-cols-3 text-sm">
                  <div>
                    <h4 className="font-bold text-[#D66829] mb-2">{config.siteName || "CAARD"}</h4>
                    <p className="text-white/70 text-xs">{config.siteTagline}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Contacto</h4>
                    <p className="text-white/70 text-xs">{config.phone}</p>
                    <p className="text-white/70 text-xs">{config.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dirección</h4>
                    <p className="text-white/70 text-xs">{config.address}</p>
                    <p className="text-white/70 text-xs">{config.city}, {config.country}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 text-center text-xs text-white/50">
                  {config.footerText || `© ${new Date().getFullYear()} CAARD. Todos los derechos reservados.`}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={saveConfig}
            disabled={isSaving}
            className="shadow-lg"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      )}
    </div>
  );
}
