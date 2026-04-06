"use client";

/**
 * CAARD - Creación Rápida de Expediente
 * Formulario simplificado en una sola página para admin/secretaría
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Scale,
  Users,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ArbitrationType = {
  id: string;
  code: string;
  name: string;
  baseFeeCents: number | null;
  currency: string;
};

export default function QuickNewCasePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arbitrationTypes, setArbitrationTypes] = useState<ArbitrationType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const [form, setForm] = useState({
    arbitrationTypeId: "",
    title: "",
    claimantName: "",
    claimantEmail: "",
    respondentName: "",
    respondentEmail: "",
    currency: "PEN",
    disputeAmount: "",
    tribunalMode: "TRIBUNAL_3",
  });

  useEffect(() => {
    fetch("/api/arbitration-types")
      .then((res) => res.json())
      .then((data) => setArbitrationTypes(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar tipos de arbitraje"))
      .finally(() => setLoadingTypes(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.arbitrationTypeId) {
      toast.error("Seleccione un tipo de arbitraje");
      return;
    }
    if (!form.title || form.title.length < 5) {
      toast.error("Ingrese un título (mínimo 5 caracteres)");
      return;
    }
    if (!form.claimantName) {
      toast.error("Ingrese el nombre del demandante");
      return;
    }
    if (!form.respondentName) {
      toast.error("Ingrese el nombre del demandado");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/cases/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          disputeAmount: form.disputeAmount ? parseFloat(form.disputeAmount) : undefined,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || "Expediente creado");
        router.push(`/cases/${result.data.id}`);
      } else {
        toast.error(result.error || "Error al crear expediente");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = arbitrationTypes.find((t) => t.id === form.arbitrationTypeId);

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#0B2A5B]">Nuevo Expediente</h1>
          <p className="text-sm text-muted-foreground">Creación rápida de expediente arbitral</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Arbitraje */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#D66829]" />
              Tipo de Arbitraje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingTypes ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {arbitrationTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setForm({ ...form, arbitrationTypeId: type.id })}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                      form.arbitrationTypeId === type.id
                        ? "border-[#D66829] bg-[#D66829]/5 shadow-sm"
                        : "border-border hover:border-[#D66829]/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{type.name}</p>
                    {type.baseFeeCents && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tasa: {type.currency === "USD" ? "$" : "S/"} {(type.baseFeeCents / 100 * 1.18).toFixed(2)} (inc. IGV)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Datos del Expediente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#D66829]" />
              Datos del Expediente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título / Materia de la Controversia *</Label>
              <Input
                placeholder="Ej: Controversia derivada de contrato de obra"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">Soles (S/)</SelectItem>
                    <SelectItem value="USD">Dólares ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cuantía (opcional)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.disputeAmount}
                  onChange={(e) => setForm({ ...form, disputeAmount: e.target.value })}
                />
              </div>
              <div>
                <Label>Tribunal</Label>
                <Select value={form.tribunalMode} onValueChange={(v) => setForm({ ...form, tribunalMode: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLE_ARBITRATOR">Árbitro Único</SelectItem>
                    <SelectItem value="TRIBUNAL_3">Tribunal (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#D66829]" />
              Partes del Proceso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <p className="text-sm font-semibold text-blue-900">Demandante</p>
                <div>
                  <Label className="text-xs">Nombre / Razón Social *</Label>
                  <Input
                    placeholder="Nombre completo o razón social"
                    value={form.claimantName}
                    onChange={(e) => setForm({ ...form, claimantName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Email (opcional)</Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.claimantEmail}
                    onChange={(e) => setForm({ ...form, claimantEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                <p className="text-sm font-semibold text-orange-900">Demandado</p>
                <div>
                  <Label className="text-xs">Nombre / Razón Social *</Label>
                  <Input
                    placeholder="Nombre completo o razón social"
                    value={form.respondentName}
                    onChange={(e) => setForm({ ...form, respondentName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Email (opcional)</Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.respondentEmail}
                    onChange={(e) => setForm({ ...form, respondentEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen y Submit */}
        {form.arbitrationTypeId && form.title && form.claimantName && form.respondentName && (
          <Card className="border-[#D66829]/30 bg-[#D66829]/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#D66829] mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">Resumen del expediente</p>
                  <p className="text-muted-foreground">
                    <strong>{selectedType?.name}</strong> — {form.title}
                  </p>
                  <p className="text-muted-foreground">
                    {form.claimantName} vs. {form.respondentName}
                  </p>
                  {selectedType?.baseFeeCents && (
                    <p className="text-muted-foreground">
                      Tasa: {selectedType.currency === "USD" ? "$" : "S/"} {(selectedType.baseFeeCents / 100 * 1.18).toFixed(2)} (inc. IGV)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/cases">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            className="bg-[#D66829] hover:bg-[#c45a22]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Crear Expediente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
