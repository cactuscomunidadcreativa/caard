"use client";

/**
 * CAARD - Configuración de Variables de Entorno
 * ==============================================
 * Panel de Super Admin para verificar y configurar
 * las variables de entorno del sistema.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Check,
  X,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface EnvVariable {
  name: string;
  isSet: boolean;
  category: string;
  description: string;
  isRequired: boolean;
  value?: string;
}

interface EnvCategory {
  id: string;
  name: string;
  description: string;
  variables: EnvVariable[];
}

interface EnvStats {
  total: number;
  configured: number;
  missing: number;
  requiredMissing: number;
}

interface EnvData {
  categories: EnvCategory[];
  stats: EnvStats;
}

export default function EnvConfigPage() {
  const [data, setData] = useState<EnvData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [savingVar, setSavingVar] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/env-config");
      if (response.status === 403) {
        toast.error("No tienes permisos para acceder a esta configuración");
        return;
      }
      if (!response.ok) {
        throw new Error("Error al cargar configuración");
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error loading env config:", error);
      toast.error("Error al cargar la configuración del entorno");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleEdit = (varName: string, currentValue?: string) => {
    setEditingVar(varName);
    setEditValue(currentValue || "");
  };

  const handleCancelEdit = () => {
    setEditingVar(null);
    setEditValue("");
  };

  const handleSave = async (varName: string) => {
    setSavingVar(varName);
    try {
      const response = await fetch("/api/admin/env-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: varName, value: editValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar");
      }

      toast.success(result.message || "Variable actualizada correctamente");
      setEditingVar(null);
      setEditValue("");
      await loadConfig();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la variable");
    } finally {
      setSavingVar(null);
    }
  };

  const toggleShowValue = (varName: string) => {
    setShowValues((prev) => ({ ...prev, [varName]: !prev[varName] }));
  };

  const isPublicVar = (name: string) => name.startsWith("NEXT_PUBLIC_");

  const getCategoryStatusColor = (variables: EnvVariable[]) => {
    const requiredMissing = variables.some((v) => v.isRequired && !v.isSet);
    const optionalMissing = variables.some((v) => !v.isRequired && !v.isSet);
    const allSet = variables.every((v) => v.isSet);

    if (requiredMissing) return "border-red-300 bg-red-50/30";
    if (optionalMissing) return "border-yellow-300 bg-yellow-50/30";
    if (allSet) return "border-green-300 bg-green-50/30";
    return "";
  };

  const getCategoryBadge = (variables: EnvVariable[]) => {
    const setCount = variables.filter((v) => v.isSet).length;
    const total = variables.length;
    const requiredMissing = variables.filter((v) => v.isRequired && !v.isSet).length;

    if (requiredMissing > 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          {requiredMissing} requerida{requiredMissing > 1 ? "s" : ""} sin configurar
        </Badge>
      );
    }

    if (setCount === total) {
      return (
        <Badge className="bg-green-100 text-green-700 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completo
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        {setCount}/{total} configuradas
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">No se pudo cargar la configuración</p>
          <Button variant="outline" onClick={loadConfig}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const { categories, stats } = data;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D66829] to-[#0B2A5B] flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
            <p className="text-sm text-muted-foreground">
              Variables de entorno y configuración de servicios
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadConfig} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Security Alert */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Solo visible para Super Administradores</p>
            <p className="text-sm text-yellow-700">
              Las variables de entorno controlan las integraciones del sistema. Los valores de
              variables secretas nunca se muestran. Los cambios pueden requerir reinicio del servidor.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total variables</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.configured}</p>
              <p className="text-xs text-muted-foreground">Configuradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.missing}</p>
              <p className="text-xs text-muted-foreground">Sin configurar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stats.requiredMissing > 0 ? "bg-red-100" : "bg-green-100"} flex items-center justify-center`}>
              {stats.requiredMissing > 0 ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.requiredMissing}</p>
              <p className="text-xs text-muted-foreground">Requeridas faltantes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((category) => (
          <Card key={category.id} className={getCategoryStatusColor(category.variables)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#0B2A5B]" />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                {getCategoryBadge(category.variables)}
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Variable</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground w-24">Estado</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground hidden md:table-cell">Descripción</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Valor</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground w-28">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.variables.map((variable) => (
                      <tr key={variable.name} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {variable.name}
                            </code>
                            {variable.isRequired && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-red-300 text-red-600">
                                REQ
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {variable.isSet ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                              <Check className="h-4 w-4 text-green-600" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                              <X className="h-4 w-4 text-red-500" />
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground text-xs hidden md:table-cell">
                          {variable.description}
                        </td>
                        <td className="py-3 px-2">
                          {editingVar === variable.name ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type={isPublicVar(variable.name) || showValues[variable.name] ? "text" : "password"}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Ingrese el valor..."
                                className="h-8 text-xs max-w-[250px]"
                                autoFocus
                              />
                              {!isPublicVar(variable.name) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => toggleShowValue(variable.name)}
                                >
                                  {showValues[variable.name] ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">
                              {isPublicVar(variable.name) && variable.value
                                ? variable.value
                                : variable.isSet
                                  ? "••••••••"
                                  : "—"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {editingVar === variable.name ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={handleCancelEdit}
                                disabled={savingVar === variable.name}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-[#D66829] hover:bg-[#c45a22]"
                                onClick={() => handleSave(variable.name)}
                                disabled={savingVar === variable.name}
                              >
                                {savingVar === variable.name ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                Guardar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleEdit(variable.name, isPublicVar(variable.name) ? variable.value : "")}
                            >
                              Editar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
