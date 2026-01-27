"use client";

/**
 * CAARD CMS - Página de Edición de Menú
 * =====================================
 * Permite administrar el menú de navegación del sitio
 * Con traducciones
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ArrowLeft,
  Loader2,
  Eye,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MenuEditor } from "@/components/cms/menu-editor";
import { useTranslation, useI18n } from "@/lib/i18n";

interface MenuItem {
  id: string;
  label: string;
  url?: string | null;
  pageSlug?: string | null;
  target?: string;
  icon?: string | null;
  isVisible: boolean;
  children: MenuItem[];
}

interface Page {
  slug: string;
  title: string;
}

export default function CmsMenuPage() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [availablePages, setAvailablePages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar menú y páginas
  useEffect(() => {
    async function loadData() {
      try {
        // Cargar menú
        const menuResponse = await fetch("/api/cms/menu");
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuItems(menuData);
        }

        // Cargar páginas disponibles
        const pagesResponse = await fetch("/api/cms/pages?limit=100");
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          setAvailablePages(
            pagesData.pages?.map((p: any) => ({
              slug: p.slug,
              title: p.title,
            })) || []
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(locale === "es" ? "Error al cargar datos" : "Error loading data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [locale]);

  // Guardar menú
  const handleSaveMenu = async (items: MenuItem[]) => {
    const response = await fetch("/api/cms/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error(locale === "es" ? "Error al guardar" : "Error saving");
    }

    const updatedMenu = await response.json();
    setMenuItems(updatedMenu);
  };

  // Recargar menú
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cms/menu");
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
        toast.success(locale === "es" ? "Menú recargado" : "Menu reloaded");
      }
    } catch (error) {
      toast.error(locale === "es" ? "Error al recargar" : "Error reloading");
    } finally {
      setIsLoading(false);
    }
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
              <Menu className="h-6 w-6" />
              {t.cms.menuTitle}
            </h1>
            <p className="text-muted-foreground">
              {t.cms.menuDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {locale === "es" ? "Recargar" : "Refresh"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/" target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              {locale === "es" ? "Ver Sitio" : "View Site"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Información */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Menu className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">
                {locale === "es" ? "Cómo funciona" : "How it works"}
              </h3>
              <p className="text-sm text-blue-700">
                {locale === "es"
                  ? "Puedes crear items de menú que enlazan a páginas internas, URLs externas, o que funcionan solo como agrupadores para submenús. Usa las flechas para reordenar y el botón + para crear submenús anidados."
                  : "You can create menu items that link to internal pages, external URLs, or work only as groupers for submenus. Use the arrows to reorder and the + button to create nested submenus."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de menú */}
      <MenuEditor
        initialItems={menuItems}
        onSave={handleSaveMenu}
        availablePages={availablePages}
      />

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t.cms.menuPreview}</CardTitle>
          <CardDescription>
            {locale === "es"
              ? "Así se verá el menú en el sitio (solo items visibles)"
              : "This is how the menu will look on the site (visible items only)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-[#0B2A5B] rounded-lg overflow-x-auto">
            <div className="flex items-center gap-6 min-w-max">
              {menuItems
                .filter((item) => item.isVisible)
                .map((item) => (
                  <div key={item.id} className="text-white">
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                      {item.children.filter((c) => c.isVisible).length > 0 && " ▼"}
                    </span>
                    {item.children.filter((c) => c.isVisible).length > 0 && (
                      <div className="mt-1 text-xs text-white/60">
                        {item.children
                          .filter((c) => c.isVisible)
                          .map((child) => child.label)
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
