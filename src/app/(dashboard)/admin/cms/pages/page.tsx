"use client";

/**
 * CAARD CMS - Gestión de Páginas
 * Con traducciones
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation, useI18n } from "@/lib/i18n";

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  _count: { sections: number };
}

export default function CmsPagesPage() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      const response = await fetch("/api/cms/pages");
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (error) {
      console.error("Error loading pages:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function togglePublish(page: CmsPage) {
    try {
      const response = await fetch(`/api/cms/pages/${page.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !page.isPublished }),
      });

      if (response.ok) {
        loadPages();
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
    }
  }

  async function deletePage() {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const page = pages.find((p) => p.id === deleteId);
      if (!page) return;

      const response = await fetch(`/api/cms/pages/${page.slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPages(pages.filter((p) => p.id !== deleteId));
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.cms.pagesTitle}</h1>
          <p className="text-muted-foreground">
            {t.cms.pagesDescription}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cms/pages/new">
            <Plus className="h-4 w-4 mr-2" />
            {t.cms.newPage}
          </Link>
        </Button>
      </div>

      {/* Pages List */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "es" ? "Todas las Páginas" : "All Pages"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{t.cms.noPages}</p>
              <Button asChild className="mt-4">
                <Link href="/admin/cms/pages/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.cms.createFirstPage}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{page.title}</span>
                        {page.isPublished ? (
                          <Badge variant="default" className="text-xs">
                            {t.cms.published}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {t.cms.draft}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        /{page.slug} · {page._count.sections} {t.cms.sections.toLowerCase()} · {t.cms.createdAt} {formatDate(page.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/${page.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/cms/pages/${page.slug}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t.common.edit}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(page)}>
                          {page.isPublished ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              {t.cms.unpublish}
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              {t.cms.publish}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(page.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{locale === "es" ? "¿Eliminar página?" : "Delete page?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "es"
                ? "Esta acción no se puede deshacer. Se eliminarán todas las secciones asociadas a esta página."
                : "This action cannot be undone. All sections associated with this page will be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {locale === "es" ? "Eliminando..." : "Deleting..."}
                </>
              ) : (
                t.common.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
