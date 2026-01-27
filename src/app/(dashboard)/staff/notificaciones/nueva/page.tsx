/**
 * CAARD - Nueva Notificación (Staff)
 * Página para enviar notificaciones a usuarios
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
import { ArrowLeft, Send, Loader2, CheckCircle, Users, Bell } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
}

const notificationTypes = [
  { value: "INFO", label: "Informativa" },
  { value: "WARNING", label: "Advertencia" },
  { value: "URGENT", label: "Urgente" },
  { value: "DEADLINE", label: "Plazo" },
  { value: "HEARING", label: "Audiencia" },
  { value: "PAYMENT", label: "Pago" },
  { value: "DOCUMENT", label: "Documento" },
];

const recipientTypes = [
  { value: "user", label: "Usuario específico" },
  { value: "case", label: "Partes de un caso" },
  { value: "role", label: "Por rol" },
  { value: "all", label: "Todos los usuarios" },
];

const roles = [
  { value: "ARBITRO", label: "Árbitros" },
  { value: "ABOGADO", label: "Abogados" },
  { value: "DEMANDANTE", label: "Demandantes" },
  { value: "DEMANDADO", label: "Demandados" },
];

export default function NuevaNotificacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  const [formData, setFormData] = useState({
    type: "INFO",
    recipientType: "user",
    userId: "",
    caseId: "",
    role: "",
    title: "",
    message: "",
    sendEmail: true,
    sendPush: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      setError("El título y mensaje son requeridos");
      return;
    }

    if (formData.recipientType === "user" && !formData.userId) {
      setError("Debe seleccionar un usuario");
      return;
    }

    if (formData.recipientType === "case" && !formData.caseId) {
      setError("Debe seleccionar un caso");
      return;
    }

    if (formData.recipientType === "role" && !formData.role) {
      setError("Debe seleccionar un rol");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar notificación");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/staff/notificaciones");
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
                La notificación ha sido enviada exitosamente.
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
        <Link href="/staff/notificaciones">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Nueva Notificación
          </CardTitle>
          <CardDescription>
            Envíe notificaciones a usuarios del sistema
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
              <Label>Tipo de Notificación</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <Select
                value={formData.recipientType}
                onValueChange={(value) =>
                  setFormData({ ...formData, recipientType: value })
                }
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

            {formData.recipientType === "user" && (
              <div className="space-y-2">
                <Label>Usuario</Label>
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

            {formData.recipientType === "case" && (
              <div className="space-y-2">
                <Label>Caso</Label>
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
              </div>
            )}

            {formData.recipientType === "role" && (
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título de la notificación"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Contenido de la notificación"
                rows={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Canales de envío</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendEmail: checked as boolean })
                  }
                />
                <label htmlFor="sendEmail" className="text-sm">
                  Enviar por correo electrónico
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendPush"
                  checked={formData.sendPush}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendPush: checked as boolean })
                  }
                />
                <label htmlFor="sendPush" className="text-sm">
                  Notificación push (si está disponible)
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
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
