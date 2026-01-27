/**
 * CAARD - Registrar Usuario (Staff)
 * Página para registrar nuevos usuarios en el sistema
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserPlus, Loader2, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";

const userRoles = [
  { value: "DEMANDANTE", label: "Demandante" },
  { value: "DEMANDADO", label: "Demandado" },
  { value: "ABOGADO", label: "Abogado" },
  { value: "ARBITRO", label: "Árbitro" },
];

const documentTypes = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carné de Extranjería" },
  { value: "RUC", label: "RUC" },
  { value: "PASSPORT", label: "Pasaporte" },
];

export default function RegistrarUsuarioPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    documentType: "DNI",
    documentNumber: "",
    phone: "",
    address: "",
    sendInvitation: true,
    generatePassword: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role) {
      setError("Nombre, correo y rol son requeridos");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("El correo electrónico no es válido");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar usuario");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/staff/usuarios");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Error al registrar usuario");
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
                Usuario Registrado
              </h2>
              <p className="text-muted-foreground">
                {formData.sendInvitation
                  ? "Se ha enviado una invitación al correo del usuario."
                  : "El usuario ha sido registrado en el sistema."}
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
        <Link href="/staff/usuarios">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registrar Usuario
          </CardTitle>
          <CardDescription>
            Registre un nuevo usuario en el sistema
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
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre y apellidos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, documentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                  placeholder="Número de documento"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+51 999 999 999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>

            {/* Opciones */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <Label>Opciones de registro</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInvitation"
                  checked={formData.sendInvitation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendInvitation: checked as boolean })
                  }
                />
                <label htmlFor="sendInvitation" className="text-sm">
                  Enviar invitación por correo electrónico
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generatePassword"
                  checked={formData.generatePassword}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, generatePassword: checked as boolean })
                  }
                />
                <label htmlFor="generatePassword" className="text-sm">
                  Generar contraseña temporal automáticamente
                </label>
              </div>
            </div>

            {formData.sendInvitation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Invitación por correo</p>
                    <p>
                      Se enviará un correo al usuario con instrucciones para acceder
                      al sistema y establecer su contraseña.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar Usuario
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
