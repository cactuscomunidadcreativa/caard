/**
 * CAARD - Sugerir Audiencia (Árbitro)
 * El árbitro sugiere fechas para audiencia, el Centro las confirma
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MapPin,
  Loader2,
  CheckCircle,
  Info,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface Case {
  id: string;
  code: string;
  title: string;
}

interface SuggestedDate {
  id: string;
  date: string;
  time: string;
  priority: number;
}

const hearingTypes = [
  { value: "INSTALACION", label: "Audiencia de Instalación" },
  { value: "SANEAMIENTO", label: "Audiencia de Saneamiento" },
  { value: "PRUEBAS", label: "Audiencia de Actuación de Pruebas" },
  { value: "ALEGATOS", label: "Audiencia de Alegatos" },
  { value: "INFORMES", label: "Audiencia de Informes Orales" },
  { value: "ESPECIAL", label: "Audiencia Especial" },
];

const modalityOptions = [
  { value: "VIRTUAL", label: "Virtual (Videollamada)", icon: Video },
  { value: "PRESENCIAL", label: "Presencial", icon: MapPin },
  { value: "MIXTA", label: "Mixta (Híbrida)", icon: Video },
];

export default function SugerirAudienciaPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [cases, setCases] = useState<Case[]>([]);

  const [formData, setFormData] = useState({
    caseId: "",
    hearingType: "",
    modality: "VIRTUAL",
    estimatedDuration: "60",
    notes: "",
  });

  const [suggestedDates, setSuggestedDates] = useState<SuggestedDate[]>([
    { id: "1", date: "", time: "", priority: 1 },
  ]);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch("/api/cases?role=ARBITRO");
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  const addSuggestedDate = () => {
    if (suggestedDates.length < 3) {
      setSuggestedDates([
        ...suggestedDates,
        { id: String(Date.now()), date: "", time: "", priority: suggestedDates.length + 1 },
      ]);
    }
  };

  const removeSuggestedDate = (id: string) => {
    if (suggestedDates.length > 1) {
      const updated = suggestedDates.filter((d) => d.id !== id);
      // Recalcular prioridades
      updated.forEach((d, i) => (d.priority = i + 1));
      setSuggestedDates(updated);
    }
  };

  const updateSuggestedDate = (id: string, field: "date" | "time", value: string) => {
    setSuggestedDates(
      suggestedDates.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.caseId) {
      setError("Debe seleccionar un expediente");
      return;
    }

    if (!formData.hearingType) {
      setError("Debe seleccionar el tipo de audiencia");
      return;
    }

    const validDates = suggestedDates.filter((d) => d.date && d.time);
    if (validDates.length === 0) {
      setError("Debe sugerir al menos una fecha y hora");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/audiencias/sugerir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          suggestedDates: validDates,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar sugerencia");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/arbitro");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Error al enviar sugerencia");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Sugerencia Enviada
              </h2>
              <p className="text-muted-foreground">
                Su sugerencia de audiencia ha sido enviada al Centro de Arbitraje.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Recibirá una notificación cuando sea confirmada.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/arbitro">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Sugerir Audiencia
          </CardTitle>
          <CardDescription>
            Proponga fechas para la audiencia. El Centro de Arbitraje confirmará y notificará a las partes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Como árbitro, usted sugiere las fechas. La programación final y notificación
              a las partes la realiza el Centro de Arbitraje.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Expediente */}
            <div className="space-y-2">
              <Label>Expediente *</Label>
              <Select
                value={formData.caseId}
                onValueChange={(value) => setFormData({ ...formData, caseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un expediente" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Audiencia */}
            <div className="space-y-2">
              <Label>Tipo de Audiencia *</Label>
              <Select
                value={formData.hearingType}
                onValueChange={(value) => setFormData({ ...formData, hearingType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {hearingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modalidad */}
            <div className="space-y-3">
              <Label>Modalidad *</Label>
              <RadioGroup
                value={formData.modality}
                onValueChange={(value) => setFormData({ ...formData, modality: value })}
                className="flex flex-wrap gap-4"
              >
                {modalityOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Duración estimada */}
            <div className="space-y-2">
              <Label>Duración Estimada</Label>
              <Select
                value={formData.estimatedDuration}
                onValueChange={(value) => setFormData({ ...formData, estimatedDuration: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1 hora 30 min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="180">3 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fechas Sugeridas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Fechas y Horas Sugeridas *</Label>
                {suggestedDates.length < 3 && (
                  <Button type="button" variant="outline" size="sm" onClick={addSuggestedDate}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar opción
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Puede sugerir hasta 3 opciones de fecha/hora en orden de preferencia
              </p>

              <div className="space-y-3">
                {suggestedDates.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    <Badge variant="outline" className="shrink-0">
                      Opción {suggestion.priority}
                    </Badge>
                    <div className="flex-1 flex gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Fecha</Label>
                        <Input
                          type="date"
                          value={suggestion.date}
                          onChange={(e) => updateSuggestedDate(suggestion.id, "date", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs text-muted-foreground">Hora</Label>
                        <Input
                          type="time"
                          value={suggestion.time}
                          onChange={(e) => updateSuggestedDate(suggestion.id, "time", e.target.value)}
                        />
                      </div>
                    </div>
                    {suggestedDates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSuggestedDate(suggestion.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Indicaciones especiales, temas a tratar, consideraciones..."
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Enviar Sugerencia
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
