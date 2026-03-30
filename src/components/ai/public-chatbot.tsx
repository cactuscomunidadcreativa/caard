"use client";

/**
 * CAARD - Chatbot Publico de Orientacion
 * =======================================
 * NO da asesoria legal. Solo orienta sobre:
 * - Informacion del centro (horarios, ubicacion, contacto)
 * - Servicios disponibles
 * - Cursos y capacitaciones
 * - Tienda y productos
 * - Biblioteca de laudos
 * - Proceso de arbitraje (informacion general)
 * - Navegacion del sitio web
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import Link from "next/link";

/* ─────────────────────────── Types ─────────────────────────── */

interface CTAButton {
  label: string;
  href: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  cta?: CTAButton;
}

/* ─────────────────────── Quick Actions ─────────────────────── */

interface QuickAction {
  emoji: string;
  label: string;
  color: string;
  hoverColor: string;
  query: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    emoji: "\u{1F3DB}\uFE0F",
    label: "Sobre CAARD",
    color: "bg-blue-600",
    hoverColor: "hover:bg-blue-700",
    query: "sobre_caard",
  },
  {
    emoji: "\u{1F4DA}",
    label: "Cursos",
    color: "bg-orange-500",
    hoverColor: "hover:bg-orange-600",
    query: "cursos",
  },
  {
    emoji: "\u{1F6D2}",
    label: "Tienda",
    color: "bg-green-600",
    hoverColor: "hover:bg-green-700",
    query: "tienda",
  },
  {
    emoji: "\u2696\uFE0F",
    label: "Arbitraje",
    color: "bg-[#0B2A5B]",
    hoverColor: "hover:bg-[#091f45]",
    query: "arbitraje",
  },
  {
    emoji: "\u{1F4CB}",
    label: "Laudos",
    color: "bg-purple-600",
    hoverColor: "hover:bg-purple-700",
    query: "laudos",
  },
  {
    emoji: "\u{1F4DE}",
    label: "Contacto",
    color: "bg-teal-600",
    hoverColor: "hover:bg-teal-700",
    query: "contacto",
  },
];

/* ─────────────────────── Knowledge Base ────────────────────── */

interface KBEntry {
  keywords: string[];
  answer: string;
  cta?: CTAButton;
}

const KNOWLEDGE_BASE: KBEntry[] = [
  // About CAARD
  {
    keywords: [
      "sobre_caard",
      "que es caard",
      "qué es caard",
      "quienes son",
      "quiénes son",
      "centro",
      "institucion",
      "institución",
      "información",
      "informacion",
      "sobre ustedes",
    ],
    answer:
      "El Centro de Administraci\u00F3n de Arbitrajes y Resoluci\u00F3n de Disputas (CAARD) es una instituci\u00F3n arbitral que impulsa el arbitraje como medio eficaz para la soluci\u00F3n de controversias.\n\nOfrecemos servicios de administraci\u00F3n de procesos arbitrales, capacitaci\u00F3n en arbitraje, y una tienda con publicaciones especializadas.",
  },
  // Location
  {
    keywords: [
      "ubicacion",
      "ubicación",
      "donde",
      "dónde",
      "direccion",
      "dirección",
      "oficina",
      "llegar",
      "mapa",
      "sede",
    ],
    answer:
      "Nuestra sede se encuentra en:\n\n\u{1F4CD} Jr. Aldebarán No. 596, oficina 1409 – Edificio IQ Surco, Santiago de Surco, Lima, Per\u00FA\n\n\u{1F552} Horario de atenci\u00F3n: Lunes a Viernes de 9:00 AM a 6:00 PM",
  },
  // Contact
  {
    keywords: [
      "contacto",
      "contactar",
      "telefono",
      "teléfono",
      "email",
      "correo",
      "whatsapp",
      "comunicar",
      "llamar",
      "escribir",
      "mesa de partes",
    ],
    answer:
      "Puedes contactarnos por los siguientes medios:\n\n\u{1F4E7} Email: info@caardpe.com\n\u{1F4F1} WhatsApp: +51 977 236 143\n\n\u{1F552} Horario de atenci\u00F3n: Lunes a Viernes de 9:00 AM a 6:00 PM\n\u{1F4CD} Jr. Aldebarán No. 596, oficina 1409 – Edificio IQ Surco, Santiago de Surco, Lima, Per\u00FA",
  },
  // Schedule
  {
    keywords: [
      "horario",
      "hora",
      "horas",
      "atencion",
      "atención",
      "abierto",
      "abiertos",
      "cuando",
      "cuándo",
    ],
    answer:
      "Nuestro horario de atenci\u00F3n es:\n\n\u{1F552} Lunes a Viernes de 9:00 AM a 6:00 PM\n\u{1F4CD} Jr. Aldebarán No. 596, oficina 1409 – Edificio IQ Surco, Santiago de Surco, Lima, Per\u00FA",
  },
  // Courses
  {
    keywords: [
      "cursos",
      "curso",
      "capacitacion",
      "capacitación",
      "formacion",
      "formación",
      "aprender",
      "estudiar",
      "diplomado",
      "taller",
      "talleres",
      "clase",
      "clases",
    ],
    answer:
      "Ofrecemos cursos y capacitaciones en arbitraje y resoluci\u00F3n de disputas. Puedes explorar nuestro cat\u00E1logo completo de cursos disponibles, con informaci\u00F3n sobre fechas, contenido y matr\u00EDcula.",
    cta: { label: "Ver Cursos \u2192", href: "/cursos" },
  },
  // Store / Products
  {
    keywords: [
      "tienda",
      "productos",
      "producto",
      "comprar",
      "publicacion",
      "publicación",
      "publicaciones",
      "libro",
      "libros",
      "material",
      "materiales",
      "venta",
    ],
    answer:
      "En nuestra tienda encontrar\u00E1s publicaciones especializadas en arbitraje, materiales acad\u00E9micos y otros productos relacionados con la resoluci\u00F3n de disputas.",
    cta: { label: "Ir a Tienda \u2192", href: "/tienda" },
  },
  // Laudos
  {
    keywords: [
      "laudos",
      "laudo",
      "biblioteca",
      "resoluciones",
      "resolucion",
      "resolución",
      "jurisprudencia",
      "sentencia",
      "sentencias",
    ],
    answer:
      "Nuestra biblioteca de laudos te permite consultar resoluciones arbitrales publicadas. Es un recurso valioso para investigaci\u00F3n y referencia en materia arbitral.",
    cta: { label: "Consultar Laudos \u2192", href: "/laudos" },
  },
  // Arbitration process
  {
    keywords: [
      "arbitraje",
      "proceso",
      "procedimiento",
      "etapas",
      "pasos",
      "como funciona",
      "cómo funciona",
      "funcionamiento",
    ],
    answer:
      "El proceso arbitral en CAARD sigue estas etapas generales:\n\n1\uFE0F\u20E3 Solicitud arbitral - Se presenta la demanda\n2\uFE0F\u20E3 Admisi\u00F3n - CAARD eval\u00FAa y admite la solicitud\n3\uFE0F\u20E3 Contestaci\u00F3n - La otra parte responde\n4\uFE0F\u20E3 Constituci\u00F3n del tribunal - Se designan \u00E1rbitros\n5\uFE0F\u20E3 Audiencias - Se llevan a cabo las audiencias\n6\uFE0F\u20E3 Laudo - El tribunal emite su decisi\u00F3n\n\nPuedes iniciar tu solicitud arbitral en l\u00EDnea.",
    cta: {
      label: "Iniciar Solicitud \u2192",
      href: "/solicitud-arbitral",
    },
  },
  // Costs / Pricing
  {
    keywords: [
      "costo",
      "costos",
      "precio",
      "precios",
      "cuanto",
      "cuánto",
      "tarifa",
      "tarifas",
      "gasto",
      "gastos",
      "pagar",
      "pago",
      "cobrar",
      "cobro",
      "honorarios",
      "arancel",
      "aranceles",
    ],
    answer:
      "Los costos del arbitraje dependen de la cuant\u00EDa de la controversia. Puedes calcular los costos estimados con nuestra calculadora en l\u00EDnea.",
    cta: {
      label: "Calculadora de Gastos \u2192",
      href: "/arbitraje/calculadora-gastos",
    },
  },
  // How to start
  {
    keywords: [
      "iniciar",
      "empezar",
      "comenzar",
      "solicitud",
      "demanda",
      "presentar",
      "arbitrar",
      "solicitar",
    ],
    answer:
      "Para iniciar un proceso arbitral en CAARD debes presentar tu solicitud arbitral. Puedes hacerlo en l\u00EDnea a trav\u00E9s de nuestro formulario.",
    cta: {
      label: "Iniciar Solicitud \u2192",
      href: "/solicitud-arbitral",
    },
  },
  // Legal advice (deflect)
  {
    keywords: [
      "abogado",
      "legal",
      "asesor",
      "asesoria",
      "asesoría",
      "ley",
      "leyes",
      "norma",
      "jurídico",
      "juridico",
      "caso",
      "mi caso",
      "demandado",
      "demandante",
      "defensa",
      "recurso",
      "impugnar",
      "anular",
      "nulidad",
      "contrato",
      "clausula",
      "cláusula",
    ],
    answer:
      "No puedo brindar asesor\u00EDa legal. Para consultas legales espec\u00EDficas, te recomiendo contactar a un abogado o iniciar una solicitud arbitral.\n\nSi necesitas empezar un proceso arbitral, puedes hacerlo en l\u00EDnea.",
    cta: {
      label: "Iniciar Solicitud \u2192",
      href: "/solicitud-arbitral",
    },
  },
  // Services
  {
    keywords: ["servicios", "servicio", "ofrecen", "brindan", "hacen"],
    answer:
      "CAARD ofrece los siguientes servicios:\n\n\u2696\uFE0F Administraci\u00F3n de procesos arbitrales\n\u{1F4DA} Cursos y capacitaciones en arbitraje\n\u{1F6D2} Tienda con publicaciones especializadas\n\u{1F4CB} Biblioteca de laudos arbitrales\n\u{1F4DD} Solicitud arbitral en l\u00EDnea",
  },
  // Website navigation
  {
    keywords: [
      "pagina",
      "página",
      "web",
      "sitio",
      "navegar",
      "encontrar",
      "buscar",
      "secciones",
      "menu",
      "menú",
    ],
    answer:
      "Puedo ayudarte a navegar nuestro sitio. Estas son las secciones principales:\n\n\u2696\uFE0F Arbitraje - Informaci\u00F3n sobre el proceso\n\u{1F4DA} Cursos - Capacitaciones disponibles\n\u{1F6D2} Tienda - Publicaciones y productos\n\u{1F4CB} Laudos - Biblioteca de resoluciones\n\u{1F4DD} Solicitud Arbitral - Iniciar un proceso\n\n\u00BFQu\u00E9 secci\u00F3n te interesa?",
  },
  // Greeting
  {
    keywords: ["hola", "buenos dias", "buenas tardes", "buenas noches", "hey", "saludos", "buen dia"],
    answer:
      "\u00A1Hola! Bienvenido a CAARD. Soy el asistente virtual y estoy aqu\u00ED para orientarte.\n\n\u00BFEn qu\u00E9 puedo ayudarte? Puedes preguntarme sobre nuestros servicios, cursos, tienda, procesos de arbitraje o informaci\u00F3n de contacto.",
  },
  // Thanks
  {
    keywords: ["gracias", "muchas gracias", "agradezco", "genial", "perfecto", "excelente"],
    answer:
      "\u00A1Con gusto! Si tienes alguna otra consulta, no dudes en preguntar. Estamos para ayudarte.",
  },
];

/* ─────────────────── Response Matcher ──────────────────────── */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function findResponse(input: string): { answer: string; cta?: CTAButton } {
  const normalized = normalize(input);
  const words = normalized.split(/\s+/);

  // Direct query match (from quick action buttons)
  const directMatch = KNOWLEDGE_BASE.find((entry) =>
    entry.keywords.includes(normalized)
  );
  if (directMatch) {
    return { answer: directMatch.answer, cta: directMatch.cta };
  }

  // Score each entry by keyword matches
  let bestScore = 0;
  let bestEntry: KBEntry | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const normalizedKeyword = normalize(keyword);
      // Exact keyword in input
      if (normalized.includes(normalizedKeyword)) {
        score += normalizedKeyword.split(/\s+/).length * 2;
      }
      // Individual word matches
      const kwWords = normalizedKeyword.split(/\s+/);
      for (const kw of kwWords) {
        if (words.includes(kw)) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 2) {
    return { answer: bestEntry.answer, cta: bestEntry.cta };
  }

  // Fallback
  return {
    answer:
      "No estoy seguro de c\u00F3mo ayudarte con eso. Puedes preguntarme sobre:\n\n\u2022 Informaci\u00F3n de CAARD\n\u2022 Cursos y capacitaciones\n\u2022 Tienda y productos\n\u2022 Proceso de arbitraje\n\u2022 Laudos arbitrales\n\u2022 Contacto y ubicaci\u00F3n\n\nO si prefieres, cont\u00E1ctanos directamente al correo info@caardpe.com o al WhatsApp +51 977 236 143.",
  };
}

/* ════════════════════════ Component ════════════════════════ */

export function PublicChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: Message = { role: "user", content: trimmed };
      const response = findResponse(trimmed);
      const botMessage: Message = {
        role: "assistant",
        content: response.answer,
        cta: response.cta,
      };

      setMessages((prev) => [...prev, userMessage, botMessage]);
      setInput("");
    },
    []
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      const userMessage: Message = {
        role: "user",
        content: action.label,
      };
      const response = findResponse(action.query);
      const botMessage: Message = {
        role: "assistant",
        content: response.answer,
        cta: response.cta,
      };
      setMessages((prev) => [...prev, userMessage, botMessage]);
    },
    []
  );

  return (
    <>
      {/* ── Chat Bubble ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#D66829] px-4 py-3 text-white shadow-lg transition-all duration-300 hover:bg-[#c45a22] hover:shadow-xl ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100 animate-bounce-subtle"
        }`}
        aria-label="Abrir chat de ayuda"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="text-sm font-medium">{"\u00BFNecesitas ayuda?"}</span>
      </button>

      {/* ── Chat Window ── */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[380px] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{ maxHeight: "550px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-[#0B2A5B] px-4 py-3">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Asistente CAARD</p>
              <p className="text-[11px] text-white/60">Orientaci&oacute;n general</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: "280px", maxHeight: "380px" }}>
          {/* Welcome + Quick Actions (only when no messages) */}
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <BotAvatar />
                <div className="rounded-lg rounded-tl-none bg-gray-100 p-3 text-sm text-gray-800">
                  {"\u00A1Hola! Soy el asistente virtual de CAARD. Estoy aqu\u00ED para orientarte sobre nuestros servicios."}
                  <br />
                  <br />
                  <span className="text-gray-500 text-xs">
                    {"Selecciona un tema o escribe tu consulta:"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-9">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.query}
                    onClick={() => handleQuickAction(action)}
                    className={`${action.color} ${action.hoverColor} inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors`}
                  >
                    <span>{action.emoji}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message history */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "user" ? <UserAvatar /> : <BotAvatar />}
              <div
                className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  msg.role === "user"
                    ? "rounded-tr-none bg-[#D66829] text-white"
                    : "rounded-tl-none bg-gray-100 text-gray-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.cta && (
                  <Link
                    href={msg.cta.href}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#D66829] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#c45a22]"
                  >
                    {msg.cta.label}
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Quick actions after conversation started */}
          {messages.length > 0 && messages.length < 12 && (
            <div className="flex flex-wrap gap-1.5 pl-9 pt-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.query}
                  onClick={() => handleQuickAction(action)}
                  className={`${action.color} ${action.hoverColor} inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white opacity-70 transition-all hover:opacity-100`}
                >
                  <span>{action.emoji}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-3 py-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#D66829]/50 focus:outline-none focus:ring-2 focus:ring-[#D66829]/20"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D66829] text-white transition-colors hover:bg-[#c45a22] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">
            {"Asistente de orientaci\u00F3n \u2022 No brinda asesor\u00EDa legal"}
          </p>
        </div>
      </div>

      {/* Bounce animation */}
      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out 3;
        }
      `}</style>
    </>
  );
}

/* ──────────────── Avatar sub-components ────────────────────── */

function BotAvatar() {
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#0B2A5B]">
      <Bot className="h-3.5 w-3.5 text-white" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#D66829]">
      <User className="h-3.5 w-3.5 text-white" />
    </div>
  );
}
