"use client";

/**
 * CAARD - Suscripciones a Biblioteca de Laudos
 */

import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Search, Trash2, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BRAND_NAVY = "#0B2A5B";
const BRAND_ORANGE = "#D66829";

type UserLite = { id: string; name: string | null; email: string };

type Subscription = {
  id: string;
  userId: string;
  period: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  status: "SUB_ACTIVE" | "SUB_EXPIRED" | "SUB_CANCELLED" | "SUB_PENDING_PAYMENT";
  priceCents: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  user: UserLite;
};

type Stats = {
  total: number;
  active: number;
  expired: number;
  revenueCents: number;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PE");
}

function statusBadge(status: Subscription["status"]) {
  const map: Record<Subscription["status"], { label: string; className: string }> = {
    SUB_ACTIVE: { label: "Activa", className: "bg-green-100 text-green-800" },
    SUB_EXPIRED: { label: "Expirada", className: "bg-gray-100 text-gray-800" },
    SUB_CANCELLED: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    SUB_PENDING_PAYMENT: { label: "Pago pendiente", className: "bg-yellow-100 text-yellow-800" },
  };
  const m = map[status];
  return <Badge className={m.className}>{m.label}</Badge>;
}

export default function LaudoSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, revenueCents: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [period, setPeriod] = useState<"MONTHLY" | "QUARTERLY" | "ANNUAL">("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [submitting, setSubmitting] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/laudos/subscriptions");
      if (!res.ok) throw new Error("Error");
      const json = await res.json();
      setSubscriptions(json.data || []);
      setStats(json.stats || { total: 0, active: 0, expired: 0, revenueCents: 0 });
    } catch {
      toast.error("No se pudieron cargar las suscripciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    if (!dialogOpen) return;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userQuery)}`);
        if (!res.ok) return;
        const json = await res.json();
        setUsers(json.items || []);
      } catch {}
    }, 250);
    return () => clearTimeout(handle);
  }, [userQuery, dialogOpen]);

  const filtered = subscriptions.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      const name = (s.user.name || "").toLowerCase();
      const email = (s.user.email || "").toLowerCase();
      if (!name.includes(t) && !email.includes(t)) return false;
    }
    return true;
  });

  const handleCreate = async () => {
    if (!selectedUserId) {
      toast.error("Selecciona un usuario");
      return;
    }
    if (!price) {
      toast.error("Ingresa un precio");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/laudos/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          period,
          priceCents: Math.round(parseFloat(price) * 100),
          currency,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      toast.success("Suscripción creada");
      setDialogOpen(false);
      setSelectedUserId("");
      setUserQuery("");
      setStartDate("");
      setEndDate("");
      setPrice("");
      loadSubscriptions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("¿Cancelar esta suscripción?")) return;
    try {
      const res = await fetch(`/api/admin/laudos/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Suscripción cancelada");
      loadSubscriptions();
    } catch {
      toast.error("Error al cancelar");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${BRAND_NAVY}15` }}
          >
            <Users className="h-6 w-6" style={{ color: BRAND_NAVY }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND_NAVY }}>
              Suscripciones a Biblioteca de Laudos
            </h1>
            <p className="text-sm text-gray-600">
              Administra las suscripciones de acceso a la biblioteca de laudos
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: BRAND_ORANGE, color: "white" }}>
              <Plus className="h-4 w-4 mr-2" /> Nueva Suscripción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ color: BRAND_NAVY }}>Nueva Suscripción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Usuario</Label>
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
                {users.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setUserQuery(`${u.name || ""} (${u.email})`);
                          setUsers([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        <div className="font-medium">{u.name || "—"}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensual</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    <SelectItem value="ANNUAL">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha de inicio</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>Fecha de fin</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Moneda</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={submitting}
                style={{ backgroundColor: BRAND_ORANGE, color: "white" }}
              >
                {submitting ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: BRAND_NAVY }}>
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-500" /> Expiradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" style={{ color: BRAND_ORANGE }} /> Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: BRAND_ORANGE }}>
              {formatMoney(stats.revenueCents, "PEN")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <CardTitle style={{ color: BRAND_NAVY }}>Listado</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-8"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="SUB_ACTIVE">Activas</SelectItem>
                  <SelectItem value="SUB_EXPIRED">Expiradas</SelectItem>
                  <SelectItem value="SUB_CANCELLED">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay suscripciones
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.user.name || "—"}</div>
                      <div className="text-xs text-gray-500">{s.user.email}</div>
                    </TableCell>
                    <TableCell>{s.period}</TableCell>
                    <TableCell>{formatDate(s.startDate)}</TableCell>
                    <TableCell>{formatDate(s.endDate)}</TableCell>
                    <TableCell>{formatMoney(s.priceCents, s.currency)}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-right">
                      {s.status !== "SUB_CANCELLED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
