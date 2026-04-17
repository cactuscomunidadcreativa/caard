"use client";

/**
 * Sección de Escritos dentro del detalle del caso.
 *
 * Roles:
 * - Partes / Abogados: pueden PRESENTAR escritos + ver los suyos (con cargo) + ver los NOTIFICADOS
 * - Árbitros: ven todos los escritos y pueden PROVEER los SUBMITTED
 * - Staff (centro): ven todos, pueden NOTIFICAR los PROVEIDOS
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  Upload,
  Gavel,
  MailCheck,
  Check,
  X,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Escrito {
  id: string;
  originalFileName: string;
  documentType: string;
  description?: string | null;
  escritoStatus: "SUBMITTED" | "PROVEIDO" | "NOTIFIED" | "REJECTED" | null;
  createdAt: string;
  proveidoAt: string | null;
  proveidoText: string | null;
  notifiedAt: string | null;
  notificationText: string | null;
  deadlineStartsAt: string | null;
  driveWebViewLink: string | null;
  uploadedBy: { id: string; name: string | null; email: string } | null;
}

interface Props {
  caseId: string;
  caseCode: string;
  userRole: string;
  userId: string;
  isArbitratorOfCase: boolean;
  isPartyOfCase: boolean;
}

const TIPO_OPTIONS = [
  "Escrito",
  "Demanda",
  "Contestación",
  "Reconvención",
  "Alegato",
  "Objeción",
  "Prueba",
  "Otro",
];

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  SUBMITTED: {
    label: "Recibido (pendiente proveer)",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  PROVEIDO: {
    label: "Proveído (pendiente notificar)",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Gavel,
  },
  NOTIFIED: {
    label: "Notificado",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: MailCheck,
  },
  REJECTED: {
    label: "Rechazado",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: X,
  },
};

export function EscritosSection({
  caseId,
  caseCode,
  userRole,
  userId,
  isArbitratorOfCase,
  isPartyOfCase,
}: Props) {
  const router = useRouter();
  const [escritos, setEscritos] = useState<Escrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(
    userRole
  );

  // Presentar
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState("Escrito");
  const [descripcion, setDescripcion] = useState("");
  const [uploading, setUploading] = useState(false);

  // Proveer
  const [proveerEscrito, setProveerEscrito] = useState<Escrito | null>(null);
  const [proveerText, setProveerText] = useState("");
  const [proveerAccept, setProveerAccept] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Notificar
  const [notifyEscrito, setNotifyEscrito] = useState<Escrito | null>(null);
  const [notifyText, setNotifyText] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/cases/${caseId}/escritos`);
      if (r.ok) {
        const d = await r.json();
        setEscritos(d.escritos || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", tipo);
      fd.append("description", descripcion);
      const r = await fetch(`/api/cases/${caseId}/escritos`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Error al presentar escrito");
      }
      setShowUpload(false);
      setFile(null);
      setTipo("Escrito");
      setDescripcion("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const proveer = async () => {
    if (!proveerEscrito) return;
    if (!proveerText.trim() || proveerText.trim().length < 5) {
      alert("Escribe la resolución del tribunal (mínimo 5 caracteres)");
      return;
    }
    setProcessing(true);
    try {
      const r = await fetch(
        `/api/cases/${caseId}/escritos/${proveerEscrito.id}/proveer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: proveerText, accept: proveerAccept }),
        }
      );
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Error");
      }
      setProveerEscrito(null);
      setProveerText("");
      setProveerAccept(true);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const notificar = async () => {
    if (!notifyEscrito) return;
    setProcessing(true);
    try {
      const r = await fetch(
        `/api/cases/${caseId}/escritos/${notifyEscrito.id}/notificar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: notifyText }),
        }
      );
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Error");
      }
      setNotifyEscrito(null);
      setNotifyText("");
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const canPresentar = isStaff || isPartyOfCase;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Escritos del expediente
        </CardTitle>
        {canPresentar && (
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-[#D66829] hover:bg-[#c45a22]"
          >
            <Upload className="h-4 w-4 mr-2" />
            Presentar escrito
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Cargando...
          </div>
        ) : escritos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aún no se han presentado escritos en este expediente.
          </p>
        ) : (
          <div className="space-y-3">
            {escritos.map((e) => {
              const meta = e.escritoStatus
                ? STATUS_META[e.escritoStatus]
                : null;
              const Icon = meta?.icon || FileText;
              const esMiEscrito = e.uploadedBy?.id === userId;
              const puedeProveer =
                isArbitratorOfCase && e.escritoStatus === "SUBMITTED";
              const puedeNotificar = isStaff && e.escritoStatus === "PROVEIDO";

              return (
                <div
                  key={e.id}
                  className="rounded-lg border p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-[#D66829] flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">
                            {e.originalFileName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {e.documentType}
                          </Badge>
                          {meta && (
                            <Badge className={`${meta.color} text-xs`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {meta.label}
                            </Badge>
                          )}
                          {esMiEscrito && (
                            <Badge variant="secondary" className="text-xs">
                              Tu escrito
                            </Badge>
                          )}
                        </div>
                        {e.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {e.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Presentado por{" "}
                          {e.uploadedBy?.name || e.uploadedBy?.email || "—"} el{" "}
                          {new Date(e.createdAt).toLocaleString("es-PE", {
                            timeZone: "America/Lima",
                          })}
                        </p>
                        {e.proveidoText && (
                          <div className="mt-2 bg-blue-50 border-l-2 border-blue-400 px-3 py-2 text-xs">
                            <strong>Resolución tribunal:</strong> {e.proveidoText}
                          </div>
                        )}
                        {e.notificationText && (
                          <div className="mt-2 bg-green-50 border-l-2 border-green-400 px-3 py-2 text-xs">
                            <strong>Notificación centro:</strong>{" "}
                            {e.notificationText}
                          </div>
                        )}
                        {e.deadlineStartsAt && (
                          <p className="text-xs text-green-700 mt-2">
                            🕒 Plazos corren desde{" "}
                            {new Date(e.deadlineStartsAt).toLocaleString(
                              "es-PE",
                              { timeZone: "America/Lima" }
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {e.driveWebViewLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(e.driveWebViewLink!, "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      )}
                      {puedeProveer && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setProveerEscrito(e);
                            setProveerText("");
                            setProveerAccept(true);
                          }}
                        >
                          <Gavel className="h-3 w-3 mr-1" />
                          Proveer
                        </Button>
                      )}
                      {puedeNotificar && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setNotifyEscrito(e);
                            setNotifyText("");
                          }}
                        >
                          <MailCheck className="h-3 w-3 mr-1" />
                          Notificar partes
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog: Presentar escrito */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Presentar nuevo escrito
            </DialogTitle>
            <DialogDescription>
              Expediente {caseCode}. Al presentarlo recibirá un cargo de recibido
              por email. El tribunal lo proveerá y el centro lo notificará a las
              partes — en ese momento corren los plazos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Archivo (PDF recomendado)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de escrito</Label>
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
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Breve descripción del contenido..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpload(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={uploading || !file}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Presentar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Proveer */}
      <Dialog
        open={!!proveerEscrito}
        onOpenChange={(v) => !v && setProveerEscrito(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Proveer escrito
            </DialogTitle>
            <DialogDescription>
              Como tribunal arbitral, resuelva sobre este escrito. Al hacerlo
              quedará pendiente de que el centro notifique a las partes.
            </DialogDescription>
          </DialogHeader>

          {proveerEscrito && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">{proveerEscrito.originalFileName}</p>
                <p className="text-xs text-muted-foreground">
                  Tipo: {proveerEscrito.documentType}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={proveerAccept ? "default" : "outline"}
                  className={
                    proveerAccept ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"
                  }
                  onClick={() => setProveerAccept(true)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Admitir / Resolver
                </Button>
                <Button
                  variant={!proveerAccept ? "default" : "outline"}
                  className={
                    !proveerAccept ? "bg-red-600 hover:bg-red-700 flex-1" : "flex-1"
                  }
                  onClick={() => setProveerAccept(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
              </div>

              <div className="space-y-1">
                <Label>Resolución del tribunal *</Label>
                <Textarea
                  rows={5}
                  value={proveerText}
                  onChange={(e) => setProveerText(e.target.value)}
                  placeholder="Téngase presente lo expuesto..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProveerEscrito(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={proveer}
              disabled={processing || !proveerText.trim()}
              className={
                proveerAccept
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Gavel className="h-4 w-4 mr-2" />
              )}
              Proveer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Notificar */}
      <Dialog
        open={!!notifyEscrito}
        onOpenChange={(v) => !v && setNotifyEscrito(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailCheck className="h-5 w-5" />
              Notificar a las partes
            </DialogTitle>
            <DialogDescription>
              Al notificar, el escrito pasa a ser visible a las partes y
              abogados. Los plazos correspondientes comienzan a correr desde
              este momento.
            </DialogDescription>
          </DialogHeader>

          {notifyEscrito && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">{notifyEscrito.originalFileName}</p>
                {notifyEscrito.proveidoText && (
                  <div className="mt-2 border-l-2 border-blue-400 pl-3 text-xs">
                    <strong>Resolución:</strong> {notifyEscrito.proveidoText}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label>Nota del centro (opcional)</Label>
                <Textarea
                  rows={3}
                  value={notifyText}
                  onChange={(e) => setNotifyText(e.target.value)}
                  placeholder="Información adicional para las partes..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotifyEscrito(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={notificar}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MailCheck className="h-4 w-4 mr-2" />
              )}
              Notificar y abrir plazos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
