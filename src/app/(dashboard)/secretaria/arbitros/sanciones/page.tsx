/**
 * Página: Sanciones a Árbitros
 * =============================
 * Lista y gestiona sanciones disciplinarias. Usa /api/admin/sanctions.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertOctagon,
  Plus,
  Eye,
  ArrowLeft,
  FileWarning,
  Loader2,
  Trash2,
  CheckCircle,
} from "lucide-react";

interface Sanction {
  id: string;
  arbitratorId: string;
  arbitratorName: string;
  type: "WARNING" | "SUSPENSION" | "REMOVAL";
  reason: string;
  resolutionNumber: string | null;
  startDate: string;
  endDate: string | null;
  blocksNewAssignments: boolean;
  removesFromActiveCases: boolean;
  status: "ACTIVE" | "COMPLETED" | "SCHEDULED";
  createdAt: string;
}

interface ArbitratorOption {
  userId: string;
  name: string;
  email: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  WARNING: { label: "Amonestación", color: "bg-amber-100 text-amber-800" },
  SUSPENSION: { label: "Suspensión", color: "bg-orange-100 text-orange-800" },
  REMOVAL: { label: "Remoción", color: "bg-red-100 text-red-800" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Vigente", color: "bg-red-100 text-red-800" },
  SCHEDULED: { label: "Programada", color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Cumplida", color: "bg-gray-100 text-gray-800" },
};

export default function SancionesPage() {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [arbitrators, setArbitrators] = useState<ArbitratorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form nuevo
  const [arbitratorUserId, setArbitratorUserId] = useState("");
  const [type, setType] = useState<"WARNING" | "SUSPENSION" | "REMOVAL">("WARNING");
  const [reason, setReason] = useState("");
  const [resolutionNumber, setResolutionNumber] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [blocksNew, setBlocksNew] = useState(true);
  const [removesActive, setRemovesActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadSanctions = async () => {
    const r = await fetch("/api/admin/sanctions");
    if (r.ok) {
      const d = await r.json();
      setSanctions(d.items || []);
    }
  };

  const loadArbitrators = async () => {
    const r = await fetch("/api/cms/arbitrators?limit=500");
    if (r.ok) {
      const d = await r.json();
      const arbs = (d.arbitrators || []).map((a: any) => ({
        userId: a.user?.id,
        name: a.profile?.displayName || a.user?.name || "—",
        email: a.user?.email || "",
      })).filter((a: any) => a.userId);
      setArbitrators(arbs);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadSanctions(), loadArbitrators()]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return sanctions.filter((s) => {
      if (filterType !== "all" && s.type !== filterType) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      return true;
    });
  }, [sanctions, filterType, filterStatus]);

  const stats = useMemo(
    () => ({
      active: sanctions.filter((s) => s.status === "ACTIVE").length,
      warnings: sanctions.filter((s) => s.type === "WARNING").length,
      suspensions: sanctions.filter((s) => s.type === "SUSPENSION").length,
      removals: sanctions.filter((s) => s.type === "REMOVAL").length,
    }),
    [sanctions]
  );

  const resetForm = () => {
    setArbitratorUserId("");
    setType("WARNING");
    setReason("");
    setResolutionNumber("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setBlocksNew(true);
    setRemovesActive(false);
    setErr(null);
  };

  const handleCreate = async () => {
    setErr(null);
    if (!arbitratorUserId || !reason || !startDate) {
      setErr("Árbitro, motivo y fecha de inicio son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/sanctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arbitratorUserId,
          type,
          reason,
          resolutionNumber: resolutionNumber || null,
          startDate,
          endDate: endDate || null,
          blocksNewAssignments: blocksNew,
          removesFromActiveCases: removesActive || type === "REMOVAL",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al crear sanción");
      setShowNewDialog(false);
      resetForm();
      await loadSanctions();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sanción? (Queda en AuditLog)")) return;
    const r = await fetch(`/api/admin/sanctions?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      await loadSanctions();
      setShowDetailDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/secretaria/arbitros">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver a Registro
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Sanciones Disciplinarias</h1>
          <p className="text-muted-foreground">
            Registro de sanciones aplicadas a árbitros del centro.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowNewDialog(true);
          }}
          className="bg-[#D66829] hover:bg-[#c45a22]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sanción
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertOctagon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Vigentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileWarning className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.warnings}</p>
              <p className="text-xs text-muted-foreground">Amonestaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertOctagon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suspensions}</p>
              <p className="text-xs text-muted-foreground">Suspensiones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertOctagon className="h-5 w-5 text-red-800" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.removals}</p>
              <p className="text-xs text-muted-foreground">Remociones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>{filtered.length} sanción(es)</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="WARNING">Amonestación</SelectItem>
                  <SelectItem value="SUSPENSION">Suspensión</SelectItem>
                  <SelectItem value="REMOVAL">Remoción</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Vigente</SelectItem>
                  <SelectItem value="SCHEDULED">Programada</SelectItem>
                  <SelectItem value="COMPLETED">Cumplida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertOctagon className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No hay sanciones registradas con estos filtros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Árbitro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.arbitratorName}
                    </TableCell>
                    <TableCell>
                      <Badge className={TYPE_LABELS[s.type]?.color}>
                        {TYPE_LABELS[s.type]?.label || s.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{s.reason}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(s.startDate).toLocaleDateString("es-PE")}
                      {s.endDate && ` → ${new Date(s.endDate).toLocaleDateString("es-PE")}`}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_LABELS[s.status]?.color}>
                        {STATUS_LABELS[s.status]?.label || s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSanction(s);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Sanción</DialogTitle>
          </DialogHeader>
          {selectedSanction && (
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-xs">Árbitro</Label>
                <p className="font-medium">{selectedSanction.arbitratorName}</p>
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <p>
                  <Badge className={TYPE_LABELS[selectedSanction.type]?.color}>
                    {TYPE_LABELS[selectedSanction.type]?.label}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-xs">Motivo</Label>
                <p className="whitespace-pre-wrap">{selectedSanction.reason}</p>
              </div>
              {selectedSanction.resolutionNumber && (
                <div>
                  <Label className="text-xs">N° Resolución</Label>
                  <p className="font-mono">{selectedSanction.resolutionNumber}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Inicio</Label>
                  <p>{new Date(selectedSanction.startDate).toLocaleDateString("es-PE")}</p>
                </div>
                <div>
                  <Label className="text-xs">Fin</Label>
                  <p>
                    {selectedSanction.endDate
                      ? new Date(selectedSanction.endDate).toLocaleDateString("es-PE")
                      : "Indefinida"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Bloquea nuevas asignaciones</Label>
                  <p>{selectedSanction.blocksNewAssignments ? "Sí" : "No"}</p>
                </div>
                <div>
                  <Label className="text-xs">Remueve de casos activos</Label>
                  <p>{selectedSanction.removesFromActiveCases ? "Sí" : "No"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Sanción */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Sanción</DialogTitle>
            <DialogDescription>
              Complete los datos. La sanción queda registrada en AuditLog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Árbitro *</Label>
                <Select value={arbitratorUserId} onValueChange={setArbitratorUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione árbitro" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {arbitrators.map((a) => (
                      <SelectItem key={a.userId} value={a.userId}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Sanción *</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WARNING">Amonestación</SelectItem>
                    <SelectItem value="SUSPENSION">Suspensión</SelectItem>
                    <SelectItem value="REMOVAL">Remoción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describa los hechos y fundamentos..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>N° Resolución (opcional)</Label>
              <Input
                value={resolutionNumber}
                onChange={(e) => setResolutionNumber(e.target.value)}
                placeholder="RES-CS-001-2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin (opcional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-xs">Bloquea nuevas asignaciones</Label>
                  <p className="text-xs text-muted-foreground">
                    No aparece para designación hasta que venza.
                  </p>
                </div>
                <Switch checked={blocksNew} onCheckedChange={setBlocksNew} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-xs">Remueve de casos activos</Label>
                  <p className="text-xs text-muted-foreground">
                    El Consejo debe reasignar sus casos.
                  </p>
                </div>
                <Switch
                  checked={removesActive || type === "REMOVAL"}
                  onCheckedChange={setRemovesActive}
                  disabled={type === "REMOVAL"}
                />
              </div>
            </div>

            {err && (
              <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
                {err}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !arbitratorUserId || !reason}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Registrar Sanción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
