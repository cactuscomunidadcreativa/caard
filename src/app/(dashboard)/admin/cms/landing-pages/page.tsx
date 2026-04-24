/**
 * /admin/cms/landing-pages — Gestión de Landing Pages del centro
 *
 * Lista las landing pages creadas y permite crear una nueva con
 * slug + título + template. Edición avanzada se hace en la página
 * individual (TODO).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Plus,
  ExternalLink,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

interface LP {
  id: string;
  slug: string;
  title: string;
  template: string;
  status: string;
  isPublished: boolean;
  viewCount: number;
  conversionCount: number;
  _count?: { sections: number };
  createdAt: string;
}

const TEMPLATES = [
  { value: "CUSTOM", label: "Custom" },
  { value: "COURSE_PROMO", label: "Promo curso" },
  { value: "EVENT", label: "Evento" },
  { value: "ARBITRATION_SERVICE", label: "Servicio arbitral" },
  { value: "SIMPLE", label: "Simple" },
];

export default function LandingPagesAdminPage() {
  const router = useRouter();
  const [pages, setPages] = useState<LP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [template, setTemplate] = useState("CUSTOM");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/cms/landing-pages");
      if (r.ok) {
        const d = await r.json();
        setPages(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setErr(null);
    setOk(null);
    if (!slug || !title) {
      setErr("slug y título son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/cms/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          title,
          metaDescription: metaDescription || null,
          template,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Error al crear");
      setOk("Landing page creada");
      setShowNew(false);
      setSlug("");
      setTitle("");
      setMetaDescription("");
      setTemplate("CUSTOM");
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/cms">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a CMS
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-[#D66829]" />
            Landing Pages
          </h1>
          <p className="text-sm text-muted-foreground">
            Páginas de aterrizaje para promociones, cursos y campañas.
          </p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="bg-[#D66829] hover:bg-[#c45a22]">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Landing Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Landing Page</DialogTitle>
              <DialogDescription>
                Define el slug y el título. Podrás agregar secciones después.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Slug (URL) *</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="curso-arbitraje-2026"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Solo letras minúsculas, números y guiones. URL final:{" "}
                  <code>/{slug || "slug"}</code>
                </p>
              </div>
              <div>
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Curso de Arbitraje 2026"
                />
              </div>
              <div>
                <Label>Meta descripción (SEO)</Label>
                <Textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </div>
              <div>
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {err && (
                <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
                  {err}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
              <Button
                onClick={create}
                disabled={saving || !slug || !title}
                className="bg-[#D66829] hover:bg-[#c45a22]"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {ok && (
        <div className="rounded bg-green-50 border border-green-200 text-green-700 p-3 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {ok}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#D66829]" />
        </div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No hay landing pages todavía.</p>
            <p className="text-sm mt-1">
              Crea la primera con el botón de arriba.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <CardDescription>
                      <code className="text-xs">/{p.slug}</code>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={p.isPublished ? "default" : "outline"}>
                      {p.isPublished ? "Publicada" : "Borrador"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {p._count?.sections ?? 0} secciones · {p.viewCount} vistas
                  </span>
                  {p.isPublished && (
                    <a
                      href={`/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D66829] hover:underline inline-flex items-center gap-1"
                    >
                      Ver <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
