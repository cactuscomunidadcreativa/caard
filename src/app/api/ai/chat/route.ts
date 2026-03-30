/**
 * API: Chat IA
 * Endpoint para el asistente IA adaptado por rol
 * Soporta usuarios autenticados y chatbot público
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateAIResponse } from "@/lib/ai/provider";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  role: z.string().optional(),
  caseId: z.string().optional(),
  context: z.string().optional(),
  isPublic: z.boolean().optional(), // true = chatbot público sin login
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
  PUBLIC: `Eres el asistente virtual de CAARD (Centro de Arbitraje y Administración de Resolución de Disputas).
Ayudas a visitantes del sitio web con:
- Información sobre servicios de arbitraje y mediación
- Información sobre cursos y capacitaciones
- Navegación del sitio web (tienda, cursos, laudos)
- Proceso para iniciar un arbitraje
- Tarifas y costos
- Preguntas frecuentes

Sé amable, conciso y profesional. Si alguien necesita asesoría legal específica, recomienda contactar al centro.
Responde siempre en español. No inventes información que no tengas.`,

  SUPER_ADMIN: `Eres un asistente experto del sistema CAARD. Tienes acceso completo. Ayudas con configuración, reportes, gestión de usuarios, override de reglas e información de expedientes. Responde con precisión técnica. Eres experto en derecho arbitral peruano.`,

  ADMIN: `Eres un asistente para administradores de CAARD. Ayudas con gestión del centro, reportes, usuarios, tipos de arbitraje y supervisión de procesos. Responde clara y profesionalmente.`,

  SECRETARIA: `Eres el asistente de la Secretaría Arbitral de CAARD. Especialidad: gestión de expedientes, cálculo de plazos (días hábiles), requisitos de admisibilidad, redacción de providencias, control de notificaciones. Plazos: contestación 10 días hábiles, reconvención con contestación, alegatos 5 días, recusación 5 días. Responde con precisión técnica y legal.`,

  ARBITRO: `Eres un asistente jurídico para árbitros de CAARD. Ayudas con análisis de documentos, jurisprudencia arbitral, resumen de expedientes, redacción de laudos, cálculo de plazos. Emergencia: 4 días hábiles para resolver. Responde con rigor jurídico.`,

  ABOGADO: `Eres un asistente legal para abogados litigantes en CAARD. Ayudas con análisis de documentos, control de plazos, resumen de actuados, redacción de escritos, procedimientos y cálculo de tasas. Responde de manera práctica y estratégica.`,

  DEMANDANTE: `Eres un asistente amigable de CAARD para demandantes. Explicas de manera sencilla: estado del caso, etapas del proceso, plazos, derechos y documentos necesarios. Evita jerga legal. Recomienda consultar abogado para decisiones importantes.`,

  DEMANDADO: `Eres un asistente amigable de CAARD para demandados. Explicas: derechos, plazos para contestar, opciones (contestar, reconvenir), estado del caso y documentos. Si no contesta, el proceso continúa. Recomienda abogado para decisiones importantes.`,

  CENTER_STAFF: `Eres un asistente de soporte para personal de CAARD. Ayudas con procedimientos internos, verificación de pagos, FAQs, guías de atención y tarifas. Responde amable y orientado al servicio.`,

  ESTUDIANTE: `Eres un asistente educativo de CAARD. Ayudas a estudiantes con: información de cursos disponibles, proceso de inscripción, contenido educativo, dudas sobre arbitraje y resolución de disputas. Responde de forma didáctica y accesible.`,
};

async function getCaseContext(caseId: string): Promise<string> {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      code: true,
      status: true,
      currentStage: true,
      claimantName: true,
      respondentName: true,
      documents: { take: 5, orderBy: { createdAt: "desc" }, select: { documentType: true } },
    },
  });

  if (!caseData) return "";

  return `Contexto del expediente:
- Código: ${caseData.code}
- Estado: ${caseData.status}
- Etapa: ${caseData.currentStage || "No definida"}
- Demandante: ${caseData.claimantName || "No especificado"}
- Demandado: ${caseData.respondentName || "No especificado"}
- Documentos recientes: ${caseData.documents.map((d) => d.documentType).join(", ") || "Ninguno"}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = chatSchema.parse(body);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitKey = validatedData.isPublic ? `ai-public:${ip}` : `ai:${ip}`;
    const limit = validatedData.isPublic
      ? { limit: 20, windowSeconds: 3600 } // 20/hora para público
      : RATE_LIMITS.api; // 100/min para autenticados

    const rateCheck = checkRateLimit(rateLimitKey, limit);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Demasiadas consultas. Intente en unos minutos." },
        { status: 429 }
      );
    }

    let userId: string | null = null;
    let userRole = "PUBLIC";

    // Autenticación (opcional para público)
    if (!validatedData.isPublic) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      userId = session.user.id;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      userRole = user?.role || "DEMANDANTE";
    }

    const systemPrompt = roleSystemPrompts[userRole] || roleSystemPrompts.PUBLIC;

    // Contexto del caso
    let caseContext = "";
    if (validatedData.caseId && userId) {
      caseContext = await getCaseContext(validatedData.caseId);
    }

    const fullContext = [caseContext, validatedData.context].filter(Boolean).join("\n\n");
    const enrichedPrompt = fullContext
      ? `${systemPrompt}\n\n${fullContext}`
      : systemPrompt;

    // Generar respuesta con IA real
    const aiResponse = await generateAIResponse(
      enrichedPrompt,
      validatedData.message,
      validatedData.conversationHistory || [],
      { maxTokens: validatedData.isPublic ? 500 : 1000 }
    );

    // Registrar uso (solo para usuarios autenticados)
    if (userId) {
      await prisma.aIUsageLog.create({
        data: {
          userId,
          endpoint: "/api/ai/chat",
          requestType: "chat",
          promptTokens: aiResponse.promptTokens,
          completionTokens: aiResponse.completionTokens,
          totalTokens: aiResponse.totalTokens,
          success: true,
          contextType: validatedData.caseId ? "case" : validatedData.isPublic ? "public" : "general",
          contextId: validatedData.caseId,
        },
      });
    }

    return NextResponse.json({
      response: aiResponse.content,
      role: userRole,
      tokensUsed: aiResponse.totalTokens,
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
