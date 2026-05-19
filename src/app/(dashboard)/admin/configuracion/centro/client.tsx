"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react";

interface Initial {
  code: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  primaryColorHex: string | null;
  accentColorHex: string | null;
  neutralColorHex: string | null;
  createdAt: string;
}

export function CentroEditorClient({
  initial,
  googleConnected,
}: {
  initial: Initial;
  googleConnected: boolean;
}) {
  const [form, setForm] = useState({
    name: initial.name,
    legalName: initial.legalName || "",
    taxId: initial.taxId || "",
    primaryColorHex: initial.primaryColorHex || "#0B2A5B",
    accentColorHex: initial.accentColorHex || "#D66829",
    neutralColorHex: initial.neutralColorHex || "#9A9A9E",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Error");
      toast.success("Centro actualizado");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/configuracion">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#0B2A5B]" />
          Datos del Centro
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Editá nombre, razón social, RUC y branding. El código del centro
          es la clave única y no se puede modificar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Código (no editable)</Label>
              <Input value={initial.code} disabled />
            </div>
            <div className="space-y-1">
              <Label>Nombre comercial *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Razón social</Label>
              <Input
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>RUC</Label>
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Colores institucionales del sitio público y del dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <ColorField
              label="Primario"
              value={form.primaryColorHex}
              onChange={(v) => setForm({ ...form, primaryColorHex: v })}
            />
            <ColorField
              label="Acento"
              value={form.accentColorHex}
              onChange={(v) => setForm({ ...form, accentColorHex: v })}
            />
            <ColorField
              label="Neutral"
              value={form.neutralColorHex}
              onChange={(v) => setForm({ ...form, neutralColorHex: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="text-xs text-muted-foreground">
                Almacenamiento de expedientes y documentos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={googleConnected ? "default" : "outline"}>
                {googleConnected ? "Conectado" : "No conectado"}
              </Badge>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/integrations/google">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Gestionar
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="font-medium">Notificaciones</p>
              <p className="text-xs text-muted-foreground">Email, WhatsApp, SMS.</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/configuracion/notificaciones">
                <ExternalLink className="h-3 w-3 mr-1" />
                Configurar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end gap-2 bg-white border rounded-md p-3 shadow-sm">
        <Button
          onClick={save}
          disabled={saving || !form.name.trim()}
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
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}
