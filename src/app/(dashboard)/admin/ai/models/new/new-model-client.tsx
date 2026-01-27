"use client";

/**
 * CAARD - Cliente para Crear Nuevo Modelo de IA
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Cpu,
  ArrowLeft,
  Save,
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

const PROVIDERS: { value: AIProvider; label: string; color: string }[] = [
  { value: "OPENAI", label: "OpenAI", color: "bg-green-100 text-green-700" },
  { value: "ANTHROPIC", label: "Anthropic", color: "bg-orange-100 text-orange-700" },
  { value: "GOOGLE", label: "Google (Gemini)", color: "bg-blue-100 text-blue-700" },
  { value: "AZURE_OPENAI", label: "Azure OpenAI", color: "bg-cyan-100 text-cyan-700" },
  { value: "CUSTOM", label: "Personalizado", color: "bg-gray-100 text-gray-700" },
];

// Templates de modelos comunes
const MODEL_TEMPLATES = [
  // OpenAI
  { provider: "OPENAI", modelId: "gpt-4-turbo", name: "GPT-4 Turbo", inputCost: 1, outputCost: 3, maxTokens: 4096, context: 128000 },
  { provider: "OPENAI", modelId: "gpt-4o", name: "GPT-4o", inputCost: 0.5, outputCost: 1.5, maxTokens: 4096, context: 128000 },
  { provider: "OPENAI", modelId: "gpt-4o-mini", name: "GPT-4o Mini", inputCost: 0.015, outputCost: 0.06, maxTokens: 4096, context: 128000 },
  // Anthropic
  { provider: "ANTHROPIC", modelId: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", inputCost: 0.3, outputCost: 1.5, maxTokens: 8192, context: 200000 },
  { provider: "ANTHROPIC", modelId: "claude-3-opus-20240229", name: "Claude 3 Opus", inputCost: 1.5, outputCost: 7.5, maxTokens: 4096, context: 200000 },
  { provider: "ANTHROPIC", modelId: "claude-3-haiku-20240307", name: "Claude 3 Haiku", inputCost: 0.025, outputCost: 0.125, maxTokens: 4096, context: 200000 },
  // Google Gemini
  { provider: "GOOGLE", modelId: "gemini-2.0-flash", name: "Gemini 2.0 Flash", inputCost: 0.01, outputCost: 0.04, maxTokens: 8192, context: 1000000 },
  { provider: "GOOGLE", modelId: "gemini-2.0-flash-thinking", name: "Gemini 2.0 Flash Thinking", inputCost: 0.01, outputCost: 0.04, maxTokens: 8192, context: 1000000 },
  { provider: "GOOGLE", modelId: "gemini-1.5-pro", name: "Gemini 1.5 Pro", inputCost: 0.125, outputCost: 0.5, maxTokens: 8192, context: 1000000 },
  { provider: "GOOGLE", modelId: "gemini-1.5-flash", name: "Gemini 1.5 Flash", inputCost: 0.0075, outputCost: 0.03, maxTokens: 8192, context: 1000000 },
  { provider: "GOOGLE", modelId: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", inputCost: 0.00375, outputCost: 0.015, maxTokens: 8192, context: 1000000 },
];

export function NewModelClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [provider, setProvider] = useState<AIProvider>("OPENAI");
  const [modelId, setModelId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inputCostPer1k, setInputCostPer1k] = useState(0);
  const [outputCostPer1k, setOutputCostPer1k] = useState(0);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [maxContextWindow, setMaxContextWindow] = useState(128000);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [supportsVision, setSupportsVision] = useState(true);
  const [supportsFunctions, setSupportsFunctions] = useState(true);
  const [supportsStreaming, setSupportsStreaming] = useState(true);

  const handleSave = async () => {
    if (!modelId || !name) {
      alert("Por favor completa los campos requeridos: ID del modelo y nombre");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/ai/models", {
        method: "POST",
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
        throw new Error(error.error || "Error al crear");
      }

      router.push("/admin/ai/models");
      router.refresh();
    } catch (error) {
      console.error("Error saving:", error);
      alert(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (template: typeof MODEL_TEMPLATES[0]) => {
    setProvider(template.provider as AIProvider);
    setModelId(template.modelId);
    setName(template.name);
    setInputCostPer1k(template.inputCost);
    setOutputCostPer1k(template.outputCost);
    setMaxTokens(template.maxTokens);
    setMaxContextWindow(template.context);
  };

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
              Nuevo Modelo
            </h1>
            <p className="text-sm text-muted-foreground">Agregar un modelo de IA</p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !modelId || !name}
          className="bg-[#D66829] hover:bg-[#c45a22]"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Crear Modelo
        </Button>
      </div>

      {/* Templates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Plantillas Rápidas</CardTitle>
          <CardDescription>Selecciona un modelo para autocompletar los campos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MODEL_TEMPLATES.map((template) => {
              const providerInfo = PROVIDERS.find((p) => p.value === template.provider);
              return (
                <Button
                  key={template.modelId}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="gap-2"
                >
                  <Badge className={`${providerInfo?.color} text-xs`}>
                    {providerInfo?.label}
                  </Badge>
                  {template.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                <Label htmlFor="modelId">ID del Modelo *</Label>
                <Input
                  id="modelId"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="gpt-4-turbo, claude-3-sonnet, gemini-2.0-flash"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
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
                  {isDefault ? "Será el modelo predeterminado" : "No será el predeterminado"}
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
