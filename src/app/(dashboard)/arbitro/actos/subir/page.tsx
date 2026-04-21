/**
 * /arbitro/actos/subir — Subir acto procesal al expediente
 *
 * El árbitro carga un documento (acta, providencia firmada, orden, laudo, etc.)
 * al expediente. Se sube vía /api/cases/[id]/escritos que coloca el archivo
 * en Drive bajo /{caso}/Escritos/ y notifica al centro y demás árbitros.
 */
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CaseItem {
  id: string;
  code: string;
  title: string | null;
}

const TIPOS_ACTO = [
  { value: "PROVIDENCIA", label: "Providencia" },
  { value: "RESOLUCION", label: "Resolución" },
  { value: "ACTA_AUDIENCIA", label: "Acta de audiencia" },
  { value: "LAUDO", label: "Laudo" },
  { value: "ORDEN_PROCESAL", label: "Orden procesal" },
  { value: "OTRO", label: "Otro documento" },
];

export default function SubirActoPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [caseId, setCaseId] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("PROVIDENCIA");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cases?pageSize=100");
        if (r.ok) {
          const d = await r.json();
          setCases(d.items || []);
        }
      } finally {
        setLoadingCases(false);
      }
    })();
  }, []);

  const submit = async () => {
    setErr(null);
    setOk(null);
    if (!caseId) {
      setErr("Selecciona un expediente");
      return;
    }
    if (!file) {
      setErr("Selecciona un archivo");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", documentType);
      fd.append("description", description);
      const r = await fetch(`/api/cases/${caseId}/escritos`, {
        method: "POST",
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al subir acto");
      setOk("Acto subido. Quedó registrado en el expediente y notificado al Centro.");
      setFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/arbitro">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0B2A5B]" />
            Subir Acto Procesal
          </CardTitle>
          <CardDescription>
            Carga providencias, actas, resoluciones o laudos al expediente.
            El archivo se guarda en Drive y se notifica al Centro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Expediente *</Label>
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingCases ? "Cargando..." : "Selecciona un expediente"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code}
                    {c.title ? ` — ${c.title}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingCases && cases.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No tienes casos asignados como árbitro.
              </p>
            )}
          </div>

          <div>
            <Label>Tipo de documento *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ACTO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Archivo (PDF, DOCX) *</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div>
            <Label>Descripción / sumilla (opcional)</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del acto procesal..."
            />
          </div>

          {err && (
            <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded bg-green-50 border border-green-200 text-green-700 p-3 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {ok}
            </div>
          )}

          <Button
            onClick={submit}
            disabled={submitting || !caseId || !file}
            className="w-full bg-[#0B2A5B] hover:bg-[#091f43]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Subir acto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
