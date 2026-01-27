"use client";

/**
 * CAARD - Cliente de Edición de Modelo de IA
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Cpu,
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Eye,
  Code,
  Zap,
  DollarSign,
} from "lucide-react";
import { AIProvider } from "@prisma/client";

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

const PROVIDERS: { value: AIProvider; label: string; color: string }[] = [
  { value: "OPENAI", label: "OpenAI", color: "bg-green-100 text-green-700" },
  { value: "ANTHROPIC", label: "Anthropic", color: "bg-orange-100 text-orange-700" },
  { value: "GOOGLE", label: "Google (Gemini)", color: "bg-blue-100 text-blue-700" },
  { value: "AZURE_OPENAI", label: "Azure OpenAI", color: "bg-cyan-100 text-cyan-700" },
  { value: "CUSTOM", label: "Personalizado", color: "bg-gray-100 text-gray-700" },
];

interface Model {
  id: string;
  provider: AIProvider;
  modelId: string;
  name: string;
  description: string | null;
  inputCostPer1k: number;
  outputCostPer1k: number;
  maxTokens: number;
  maxContextWindow: number;
  isActive: boolean;
  isDefault: boolean;
  supportsVision: boolean;
  supportsFunctions: boolean;
  supportsStreaming: boolean;
  _count: {
    roleAssignments: number;
    usageLogs: number;
  };
}

interface ModelEditClientProps {
  model: Model;
}

export function ModelEditClient({ model }: ModelEditClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [provider, setProvider] = useState<AIProvider>(model.provider);
  const [modelId, setModelId] = useState(model.modelId);
  const [name, setName] = useState(model.name);
  const [description, setDescription] = useState(model.description || "");
  const [inputCostPer1k, setInputCostPer1k] = useState(model.inputCostPer1k);
  const [outputCostPer1k, setOutputCostPer1k] = useState(model.outputCostPer1k);
  const [maxTokens, setMaxTokens] = useState(model.maxTokens);
  const [maxContextWindow, setMaxContextWindow] = useState(model.maxContextWindow);
  const [isActive, setIsActive] = useState(model.isActive);
  const [isDefault, setIsDefault] = useState(model.isDefault);
  const [supportsVision, setSupportsVision] = useState(model.supportsVision);
  const [supportsFunctions, setSupportsFunctions] = useState(model.supportsFunctions);
  const [supportsStreaming, setSupportsStreaming] = useState(model.supportsStreaming);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ai/models/${model.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          modelId,
          name,
          description: description || null,
          inputCostPer1k,
          outputCostPer1k,
          maxTokens,
          maxContextWindow,
          isActive,
          isDefault,
          supportsVision,
          supportsFunctions,
          supportsStreaming,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      router.push("/admin/ai/models");
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
      const response = await fetch(`/api/ai/models/${model.id}?force=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      router.push("/admin/ai/models");
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar el modelo");
    } finally {
      setDeleting(false);
    }
  };

  const providerInfo = PROVIDERS.find((p) => p.value === provider);

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/ai/models">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Cpu className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Editar Modelo
            </h1>
            <p className="text-sm text-muted-foreground">{model.modelId}</p>
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
                <AlertDialogTitle>¿Eliminar modelo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                  {model._count.roleAssignments > 0 && (
                    <span className="block mt-2 text-yellow-600">
                      Este modelo tiene {model._count.roleAssignments} asignaciones de roles que también se eliminarán.
                    </span>
                  )}
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

      <div className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Modelo</CardTitle>
            <CardDescription>Identificación y configuración básica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as AIProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={`${p.color} text-xs`}>{p.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelId">ID del Modelo</Label>
                <Input
                  id="modelId"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="gpt-4-turbo, claude-3-sonnet, gemini-2.0-flash"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="GPT-4 Turbo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del modelo..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Costos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle>Costos por 1K Tokens</CardTitle>
            </div>
            <CardDescription>Costos en centavos USD para el cálculo de uso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inputCost">Costo Input (centavos)</Label>
                <Input
                  id="inputCost"
                  type="number"
                  step="0.001"
                  value={inputCostPer1k}
                  onChange={(e) => setInputCostPer1k(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  = ${(inputCostPer1k / 100).toFixed(4)} USD/1K tokens
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outputCost">Costo Output (centavos)</Label>
                <Input
                  id="outputCost"
                  type="number"
                  step="0.001"
                  value={outputCostPer1k}
                  onChange={(e) => setOutputCostPer1k(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  = ${(outputCostPer1k / 100).toFixed(4)} USD/1K tokens
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Límites */}
        <Card>
          <CardHeader>
            <CardTitle>Límites del Modelo</CardTitle>
            <CardDescription>Capacidades máximas de tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens (respuesta)</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxContext">Max Contexto (ventana)</Label>
                <Input
                  id="maxContext"
                  type="number"
                  value={maxContextWindow}
                  onChange={(e) => setMaxContextWindow(parseInt(e.target.value) || 128000)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacidades */}
        <Card>
          <CardHeader>
            <CardTitle>Capacidades</CardTitle>
            <CardDescription>Funcionalidades soportadas por el modelo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <Label>Visión</Label>
                </div>
                <Switch checked={supportsVision} onCheckedChange={setSupportsVision} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-purple-600" />
                  <Label>Funciones</Label>
                </div>
                <Switch checked={supportsFunctions} onCheckedChange={setSupportsFunctions} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <Label>Streaming</Label>
                </div>
                <Switch checked={supportsStreaming} onCheckedChange={setSupportsStreaming} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
            <CardDescription>Configuración de disponibilidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Modelo Activo</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Disponible para usar" : "Desactivado"}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Modelo por Defecto</Label>
                <p className="text-sm text-muted-foreground">
                  {isDefault ? "Es el modelo predeterminado" : "No es el predeterminado"}
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Asignaciones de roles:</span>{" "}
                <strong>{model._count.roleAssignments}</strong>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Logs de uso:</span>{" "}
                <strong>{model._count.usageLogs}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
