"use client";

/**
 * CAARD - Cliente de Edición de Asistente de IA
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Plus,
  X,
  Sparkles,
  Shield,
  Eye,
  Code,
  Zap,
} from "lucide-react";
import { AIProvider, Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "bg-red-100 text-red-700" },
  { value: "ADMIN", label: "Admin", color: "bg-orange-100 text-orange-700" },
  { value: "SECRETARIA", label: "Secretaría", color: "bg-blue-100 text-blue-700" },
  { value: "ARBITRO", label: "Árbitro", color: "bg-purple-100 text-purple-700" },
  { value: "ABOGADO", label: "Abogado", color: "bg-green-100 text-green-700" },
  { value: "DEMANDANTE", label: "Demandante", color: "bg-yellow-100 text-yellow-700" },
  { value: "DEMANDADO", label: "Demandado", color: "bg-gray-100 text-gray-700" },
  { value: "CENTER_STAFF", label: "Staff", color: "bg-cyan-100 text-cyan-700" },
];

const PROVIDER_LABELS: Record<AIProvider, string> = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google",
  AZURE_OPENAI: "Azure OpenAI",
  CUSTOM: "Personalizado",
};

const PROVIDER_COLORS: Record<AIProvider, string> = {
  OPENAI: "bg-green-100 text-green-700",
  ANTHROPIC: "bg-orange-100 text-orange-700",
  GOOGLE: "bg-blue-100 text-blue-700",
  AZURE_OPENAI: "bg-cyan-100 text-cyan-700",
  CUSTOM: "bg-gray-100 text-gray-700",
};

const CONTEXT_OPTIONS = [
  { value: "case", label: "Expediente" },
  { value: "document", label: "Documentos" },
  { value: "payment", label: "Pagos" },
  { value: "deadline", label: "Plazos" },
  { value: "hearing", label: "Audiencias" },
  { value: "general", label: "General" },
];

interface RoleAssignment {
  id?: string;
  role: Role;
  modelId: string;
  customSystemPrompt: string | null;
  maxTokensPerRequest: number | null;
  maxRequestsPerDay: number | null;
  isActive: boolean;
  model?: {
    id: string;
    name: string;
    provider: AIProvider;
    modelId: string;
  };
}

interface Model {
  id: string;
  name: string;
  provider: AIProvider;
  modelId: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsFunctions: boolean;
}

interface Assistant {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  systemPrompt: string;
  welcomeMessage: string | null;
  temperature: number;
  maxTokens: number;
  allowedContexts: string[];
  isActive: boolean;
  roleAssignments: RoleAssignment[];
}

interface AssistantEditClientProps {
  assistant: Assistant;
  models: Model[];
}

export function AssistantEditClient({ assistant, models }: AssistantEditClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState(assistant.name);
  const [description, setDescription] = useState(assistant.description || "");
  const [slug, setSlug] = useState(assistant.slug);
  const [systemPrompt, setSystemPrompt] = useState(assistant.systemPrompt);
  const [welcomeMessage, setWelcomeMessage] = useState(assistant.welcomeMessage || "");
  const [temperature, setTemperature] = useState(assistant.temperature);
  const [maxTokens, setMaxTokens] = useState(assistant.maxTokens);
  const [allowedContexts, setAllowedContexts] = useState<string[]>(assistant.allowedContexts);
  const [isActive, setIsActive] = useState(assistant.isActive);

  // Role assignments
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(
    assistant.roleAssignments.map((ra) => ({
      id: ra.id,
      role: ra.role,
      modelId: ra.modelId,
      customSystemPrompt: ra.customSystemPrompt,
      maxTokensPerRequest: ra.maxTokensPerRequest,
      maxRequestsPerDay: ra.maxRequestsPerDay,
      isActive: ra.isActive,
      model: ra.model,
    }))
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ai/assistants/${assistant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          slug,
          systemPrompt,
          welcomeMessage: welcomeMessage || null,
          temperature,
          maxTokens,
          allowedContexts,
          isActive,
          roleAssignments: roleAssignments.map((ra) => ({
            role: ra.role,
            modelId: ra.modelId,
            customSystemPrompt: ra.customSystemPrompt,
            maxTokensPerRequest: ra.maxTokensPerRequest,
            maxRequestsPerDay: ra.maxRequestsPerDay,
            isActive: ra.isActive,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      router.push("/admin/ai/assistants");
      router.refresh();
    } catch (error) {
      console.error("Error saving:", error);
      alert(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/ai/assistants/${assistant.id}?force=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      router.push("/admin/ai/assistants");
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar el asistente");
    } finally {
      setDeleting(false);
    }
  };

  const addRoleAssignment = () => {
    // Find a role not already assigned
    const assignedRoles = roleAssignments.map((ra) => ra.role);
    const availableRole = ROLES.find((r) => !assignedRoles.includes(r.value));

    if (!availableRole || models.length === 0) return;

    setRoleAssignments([
      ...roleAssignments,
      {
        role: availableRole.value,
        modelId: models[0].id,
        customSystemPrompt: null,
        maxTokensPerRequest: null,
        maxRequestsPerDay: null,
        isActive: true,
      },
    ]);
  };

  const removeRoleAssignment = (index: number) => {
    setRoleAssignments(roleAssignments.filter((_, i) => i !== index));
  };

  const updateRoleAssignment = (index: number, updates: Partial<RoleAssignment>) => {
    setRoleAssignments(
      roleAssignments.map((ra, i) => (i === index ? { ...ra, ...updates } : ra))
    );
  };

  const toggleContext = (context: string) => {
    setAllowedContexts((prev) =>
      prev.includes(context)
        ? prev.filter((c) => c !== context)
        : [...prev, context]
    );
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/ai/assistants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Editar Asistente
            </h1>
            <p className="text-sm text-muted-foreground">/{assistant.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar asistente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán todas las configuraciones
                  y asignaciones de roles asociadas a este asistente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Eliminar"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#D66829] hover:bg-[#c45a22]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="prompt" className="gap-2">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Prompt</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Configuración general del asistente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Asistente Legal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="asistente-legal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del asistente..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Estado</Label>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? "El asistente está activo y disponible" : "El asistente está desactivado"}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parámetros del Modelo</CardTitle>
              <CardDescription>Configuración de generación de respuestas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Temperatura: {temperature.toFixed(2)}</Label>
                  <span className="text-sm text-muted-foreground">
                    {temperature < 0.3 ? "Preciso" : temperature < 0.7 ? "Balanceado" : "Creativo"}
                  </span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={0}
                  max={2}
                  step={0.05}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Tokens Máximos: {maxTokens.toLocaleString()}</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                  min={100}
                  max={128000}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contextos Permitidos</CardTitle>
              <CardDescription>Tipos de información a los que el asistente puede acceder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_OPTIONS.map((ctx) => (
                  <Badge
                    key={ctx.value}
                    variant={allowedContexts.includes(ctx.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleContext(ctx.value)}
                  >
                    {ctx.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Prompt */}
        <TabsContent value="prompt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Instrucciones que definen el comportamiento y conocimientos del asistente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Eres un asistente experto en..."
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {systemPrompt.length} caracteres
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensaje de Bienvenida</CardTitle>
              <CardDescription>
                Mensaje inicial que ve el usuario al iniciar una conversación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="¡Hola! Soy tu asistente de CAARD..."
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Roles */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asignación de Roles y Modelos</CardTitle>
                  <CardDescription>
                    Define qué modelo de IA usa cada rol con este asistente
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRoleAssignment}
                  disabled={roleAssignments.length >= ROLES.length || models.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Rol
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {models.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay modelos de IA configurados</p>
                  <Link href="/admin/ai/models">
                    <Button variant="link" className="mt-2">
                      Configurar Modelos
                    </Button>
                  </Link>
                </div>
              ) : roleAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay roles asignados</p>
                  <p className="text-sm">Agrega roles para definir qué usuarios pueden usar este asistente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roleAssignments.map((ra, index) => {
                    const roleInfo = ROLES.find((r) => r.value === ra.role);
                    const selectedModel = models.find((m) => m.id === ra.modelId);

                    return (
                      <Card key={index} className="border-l-4 border-l-[#D66829]">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Role selector */}
                            <div className="flex-1 space-y-2">
                              <Label>Rol</Label>
                              <Select
                                value={ra.role}
                                onValueChange={(value) =>
                                  updateRoleAssignment(index, { role: value as Role })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.filter(
                                    (r) =>
                                      r.value === ra.role ||
                                      !roleAssignments.some((a) => a.role === r.value)
                                  ).map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          className={`${role.color} text-xs`}
                                          variant="secondary"
                                        >
                                          {role.label}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Model selector */}
                            <div className="flex-1 space-y-2">
                              <Label>Modelo</Label>
                              <Select
                                value={ra.modelId}
                                onValueChange={(value) =>
                                  updateRoleAssignment(index, { modelId: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {models.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          className={`${PROVIDER_COLORS[model.provider]} text-xs`}
                                        >
                                          {PROVIDER_LABELS[model.provider]}
                                        </Badge>
                                        <span>{model.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Status & Delete */}
                            <div className="flex items-end gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={ra.isActive}
                                  onCheckedChange={(checked) =>
                                    updateRoleAssignment(index, { isActive: checked })
                                  }
                                />
                                <span className="text-sm">
                                  {ra.isActive ? "Activo" : "Inactivo"}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeRoleAssignment(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Model info */}
                          {selectedModel && (
                            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>ID: {selectedModel.modelId}</span>
                              <span>|</span>
                              <span>Max: {selectedModel.maxTokens.toLocaleString()} tokens</span>
                              {selectedModel.supportsVision && (
                                <>
                                  <span>|</span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> Visión
                                  </span>
                                </>
                              )}
                              {selectedModel.supportsFunctions && (
                                <>
                                  <span>|</span>
                                  <span className="flex items-center gap-1">
                                    <Code className="h-3 w-3" /> Funciones
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Optional custom prompt */}
                          <details className="mt-3">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                              Personalización avanzada
                            </summary>
                            <div className="mt-3 space-y-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Prompt personalizado (opcional)</Label>
                                <Textarea
                                  value={ra.customSystemPrompt || ""}
                                  onChange={(e) =>
                                    updateRoleAssignment(index, {
                                      customSystemPrompt: e.target.value || null,
                                    })
                                  }
                                  placeholder="Instrucciones adicionales para este rol..."
                                  rows={3}
                                  className="text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs">Max tokens/request</Label>
                                  <Input
                                    type="number"
                                    value={ra.maxTokensPerRequest || ""}
                                    onChange={(e) =>
                                      updateRoleAssignment(index, {
                                        maxTokensPerRequest: e.target.value
                                          ? parseInt(e.target.value)
                                          : null,
                                      })
                                    }
                                    placeholder="Heredar"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Max requests/día</Label>
                                  <Input
                                    type="number"
                                    value={ra.maxRequestsPerDay || ""}
                                    onChange={(e) =>
                                      updateRoleAssignment(index, {
                                        maxRequestsPerDay: e.target.value
                                          ? parseInt(e.target.value)
                                          : null,
                                      })
                                    }
                                    placeholder="Sin límite"
                                  />
                                </div>
                              </div>
                            </div>
                          </details>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
