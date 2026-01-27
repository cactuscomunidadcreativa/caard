/**
 * CAARD - Programar Audiencia (Staff)
 * Página para programar audiencias en casos
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Calendar, Loader2, CheckCircle, Video, MapPin } from "lucide-react";
import Link from "next/link";

interface Case {
  id: string;
  caseNumber: string;
  title: string;
}

const hearingTypes = [
  { value: "PRELIMINARY", label: "Audiencia preliminar" },
  { value: "EVIDENCE", label: "Audiencia de pruebas" },
  { value: "HEARING", label: "Audiencia oral" },
  { value: "CONCILIATION", label: "Audiencia de conciliación" },
  { value: "AWARD", label: "Lectura de laudo" },
  { value: "OTHER", label: "Otra" },
];

export default function ProgramarAudienciaPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    caseId: "",
    type: "HEARING",
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "60",
    isOnline: true,
    location: "",
    meetingUrl: "",
    notes: "",
    notifyParties: true,
    notifyArbitrators: true,
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch("/api/cases?status=active");
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.caseId || !formData.title || !formData.date || !formData.time) {
      setError("Por favor complete todos los campos requeridos");
      return;
    }

    if (!formData.isOnline && !formData.location) {
      setError("Debe especificar la ubicación para audiencias presenciales");
      return;
    }

    if (formData.isOnline && !formData.meetingUrl) {
      setError("Debe proporcionar el enlace de la reunión virtual");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);

      const res = await fetch("/api/audiencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: formData.caseId,
          type: formData.type,
          title: formData.title,
          description: formData.description,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(formData.duration),
          isOnline: formData.isOnline,
          location: formData.isOnline ? null : formData.location,
          meetingUrl: formData.isOnline ? formData.meetingUrl : null,
          notes: formData.notes,
          notifyParties: formData.notifyParties,
          notifyArbitrators: formData.notifyArbitrators,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al programar audiencia");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/staff/audiencias");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Error al programar audiencia");
    } finally {
      setSubmitting(false);
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
                Audiencia Programada
              </h2>
              <p className="text-muted-foreground">
                La audiencia ha sido programada y se notificará a los participantes.
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
        <Link href="/staff/audiencias">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programar Audiencia
          </CardTitle>
          <CardDescription>
            Programe una audiencia para un caso arbitral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Caso *</Label>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando casos...
                </div>
              ) : (
                <Select
                  value={formData.caseId}
                  onValueChange={(value) => setFormData({ ...formData, caseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un caso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Audiencia *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Audiencia de pruebas - Caso 001-2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la audiencia"
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (min)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="180">3 horas</SelectItem>
                    <SelectItem value="240">4 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Modalidad */}
            <div className="space-y-4">
              <Label>Modalidad</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.isOnline ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, isOnline: true })}
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Virtual
                </Button>
                <Button
                  type="button"
                  variant={!formData.isOnline ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, isOnline: false })}
                  className="flex-1"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Presencial
                </Button>
              </div>
            </div>

            {formData.isOnline ? (
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Enlace de Reunión *</Label>
                <Input
                  id="meetingUrl"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Dirección de la audiencia"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Instrucciones o notas para los participantes"
                rows={3}
              />
            </div>

            {/* Notificaciones */}
            <div className="space-y-3">
              <Label>Notificaciones</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyParties"
                  checked={formData.notifyParties}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyParties: checked as boolean })
                  }
                />
                <label htmlFor="notifyParties" className="text-sm">
                  Notificar a las partes y sus abogados
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyArbitrators"
                  checked={formData.notifyArbitrators}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyArbitrators: checked as boolean })
                  }
                />
                <label htmlFor="notifyArbitrators" className="text-sm">
                  Notificar al tribunal arbitral
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Programando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Programar Audiencia
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
