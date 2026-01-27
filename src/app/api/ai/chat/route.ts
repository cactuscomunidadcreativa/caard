/**
 * API: Chat IA
 * =============
 * Endpoint para el asistente IA adaptado por rol
 * Cada rol tiene un system prompt diferente y acceso a diferentes datos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación
const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  role: z.string().optional(),
  caseId: z.string().optional(),
  context: z.string().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

// System prompts por rol
const roleSystemPrompts: Record<string, string> = {
  SUPER_ADMIN: `Eres un asistente experto del sistema CAARD (Centro de Arbitraje y Administración de Resolución de Disputas).
Tienes acceso completo a todas las funciones del sistema. Puedes ayudar con:
- Configuración del sistema y reglas de arbitraje
- Reportes avanzados y análisis de métricas
- Gestión de usuarios y árbitros
- Override de reglas cuando sea necesario
- Información sobre todos los expedientes y procesos

Siempre responde de manera profesional y precisa. Si necesitas información específica de un expediente, indica qué datos necesitas.
Eres experto en derecho arbitral peruano y procedimientos del centro.`,

  ADMIN: `Eres un asistente para administradores del centro CAARD.
Puedes ayudar con:
- Gestión del centro de arbitraje
- Reportes y estadísticas
- Gestión de usuarios del centro
- Configuración de tipos de arbitraje
- Supervisión de procesos

Responde de manera clara y profesional. Si necesitas acceso a información específica, indícalo.`,

  SECRETARIA: `Eres el asistente de la Secretaría Arbitral de CAARD.
Tu especialidad es:
- Gestión de expedientes y actuados
- Cálculo de plazos procesales (días hábiles, considerando feriados)
- Verificación de requisitos de admisibilidad
- Redacción de providencias y resoluciones
- Control de notificaciones
- Seguimiento de etapas procesales

Los plazos en CAARD se calculan en días hábiles (lunes a viernes, excluyendo feriados).
Plazos importantes:
- Contestación de demanda: según convenio arbitral o 10 días hábiles
- Reconvención: con la contestación
- Alegatos: 5 días hábiles
- Recusación: 5 días hábiles para absolver

Responde con precisión técnica y legal.`,

  ARBITRO: `Eres un asistente jurídico especializado para árbitros de CAARD.
Puedes ayudar con:
- Análisis de documentos y escritos
- Búsqueda y referencia de jurisprudencia arbitral
- Resumen de expedientes y argumentos
- Asistencia en redacción de laudos
- Cálculo de plazos para resoluciones
- Análisis de pruebas

Como árbitro de emergencia:
- Tienes 4 días hábiles para resolver
- Debes emitir medidas cautelares fundamentadas

Responde con rigor jurídico y precisión técnica.`,

  ABOGADO: `Eres un asistente legal para abogados litigantes en CAARD.
Puedes ayudar con:
- Análisis de documentos del expediente
- Control de plazos de los casos
- Resumen de actuados y escritos
- Asistencia en redacción de escritos
- Información sobre procedimientos del centro
- Cálculo de tasas y aranceles

Plazos típicos:
- Contestación: según convenio o 10 días hábiles
- Reconvención: con la contestación
- Pruebas documentales: hasta el cierre de instrucción

Responde de manera práctica y orientada a la estrategia procesal.`,

  DEMANDANTE: `Eres un asistente amigable que ayuda a los demandantes a entender su proceso de arbitraje en CAARD.
Tu objetivo es explicar de manera sencilla y clara:
- El estado actual del caso
- Las etapas del proceso de arbitraje
- Los plazos importantes
- Sus derechos como demandante
- Qué documentos necesita presentar

Evita usar jerga legal excesiva. Si el usuario pregunta algo que requiere asesoría legal específica,
recomiéndale consultar con su abogado.

El proceso típico es:
1. Presentación de demanda
2. Admisión
3. Notificación al demandado
4. Contestación
5. Etapa probatoria
6. Alegatos
7. Laudo (decisión final)`,

  DEMANDADO: `Eres un asistente amigable que ayuda a los demandados a entender el proceso de arbitraje en CAARD.
Tu objetivo es explicar de manera sencilla:
- Sus derechos como demandado
- Los plazos para responder (contestación)
- Las opciones que tiene (contestar, reconvenir, etc.)
- El estado de su caso
- Qué documentos puede presentar

Es importante que el demandado sepa:
- Tiene derecho a contestar la demanda
- Puede presentar una reconvención (contrademanda)
- Tiene derecho a presentar pruebas
- Si no contesta, el proceso continúa sin su participación

Recomienda consultar con un abogado para decisiones importantes.`,

  CENTER_STAFF: `Eres un asistente de soporte para el personal del centro CAARD.
Ayudas con:
- Información sobre procedimientos internos
- Verificación de pagos y documentos
- Respuestas a preguntas frecuentes de usuarios
- Guías de atención al público
- Información sobre tarifas y requisitos

Tarifas actuales:
- Tasa de presentación nacional: S/ 500 + IGV
- Tasa de presentación internacional: US$ 700 + IGV
- Arbitraje de emergencia: S/ 1,800 + IGV (nacional)

Requisitos básicos para demanda:
- Copia del convenio arbitral
- Documento de identidad
- Poder de representación (si aplica)
- Comprobante de pago de tasa

Responde de manera amable y orientada al servicio al cliente.`,
};

// Función para obtener contexto del caso si se proporciona
async function getCaseContext(caseId: string): Promise<string> {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      members: true,
      documents: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!caseData) return "";

  return `
Contexto del expediente:
- Código: ${caseData.code}
- Estado: ${caseData.status}
- Etapa: ${caseData.currentStage || "No definida"}
- Demandante: ${caseData.claimantName || "No especificado"}
- Demandado: ${caseData.respondentName || "No especificado"}
- Documentos recientes: ${caseData.documents.map((d) => d.documentType).join(", ") || "Ninguno"}
`;
}

// Simular respuesta de IA (en producción usar OpenAI, Claude, etc.)
async function generateAIResponse(
  message: string,
  systemPrompt: string,
  context: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  // TODO: Integrar con proveedor de IA real (OpenAI, Anthropic, etc.)
  // Por ahora, respuesta simulada inteligente

  const lowerMessage = message.toLowerCase();

  // Respuestas basadas en patrones comunes
  if (lowerMessage.includes("plazo") || lowerMessage.includes("tiempo")) {
    return `Los plazos en CAARD se calculan en días hábiles (lunes a viernes, excluyendo feriados):

**Plazos principales:**
- Contestación de demanda: 10 días hábiles (o según convenio)
- Reconvención: junto con la contestación
- Alegatos: 5 días hábiles
- Laudo: según complejidad del caso

Para calcular un plazo específico, necesito saber la fecha de inicio y el tipo de actuación.`;
  }

  if (lowerMessage.includes("pago") || lowerMessage.includes("costo") || lowerMessage.includes("tasa")) {
    return `**Tarifas de CAARD:**

**Arbitraje Nacional:**
- Tasa de presentación: S/ 500.00 + IGV = S/ 590.00

**Arbitraje Internacional:**
- Tasa de presentación: US$ 700.00 + IGV

**Arbitraje de Emergencia:**
- Tasa: S/ 1,800.00 + IGV = S/ 2,124.00
- Honorarios del árbitro de emergencia: Adicional

Los pagos se pueden realizar por transferencia bancaria o en línea a través de Culqi.`;
  }

  if (lowerMessage.includes("emergencia")) {
    return `**Arbitraje de Emergencia:**

El procedimiento de emergencia permite obtener medidas cautelares urgentes antes de la constitución del tribunal arbitral.

**Plazos estrictos:**
1. Verificación formal: 1 día hábil
2. Pago de tasa: 1 día hábil
3. Designación de árbitro: 4 días hábiles
4. Resolución del árbitro: 4 días hábiles
5. Presentar demanda principal: 15 días hábiles

**Importante:** Si no se presenta la demanda principal en 15 días, las medidas de emergencia caducan.`;
  }

  if (lowerMessage.includes("estado") || lowerMessage.includes("etapa")) {
    return `${context ? `\n${context}\n` : ""}

**Etapas del proceso arbitral:**

1. **Demanda** - Presentación y admisión de la solicitud
2. **Contestación** - Respuesta del demandado
3. **Reconvención** - Contrademanda (opcional)
4. **Probatoria** - Presentación y actuación de pruebas
5. **Alegatos** - Argumentos finales de las partes
6. **Laudo** - Decisión final del tribunal

Si necesita información específica sobre un expediente, proporcione el código del caso.`;
  }

  if (lowerMessage.includes("documento") || lowerMessage.includes("requisito")) {
    return `**Documentos requeridos para iniciar un arbitraje:**

1. ✅ Solicitud de arbitraje (formato del centro)
2. ✅ Copia del convenio arbitral
3. ✅ Documento de identidad del solicitante
4. ✅ Poder de representación (si actúa mediante abogado)
5. ✅ Comprobante de pago de la tasa de presentación
6. ✅ Documentos que sustentan la demanda

**Formatos aceptados:** PDF, Word, imágenes escaneadas
**Tamaño máximo:** 25 MB por archivo

¿Necesita ayuda con algún documento específico?`;
  }

  // Respuesta genérica
  return `Gracias por su consulta.

${context ? `Basándome en el contexto del expediente:\n${context}\n` : ""}

Para darle una respuesta más precisa, ¿podría especificar:
- ¿Se trata de un caso en particular? (proporcione el código)
- ¿Qué información específica necesita?

Estoy aquí para ayudarle con cualquier duda sobre el proceso de arbitraje en CAARD.`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = chatSchema.parse(body);

    // Obtener rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const userRole = user?.role || validatedData.role || "DEMANDANTE";
    const systemPrompt = roleSystemPrompts[userRole] || roleSystemPrompts.DEMANDANTE;

    // Obtener contexto del caso si se proporciona
    let caseContext = "";
    if (validatedData.caseId) {
      caseContext = await getCaseContext(validatedData.caseId);
    }

    // Agregar contexto adicional si se proporciona
    const fullContext = [caseContext, validatedData.context]
      .filter(Boolean)
      .join("\n\n");

    // Generar respuesta
    const response = await generateAIResponse(
      validatedData.message,
      systemPrompt,
      fullContext,
      validatedData.conversationHistory || []
    );

    // Registrar uso (para cuotas)
    await prisma.aIUsageLog.create({
      data: {
        userId: session.user.id,
        endpoint: "/api/ai/chat",
        requestType: "chat",
        promptTokens: Math.ceil(validatedData.message.length / 4), // Estimación
        completionTokens: Math.ceil(response.length / 4),
        totalTokens: Math.ceil((validatedData.message.length + response.length) / 4),
        success: true,
        contextType: validatedData.caseId ? "case" : undefined,
        contextId: validatedData.caseId,
      },
    });

    return NextResponse.json({
      response,
      role: userRole,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { error: "Error al procesar la consulta" },
      { status: 500 }
    );
  }
}
