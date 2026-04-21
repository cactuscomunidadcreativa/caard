/**
 * /arbitro/resoluciones/nueva — Emitir resolución (proveer escrito)
 *
 * El árbitro ve los escritos pendientes de proveer en sus casos asignados,
 * selecciona uno, redacta la resolución y decide aceptar o rechazar.
 * POST /api/cases/[id]/escritos/[docId]/proveer
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Gavel,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CaseItem {
  id: string;
  code: string;
  title: string | null;
}

interface Escrito {
  id: string;
  originalFileName: string;
  documentType: string;
  description: string | null;
  escritoStatus: string;
  createdAt: string;
  driveWebViewLink: string | null;
  uploadedBy: { name: string | null; email: string | null } | null;
}

export default function NuevaResolucionPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [caseId, setCaseId] = useState<string>("");
  const [escritos, setEscritos] = useState<Escrito[]>([]);
  const [loadingEscritos, setLoadingEscritos] = useState(false);
  const [escritoId, setEscritoId] = useState<string>("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState<null | "accept" | "reject">(
    null
  );
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  useEffect(() => {
    if (!caseId) {
      setEscritos([]);
      setEscritoId("");
      return;
    }
    setLoadingEscritos(true);
    (async () => {
      try {
        const r = await fetch(`/api/cases/${caseId}/escritos`);
        if (r.ok) {
          const d = await r.json();
          const pendientes = (d.escritos || []).filter(
            (e: Escrito) => e.escritoStatus === "SUBMITTED"
          );
          setEscritos(pendientes);
        }
      } finally {
        setLoadingEscritos(false);
      }
    })();
  }, [caseId]);

  const submit = async (accept: boolean) => {
    setErr(null);
    setOk(null);
    if (!caseId || !escritoId) {
      setErr("Selecciona caso y escrito");
      return;
    }
    if (text.trim().length < 5) {
      setErr("La resolución debe tener al menos 5 caracteres");
      return;
    }
    setSubmitting(accept ? "accept" : "reject");
    try {
      const r = await fetch(
        `/api/cases/${caseId}/escritos/${escritoId}/proveer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), accept }),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al emitir resolución");
      setOk(
        accept
          ? "Resolución emitida. El Centro procederá a notificar a las partes."
          : "Escrito rechazado. Se notificó al presentante."
      );
      setText("");
      setEscritoId("");
      // Refrescar lista de escritos del caso
      const rr = await fetch(`/api/cases/${caseId}/escritos`);
      if (rr.ok) {
        const dd = await rr.json();
        setEscritos(
          (dd.escritos || []).filter(
            (e: Escrito) => e.escritoStatus === "SUBMITTED"
          )
        );
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(null);
    }
  };

  const selectedEscrito = escritos.find((e) => e.id === escritoId);

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
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
            <Gavel className="h-5 w-5 text-[#D66829]" />
            Emitir Resolución
          </CardTitle>
          <CardDescription>
            Provee un escrito presentado por las partes. Tu resolución pasa al
            Centro para notificación a las partes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Caso */}
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

          {/* Escrito */}
          {caseId && (
            <div>
              <Label>Escrito a proveer *</Label>
              {loadingEscritos ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando escritos...
                </div>
              ) : escritos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay escritos pendientes de proveer en este expediente.
                </p>
              ) : (
                <Select value={escritoId} onValueChange={setEscritoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el escrito" />
                  </SelectTrigger>
                  <SelectContent>
                    {escritos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.documentType} — {e.originalFileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Preview del escrito seleccionado */}
          {selectedEscrito && (
            <Card className="bg-muted/30">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {selectedEscrito.originalFileName}
                    </span>
                    <Badge variant="secondary">
                      {selectedEscrito.documentType}
                    </Badge>
                  </div>
                  {selectedEscrito.driveWebViewLink && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={selectedEscrito.driveWebViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver archivo
                      </a>
                    </Button>
                  )}
                </div>
                {selectedEscrito.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEscrito.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Presentado por{" "}
                  {selectedEscrito.uploadedBy?.name ||
                    selectedEscrito.uploadedBy?.email ||
                    "—"}{" "}
                  el{" "}
                  {new Date(selectedEscrito.createdAt).toLocaleString("es-PE", {
                    timeZone: "America/Lima",
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Texto de la resolución */}
          <div>
            <Label>Texto de la resolución *</Label>
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="RESOLUCIÓN N.° ...&#10;&#10;AUTOS Y VISTOS; y considerando...&#10;&#10;SE RESUELVE: ..."
              disabled={!escritoId}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Redacta la providencia o resolución. Quedará registrada en el
              expediente y será firmada con tu usuario.
            </p>
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

          <div className="flex gap-3">
            <Button
              onClick={() => submit(true)}
              disabled={
                submitting !== null ||
                !escritoId ||
                text.trim().length < 5
              }
              className="flex-1 bg-[#D66829] hover:bg-[#c45a22]"
            >
              {submitting === "accept" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Proveer (admitir)
            </Button>
            <Button
              onClick={() => submit(false)}
              disabled={
                submitting !== null ||
                !escritoId ||
                text.trim().length < 5
              }
              variant="destructive"
              className="flex-1"
            >
              {submitting === "reject" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Rechazar escrito
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
