"use client";

/**
 * Asistente IA por Rol
 * =====================
 * Componente de chat que adapta su comportamiento según el rol del usuario
 * Cada rol tiene un prompt de sistema diferente y capacidades específicas
 */

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Bot,
  User,
  Loader2,
  FileText,
  Upload,
  Paperclip,
  RefreshCw,
  Download,
  Copy,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Configuración por rol
const roleConfigs: Record<
  string,
  {
    title: string;
    description: string;
    welcomeMessage: string;
    capabilities: string[];
    suggestedQuestions: string[];
  }
> = {
  SUPER_ADMIN: {
    title: "Asistente del Super Administrador",
    description: "Acceso completo a todas las funciones del sistema",
    welcomeMessage:
      "¡Hola! Soy tu asistente con acceso completo al sistema. Puedo ayudarte con configuración, reportes avanzados, análisis de datos y cualquier operación del sistema.",
    capabilities: [
      "Configuración del sistema",
      "Reportes avanzados",
      "Análisis de métricas",
      "Override de reglas",
      "Gestión de usuarios",
    ],
    suggestedQuestions: [
      "Muéstrame un resumen de actividad del último mes",
      "¿Cuáles son los expedientes con más antigüedad?",
      "Genera un reporte de pagos pendientes",
      "¿Cuántos árbitros tenemos activos?",
    ],
  },
  ADMIN: {
    title: "Asistente del Administrador",
    description: "Gestión completa del centro de arbitraje",
    welcomeMessage:
      "¡Hola! Estoy aquí para ayudarte con la gestión del centro. Puedo asistirte con reportes, estadísticas, gestión de usuarios y configuración.",
    capabilities: [
      "Reportes del centro",
      "Estadísticas",
      "Gestión de usuarios",
      "Configuración",
    ],
    suggestedQuestions: [
      "¿Cuántos expedientes tenemos este mes?",
      "Muéstrame los árbitros disponibles",
      "¿Cuál es el tiempo promedio de resolución?",
      "Lista los pagos pendientes de verificar",
    ],
  },
  SECRETARIA: {
    title: "Asistente de Secretaría",
    description: "Apoyo en gestión de expedientes y plazos",
    welcomeMessage:
      "¡Hola! Soy tu asistente de secretaría. Puedo ayudarte con la gestión de expedientes, cálculo de plazos, verificación de requisitos y redacción de documentos.",
    capabilities: [
      "Gestión de expedientes",
      "Cálculo de plazos",
      "Verificación de requisitos",
      "Redacción de providencias",
      "Control de notificaciones",
    ],
    suggestedQuestions: [
      "¿Qué plazos vencen esta semana?",
      "Redacta una providencia de admisión",
      "¿Qué documentos faltan en el expediente X?",
      "Calcula el plazo de contestación desde hoy",
    ],
  },
  ARBITRO: {
    title: "Asistente del Árbitro",
    description: "Apoyo en análisis jurídico y resolución de casos",
    welcomeMessage:
      "¡Hola! Soy tu asistente jurídico. Puedo ayudarte con análisis de documentos, búsqueda de jurisprudencia, redacción de laudos y resúmenes de expedientes.",
    capabilities: [
      "Análisis de documentos",
      "Búsqueda de jurisprudencia",
      "Resumen de expedientes",
      "Asistencia en redacción",
      "Cálculo de plazos",
    ],
    suggestedQuestions: [
      "Resume los argumentos principales del demandante",
      "¿Qué dice la jurisprudencia sobre cláusulas abusivas?",
      "Analiza las pruebas presentadas",
      "¿Cuánto tiempo tengo para emitir el laudo?",
    ],
  },
  ABOGADO: {
    title: "Asistente Legal",
    description: "Apoyo en la gestión de sus casos",
    welcomeMessage:
      "¡Hola! Soy tu asistente legal. Puedo ayudarte con el análisis de documentos, plazos de tus casos, búsqueda de información y redacción de escritos.",
    capabilities: [
      "Análisis de documentos",
      "Control de plazos",
      "Resumen de actuados",
      "Asistencia en redacción",
      "Información del proceso",
    ],
    suggestedQuestions: [
      "¿Cuáles son los plazos próximos en mis casos?",
      "Resume el último escrito de la contraparte",
      "¿Qué documentos debo presentar para la contestación?",
      "Ayúdame a redactar un escrito de alegatos",
    ],
  },
  DEMANDANTE: {
    title: "Asistente del Demandante",
    description: "Información sobre su proceso de arbitraje",
    welcomeMessage:
      "¡Hola! Estoy aquí para ayudarte a entender tu proceso de arbitraje. Puedo explicarte el estado de tu caso, los plazos, tus derechos y responder tus dudas.",
    capabilities: [
      "Estado del caso",
      "Explicación de etapas",
      "Plazos importantes",
      "Preguntas frecuentes",
    ],
    suggestedQuestions: [
      "¿En qué etapa está mi caso?",
      "¿Qué significa que mi demanda fue admitida?",
      "¿Cuánto tiempo durará el proceso?",
      "¿Qué documentos necesito presentar?",
    ],
  },
  DEMANDADO: {
    title: "Asistente del Demandado",
    description: "Información sobre el proceso en su contra",
    welcomeMessage:
      "¡Hola! Estoy aquí para ayudarte a entender el proceso de arbitraje. Puedo explicarte tus derechos, plazos para responder y el estado del caso.",
    capabilities: [
      "Estado del caso",
      "Derechos del demandado",
      "Plazos para responder",
      "Preguntas frecuentes",
    ],
    suggestedQuestions: [
      "¿Cuánto tiempo tengo para contestar la demanda?",
      "¿Qué opciones tengo como demandado?",
      "¿Puedo presentar una reconvención?",
      "¿Qué pasa si no contesto?",
    ],
  },
  CENTER_STAFF: {
    title: "Asistente de Soporte",
    description: "Apoyo para atención al usuario",
    welcomeMessage:
      "¡Hola! Soy tu asistente de soporte. Puedo ayudarte con información sobre procesos, verificación de pagos, y respuestas a consultas frecuentes de usuarios.",
    capabilities: [
      "Información de procesos",
      "Verificación de pagos",
      "Preguntas frecuentes",
      "Guías de procedimiento",
    ],
    suggestedQuestions: [
      "¿Cómo se verifica un pago?",
      "¿Cuáles son los requisitos para presentar una demanda?",
      "¿Cuánto cuesta el arbitraje?",
      "¿Cómo ayudo a un usuario con problemas de pago?",
    ],
  },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface RoleAssistantProps {
  caseId?: string;
  caseCode?: string;
  context?: string;
  initialMessage?: string;
}

export function RoleAssistant({
  caseId,
  caseCode,
  context,
  initialMessage,
}: RoleAssistantProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  const userRole = (session?.user as any)?.role || "DEMANDANTE";
  const config = roleConfigs[userRole] || roleConfigs.DEMANDANTE;

  // Inicializar con mensaje de bienvenida
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg: Message = {
        id: "welcome",
        role: "assistant",
        content: config.welcomeMessage,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }
  }, [config.welcomeMessage, messages.length]);

  // Scroll al final cuando hay nuevos mensajes.
  // Radix ScrollArea tiene un viewport interno con data-radix-scroll-area-viewport,
  // no basta con setear scrollTop del wrapper.
  useEffect(() => {
    // Usar un anclaje al final como target confiable
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      return;
    }
    // Fallback: buscar el viewport de Radix dentro del ScrollArea
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isLoading]);

  // Enviar mensaje
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          role: userRole,
          caseId,
          context,
          conversationHistory: messages.slice(-10), // Últimos 10 mensajes para contexto
        }),
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Copiar mensaje
  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Usar pregunta sugerida
  const useSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  // Limpiar conversación
  const clearConversation = () => {
    const welcomeMsg: Message = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: config.welcomeMessage,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  };

  return (
    <Card className="flex flex-col h-full min-h-[500px] max-h-[calc(100vh-180px)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {config.title}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {caseCode && <Badge variant="outline">{caseCode}</Badge>}
            <Button variant="ghost" size="icon" onClick={clearConversation}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Capacidades */}
        <div className="flex flex-wrap gap-1 mt-2">
          {config.capabilities.map((cap) => (
            <Badge key={cap} variant="secondary" className="text-xs">
              {cap}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
        {/* Área de mensajes */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 relative group",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-50 mt-1 block">
                    {message.timestamp.toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyMessage(message.content, message.id)}
                    >
                      {copied === message.id ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {/* Anclaje para auto-scroll al final */}
            <div ref={bottomAnchorRef} aria-hidden="true" />
          </div>
        </ScrollArea>

        {/* Preguntas sugeridas */}
        {messages.length <= 1 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Preguntas sugeridas:
            </p>
            <div className="flex flex-wrap gap-2">
              {config.suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1"
                  onClick={() => useSuggestedQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="min-h-[60px] pr-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RoleAssistant;
