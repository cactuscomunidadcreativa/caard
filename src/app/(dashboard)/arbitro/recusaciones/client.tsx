"use client";

import { useEffect, useState } from "react";
import { Loader2, Gavel, CheckCircle2, XCircle, Clock, FileText, Send, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Recusation {
  id: string;
  caseId: string;
  requesterRole: string;
  reason: string;
  status: string;
  filedAt: string;
  responseDueAt: string | null;
  arbitratorResponse: string | null;
  arbitratorResponseAt: string | null;
  councilDecision: string | null;
  councilResolution: string | null;
  resolvedAt: string | null;
  case: { id: string; code: string; title: string | null };
  arbitrator: {
    id: string;
    user: { id: string; name: string | null; email: string } | null;
    profile: { displayName: string; slug: string } | null;
  };
}

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  FILED: { label: "Presentada", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  TRANSFERRED: { label: "Trasladada", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Send },
  PENDING_RESPONSE: { label: "Pendiente respuesta", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  RESPONSE_RECEIVED: { label: "Respuesta recibida", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
  PENDING_COUNCIL_DECISION: { label: "Pendiente consejo", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Gavel },
  ACCEPTED: { label: "Aceptada", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

export function RecusacionesClient({ userId, userRole }: { userId: string; userRole: string }) {
  const [recusations, setRecusations] = useState<Recusation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [respondRec, setRespondRec] = useState<Recusation | null>(null);
  const [responseText, setResponseText] = useState("");

  const [decideRec, setDecideRec] = useState<Recusation | null>(null);
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED">("REJECTED");
  const [resolution, setResolution] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [processing, setProcessing] = useState(false);

  const isStaff = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole);

  // Presentar nueva recusación
  const [showNew, setShowNew] = useState(false);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [newCaseId, setNewCaseId] = useState("");
  const [newArbitratorId, setNewArbitratorId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [caseArbitrators, setCaseArbitrators] = useState<any[]>([]);

  const loadMyCases = async () => {
    try {
      const r = await fetch("/api/cases?pageSize=100");
      if (r.ok) {
        const d = await r.json();
        setMyCases(d.items || []);
      }
    } catch {}
  };

  const loadCaseArbitrators = async (caseId: string) => {
    setCaseArbitrators([]);
    try {
      const r = await fetch(`/api/cases/${caseId}`);
      if (r.ok) {
        const d = await r.json();
        // members con role ARBITRO; necesitamos el arbitratorRegistry.id, no el member.id
        const arbs = (d.case?.members || []).filter((m: any) => m.role === "ARBITRO");
        // Para cada arbitro, buscar su registry
        const regs = await Promise.all(
          arbs.map(async (m: any) => {
            if (!m.userId) return null;
            const reg = await fetch(`/api/arbitrators/registry-by-user/${m.userId}`);
            if (reg.ok) {
              const data = await reg.json();
              return {
                registryId: data.registry?.id,
                displayName: m.displayName || m.user?.name || m.email,
                email: m.email,
              };
            }
            return {
              registryId: null,
              displayName: m.displayName || m.user?.name || m.email,
              email: m.email,
              userId: m.userId,
            };
          })
        );
        setCaseArbitrators(regs.filter((x) => x !== null));
      }
    } catch {}
  };

  const submitNew = async () => {
    if (!newCaseId || !newArbitratorId || newReason.trim().length < 10) {
      alert("Completa todos los campos (motivo mínimo 10 caracteres)");
      return;
    }
    setProcessing(true);
    try {
      const r = await fetch("/api/recusations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: newCaseId,
          arbitratorId: newArbitratorId,
          reason: newReason,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error);
      }
      setShowNew(false);
      setNewCaseId("");
      setNewArbitratorId("");
      setNewReason("");
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/recusations");
      const d = await r.json();
      if (r.ok) setRecusations(d.recusations || []);
      else setError(d.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async () => {
    if (!respondRec || !responseText.trim()) return;
    setProcessing(true);
    try {
      const r = await fetch(`/api/recusations/${respondRec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", response: responseText }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error);
      }
      setRespondRec(null);
      setResponseText("");
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const decide = async () => {
    if (!decideRec || !resolution.trim()) return;
    setProcessing(true);
    try {
      const r = await fetch(`/api/recusations/${decideRec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          decision,
          resolution,
          amountCents: decision === "ACCEPTED" && paymentAmount
            ? Math.round(parseFloat(paymentAmount) * 100)
            : 0,
          paymentDescription: `Pago por recusación aceptada - Expediente ${decideRec.case.code}`,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error);
      }
      const data = await r.json();
      setDecideRec(null);
      setResolution("");
      setPaymentAmount("");
      if (data.paymentOrderId) {
        alert(
          `Decisión guardada. Se generó la orden de pago ${data.paymentOrderId} al árbitro.`
        );
      }
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#D66829]">Recusaciones</h1>
          <p className="text-sm text-muted-foreground">
            {userRole === "ARBITRO"
              ? "Recusaciones que le involucran"
              : isStaff
              ? "Todas las recusaciones del centro"
              : "Recusaciones en sus casos"}
          </p>
        </div>
        {["DEMANDANTE", "DEMANDADO", "ABOGADO", "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole) && (
          <Button
            onClick={() => {
              setShowNew(true);
              loadMyCases();
            }}
            className="bg-[#D66829] hover:bg-[#c45a22]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Presentar recusación
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">{error}</div>
      )}

      {recusations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay recusaciones registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recusations.map((rec) => {
            const meta = STATUS_META[rec.status] || STATUS_META.FILED;
            const Icon = meta.icon;

            const isAffectedArbitrator =
              userRole === "ARBITRO" && rec.arbitrator?.user?.id === userId;
            const canRespond =
              isAffectedArbitrator &&
              ["FILED", "PENDING_RESPONSE", "TRANSFERRED"].includes(rec.status);
            const canDecide =
              isStaff &&
              ["RESPONSE_RECEIVED", "PENDING_COUNCIL_DECISION", "FILED"].includes(rec.status);

            return (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Gavel className="h-4 w-4 text-[#D66829]" />
                        Recusación en {rec.case.code}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Árbitro recusado:{" "}
                        <strong>
                          {rec.arbitrator?.profile?.displayName ||
                            rec.arbitrator?.user?.name ||
                            rec.arbitrator?.user?.email}
                        </strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Presentada por {rec.requesterRole} el{" "}
                        {new Date(rec.filedAt).toLocaleDateString("es-PE")}
                      </p>
                    </div>
                    <Badge className={meta.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {meta.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Motivo</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{rec.reason}</p>
                  </div>

                  {rec.arbitratorResponse && (
                    <div className="bg-blue-50 border-l-2 border-blue-400 pl-3 py-2">
                      <Label className="text-xs">Respuesta del árbitro</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {rec.arbitratorResponse}
                      </p>
                      {rec.arbitratorResponseAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(rec.arbitratorResponseAt).toLocaleString("es-PE")}
                        </p>
                      )}
                    </div>
                  )}

                  {rec.councilResolution && (
                    <div className="bg-purple-50 border-l-2 border-purple-400 pl-3 py-2">
                      <Label className="text-xs">Resolución del Consejo</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {rec.councilResolution}
                      </p>
                      {rec.resolvedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(rec.resolvedAt).toLocaleString("es-PE")}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {canRespond && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setRespondRec(rec);
                          setResponseText("");
                        }}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Responder
                      </Button>
                    )}
                    {canDecide && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          setDecideRec(rec);
                          setResolution("");
                          setDecision("REJECTED");
                          setPaymentAmount("");
                        }}
                      >
                        <Gavel className="h-3 w-3 mr-1" />
                        Decidir (consejo)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog responder (árbitro) */}
      <Dialog open={!!respondRec} onOpenChange={(v) => !v && setRespondRec(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder recusación</DialogTitle>
            <DialogDescription>
              Presente su respuesta al motivo expuesto.
            </DialogDescription>
          </DialogHeader>
          {respondRec && (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded text-sm">
                <strong>Motivo:</strong> {respondRec.reason}
              </div>
              <div>
                <Label>Su respuesta *</Label>
                <Textarea
                  rows={6}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRespondRec(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button onClick={respond} disabled={processing || !responseText.trim()}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog presentar nueva recusación */}
      <Dialog
        open={showNew}
        onOpenChange={(v) => {
          setShowNew(v);
          if (!v) {
            setNewCaseId("");
            setNewArbitratorId("");
            setNewReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Presentar recusación</DialogTitle>
            <DialogDescription>
              Seleccione el caso y el árbitro a recusar. El árbitro tendrá 5 días para responder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Caso *</Label>
              <Select
                value={newCaseId}
                onValueChange={(v) => {
                  setNewCaseId(v);
                  setNewArbitratorId("");
                  loadCaseArbitrators(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un expediente" />
                </SelectTrigger>
                <SelectContent>
                  {myCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.title || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newCaseId && (
              <div>
                <Label>Árbitro a recusar *</Label>
                {caseArbitrators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay árbitros registrados con registry en este caso.
                  </p>
                ) : (
                  <Select value={newArbitratorId} onValueChange={setNewArbitratorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el árbitro" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseArbitrators
                        .filter((a: any) => a.registryId)
                        .map((a: any) => (
                          <SelectItem key={a.registryId} value={a.registryId}>
                            {a.displayName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <div>
              <Label>Motivo de la recusación *</Label>
              <Textarea
                rows={6}
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Detalle los hechos y fundamentos de la recusación..."
              />
              <p className="text-xs text-muted-foreground mt-1">Mínimo 10 caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button
              onClick={submitNew}
              disabled={
                processing ||
                !newCaseId ||
                !newArbitratorId ||
                newReason.trim().length < 10
              }
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Presentar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog decidir (consejo / staff) */}
      <Dialog open={!!decideRec} onOpenChange={(v) => !v && setDecideRec(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decisión del Consejo Superior</DialogTitle>
            <DialogDescription>
              Registre la resolución del consejo sobre la recusación.
            </DialogDescription>
          </DialogHeader>
          {decideRec && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={decision === "ACCEPTED" ? "default" : "outline"}
                  className={
                    decision === "ACCEPTED"
                      ? "bg-green-600 hover:bg-green-700 flex-1"
                      : "flex-1"
                  }
                  onClick={() => setDecision("ACCEPTED")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Aceptar recusación
                </Button>
                <Button
                  variant={decision === "REJECTED" ? "default" : "outline"}
                  className={
                    decision === "REJECTED"
                      ? "bg-red-600 hover:bg-red-700 flex-1"
                      : "flex-1"
                  }
                  onClick={() => setDecision("REJECTED")}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rechazar recusación
                </Button>
              </div>
              <div>
                <Label>Resolución *</Label>
                <Textarea
                  rows={5}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Considerando... RESUELVE..."
                />
              </div>
              {decision === "ACCEPTED" && (
                <div className="space-y-2 bg-green-50 border border-green-200 p-3 rounded">
                  <Label>Monto a pagar al árbitro (S/.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Al aceptar la recusación, se generará una orden de pago automática al árbitro.
                    Deje en blanco si no corresponde pago.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDecideRec(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={decide}
              disabled={processing || !resolution.trim()}
              className={
                decision === "ACCEPTED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gavel className="h-4 w-4 mr-2" />}
              Registrar decisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
