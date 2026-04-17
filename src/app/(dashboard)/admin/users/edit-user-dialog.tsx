/**
 * CAARD - Dialog para Editar Usuario (versión simplificada, sin react-hook-form)
 */

"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string | null;
  phoneE164: string | null;
  role: Role;
  isActive: boolean;
  center: { id: string; name: string } | null;
}

interface Center {
  id: string;
  name: string;
  code: string;
}

interface EditUserDialogProps {
  user: User;
  centers: Center[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador General",
  CENTER_STAFF: "Personal del Centro",
  SECRETARIA: "Secretaría",
  ARBITRO: "Árbitro",
  ABOGADO: "Abogado",
  DEMANDANTE: "Demandante",
  DEMANDADO: "Demandado",
  ESTUDIANTE: "Estudiante",
};

const NONE_CENTER = "__none__";

export function EditUserDialog({
  user,
  centers,
  open,
  onClose,
  onSuccess,
}: EditUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estado controlado de cada campo (sin react-hook-form)
  const [name, setName] = useState<string>(user.name ?? "");
  const [email, setEmail] = useState<string>(user.email ?? "");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<string>(user.role);
  const [phoneE164, setPhoneE164] = useState<string>(user.phoneE164 ?? "");
  const [centerId, setCenterId] = useState<string>(user.center?.id ?? "");
  const [isActive, setIsActive] = useState<boolean>(!!user.isActive);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name || name.trim().length < 2) {
      e.name = "El nombre debe tener al menos 2 caracteres";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Email inválido";
    }
    if (password) {
      if (password.length < 8) {
        e.password = "Debe tener 8+ caracteres";
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        e.password = "Debe tener mayúscula, minúscula y número";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const payload: any = {
        email: email.trim(),
        name: name.trim(),
        role,
        phoneE164: phoneE164 || null,
        centerId: centerId || null,
        isActive,
      };
      if (password) payload.password = password;

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar usuario");
      }

      toast({
        title: "Usuario actualizado",
        description: `Los datos de ${result.name || name} han sido actualizados.`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al actualizar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Actualiza los datos del usuario. Deja la contraseña vacía para no cambiarla.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
            <Label htmlFor="eu-name">Nombre completo</Label>
            <Input
              id="eu-name"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="eu-email">Email</Label>
            <Input
              id="eu-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Password (opcional) */}
          <div className="space-y-1">
            <Label htmlFor="eu-password">Nueva contraseña (opcional)</Label>
            <div className="relative">
              <Input
                id="eu-password"
                type={showPassword ? "text" : "password"}
                placeholder="Dejar vacío para no cambiar"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Deja vacío para mantener la contraseña actual
            </p>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Rol */}
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Centro */}
            <div className="space-y-1">
              <Label>Centro</Label>
              <Select
                value={centerId ? centerId : NONE_CENTER}
                onValueChange={(v) => setCenterId(v === NONE_CENTER ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_CENTER}>Sin centro</SelectItem>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1">
            <Label htmlFor="eu-phone">Teléfono (opcional)</Label>
            <Input
              id="eu-phone"
              placeholder="+51 999 999 999"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
            />
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Usuario activo</Label>
              <p className="text-xs text-muted-foreground">
                El usuario podrá acceder al sistema
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
