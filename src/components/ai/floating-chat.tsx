"use client";

/**
 * CAARD - Chat Flotante de IA
 * ============================
 * Chat lateral persistente que puede minimizarse/expandirse
 * Integrado en el dashboard para acceso rápido
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Minimize2,
  Maximize2,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  User,
  Copy,
  CheckCircle,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Configuración por rol
const roleConfig: Record<string, { title: string; suggestions: string[] }> = {
  SUPER_ADMIN: {
    title: "Asistente Admin",
    suggestions: [
      "Resumen de actividad del sistema",
      "Expedientes con mayor antigüedad",
      "Estadísticas de pagos pendientes",
    ],
  },
  ADMIN: {
    title: "Asistente Admin",
    suggestions: [
      "Resumen de expedientes del mes",
      "Árbitros disponibles",
      "Verificar pagos pendientes",
    ],
  },
  SECRETARIA: {
    title: "Asistente Secretaría",
    suggestions: [
      "Plazos que vencen esta semana",
      "Redactar providencia de admisión",
      "Verificar documentos pendientes",
    ],
  },
  ARBITRO: {
    title: "Asistente Jurídico",
    suggestions: [
      "Resumir argumentos del demandante",
      "Buscar jurisprudencia relevante",
      "Plazo para emitir el laudo",
    ],
  },
  ABOGADO: {
    title: "Asistente Legal",
    suggestions: [
      "Plazos próximos en mis casos",
      "Resumir escrito de contraparte",
      "Ayuda para redactar alegatos",
    ],
  },
  DEMANDANTE: {
    title: "Asistente",
    suggestions: [
      "¿En qué etapa está mi caso?",
      "¿Qué significa demanda admitida?",
      "¿Cuánto durará el proceso?",
    ],
  },
  DEMANDADO: {
    title: "Asistente",
    suggestions: [
      "¿Cuánto tiempo para contestar?",
      "¿Qué opciones tengo?",
      "¿Puedo presentar reconvención?",
    ],
  },
  CENTER_STAFF: {
    title: "Asistente Soporte",
    suggestions: [
      "¿Cómo verificar un pago?",
      "Requisitos para demanda",
      "Guía de procedimiento",
    ],
  },
};

export function FloatingChat() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userRole = (session?.user as any)?.role || "DEMANDANTE";
  const config = roleConfig[userRole] || roleConfig.DEMANDANTE;

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollRef.current && isOpen && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Mensaje inicial de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: Message = {
        id: "welcome",
        role: "assistant",
        content: `¡Hola! Soy tu ${config.title}. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, messages.length, config.title]);

  // Reset unread cuando se abre
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  // Enviar mensaje
  const handleSend = useCallback(async () => {
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
          conversationHistory: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error("Error en respuesta");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Si está minimizado, incrementar contador
      if (isMinimized) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, hubo un error. Por favor intenta de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userRole, messages, isMinimized]);

  // Copiar mensaje
  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Usar sugerencia
  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  // Limpiar conversación
  const clearChat = () => {
    const welcomeMsg: Message = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: `¡Hola! Soy tu ${config.title}. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  };

  // Tecla Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botón flotante para abrir */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full bg-gradient-to-br from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] shadow-lg hover:shadow-xl transition-all"
            >
              <MessageSquare className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-50 bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col",
              isMinimized
                ? "bottom-6 right-6 w-72 h-14"
                : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#D66829] to-[#c45a22] text-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{config.title}</h3>
                  {!isMinimized && (
                    <p className="text-[10px] text-white/80">Powered by AI</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isMinimized && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={clearChat}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Minimize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Contenido (oculto cuando minimizado) */}
            {!isMinimized && (
              <>
                {/* Mensajes */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#D66829]/20 to-[#D66829]/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-[#D66829]" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm group relative",
                            message.role === "user"
                              ? "bg-[#D66829] text-white rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <span className="text-[10px] opacity-60 mt-1 block">
                            {message.timestamp.toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {message.role === "assistant" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -right-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyMessage(message.content, message.id)}
                            >
                              {copied === message.id ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="h-7 w-7 rounded-full bg-[#0B2A5B] flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#D66829]/20 to-[#D66829]/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-[#D66829]" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#D66829]" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Sugerencias (solo si hay pocas mensajes) */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2">
                    <p className="text-[10px] text-muted-foreground mb-1.5">
                      Sugerencias:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {config.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => useSuggestion(suggestion)}
                          className="text-[10px] px-2 py-1 rounded-full bg-[#D66829]/10 text-[#D66829] hover:bg-[#D66829]/20 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe tu consulta..."
                      className="min-h-[44px] max-h-24 resize-none text-sm rounded-xl"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl bg-[#D66829] hover:bg-[#c45a22]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
