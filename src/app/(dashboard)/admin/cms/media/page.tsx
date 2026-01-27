"use client";

/**
 * CAARD CMS - Biblioteca de Medios
 * ================================
 * Gestión de imágenes y archivos subidos
 * Con traducciones
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  Upload,
  Trash2,
  RefreshCw,
  Search,
  Grid,
  List,
  Calendar,
  HardDrive,
  Copy,
  Check,
  X,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageUploader } from "@/components/cms/image-uploader";
import { useTranslation, useI18n } from "@/lib/i18n";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  createdAt: string;
  uploadedBy?: string;
}

export default function CmsMediaPage() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Cargar medios
  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cms/media");
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error("Error loading media:", error);
      toast.error(locale === "es" ? "Error al cargar medios" : "Error loading media");
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Formatear tamaño
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "es" ? "es-PE" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Copiar URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(locale === "es" ? "URL copiada al portapapeles" : "URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Eliminar medio
  const handleDelete = async (id: string) => {
    if (!confirm(locale === "es"
      ? "¿Estás seguro de eliminar este archivo? Esta acción no se puede deshacer."
      : "Are you sure you want to delete this file? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cms/media?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
        setSelectedItem(null);
        toast.success(locale === "es" ? "Archivo eliminado" : "File deleted");
      } else {
        throw new Error("Error");
      }
    } catch (error) {
      toast.error(locale === "es" ? "Error al eliminar el archivo" : "Error deleting file");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar medios
  const filteredMedia = media.filter(
    (item) =>
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mimeType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Estadísticas
  const totalSize = media.reduce((acc, m) => acc + m.size, 0);
  const imageCount = media.filter((m) => m.mimeType.startsWith("image/")).length;

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
              <ImageIcon className="h-6 w-6" />
              {t.cms.mediaTitle}
            </h1>
            <p className="text-muted-foreground">
              {t.cms.mediaDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadMedia}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {locale === "es" ? "Actualizar" : "Refresh"}
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t.cms.uploadImage}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.cms.totalFiles}</p>
                <p className="text-2xl font-bold">{media.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <FolderOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{locale === "es" ? "Imágenes" : "Images"}</p>
                <p className="text-2xl font-bold">{imageCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <ImageIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.cms.usedSpace}</p>
                <p className="text-2xl font-bold">{formatSize(totalSize)}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <HardDrive className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={locale === "es" ? "Buscar archivos..." : "Search files..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery
                  ? (locale === "es" ? "No se encontraron resultados" : "No results found")
                  : (locale === "es" ? "Biblioteca vacía" : "Library empty")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? (locale === "es" ? "Intenta con otros términos de búsqueda" : "Try different search terms")
                  : (locale === "es" ? "Sube tu primera imagen para empezar" : "Upload your first image to get started")}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  {t.cms.uploadImage}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <button
              key={item.id}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary group",
                selectedItem?.id === item.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent"
              )}
              onClick={() => setSelectedItem(item)}
            >
              <Image
                src={item.url}
                alt={item.filename}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-xs text-center px-2 truncate">
                  {item.filename}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">{locale === "es" ? "Archivo" : "File"}</th>
                  <th className="text-left p-3 font-medium">{locale === "es" ? "Tipo" : "Type"}</th>
                  <th className="text-left p-3 font-medium">{locale === "es" ? "Tamaño" : "Size"}</th>
                  <th className="text-left p-3 font-medium">{locale === "es" ? "Fecha" : "Date"}</th>
                  <th className="text-right p-3 font-medium">{locale === "es" ? "Acciones" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
                          <Image
                            src={item.url}
                            alt={item.filename}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="truncate max-w-[200px]">{item.filename}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{item.mimeType.split("/")[1]}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatSize(item.size)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyUrl(item.url)}
                        >
                          {copiedUrl === item.url ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedItem(item)}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Detalles del archivo" : "File details"}</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedItem.url}
                  alt={selectedItem.filename}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{locale === "es" ? "Nombre" : "Name"}</p>
                  <p className="font-medium break-all">{selectedItem.filename}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{locale === "es" ? "Tipo" : "Type"}</p>
                  <p className="font-medium">{selectedItem.mimeType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{locale === "es" ? "Tamaño" : "Size"}</p>
                  <p className="font-medium">{formatSize(selectedItem.size)}</p>
                </div>
                {selectedItem.width && selectedItem.height && (
                  <div>
                    <p className="text-sm text-muted-foreground">{locale === "es" ? "Dimensiones" : "Dimensions"}</p>
                    <p className="font-medium">
                      {selectedItem.width} x {selectedItem.height} px
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{locale === "es" ? "Fecha de subida" : "Upload date"}</p>
                  <p className="font-medium">{formatDate(selectedItem.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">URL</p>
                  <div className="flex gap-2">
                    <Input value={selectedItem.url} readOnly className="text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyUrl(selectedItem.url)}
                    >
                      {copiedUrl === selectedItem.url ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              {locale === "es" ? "Cerrar" : "Close"}
            </Button>
            {selectedItem && (
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedItem.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t.common.delete}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.cms.uploadImage}</DialogTitle>
            <DialogDescription>
              {locale === "es"
                ? "Sube una nueva imagen a la biblioteca de medios"
                : "Upload a new image to the media library"}
            </DialogDescription>
          </DialogHeader>
          <ImageUploader
            onChange={(url) => {
              loadMedia();
              setShowUploadDialog(false);
            }}
            aspectRatio="auto"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
