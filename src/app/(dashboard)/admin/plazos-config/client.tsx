"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { ArrowLeft, Clock, Loader2, RotateCcw, Save } from "lucide-react";

interface Plazo {
  key: string;
  label: string;
  description: string;
  defaultDays: number;
  group: "EMERGENCIA" | "ARBITRAJE" | "RECORDATORIO";
}

// Defaults espejo de src/lib/rules/constants.ts. Si cambian allá, hay
// que reflejarlos acá para que la UI muestre comparativa correcta.
const PLAZOS: Plazo[] = [
  // Emergencia
  {
    key: "VERIFICACION_FORMAL",
    label: "Verificación formal",
    description: "Centro verifica requisitos formales de la solicitud de emergencia",
    defaultDays: 1,
    group: "EMERGENCIA",
  },
  {
    key: "SUBSANACION_Y_PAGO",
    label: "Subsanación y pago",
    description: "Solicitante subsana observaciones y paga la tasa",
    defaultDays: 1,
    group: "EMERGENCIA",
  },
  {
    key: "DESIGNACION_ARBITRO",
    label: "Designación de árbitro de emergencia",
    description: "Consejo designa árbitro de emergencia",
    defaultDays: 4,
    group: "EMERGENCIA",
  },
  {
    key: "RESOLUCION_ARBITRO",
    label: "Resolución del árbitro",
    description: "Árbitro de emergencia emite la medida",
    defaultDays: 4,
    group: "EMERGENCIA",
  },
  {
    key: "SOLICITUD_PRINCIPAL",
    label: "Solicitud principal post-emergencia",
    description: "Presentación de solicitud arbitral principal tras la medida",
    defaultDays: 15,
    group: "EMERGENCIA",
  },
  // Recordatorios
  {
    key: "PRIMER_AVISO",
    label: "Primer aviso (días antes)",
    description: "Recordatorio temprano antes del vencimiento",
    defaultDays: 3,
    group: "RECORDATORIO",
  },
  {
    key: "SEGUNDO_AVISO",
    label: "Segundo aviso (urgente, días antes)",
    description: "Recordatorio urgente antes del vencimiento",
    defaultDays: 1,
    group: "RECORDATORIO",
  },
];

const GROUP_META: Record<string, { label: string; description: string }> = {
  EMERGENCIA: {
    label: "Arbitraje de emergencia",
    description: "Plazos críticos del flujo de emergencia (días hábiles).",
  },
  ARBITRAJE: {
    label: "Arbitraje ordinario",
    description: "Plazos generales del proceso arbitral.",
  },
  RECORDATORIO: {
    label: "Recordatorios automáticos",
    description: "Días antes del vencimiento para disparar el aviso.",
  },
};

export function PlazosConfigClient() {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/plazos-config")
      .then((r) => r.json())
      .then((d) => {
        const o = d.overrides || {};
        setOverrides(o);
        const init: Record<string, string> = {};
        for (const p of PLAZOS) {
          init[p.key] =
            o[p.key] != null ? String(o[p.key]) : String(p.defaultDays);
        }
        setDraft(init);
      })
      .catch(() => toast.error("No se pudieron cargar los plazos"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Mantener solo los que difieren del default — la tabla queda mínima
      const newOverrides: Record<string, number> = {};
      for (const p of PLAZOS) {
        const v = parseInt(draft[p.key] || "0", 10);
        if (!isNaN(v) && v > 0 && v !== p.defaultDays) {
          newOverrides[p.key] = v;
        }
      }
      const r = await fetch("/api/admin/plazos-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: newOverrides }),
      });
      if (!r.ok) throw new Error("Error guardando");
      setOverrides(newOverrides);
      toast.success("Plazos actualizados");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    const reset: Record<string, string> = {};
    for (const p of PLAZOS) {
      reset[p.key] = String(p.defaultDays);
    }
    setDraft(reset);
  };

  const groups = Array.from(new Set(PLAZOS.map((p) => p.group)));
  const hasChanges = PLAZOS.some(
    (p) =>
      parseInt(draft[p.key] || "0", 10) !==
      (overrides[p.key] ?? p.defaultDays)
  );

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0B2A5B]">
            <Clock className="h-6 w-6" />
            Plazos reglamentarios
          </h1>
          <p className="text-muted-foreground">
            Editá los plazos en días hábiles. Los valores en blanco usan el
            default del reglamento.
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
            Cargando...
          </CardContent>
        </Card>
      ) : (
        <>
          {groups.map((g) => (
            <Card key={g}>
              <CardHeader>
                <CardTitle>{GROUP_META[g].label}</CardTitle>
                <CardDescription>{GROUP_META[g].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PLAZOS.filter((p) => p.group === g).map((p) => {
                  const overridden =
                    overrides[p.key] != null && overrides[p.key] !== p.defaultDays;
                  return (
                    <div
                      key={p.key}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">{p.label}</Label>
                        <p className="text-xs text-muted-foreground">
                          {p.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-1">
                          {p.key} · default: {p.defaultDays} días
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Días hábiles</Label>
                        <Input
                          type="number"
                          min={1}
                          className={`no-spinner ${overridden ? "border-amber-400 ring-1 ring-amber-200" : ""}`}
                          value={draft[p.key] || ""}
                          onChange={(e) =>
                            setDraft({ ...draft, [p.key]: e.target.value })
                          }
                        />
                        {overridden && (
                          <p className="text-[11px] text-amber-700">
                            Personalizado (default: {p.defaultDays})
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between sticky bottom-4 bg-white border rounded-md p-3 shadow-sm">
            <div className="text-sm text-muted-foreground">
              {hasChanges
                ? "Tenés cambios sin guardar"
                : "Sin cambios pendientes"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar defaults
              </Button>
              <Button
                onClick={save}
                disabled={saving || !hasChanges}
                className="bg-[#0B2A5B] hover:bg-[#0d3570]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
