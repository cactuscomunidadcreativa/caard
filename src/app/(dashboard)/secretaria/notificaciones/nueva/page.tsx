/**
 * CAARD - Nueva Notificación (Secretaría)
 * Página para enviar notificaciones/traslados a las partes
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, CheckCircle, Users, Bell, FileText, Clock, Upload, File } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Case {
  id: string;
  code: string;
  title: string;
  claimantName?: string;
  respondentName?: string;
}

const notificationTypes = [
  { value: "TRASLADO", label: "Traslado de Escrito", icon: FileText, description: "Correr traslado de documento a las partes" },
  { value: "RESOLUCION", label: "Notificación de Resolución", icon: Send, description: "Notificar providencia o laudo" },
  { value: "AUDIENCIA", label: "Citación a Audiencia", icon: Bell, description: "Citar a audiencia virtual o presencial" },
  { value: "PLAZO", label: "Recordatorio de Plazo", icon: Clock, description: "Recordar vencimiento de plazo" },
  { value: "INFO", label: "Informativa General", icon: Bell, description: "Comunicación general" },
  { value: "URGENT", label: "Urgente", icon: Bell, description: "Notificación de carácter urgente" },
];

const recipientTypes = [
  { value: "case_parties", label: "Partes del expediente" },
  { value: "claimant", label: "Solo demandante" },
  { value: "respondent", label: "Solo demandado" },
  { value: "arbitrators", label: "Tribunal arbitral" },
  { value: "all_case", label: "Todos los involucrados" },
  { value: "specific", label: "Usuario específico" },
];

// Plantillas de notificación
const templates: Record<string, { title: string; message: string }> = {
  TRASLADO: {
    title: "Traslado de escrito - {caseCode}",
    message: "Por medio del presente, se corre traslado del escrito presentado por {sender} con fecha {date}.\n\nTérmino para absolver: {days} días hábiles.\n\nSe adjunta el documento para su conocimiento y fines correspondientes.",
  },
  RESOLUCION: {
    title: "Notificación de Resolución - {caseCode}",
    message: "Se notifica a las partes que el Tribunal Arbitral ha emitido la Resolución N° {resolutionNumber} con fecha {date}.\n\nLa resolución se encuentra disponible en el expediente electrónico para su descarga.\n\nQuedan notificadas las partes.",
  },
  AUDIENCIA: {
    title: "Citación a Audiencia - {caseCode}",
    message: "Se cita a las partes a la audiencia de {hearingType} a realizarse:\n\nFecha: {date}\nHora: {time}\nModalidad: {modality}\n{location}\n\nSe requiere puntualidad. En caso de inasistencia, comunicar con anticipación.",
  },
  PLAZO: {
    title: "Recordatorio de Plazo - {caseCode}",
    message: "Se le recuerda que el plazo para {action} vence el día {dueDate}.\n\nDías restantes: {daysRemaining}\n\nSe solicita dar cumplimiento dentro del plazo establecido.",
  },
};

export default function NuevaNotificacionSecretariaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const initialType = searchParams.get("type")?.toUpperCase() || "TRASLADO";

  const [formData, setFormData] = useState({
    type: initialType,
    recipientType: "case_parties",
    caseId: "",
    userId: "",
    title: "",
    message: "",
    sendEmail: true,
    sendWhatsapp: false,
    attachDocument: false,
    documentName: "",
    daysToRespond: "5",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Aplicar plantilla cuando cambia el tipo
    const template = templates[formData.type];
    if (template && !formData.title && !formData.message) {
      setFormData({
        ...formData,
        title: template.title,
        message: template.message,
      });
    }
  }, [formData.type]);

  const fetchData = async () => {
    try {
      const [usersRes, casesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/cases"),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleCaseChange = (caseId: string) => {
    const caseData = cases.find((c) => c.id === caseId);
    setSelectedCase(caseData || null);
    setFormData({ ...formData, caseId });

    // Actualizar título con código del caso
    if (caseData) {
      const template = templates[formData.type];
      if (template) {
        setFormData({
          ...formData,
          caseId,
          title: template.title.replace("{caseCode}", caseData.code),
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.caseId) {
      setError("Debe seleccionar un expediente");
      return;
    }

    if (!formData.title || !formData.message) {
      setError("El título y mensaje son requeridos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "SECRETARIA",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar notificación");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/secretaria/notificaciones");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Error al enviar notificación");
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
                Notificación Enviada
              </h2>
              <p className="text-muted-foreground">
                La notificación ha sido enviada exitosamente a las partes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/secretaria/notificaciones">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Notificaciones
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#D66829]" />
            Nueva Notificación / Traslado
          </CardTitle>
          <CardDescription>
            Envíe notificaciones y corra traslado a las partes del proceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Tipo de Notificación */}
            <div className="space-y-3">
              <Label>Tipo de Notificación</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {notificationTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.value;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#D66829] bg-orange-50 ring-2 ring-[#D66829]/20"
                          : "hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${isSelected ? "text-[#D66829]" : "text-muted-foreground"}`} />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expediente */}
            <div className="space-y-2">
              <Label>Expediente *</Label>
              <Select value={formData.caseId} onValueChange={handleCaseChange}>
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
              {selectedCase && (
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Demandante: {selectedCase.claimantName || "—"}</Badge>
                  <Badge variant="outline">Demandado: {selectedCase.respondentName || "—"}</Badge>
                </div>
              )}
            </div>

            {/* Destinatarios */}
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <Select
                value={formData.recipientType}
                onValueChange={(value) => setFormData({ ...formData, recipientType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recipientTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.recipientType === "specific" && (
              <div className="space-y-2">
                <Label>Usuario específico</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData({ ...formData, userId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Plazo para absolver (solo para traslados) */}
            {formData.type === "TRASLADO" && (
              <div className="space-y-2">
                <Label>Plazo para absolver (días hábiles)</Label>
                <Select
                  value={formData.daysToRespond}
                  onValueChange={(value) => setFormData({ ...formData, daysToRespond: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 días</SelectItem>
                    <SelectItem value="5">5 días</SelectItem>
                    <SelectItem value="10">10 días</SelectItem>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="20">20 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título / Asunto *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Asunto de la notificación"
              />
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
              <Label htmlFor="message">Contenido del mensaje *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Redacte el contenido de la notificación..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Puede usar variables: {"{caseCode}"}, {"{date}"}, {"{sender}"}, {"{days}"}, etc.
              </p>
            </div>

            {/* Adjuntar documento */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attachDocument"
                  checked={formData.attachDocument}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, attachDocument: checked as boolean })
                  }
                />
                <label htmlFor="attachDocument" className="text-sm font-medium">
                  Adjuntar documento del expediente
                </label>
              </div>
              {formData.attachDocument && (
                <div className="mt-3 flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar documento
                  </Button>
                  {formData.documentName && (
                    <div className="flex items-center gap-2 text-sm">
                      <File className="h-4 w-4" />
                      {formData.documentName}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Canales de envío */}
            <div className="space-y-3">
              <Label>Canales de envío</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={formData.sendEmail}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, sendEmail: checked as boolean })
                    }
                  />
                  <label htmlFor="sendEmail" className="text-sm">
                    Correo electrónico
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendWhatsapp"
                    checked={formData.sendWhatsapp}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, sendWhatsapp: checked as boolean })
                    }
                  />
                  <label htmlFor="sendWhatsapp" className="text-sm">
                    WhatsApp (si está disponible)
                  </label>
                </div>
              </div>
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
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#D66829] hover:bg-[#c45a22]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Notificación
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
