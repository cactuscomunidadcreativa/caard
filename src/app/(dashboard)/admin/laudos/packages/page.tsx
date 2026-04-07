"use client";

/**
 * CAARD - Paquetes de Laudos
 */

import { useEffect, useState, useCallback } from "react";
import { Gift, Plus, Pencil, Trash2, Package as PackageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BRAND_NAVY = "#0B2A5B";
const BRAND_ORANGE = "#D66829";

type LaudoPackage = {
  id: string;
  name: string;
  description: string | null;
  laudoCount: number;
  priceCents: number;
  currency: string;
  validDays: number;
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
};

type Stats = { total: number; active: number; sales: number };

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(cents / 100);
}

export default function LaudoPackagesPage() {
  const [packages, setPackages] = useState<LaudoPackage[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, sales: 0 });
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [laudoCount, setLaudoCount] = useState("1");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [validDays, setValidDays] = useState("365");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/laudos/packages");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPackages(json.data || []);
      setStats(json.stats || { total: 0, active: 0, sales: 0 });
    } catch {
      toast.error("No se pudieron cargar los paquetes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setLaudoCount("1");
    setPrice("");
    setCurrency("PEN");
    setValidDays("365");
    setIsActive(true);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (p: LaudoPackage) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setLaudoCount(String(p.laudoCount));
    setPrice((p.priceCents / 100).toFixed(2));
    setCurrency(p.currency);
    setValidDays(String(p.validDays));
    setIsActive(p.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price) {
      toast.error("Completa los campos requeridos");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        laudoCount: parseInt(laudoCount, 10) || 1,
        priceCents: Math.round(parseFloat(price) * 100),
        currency,
        validDays: parseInt(validDays, 10) || 365,
        isActive,
      };
      const url = editingId
        ? `/api/admin/laudos/packages/${editingId}`
        : "/api/admin/laudos/packages";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      toast.success(editingId ? "Paquete actualizado" : "Paquete creado");
      setDialogOpen(false);
      resetForm();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este paquete?")) return;
    try {
      const res = await fetch(`/api/admin/laudos/packages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Paquete eliminado");
      load();
    } catch {
      toast.error("Error al eliminar");
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
            <Gift className="h-6 w-6" style={{ color: BRAND_NAVY }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND_NAVY }}>
              Paquetes de Laudos
            </h1>
            <p className="text-sm text-gray-600">
              Administra los paquetes de acceso a laudos
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNew}
              style={{ backgroundColor: BRAND_ORANGE, color: "white" }}
            >
              <Plus className="h-4 w-4 mr-2" /> Nuevo Paquete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ color: BRAND_NAVY }}>
                {editingId ? "Editar Paquete" : "Nuevo Paquete"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cantidad de laudos</Label>
                  <Input
                    type="number"
                    value={laudoCount}
                    onChange={(e) => setLaudoCount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Duración (días)</Label>
                  <Input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                  />
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
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <Label htmlFor="isActive">Activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={submitting}
                style={{ backgroundColor: BRAND_ORANGE, color: "white" }}
              >
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total paquetes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: BRAND_NAVY }}>
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: BRAND_ORANGE }}>
              {stats.sales}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            No hay paquetes. Crea el primero.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((p) => (
            <Card key={p.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <PackageIcon className="h-5 w-5" style={{ color: BRAND_ORANGE }} />
                    <CardTitle style={{ color: BRAND_NAVY }}>{p.name}</CardTitle>
                  </div>
                  {p.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.description && (
                  <p className="text-sm text-gray-600">{p.description}</p>
                )}
                <div className="text-2xl font-bold" style={{ color: BRAND_ORANGE }}>
                  {formatMoney(p.priceCents, p.currency)}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Laudos: {p.laudoCount}</div>
                  <div>Duración: {p.validDays} días</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-red-600" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
