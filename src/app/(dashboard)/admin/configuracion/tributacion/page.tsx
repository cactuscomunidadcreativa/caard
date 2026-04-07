"use client";

/**
 * CAARD - Configuración Tributaria
 */

import { useState, useEffect } from "react";
import { Receipt, Loader2, Save, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TaxConfig {
  id: string;
  name: string;
  type: string;
  rate: number;
  isActive: boolean;
}

const TAX_DEFAULTS = [
  { type: "IGV", name: "IGV", rate: 0.18, label: "IGV (18%)" },
  { type: "DETRACCION", name: "Detracción", rate: 0.12, label: "Detracción" },
  { type: "PERCEPCION", name: "Percepción", rate: 0.02, label: "Percepción" },
  { type: "RETENCION_4TA", name: "Retención 4ta (Renta)", rate: 0.08, label: "Retención Renta Árbitros" },
];

export default function TaxConfigPage() {
  const [configs, setConfigs] = useState<TaxConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({
    IGV: 18,
    DETRACCION: 12,
    PERCEPCION: 2,
    RETENCION_4TA: 8,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/admin/tax-config");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      const items: TaxConfig[] = data.items || [];
      setConfigs(items);
      const next = { ...rates };
      for (const c of items) {
        next[c.type] = Math.round(c.rate * 10000) / 100;
      }
      setRates(next);
    } catch (e: any) {
      toast.error(e.message || "Error al cargar configuración");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (type: string, name: string, percent: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tax-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          rate: percent / 100,
          isActive: true,
          appliesToProducts: true,
          appliesToCourses: true,
          appliesToLaudos: true,
          appliesToServices: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      toast.success(`${name} guardado`);
      fetchConfigs();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta configuración?")) return;
    try {
      const res = await fetch(`/api/admin/tax-config/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Eliminado");
      fetchConfigs();
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6 lg:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
          <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-[#D66829]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2A5B]">Configuración Tributaria</h1>
          <p className="text-sm text-muted-foreground">
            Impuestos y retenciones aplicables a pagos
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tasas</CardTitle>
          <CardDescription>Registra o actualiza tasas tributarias (en porcentaje)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TAX_DEFAULTS.map((t) => (
              <div key={t.type} className="border rounded-lg p-4">
                <Label className="font-medium text-[#0B2A5B]">{t.label}</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rates[t.type] ?? 0}
                    onChange={(e) =>
                      setRates((r) => ({ ...r, [t.type]: parseFloat(e.target.value) || 0 }))
                    }
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">%</span>
                  <Button
                    size="sm"
                    onClick={() => handleCreate(t.type, t.name, rates[t.type] ?? 0)}
                    disabled={saving}
                    className="bg-[#D66829] hover:bg-[#c45a22]"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" /> Crear
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuraciones Actuales</CardTitle>
          <CardDescription>Reglas activas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay configuraciones registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tasa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{c.type}</code>
                    </TableCell>
                    <TableCell>{(c.rate * 100).toFixed(2)}%</TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
