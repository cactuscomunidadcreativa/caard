/**
 * Cliente: confirmar/programar una sugerencia de audiencia.
 * - Muestra las opciones que sugirió el árbitro.
 * - Permite elegir una de las opciones o ingresar manual.
 * - Submit a POST /api/audiencias con fromSuggestionId
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  CheckCircle,
  Video,
  MapPin,
  Info,
} from "lucide-react";

interface SuggestedOption {
  date: string;
  time: string;
  priority: number;
  iso?: string;
}

interface Hearing {
  id: string;
  caseId: string;
  type: string;
  title: string;
  hearingAt: string;
  durationMinutes: number;
  isOnline: boolean;
  location: string | null;
  meetingUrl: string | null;
  notes: string | null;
  status: string;
  suggestedDates: SuggestedOption[];
  case: { id: string; code: string; title: string | null } | null;
}

export default function ConfirmSuggestionClient({
  hearing,
  suggestedBy,
}: {
  hearing: Hearing;
  suggestedBy: { name: string | null; email: string | null } | null;
}) {
  const router = useRouter();

  // Pre-llenar con la primera opción sugerida (la "principal")
  const initialIso = hearing.suggestedDates?.[0]?.iso || hearing.hearingAt;
  const initialDate = new Date(initialIso);
  const yyyy = initialDate.getFullYear();
  const mm = String(initialDate.getMonth() + 1).padStart(2, "0");
  const dd = String(initialDate.getDate()).padStart(2, "0");
  const hh = String(initialDate.getHours()).padStart(2, "0");
  const mi = String(initialDate.getMinutes()).padStart(2, "0");

  const [form, setForm] = useState({
    title: hearing.title,
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${mi}`,
    duration: String(hearing.durationMinutes || 60),
    isOnline: hearing.isOnline,
    location: hearing.location || "",
    meetingUrl: hearing.meetingUrl || "",
    notes: hearing.notes || "",
    notifyParties: true,
    notifyArbitrators: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pickOption = (opt: SuggestedOption) => {
    setForm((f) => ({ ...f, date: opt.date, time: opt.time }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.date || !form.time) {
      setError("Título, fecha y hora son requeridos");
      return;
    }
    if (form.isOnline && !form.meetingUrl) {
      setError("Debe proporcionar el enlace de reunión virtual");
      return;
    }
    if (!form.isOnline && !form.location) {
      setError("Debe especificar la ubicación");
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`);
      const res = await fetch("/api/audiencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromSuggestionId: hearing.id,
          caseId: hearing.caseId,
          type: hearing.type,
          title: form.title,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(form.duration),
          isOnline: form.isOnline,
          location: form.isOnline ? null : form.location,
          meetingUrl: form.isOnline ? form.meetingUrl : null,
          notes: form.notes,
          notifyParties: form.notifyParties,
          notifyArbitrators: form.notifyArbitrators,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al programar");
      }

      setSuccess(true);
      setTimeout(() => router.push("/secretaria/audiencias"), 1800);
    } catch (e: any) {
      setError(e.message || "Error al programar");
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
                Audiencia programada
              </h2>
              <p className="text-muted-foreground">
                Las partes y los árbitros recibirán la notificación.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuggested = hearing.status === "SUGGESTED";

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/secretaria/audiencias">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Audiencias
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {isSuggested ? "Confirmar audiencia sugerida" : "Editar audiencia"}
          </CardTitle>
          <CardDescription>
            {hearing.case?.code} — {hearing.case?.title}
            {suggestedBy && (
              <span className="block mt-1">
                Sugerida por:{" "}
                <strong>{suggestedBy.name || suggestedBy.email}</strong>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuggested && hearing.suggestedDates?.length > 0 && (
            <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
              <div className="flex items-start gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Opciones sugeridas por el árbitro
                  </p>
                  <p className="text-xs text-blue-700">
                    Haz clic en una opción para seleccionarla, o ingresa una fecha
                    distinta abajo.
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                {hearing.suggestedDates
                  .slice()
                  .sort((a, b) => a.priority - b.priority)
                  .map((opt, i) => {
                    const selected =
                      form.date === opt.date && form.time === opt.time;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pickOption(opt)}
                        className={`text-left p-3 rounded border transition-colors ${
                          selected
                            ? "border-blue-600 bg-white ring-2 ring-blue-200"
                            : "border-blue-200 bg-white hover:bg-blue-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant="outline" className="mb-1">
                              Opción {opt.priority}
                            </Badge>
                            <p className="text-sm font-medium">
                              {new Date(
                                `${opt.date}T${opt.time}`
                              ).toLocaleString("es-PE", {
                                timeZone: "America/Lima",
                                dateStyle: "full",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                          {selected && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Select
                  value={form.duration}
                  onValueChange={(v) => setForm({ ...form, duration: v })}
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

            <div className="space-y-3">
              <Label>Modalidad</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={form.isOnline ? "default" : "outline"}
                  onClick={() => setForm({ ...form, isOnline: true })}
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Virtual
                </Button>
                <Button
                  type="button"
                  variant={!form.isOnline ? "default" : "outline"}
                  onClick={() => setForm({ ...form, isOnline: false })}
                  className="flex-1"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Presencial
                </Button>
              </div>
            </div>

            {form.isOnline ? (
              <div className="space-y-2">
                <Label>Enlace de Reunión *</Label>
                <Input
                  value={form.meetingUrl}
                  onChange={(e) =>
                    setForm({ ...form, meetingUrl: e.target.value })
                  }
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Ubicación *</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Dirección"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Notificaciones</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyParties"
                  checked={form.notifyParties}
                  onCheckedChange={(c) =>
                    setForm({ ...form, notifyParties: !!c })
                  }
                />
                <label htmlFor="notifyParties" className="text-sm">
                  Notificar a las partes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyArbitrators"
                  checked={form.notifyArbitrators}
                  onCheckedChange={(c) =>
                    setForm({ ...form, notifyArbitrators: !!c })
                  }
                />
                <label htmlFor="notifyArbitrators" className="text-sm">
                  Notificar al tribunal arbitral
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
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
                    {isSuggested ? "Confirmar y programar" : "Guardar cambios"}
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
