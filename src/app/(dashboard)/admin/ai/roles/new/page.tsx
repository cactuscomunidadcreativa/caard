/**
 * /admin/ai/roles/new — Crear configuración de IA por rol
 *
 * Vincula un Role del sistema con un AIModel y opcionalmente un Assistant.
 * POST /api/admin/ai/roles
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Loader2,
  CheckCircle,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CENTER_STAFF",
  "SECRETARIA",
  "ARBITRO",
  "ABOGADO",
  "DEMANDANTE",
  "DEMANDADO",
  "ESTUDIANTE",
];

interface Model {
  id: string;
  name: string;
  provider: string;
  modelIdentifier: string;
}

interface Assistant {
  id: string;
  name: string;
}

export default function NuevoRolIaPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<string>("DEMANDANTE");
  const [modelId, setModelId] = useState<string>("");
  const [assistantId, setAssistantId] = useState<string>("none");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [maxTokensPerRequest, setMaxTokensPerRequest] = useState("");
  const [maxRequestsPerDay, setMaxRequestsPerDay] = useState("");
  const [maxTokensPerDay, setMaxTokensPerDay] = useState("");
  const [maxTokensPerMonth, setMaxTokensPerMonth] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState("0");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [mr, ar] = await Promise.all([
          fetch("/api/admin/ai/models"),
          fetch("/api/admin/ai/assistants"),
        ]);
        if (mr.ok) {
          const md = await mr.json();
          setModels(Array.isArray(md) ? md : md.models || []);
        }
        if (ar.ok) {
          const ad = await ar.json();
          setAssistants(Array.isArray(ad) ? ad : ad.assistants || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async () => {
    setErr(null);
    setOk(null);
    if (!modelId) return setErr("Selecciona un modelo");
    setSubmitting(true);
    try {
      const payload: any = {
        role,
        modelId,
        assistantId: assistantId === "none" ? null : assistantId,
        customSystemPrompt: customSystemPrompt || null,
        isActive,
        priority: parseInt(priority || "0", 10) || 0,
      };
      if (maxTokensPerRequest)
        payload.maxTokensPerRequest = parseInt(maxTokensPerRequest, 10);
      if (maxRequestsPerDay)
        payload.maxRequestsPerDay = parseInt(maxRequestsPerDay, 10);
      if (maxTokensPerDay)
        payload.maxTokensPerDay = parseInt(maxTokensPerDay, 10);
      if (maxTokensPerMonth)
        payload.maxTokensPerMonth = parseInt(maxTokensPerMonth, 10);

      const r = await fetch("/api/admin/ai/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al crear configuración");
      setOk("Configuración creada correctamente");
      setTimeout(() => router.push("/admin/ai/roles"), 1000);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ai/roles">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#D66829]" />
            Nueva configuración de IA por rol
          </CardTitle>
          <CardDescription>
            Asocia un rol del sistema con un modelo de IA y cuotas específicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rol *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Modelo de IA *</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading ? "Cargando..." : "Selecciona un modelo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loading && models.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No hay modelos configurados.{" "}
                <Link
                  href="/admin/ai/models"
                  className="text-[#D66829] hover:underline"
                >
                  Agregar uno
                </Link>
                .
              </p>
            )}
          </div>

          <div>
            <Label>Asistente (opcional)</Label>
            <Select value={assistantId} onValueChange={setAssistantId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin asistente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asistente</SelectItem>
                {assistants.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>System prompt personalizado (opcional)</Label>
            <Textarea
              rows={4}
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="Sobrescribe el system prompt por defecto del rol..."
            />
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="font-medium text-sm">Cuotas (opcionales)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tokens por request</Label>
                <Input
                  type="number"
                  value={maxTokensPerRequest}
                  onChange={(e) => setMaxTokensPerRequest(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div>
                <Label className="text-xs">Requests por día</Label>
                <Input
                  type="number"
                  value={maxRequestsPerDay}
                  onChange={(e) => setMaxRequestsPerDay(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div>
                <Label className="text-xs">Tokens por día</Label>
                <Input
                  type="number"
                  value={maxTokensPerDay}
                  onChange={(e) => setMaxTokensPerDay(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div>
                <Label className="text-xs">Tokens por mes</Label>
                <Input
                  type="number"
                  value={maxTokensPerMonth}
                  onChange={(e) => setMaxTokensPerMonth(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Activa</Label>
              <p className="text-xs text-muted-foreground">
                Si está apagada, el rol no podrá usar este modelo.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {err && (
            <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded bg-green-50 border border-green-200 text-green-700 p-3 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {ok}
            </div>
          )}

          <Button
            onClick={submit}
            disabled={submitting || !modelId}
            className="w-full bg-[#D66829] hover:bg-[#c45a22]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bot className="h-4 w-4 mr-2" />
            )}
            Crear configuración
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
