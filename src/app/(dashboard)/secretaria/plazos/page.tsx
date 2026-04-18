/**
 * Página: Gestión de Plazos Procesales
 * =====================================
 * Panel de control de plazos para la secretaría.
 * Status reales del modelo ProcessDeadline (enum DeadlineStatus):
 *   ACTIVE | COMPLETED | OVERDUE | CANCELLED | EXTENDED
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Plus,
  RefreshCw,
  Loader2,
  XCircle,
  Ban,
} from "lucide-react";

// ======== Tipos y helpers ========
interface Deadline {
  id: string;
  caseId: string;
  caseCode: string;
  type: string;
  title: string;
  description: string;
  dueDate: string; // ISO
  dueDateLocal: string; // YYYY-MM-DD Peru
  businessDays: number;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE" | "CANCELLED" | "EXTENDED";
  completedAt: string | null;
  daysRemaining: number; // cal dias calendario (positivo = futuro)
  businessDaysRemaining: number; // cal dias habiles
  isOverdue: boolean;
  extensions: number;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  ACTIVE: {
    label: "En Curso",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
  OVERDUE: {
    label: "Vencido",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
  COMPLETED: {
    label: "Cumplido",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  EXTENDED: {
    label: "Prorrogado",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: RefreshCw,
  },
  CANCELLED: {
    label: "Anulado",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Ban,
  },
};

// ======== Feriados Perú (para cálculo client-side) ========
const FIXED_HOLIDAYS = new Set([
  "01-01",
  "05-01",
  "06-29",
  "07-28",
  "07-29",
  "08-06",
  "08-30",
  "10-08",
  "11-01",
  "12-08",
  "12-09",
  "12-25",
]);
const VARIABLE_HOLIDAYS_BY_YEAR: Record<number, Set<string>> = {
  2024: new Set(["03-28", "03-29"]),
  2025: new Set(["04-17", "04-18"]),
  2026: new Set(["04-02", "04-03"]),
  2027: new Set(["03-25", "03-26"]),
  2028: new Set(["04-13", "04-14"]),
};

function isHolidayPe(d: Date): boolean {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const key = `${mm}-${dd}`;
  if (FIXED_HOLIDAYS.has(key)) return true;
  const v = VARIABLE_HOLIDAYS_BY_YEAR[d.getFullYear()];
  return v ? v.has(key) : false;
}
function isBusinessDayPe(d: Date): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  return !isHolidayPe(d);
}
/** Días hábiles entre ahora (inicio del día local) y la fecha dada. Negativo si la fecha ya pasó. */
function businessDaysBetween(fromDate: Date, toDate: Date): number {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  if (start.getTime() === end.getTime()) return 0;
  const sign = end > start ? 1 : -1;
  const a = sign === 1 ? start : end;
  const b = sign === 1 ? end : start;
  let n = 0;
  const cur = new Date(a);
  while (cur < b) {
    cur.setDate(cur.getDate() + 1);
    if (isBusinessDayPe(cur)) n++;
  }
  return n * sign;
}

// ======== Component ========
export default function PlazosPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("active");

  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [extensionDays, setExtensionDays] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [extending, setExtending] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cases, setCases] = useState<{ id: string; code: string }[]>([]);
  const [newDeadline, setNewDeadline] = useState({
    caseId: "",
    type: "CUSTOM" as string,
    title: "",
    description: "",
    businessDays: "10",
  });

  // Cargar casos al montar
  useEffect(() => {
    fetch("/api/cases?pageSize=500")
      .then((r) => r.json())
      .then((d) =>
        setCases((d.items || []).map((c: any) => ({ id: c.id, code: c.code })))
      )
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/deadlines?limit=500");
      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        const items: Deadline[] = (data.data || []).map((d: any) => {
          const due = new Date(d.dueAt);
          const daysRemaining = Math.ceil(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const businessDaysRemaining = businessDaysBetween(now, due);
          const rawStatus = d.status || "ACTIVE";
          // Corregir: si status es ACTIVE pero ya pasó, mostrarlo como OVERDUE en la UI
          const effectiveStatus =
            rawStatus === "ACTIVE" && due < now ? "OVERDUE" : rawStatus;
          return {
            id: d.id,
            caseId: d.case?.id || d.caseId,
            caseCode: d.case?.code || "—",
            type: d.type || "CUSTOM",
            title: d.title || "Plazo procesal",
            description: d.description || "",
            dueDate: d.dueAt,
            dueDateLocal: due.toLocaleDateString("es-PE", {
              timeZone: "America/Lima",
            }),
            businessDays: d.businessDays || 0,
            status: effectiveStatus,
            completedAt: d.completedAt || null,
            daysRemaining,
            businessDaysRemaining,
            isOverdue: effectiveStatus === "OVERDUE",
            extensions: d.originalDueAt ? 1 : 0,
          };
        });
        setDeadlines(items);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ======= Actions =======
  async function handleMarkComplete(d: Deadline) {
    if (!confirm(`¿Marcar "${d.title}" como cumplido?`)) return;
    try {
      const res = await fetch(`/api/deadlines/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleCancel(d: Deadline) {
    if (!confirm(`¿Anular el plazo "${d.title}"?`)) return;
    try {
      const res = await fetch(`/api/deadlines/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("Error al anular");
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleCreateDeadline() {
    if (
      !newDeadline.caseId ||
      !newDeadline.title ||
      !newDeadline.businessDays
    )
      return;
    setCreating(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: newDeadline.caseId,
          type: newDeadline.type,
          title: newDeadline.title,
          description: newDeadline.description || undefined,
          businessDays: parseInt(newDeadline.businessDays, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear plazo");
      }
      setShowCreateDialog(false);
      setNewDeadline({
        caseId: "",
        type: "CUSTOM",
        title: "",
        description: "",
        businessDays: "10",
      });
      await load();
    } catch (e: any) {
      alert(e.message || "Error al crear plazo");
    } finally {
      setCreating(false);
    }
  }

  async function handleExtension() {
    if (!selectedDeadline || !extensionDays) return;
    setExtending(true);
    try {
      const res = await fetch(`/api/deadlines/${selectedDeadline.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          additionalDays: parseInt(extensionDays, 10),
          reason:
            extensionReason.length >= 10
              ? extensionReason
              : "Prórroga otorgada por la secretaría arbitral",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al prorrogar");
      }
      setShowExtensionDialog(false);
      setExtensionDays("");
      setExtensionReason("");
      setSelectedDeadline(null);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExtending(false);
    }
  }

  // ======= Derivados =======
  const active = useMemo(
    () => deadlines.filter((d) => d.status === "ACTIVE"),
    [deadlines]
  );
  const overdue = useMemo(
    () => deadlines.filter((d) => d.status === "OVERDUE"),
    [deadlines]
  );
  const urgent = useMemo(
    () =>
      deadlines.filter(
        (d) =>
          d.status === "ACTIVE" &&
          d.businessDaysRemaining >= 0 &&
          d.businessDaysRemaining <= 2
      ),
    [deadlines]
  );
  const completed = useMemo(
    () => deadlines.filter((d) => d.status === "COMPLETED"),
    [deadlines]
  );
  const extended = useMemo(
    () => deadlines.filter((d) => d.status === "EXTENDED"),
    [deadlines]
  );
  const all = deadlines;

  const visible =
    activeTab === "active"
      ? active
      : activeTab === "overdue"
      ? overdue
      : activeTab === "urgent"
      ? urgent
      : activeTab === "completed"
      ? completed
      : activeTab === "extended"
      ? extended
      : all;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Plazos</h1>
          <p className="text-muted-foreground">
            Control y seguimiento de plazos procesales (lunes a viernes, excluye
            feriados nacionales de Perú)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#D66829] hover:bg-[#c45a22]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plazo
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard
          label="Vencidos"
          value={overdue.length}
          icon={AlertTriangle}
          color="red"
          active={activeTab === "overdue"}
          onClick={() => setActiveTab("overdue")}
        />
        <SummaryCard
          label="Urgentes (≤2 días hábiles)"
          value={urgent.length}
          icon={Clock}
          color="amber"
          active={activeTab === "urgent"}
          onClick={() => setActiveTab("urgent")}
        />
        <SummaryCard
          label="En Curso"
          value={active.length}
          icon={Calendar}
          color="blue"
          active={activeTab === "active"}
          onClick={() => setActiveTab("active")}
        />
        <SummaryCard
          label="Cumplidos"
          value={completed.length}
          icon={CheckCircle}
          color="green"
          active={activeTab === "completed"}
          onClick={() => setActiveTab("completed")}
        />
        <SummaryCard
          label="Total"
          value={all.length}
          icon={Calendar}
          color="slate"
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="active">En Curso ({active.length})</TabsTrigger>
          <TabsTrigger value="urgent" className="text-amber-700">
            Urgentes ({urgent.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-700">
            Vencidos ({overdue.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-green-700">
            Cumplidos ({completed.length})
          </TabsTrigger>
          <TabsTrigger value="extended" className="text-purple-700">
            Prorrogados ({extended.length})
          </TabsTrigger>
          <TabsTrigger value="all">Todos ({all.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DeadlineTable
            deadlines={visible}
            onExtend={(d) => {
              setSelectedDeadline(d);
              setShowExtensionDialog(true);
            }}
            onMarkComplete={handleMarkComplete}
            onCancel={handleCancel}
          />
        </TabsContent>
      </Tabs>

      {/* Crear */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Plazo Procesal</DialogTitle>
            <DialogDescription>
              Los días se cuentan <strong>hábiles</strong> (lunes a viernes,
              excluyendo feriados peruanos).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Expediente *</Label>
              <Select
                value={newDeadline.caseId}
                onValueChange={(v) => setNewDeadline({ ...newDeadline, caseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un expediente" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={newDeadline.type}
                onValueChange={(v) => setNewDeadline({ ...newDeadline, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTESTACION">Contestación</SelectItem>
                  <SelectItem value="RECONVENCION">Reconvención</SelectItem>
                  <SelectItem value="CONTESTACION_RECONVENCION">
                    Contestación de reconvención
                  </SelectItem>
                  <SelectItem value="ALEGATOS">Alegatos</SelectItem>
                  <SelectItem value="PAYMENT">Pago</SelectItem>
                  <SelectItem value="DESIGNACION_ARBITRO">
                    Designación de árbitro
                  </SelectItem>
                  <SelectItem value="SUBSANACION">Subsanación</SelectItem>
                  <SelectItem value="RECUSACION_ABSOLUCION">
                    Recusación / Absolución
                  </SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input
                value={newDeadline.title}
                onChange={(e) =>
                  setNewDeadline({ ...newDeadline, title: e.target.value })
                }
                placeholder="Ej: Plazo para contestar demanda"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={newDeadline.description}
                onChange={(e) =>
                  setNewDeadline({ ...newDeadline, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <Label>Días hábiles *</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={newDeadline.businessDays}
                onChange={(e) =>
                  setNewDeadline({ ...newDeadline, businessDays: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateDeadline}
              disabled={creating || !newDeadline.caseId || !newDeadline.title}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Plazo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prórroga */}
      <Dialog open={showExtensionDialog} onOpenChange={setShowExtensionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prorrogar plazo</DialogTitle>
            <DialogDescription>
              {selectedDeadline
                ? `${selectedDeadline.caseCode} — ${selectedDeadline.title}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Días hábiles adicionales *</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                placeholder="Ej: 5"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={3}
                placeholder="Motivo de la prórroga..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExtensionDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExtension}
              disabled={extending || !extensionDays}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {extending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Confirmar prórroga
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  color: "red" | "amber" | "blue" | "green" | "slate";
  active?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    red: {
      card: "border-red-200 bg-red-50",
      bg: "bg-red-100",
      text: "text-red-700",
    },
    amber: {
      card: "border-amber-200 bg-amber-50",
      bg: "bg-amber-100",
      text: "text-amber-700",
    },
    blue: {
      card: "border-blue-200 bg-blue-50",
      bg: "bg-blue-100",
      text: "text-blue-700",
    },
    green: {
      card: "border-green-200 bg-green-50",
      bg: "bg-green-100",
      text: "text-green-700",
    },
    slate: {
      card: "border-slate-200 bg-slate-50",
      bg: "bg-slate-100",
      text: "text-slate-700",
    },
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-4 transition-all ${styles.card} ${
        active ? "ring-2 ring-[#D66829] shadow" : "hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          <Icon className={`h-5 w-5 ${styles.text}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${styles.text}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </button>
  );
}

function DeadlineTable({
  deadlines,
  onExtend,
  onMarkComplete,
  onCancel,
}: {
  deadlines: Deadline[];
  onExtend: (d: Deadline) => void;
  onMarkComplete: (d: Deadline) => void;
  onCancel: (d: Deadline) => void;
}) {
  if (deadlines.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay plazos en esta categoría.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expediente</TableHead>
                <TableHead>Título / Tipo</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Días restantes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deadlines.map((d) => {
                const cfg = statusConfig[d.status] || statusConfig.ACTIVE;
                const StatusIcon = cfg.icon;
                const isClosed =
                  d.status === "COMPLETED" || d.status === "CANCELLED";

                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-medium">
                      <Link
                        href={`/cases/${d.caseId}`}
                        className="hover:underline text-[#D66829]"
                      >
                        {d.caseCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{d.title}</div>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {d.type}
                      </Badge>
                      {d.description && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[320px] truncate">
                          {d.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {d.dueDateLocal}
                      <p className="text-[11px] text-muted-foreground">
                        {d.businessDays} días hábiles
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {isClosed ? (
                        <span className="text-muted-foreground">—</span>
                      ) : d.status === "OVERDUE" ? (
                        <span className="text-red-700 font-medium">
                          {Math.abs(d.businessDaysRemaining)} día
                          {Math.abs(d.businessDaysRemaining) !== 1 ? "s" : ""}{" "}
                          hábil{Math.abs(d.businessDaysRemaining) !== 1 ? "es" : ""} de retraso
                        </span>
                      ) : d.businessDaysRemaining === 0 ? (
                        <span className="text-amber-700 font-medium">Vence hoy</span>
                      ) : d.businessDaysRemaining <= 2 ? (
                        <span className="text-amber-700 font-medium">
                          {d.businessDaysRemaining} día
                          {d.businessDaysRemaining !== 1 ? "s" : ""} hábil
                          {d.businessDaysRemaining !== 1 ? "es" : ""}
                        </span>
                      ) : (
                        <span>
                          {d.businessDaysRemaining} días hábiles
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cfg.color + " border"}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                      {d.completedAt && d.status === "COMPLETED" && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(d.completedAt).toLocaleDateString("es-PE")}
                        </p>
                      )}
                      {d.extensions > 0 && (
                        <Badge variant="outline" className="ml-1 text-[10px]">
                          +{d.extensions} prórr.
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {!isClosed && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onExtend(d)}
                              className="h-7 text-xs"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Prorrogar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => onMarkComplete(d)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Cumplido
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => onCancel(d)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Anular
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
