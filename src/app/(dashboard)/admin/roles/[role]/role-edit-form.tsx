"use client";

/**
 * Formulario de edición de rol
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleData {
  role: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  canAccessAdmin: boolean;
  canAccessCMS: boolean;
  canAccessAI: boolean;
  canManageUsers: boolean;
  canManageCases: boolean;
  canManageDocuments: boolean;
  canViewReports: boolean;
  maxCasesAssigned: number | null;
  isActive: boolean;
  sortOrder: number;
}

const ICON_OPTIONS = [
  { value: "ShieldAlert", label: "Escudo Alerta" },
  { value: "Shield", label: "Escudo" },
  { value: "Building", label: "Edificio" },
  { value: "ClipboardList", label: "Portapapeles" },
  { value: "Scale", label: "Balanza" },
  { value: "Briefcase", label: "Maletín" },
  { value: "UserCheck", label: "Usuario Check" },
  { value: "User", label: "Usuario" },
];

const COLOR_OPTIONS = [
  { value: "bg-red-100 text-red-700 border-red-200", label: "Rojo" },
  { value: "bg-purple-100 text-purple-700 border-purple-200", label: "Morado" },
  { value: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Índigo" },
  { value: "bg-blue-100 text-blue-700 border-blue-200", label: "Azul" },
  { value: "bg-cyan-100 text-cyan-700 border-cyan-200", label: "Cian" },
  { value: "bg-amber-100 text-amber-700 border-amber-200", label: "Ámbar" },
  { value: "bg-green-100 text-green-700 border-green-200", label: "Verde" },
  { value: "bg-orange-100 text-orange-700 border-orange-200", label: "Naranja" },
  { value: "bg-gray-100 text-gray-700 border-gray-200", label: "Gris" },
];

export function RoleEditForm({ roleData }: { roleData: RoleData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    displayName: roleData.displayName,
    description: roleData.description,
    color: roleData.color,
    icon: roleData.icon,
    canAccessAdmin: roleData.canAccessAdmin,
    canAccessCMS: roleData.canAccessCMS,
    canAccessAI: roleData.canAccessAI,
    canManageUsers: roleData.canManageUsers,
    canManageCases: roleData.canManageCases,
    canManageDocuments: roleData.canManageDocuments,
    canViewReports: roleData.canViewReports,
    maxCasesAssigned: roleData.maxCasesAssigned,
    isActive: roleData.isActive,
    sortOrder: roleData.sortOrder,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/roles/${roleData.role}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar");
      }

      setSuccess(true);
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Configuración del Rol</CardTitle>
          <CardDescription className="text-sm">
            Modifica los permisos y configuración de este rol
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Información Básica</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre para mostrar</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="Ej: Administrador General"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Orden de prioridad</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="1"
                  value={formData.sortOrder}
                  onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe las responsabilidades de este rol..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="icon">Icono</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => handleChange("icon", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un icono" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => handleChange("color", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${option.value.split(" ")[0]}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Permisos de acceso */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Permisos de Acceso</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="canAccessAdmin" className="font-normal">Panel de Administración</Label>
                  <p className="text-xs text-muted-foreground">Acceso a /admin</p>
                </div>
                <Switch
                  id="canAccessAdmin"
                  checked={formData.canAccessAdmin}
                  onCheckedChange={(checked) => handleChange("canAccessAdmin", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="canAccessCMS" className="font-normal">Acceso CMS</Label>
                  <p className="text-xs text-muted-foreground">Editor de contenido</p>
                </div>
                <Switch
                  id="canAccessCMS"
                  checked={formData.canAccessCMS}
                  onCheckedChange={(checked) => handleChange("canAccessCMS", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="canAccessAI" className="font-normal">Acceso a IA</Label>
                  <p className="text-xs text-muted-foreground">Asistentes de IA</p>
                </div>
                <Switch
                  id="canAccessAI"
                  checked={formData.canAccessAI}
                  onCheckedChange={(checked) => handleChange("canAccessAI", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="canViewReports" className="font-normal">Ver Reportes</Label>
                  <p className="text-xs text-muted-foreground">Estadísticas y reportes</p>
                </div>
                <Switch
                  id="canViewReports"
                  checked={formData.canViewReports}
                  onCheckedChange={(checked) => handleChange("canViewReports", checked)}
                />
              </div>
            </div>
          </div>

          {/* Permisos de gestión */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Permisos de Gestión</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="canManageUsers" className="font-normal">Gestionar Usuarios</Label>
                  <p className="text-xs text-muted-foreground">Crear, editar, eliminar</p>
                </div>
                <Switch
                  id="canManageUsers"
                  checked={formData.canManageUsers}
                  onCheckedChange={(checked) => handleChange("canManageUsers", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="canManageCases" className="font-normal">Gestionar Casos</Label>
                  <p className="text-xs text-muted-foreground">Expedientes arbitrales</p>
                </div>
                <Switch
                  id="canManageCases"
                  checked={formData.canManageCases}
                  onCheckedChange={(checked) => handleChange("canManageCases", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="canManageDocuments" className="font-normal">Gestionar Documentos</Label>
                  <p className="text-xs text-muted-foreground">Subir, descargar, eliminar</p>
                </div>
                <Switch
                  id="canManageDocuments"
                  checked={formData.canManageDocuments}
                  onCheckedChange={(checked) => handleChange("canManageDocuments", checked)}
                />
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <Label htmlFor="maxCasesAssigned" className="font-normal">Máx. casos asignados</Label>
                <Input
                  id="maxCasesAssigned"
                  type="number"
                  min="0"
                  value={formData.maxCasesAssigned || ""}
                  onChange={(e) => handleChange("maxCasesAssigned", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Sin límite"
                />
                <p className="text-xs text-muted-foreground">Para árbitros y abogados</p>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Estado</h3>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="isActive" className="font-normal">Rol activo</Label>
                <p className="text-xs text-muted-foreground">Los usuarios con rol inactivo no pueden acceder</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
              />
            </div>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              Configuración guardada correctamente
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
