"use client";

/**
 * CAARD CMS - Componente de Subida de Imágenes
 * ============================================
 * Permite subir imágenes con drag & drop, preview y selección de biblioteca
 */

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Trash2,
  FolderOpen,
  Link as LinkIcon,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  aspectRatio?: "square" | "video" | "wide" | "auto";
  maxSize?: number; // en MB
  accept?: string;
  className?: string;
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  label,
  description,
  aspectRatio = "auto",
  maxSize = 5,
  accept = "image/*",
  className,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "library" | "url">("upload");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar biblioteca de medios
  const loadMediaLibrary = useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      const response = await fetch("/api/cms/media");
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data);
      }
    } catch (error) {
      console.error("Error loading media:", error);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  // Subir archivo
  const uploadFile = async (file: File) => {
    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`El archivo excede el límite de ${maxSize}MB`);
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cms/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Error al subir archivo");
      }

      const data = await response.json();
      onChange(data.url);
      toast.success("Imagen subida correctamente");
      setShowLibrary(false);
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Seleccionar de biblioteca
  const handleSelectFromLibrary = (item: MediaItem) => {
    onChange(item.url);
    setShowLibrary(false);
    toast.success("Imagen seleccionada");
  };

  // Usar URL externa
  const handleUseUrl = () => {
    if (!urlInput.trim()) {
      toast.error("Ingresa una URL válida");
      return;
    }

    // Validar que sea una URL de imagen
    if (!urlInput.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) && !urlInput.startsWith("data:image")) {
      toast.error("La URL debe ser de una imagen");
      return;
    }

    onChange(urlInput);
    setUrlInput("");
    setShowLibrary(false);
    toast.success("Imagen agregada");
  };

  // Aspect ratio classes
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[21/9]",
    auto: "aspect-auto min-h-[120px]",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Preview o Dropzone */}
      {value ? (
        <div className={cn("relative rounded-lg border overflow-hidden group", aspectClasses[aspectRatio])}>
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={value.startsWith("http")}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowLibrary(true)}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Cambiar
            </Button>
            {onRemove && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onRemove();
                  onChange("");
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center p-6",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            aspectClasses[aspectRatio]
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => setShowLibrary(true)}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Subiendo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Arrastra una imagen o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF, WebP hasta {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dialog de selección */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seleccionar imagen</DialogTitle>
            <DialogDescription>
              Sube una nueva imagen, selecciona de la biblioteca o usa una URL
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Subir
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="flex items-center gap-2"
                onClick={loadMediaLibrary}
              >
                <FolderOpen className="h-4 w-4" />
                Biblioteca
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                URL
              </TabsTrigger>
            </TabsList>

            {/* Tab: Subir */}
            <TabsContent value="upload" className="mt-4">
              <div
                className={cn(
                  "rounded-lg border-2 border-dashed p-12 text-center transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium">Subiendo imagen...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        Arrastra y suelta tu imagen aquí
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para buscar en tu computadora
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Formatos: PNG, JPG, GIF, WebP • Máximo: {maxSize}MB
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Biblioteca */}
            <TabsContent value="library" className="mt-4">
              {isLoadingMedia ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Biblioteca vacía</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sube tu primera imagen para empezar
                  </p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir imagen
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-4 gap-3 p-1">
                    {mediaItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary",
                          value === item.url
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent"
                        )}
                        onClick={() => handleSelectFromLibrary(item)}
                      >
                        <Image
                          src={item.url}
                          alt={item.filename}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {value === item.url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Tab: URL */}
            <TabsContent value="url" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL de la imagen</Label>
                  <div className="flex gap-2">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      type="url"
                    />
                    <Button type="button" onClick={handleUseUrl}>
                      Usar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pega la URL de una imagen existente en internet
                  </p>
                </div>

                {/* Preview de URL */}
                {urlInput && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium mb-2">Vista previa:</p>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={urlInput}
                        alt="Preview"
                        fill
                        className="object-contain"
                        unoptimized
                        onError={() => {
                          toast.error("No se pudo cargar la imagen");
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImageUploader;
