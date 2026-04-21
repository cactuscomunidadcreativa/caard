/**
 * /arbitro/asistente — Chat con el asistente IA para árbitros
 *
 * Usa /api/ai/chat con role=ARBITRO. Mantiene historial en memoria y
 * opcionalmente ancla la conversación a uno de sus casos.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CaseItem {
  id: string;
  code: string;
  title: string | null;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGERENCIAS = [
  "Resume los hechos principales del expediente",
  "¿Qué plazos tengo en curso y cuándo vencen?",
  "Borrador de providencia admitiendo el escrito",
  "Estructura sugerida para el laudo arbitral",
  "Jurisprudencia peruana relevante sobre nulidad de cláusula arbitral",
];

export default function AsistenteArbitroPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [caseId, setCaseId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cases?pageSize=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCases(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setErr(null);
    setInput("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role: "ARBITRO",
          caseId: caseId || undefined,
          conversationHistory: history,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error en la respuesta");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: d.response || "" },
      ]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  const selectedCase = cases.find((c) => c.id === caseId);

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/arbitro">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <Card className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#D66829]" />
                Asistente IA del Árbitro
              </CardTitle>
              <CardDescription>
                Jurisprudencia, análisis de expedientes, borradores de
                resoluciones y cálculo de plazos.
              </CardDescription>
            </div>
            <div className="min-w-[220px]">
              <Label className="text-xs">Caso de referencia (opcional)</Label>
              <Select
                value={caseId || "none"}
                onValueChange={(v) => setCaseId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin caso</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedCase && (
            <Badge variant="secondary" className="w-fit mt-2">
              Contexto: {selectedCase.code}
              {selectedCase.title ? ` — ${selectedCase.title}` : ""}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Sparkles className="h-10 w-10 text-[#D66829]" />
              <div>
                <p className="font-medium">¿En qué te ayudo hoy?</p>
                <p className="text-sm text-muted-foreground">
                  Prueba con una de estas sugerencias:
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-md">
                {SUGERENCIAS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 whitespace-normal"
                    onClick={() => send(s)}
                    disabled={sending}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#D66829] text-white"
                        : "bg-muted"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Pensando...
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <div className="border-t p-3 space-y-2">
          {err && (
            <p className="text-xs text-red-600">{err}</p>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter salto de línea)"
              rows={2}
              disabled={sending}
              className="resize-none"
            />
            <Button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
