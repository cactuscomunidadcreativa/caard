"use client";

/**
 * CAARD - Nueva Orden Procesal (Staff)
 *
 * Pantalla para que la secretaría o staff cree una OP eligiendo el
 * expediente, el tipo (Orden Procesal / Resolución), y la fuente del
 * contenido: subir un PDF/DOCX existente o redactarlo con IA. El
 * resultado se sube por el flujo estándar de escritos (cargo de
 * recibido, proveído, notificación a partes).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Gavel,
  Sparkles,
  Upload,
  Send,
  Loader2,
} from "lucide-react";

interface Case {
  id: string;
  code: string;
  title?: string | null;
  status?: string;
}

const TIPO_OPTIONS = ["Orden Procesal", "Resolución"];

export default function NuevaOrdenProcesalPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);

  const [caseId, setCaseId] = useState<string>("");
  const [tipo, setTipo] = useState<string>("Orden Procesal");
  const [mode, setMode] = useState<"ai" | "upload">("ai");

  // Modo IA
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);

  // Modo upload
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/cases?pageSize=200")
      .then((r) => r.json())
      .then((d) => {
        const arr: Case[] = Array.isArray(d) ? d : d.items || d.cases || d.data || [];
        setCases(arr);
      })
      .catch(() => setCases([]))
      .finally(() => setCasesLoading(false));
  }, []);

  const generateDraft = async () => {
    if (!caseId) {
      toast.error("Elegí un expediente primero");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Describí qué quieres redactar");
      return;
    }
    setGenerating(true);
    try {
      const r = await fetch(`/api/cases/${caseId}/escritos/ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: tipo, prompt }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error generando borrador");
      setDraft(d.text || "");
      toast.success("Borrador generado — revisalo y editalo antes de emitir");
    } catch (e: any) {
      toast.error(e.message || "Error generando borrador");
    } finally {
      setGenerating(false);
    }
  };

  const submitAi = async () => {
    if (!caseId || !draft.trim()) {
      toast.error("Falta caso o borrador");
      return;
    }
    setSubmitting(true);
    try {
      const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
      const safeTipo = tipo.replace(/[^a-zA-Z0-9-]/g, "-");
      const filename = `${safeTipo}-${new Date().toISOString().slice(0, 10)}.txt`;
      const fd = new FormData();
      fd.append("file", new File([blob], filename, { type: "text/plain" }));
      fd.append("documentType", tipo);
      fd.append(
        "description",
        `Generada con IA por staff — prompt: ${prompt.slice(0, 200)}`
      );
      const r = await fetch(`/api/cases/${caseId}/escritos`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Error al emitir OP");
      }
      toast.success("Orden Procesal emitida correctamente");
      router.push("/staff/ordenes-procesales");
    } catch (e: any) {
      toast.error(e.message || "Error al emitir OP");
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpload = async () => {
    if (!caseId || !file) {
      toast.error("Falta caso o archivo");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", tipo);
      fd.append("description", description || `${tipo} emitida por staff`);
      const r = await fetch(`/api/cases/${caseId}/escritos`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Error al subir");
      }
      toast.success("Orden Procesal cargada correctamente");
      router.push("/staff/ordenes-procesales");
    } catch (e: any) {
      toast.error(e.message || "Error al subir");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/staff/ordenes-procesales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0B2A5B]">
            <Gavel className="h-6 w-6" />
            Nueva Orden Procesal
          </h1>
          <p className="text-muted-foreground">
            Eligí el expediente y redactá con IA o subí un documento ya
            preparado.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
          <CardDescription>
            Estos campos son comunes a las dos formas de creación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>
                Expediente <span className="text-red-600">*</span>
              </Label>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      casesLoading ? "Cargando casos..." : "Seleccioná un expediente"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono">{c.code}</span>
                      {c.title ? ` — ${c.title.slice(0, 60)}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>
                Tipo de documento <span className="text-red-600">*</span>
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contenido</CardTitle>
              <CardDescription>
                {mode === "ai"
                  ? "Generá el texto con IA y revisalo antes de emitir."
                  : "Subí un archivo PDF / DOCX ya preparado."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={mode === "ai" ? "default" : "outline"}
                onClick={() => setMode("ai")}
                className={
                  mode === "ai" ? "bg-[#0B2A5B] hover:bg-[#0d3570]" : ""
                }
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Con IA
              </Button>
              <Button
                variant={mode === "upload" ? "default" : "outline"}
                onClick={() => setMode("upload")}
                className={
                  mode === "upload" ? "bg-[#0B2A5B] hover:bg-[#0d3570]" : ""
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir archivo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "ai" ? (
            <>
              <div className="space-y-1">
                <Label>Indicaciones para la IA</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder='Ej. "Redactá la Orden Procesal Nº 3 fijando audiencia de fijación de puntos controvertidos para el 15 de junio a las 10:00, en sala virtual."'
                />
                <p className="text-xs text-muted-foreground">
                  Tip: incluí fechas, nombres y montos relevantes. Lo que
                  falte la IA lo deja entre [CORCHETES] para que lo completes.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={generateDraft}
                  disabled={generating || !prompt.trim() || !caseId}
                  className="border-[#0B2A5B] text-[#0B2A5B] hover:bg-[#0B2A5B]/5"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {draft ? "Regenerar" : "Generar borrador"}
                    </>
                  )}
                </Button>
              </div>

              {draft && (
                <div className="space-y-1">
                  <Label>Borrador (editable)</Label>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={submitAi}
                  disabled={submitting || !caseId || !draft.trim()}
                  className="bg-[#D66829] hover:bg-[#c45a22]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Emitiendo...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Emitir Orden Procesal
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Archivo (PDF / DOCX)</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-1">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Breve descripción del contenido..."
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={submitUpload}
                  disabled={submitting || !caseId || !file}
                  className="bg-[#D66829] hover:bg-[#c45a22]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Orden Procesal
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground border-t pt-3">
            Al emitir la OP se carga al expediente como escrito. Si se generó
            con IA queda como archivo .txt. El tribunal luego la provee y la
            secretaría la notifica a las partes — recién ahí corren plazos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
