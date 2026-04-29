"use client";

/**
 * CAARD - Admin: Gestión de Imágenes de Cabecera
 * Permite subir/cambiar la imagen hero de cada página pública
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, Loader2, Check, X, Trash2, Eye } from "lucide-react";

interface HeroPage {
  slug: string;
  label: string;
  imageUrl: string | null;
}

export default function HeroImagesPage() {
  const [pages, setPages] = useState<HeroPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      const res = await fetch("/api/cms/hero-images");
      if (!res.ok) {
        const text = await res.text();
        console.error("hero-images API error:", res.status, text.slice(0, 200));
        toast.error(`Error ${res.status} al cargar imágenes`);
        return;
      }
      const data = await res.json();
      setPages(data.pages || []);
    } catch (err: any) {
      console.error("hero-images fetch error:", err);
      toast.error("Error al cargar imágenes");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(slug: string, file: File) {
    // Vercel limita el body de funciones serverless a ~4.5 MB. Si nos
    // pasamos, la plataforma corta antes de que el handler corra y
    // responde con "Request Entity Too Large" en HTML, no JSON. Así
    // que validamos del lado del cliente.
    const MAX_MB = 4;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(
        `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo ${MAX_MB}MB. Comprimila (ej. tinypng.com) o redimensiónala antes de subir.`
      );
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se aceptan archivos de imagen");
      return;
    }

    setUploading(slug);
    try {
      // 1. Subir archivo
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "heroes");

      const uploadRes = await fetch("/api/cms/media/upload", {
        method: "POST",
        body: formData,
      });

      // Manejo robusto: si Vercel devolvió HTML (413/504/etc.) no
      // intentamos parsear JSON.
      const ct = uploadRes.headers.get("content-type") || "";
      let uploadData: any = null;
      if (ct.includes("application/json")) {
        uploadData = await uploadRes.json();
      } else {
        const txt = await uploadRes.text();
        if (uploadRes.status === 413) {
          throw new Error("La imagen es muy grande. Reducila a menos de 4MB.");
        }
        throw new Error(
          `Error ${uploadRes.status} del servidor: ${txt.slice(0, 120)}`
        );
      }

      if (!uploadRes.ok) throw new Error(uploadData?.error || "Error al subir");

      // 2. Guardar referencia
      const saveRes = await fetch("/api/cms/hero-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, imageUrl: uploadData.url }),
      });

      if (!saveRes.ok) throw new Error("Error al guardar");

      // 3. Actualizar estado local
      setPages((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, imageUrl: uploadData.url } : p))
      );

      toast.success("Imagen actualizada correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al subir imagen");
    } finally {
      setUploading(null);
    }
  }

  async function handleRemove(slug: string) {
    try {
      await fetch("/api/cms/hero-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, imageUrl: "" }),
      });
      setPages((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, imageUrl: null } : p))
      );
      toast.success("Imagen eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  const configured = pages.filter((p) => p.imageUrl).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2A5B] flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Imágenes de Cabecera
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las imágenes hero de cada página del sitio público
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            {configured}/{pages.length} configuradas
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-[#0B2A5B]">{pages.length}</div>
            <p className="text-sm text-muted-foreground">Total Páginas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{configured}</div>
            <p className="text-sm text-muted-foreground">Con Imagen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{pages.length - configured}</div>
            <p className="text-sm text-muted-foreground">Sin Imagen</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de páginas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Card key={page.slug} className="overflow-hidden">
            {/* Preview */}
            <div className="relative h-40 bg-gradient-to-br from-[#0B2A5B] to-[#0d3570]">
              {page.imageUrl ? (
                <>
                  <Image
                    src={page.imageUrl}
                    alt={page.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-[#0B2A5B]/50" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <ImageIcon className="h-16 w-16 text-white" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <h3 className="text-white font-bold text-lg">{page.label}</h3>
              </div>
              {/* Status badge */}
              <div className="absolute top-2 right-2 z-10">
                {page.imageUrl ? (
                  <Badge className="bg-green-500 text-white text-xs">
                    <Check className="h-3 w-3 mr-1" /> Configurada
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <X className="h-3 w-3 mr-1" /> Sin imagen
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">/{page.slug}</span>
                <a
                  href={`/${page.slug === "home" ? "" : page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D66829] hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" /> Ver página
                </a>
              </div>

              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(page.slug, file);
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    asChild
                    disabled={uploading === page.slug}
                  >
                    <span>
                      {uploading === page.slug ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {page.imageUrl ? "Cambiar" : "Subir imagen"}
                    </span>
                  </Button>
                </label>

                {page.imageUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemove(page.slug)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tip */}
      <Card className="border-[#D66829]/30 bg-[#D66829]/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Las imágenes recomendadas son de al menos 1920x600
            píxeles en formato JPG o WebP. <strong>Tamaño máximo: 4 MB</strong> —
            si tu imagen pesa más, comprimila en{" "}
            <a
              href="https://tinypng.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D66829] underline"
            >
              tinypng.com
            </a>{" "}
            o redimensionala antes de subir. Se aplica un overlay oscuro
            automáticamente para mejorar la legibilidad del texto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
