/**
 * CAARD - Proveedor de IA
 * Conecta con OpenAI o Anthropic según configuración
 */

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: string;
}

/**
 * Genera respuesta usando OpenAI API
 */
async function callOpenAI(
  messages: AIMessage[],
  model: string = "gpt-4o-mini",
  maxTokens: number = 1000
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || "No se pudo generar una respuesta.",
    promptTokens: data.usage?.prompt_tokens || 0,
    completionTokens: data.usage?.completion_tokens || 0,
    totalTokens: data.usage?.total_tokens || 0,
    model: data.model || model,
    provider: "openai",
  };
}

/**
 * Genera respuesta usando Anthropic API
 */
async function callAnthropic(
  messages: AIMessage[],
  model: string = "claude-sonnet-4-20250514",
  maxTokens: number = 1000
): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");

  // Separar system message
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemMsg?.content || "",
      messages: chatMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "No se pudo generar una respuesta.";

  return {
    content,
    promptTokens: data.usage?.input_tokens || 0,
    completionTokens: data.usage?.output_tokens || 0,
    totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    model: data.model || model,
    provider: "anthropic",
  };
}

/**
 * Genera respuesta de IA usando el proveedor disponible
 * Intenta OpenAI primero, luego Anthropic, luego fallback local
 */
export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  options: {
    model?: string;
    maxTokens?: number;
    provider?: "openai" | "anthropic" | "auto";
  } = {}
): Promise<AIResponse> {
  const { maxTokens = 1000, provider = "auto" } = options;

  // Construir mensajes
  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Intentar con el proveedor preferido o auto-detect
  if (provider === "anthropic" || (provider === "auto" && process.env.ANTHROPIC_API_KEY)) {
    try {
      return await callAnthropic(messages, options.model || "claude-sonnet-4-20250514", maxTokens);
    } catch (error) {
      console.error("Anthropic failed, trying OpenAI:", error);
      if (provider === "anthropic") throw error;
    }
  }

  if (provider === "openai" || (provider === "auto" && process.env.OPENAI_API_KEY)) {
    try {
      return await callOpenAI(messages, options.model || "gpt-4o-mini", maxTokens);
    } catch (error) {
      console.error("OpenAI failed:", error);
      if (provider === "openai") throw error;
    }
  }

  // Fallback: respuesta local si no hay API keys
  return {
    content: generateLocalResponse(userMessage),
    promptTokens: Math.ceil(userMessage.length / 4),
    completionTokens: 100,
    totalTokens: Math.ceil(userMessage.length / 4) + 100,
    model: "local-fallback",
    provider: "local",
  };
}

/**
 * Respuesta local de fallback cuando no hay API keys
 */
function generateLocalResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("plazo") || lower.includes("tiempo")) {
    return "Los plazos en CAARD se calculan en días hábiles. Contestación: 10 días hábiles, Reconvención: junto con contestación, Alegatos: 5 días hábiles. Para un cálculo exacto, consulte la secretaría.";
  }
  if (lower.includes("pago") || lower.includes("costo") || lower.includes("tasa")) {
    return "Tasa de presentación nacional: S/ 500 + IGV. Internacional: US$ 700 + IGV. Emergencia: S/ 1,800 + IGV. Puede pagar con tarjeta o transferencia bancaria.";
  }
  if (lower.includes("curso")) {
    return "CAARD ofrece cursos de arbitraje y resolución de disputas. Visite la sección de Cursos para ver nuestra oferta educativa.";
  }
  if (lower.includes("arbitraje") || lower.includes("proceso")) {
    return "El arbitraje en CAARD sigue las etapas: Demanda → Contestación → Reconvención → Probatoria → Alegatos → Laudo. Para iniciar, presente su solicitud en la sección correspondiente.";
  }

  return "Gracias por su consulta. Para una respuesta más precisa, ¿podría especificar qué información necesita? Puedo ayudarle con plazos, pagos, procesos de arbitraje, cursos y más.";
}
