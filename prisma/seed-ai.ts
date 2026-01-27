/**
 * CAARD - Seed de Modelos y Asistentes de IA
 * Ejecutar: npx ts-node prisma/seed-ai.ts
 */

import { PrismaClient, AIProvider, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Modelos de IA populares con sus costos actualizados
const AI_MODELS = [
  // OpenAI
  {
    provider: AIProvider.OPENAI,
    modelId: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Modelo más capaz de OpenAI, ideal para tareas complejas",
    inputCostPer1k: 1, // $0.01 por 1K tokens
    outputCostPer1k: 3, // $0.03 por 1K tokens
    maxTokens: 4096,
    maxContextWindow: 128000,
    isActive: true,
    isDefault: true,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.OPENAI,
    modelId: "gpt-4o",
    name: "GPT-4o",
    description: "Modelo multimodal más reciente de OpenAI",
    inputCostPer1k: 0.5, // $0.005 por 1K tokens
    outputCostPer1k: 1.5, // $0.015 por 1K tokens
    maxTokens: 4096,
    maxContextWindow: 128000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.OPENAI,
    modelId: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Versión económica de GPT-4o, buena relación costo-beneficio",
    inputCostPer1k: 0.015, // $0.00015 por 1K tokens
    outputCostPer1k: 0.06, // $0.0006 por 1K tokens
    maxTokens: 4096,
    maxContextWindow: 128000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  // Anthropic
  {
    provider: AIProvider.ANTHROPIC,
    modelId: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    description: "Modelo equilibrado de Anthropic, excelente para análisis legal",
    inputCostPer1k: 0.3, // $0.003 por 1K tokens
    outputCostPer1k: 1.5, // $0.015 por 1K tokens
    maxTokens: 8192,
    maxContextWindow: 200000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.ANTHROPIC,
    modelId: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Modelo más potente de Anthropic para tareas críticas",
    inputCostPer1k: 1.5, // $0.015 por 1K tokens
    outputCostPer1k: 7.5, // $0.075 por 1K tokens
    maxTokens: 4096,
    maxContextWindow: 200000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.ANTHROPIC,
    modelId: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    description: "Modelo económico y rápido de Anthropic",
    inputCostPer1k: 0.025, // $0.00025 por 1K tokens
    outputCostPer1k: 0.125, // $0.00125 por 1K tokens
    maxTokens: 4096,
    maxContextWindow: 200000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  // Google Gemini
  {
    provider: AIProvider.GOOGLE,
    modelId: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Modelo más reciente de Google, rápido y multimodal con capacidades avanzadas",
    inputCostPer1k: 0.01, // $0.0001 por 1K tokens
    outputCostPer1k: 0.04, // $0.0004 por 1K tokens
    maxTokens: 8192,
    maxContextWindow: 1000000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.GOOGLE,
    modelId: "gemini-2.0-flash-thinking",
    name: "Gemini 2.0 Flash Thinking",
    description: "Versión con razonamiento explícito para tareas complejas",
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.04,
    maxTokens: 8192,
    maxContextWindow: 1000000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.GOOGLE,
    modelId: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Modelo avanzado de Google con contexto ultra-largo de 1M tokens",
    inputCostPer1k: 0.125, // $0.00125 por 1K tokens
    outputCostPer1k: 0.5, // $0.005 por 1K tokens
    maxTokens: 8192,
    maxContextWindow: 1000000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.GOOGLE,
    modelId: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Modelo rápido y económico de Google, ideal para alto volumen",
    inputCostPer1k: 0.0075, // $0.000075 por 1K tokens
    outputCostPer1k: 0.03, // $0.0003 por 1K tokens
    maxTokens: 8192,
    maxContextWindow: 1000000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  {
    provider: AIProvider.GOOGLE,
    modelId: "gemini-1.5-flash-8b",
    name: "Gemini 1.5 Flash 8B",
    description: "Versión compacta ultra-rápida, más económica",
    inputCostPer1k: 0.00375, // Más económico
    outputCostPer1k: 0.015,
    maxTokens: 8192,
    maxContextWindow: 1000000,
    isActive: true,
    isDefault: false,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
];

// Asistentes predefinidos para el contexto de arbitraje
const AI_ASSISTANTS = [
  {
    name: "Asistente Legal General",
    description: "Asistente para consultas legales generales sobre arbitraje",
    slug: "legal-general",
    systemPrompt: `Eres un asistente legal especializado en arbitraje en Perú. Tu rol es ayudar a los usuarios con:
- Consultas sobre procedimientos arbitrales
- Explicación de términos legales
- Guía sobre documentación requerida
- Información sobre plazos y etapas del proceso

Importante:
- Siempre recuerda que no puedes dar asesoría legal vinculante
- Recomienda consultar con un abogado para casos específicos
- Mantén un tono profesional pero accesible
- Cita la normativa peruana cuando sea relevante (Ley de Arbitraje - D.L. 1071)`,
    welcomeMessage: "Hola, soy el asistente legal de CAARD. ¿En qué puedo ayudarte hoy con tu consulta sobre arbitraje?",
    temperature: 0.3,
    maxTokens: 2048,
    allowedContexts: ["general", "cases"],
    isActive: true,
  },
  {
    name: "Revisor de Documentos",
    description: "Asistente para revisar y analizar documentos arbitrales",
    slug: "doc-reviewer",
    systemPrompt: `Eres un asistente especializado en revisión de documentos para procesos arbitrales. Tu rol es:
- Analizar documentos legales cargados
- Identificar elementos faltantes o inconsistencias
- Sugerir mejoras en la redacción
- Verificar cumplimiento de requisitos formales

Guías:
- Revisa estructura, claridad y completitud
- Señala posibles problemas de forma constructiva
- Sugiere mejoras específicas cuando sea posible
- Mantén confidencialidad absoluta de la información`,
    welcomeMessage: "Soy el asistente de revisión de documentos. Puedo ayudarte a analizar tus documentos arbitrales. ¿Qué documento te gustaría revisar?",
    temperature: 0.2,
    maxTokens: 4096,
    allowedContexts: ["documents", "cases"],
    isActive: true,
  },
  {
    name: "Asistente de Secretaría",
    description: "Asistente para tareas administrativas de secretaría",
    slug: "secretaria-assistant",
    systemPrompt: `Eres un asistente administrativo para la secretaría del centro de arbitraje. Tu rol es ayudar con:
- Gestión de expedientes y casos
- Seguimiento de plazos y notificaciones
- Coordinación de audiencias
- Respuesta a consultas de las partes

Directrices:
- Sé preciso con fechas y plazos
- Mantén registro de las acciones sugeridas
- Prioriza la eficiencia administrativa
- Respeta los procedimientos establecidos`,
    welcomeMessage: "Hola, soy el asistente de secretaría. ¿Cómo puedo ayudarte con la gestión administrativa hoy?",
    temperature: 0.4,
    maxTokens: 2048,
    allowedContexts: ["cases", "admin"],
    isActive: true,
  },
  {
    name: "Asistente del Árbitro",
    description: "Asistente para árbitros en la gestión de casos",
    slug: "arbitro-assistant",
    systemPrompt: `Eres un asistente especializado para árbitros. Tu rol es ayudar con:
- Análisis de argumentos de las partes
- Resumen de expedientes complejos
- Investigación de jurisprudencia y normativa
- Preparación de resoluciones y laudos

Importante:
- Mantén imparcialidad absoluta
- Presenta información objetiva
- No tomes posición sobre el fondo del caso
- Facilita el análisis pero no decides`,
    welcomeMessage: "Soy su asistente de arbitraje. Puedo ayudarle a analizar expedientes, investigar jurisprudencia o preparar documentos. ¿En qué puedo asistirle?",
    temperature: 0.3,
    maxTokens: 4096,
    allowedContexts: ["cases", "documents"],
    isActive: true,
  },
];

// Configuración por rol
const ROLE_CONFIGS = [
  // Super Admin - acceso total
  {
    role: Role.SUPER_ADMIN,
    modelSlug: "gpt-4-turbo",
    assistantSlug: "legal-general",
    maxRequestsPerDay: null, // Sin límite
    maxTokensPerDay: null,
    maxTokensPerMonth: null,
    isActive: true,
    priority: 10,
  },
  {
    role: Role.SUPER_ADMIN,
    modelSlug: "claude-3-5-sonnet-20241022",
    assistantSlug: "doc-reviewer",
    maxRequestsPerDay: null,
    maxTokensPerDay: null,
    maxTokensPerMonth: null,
    isActive: true,
    priority: 9,
  },
  // Secretaría
  {
    role: Role.SECRETARIA,
    modelSlug: "gpt-4o-mini",
    assistantSlug: "secretaria-assistant",
    maxRequestsPerDay: 100,
    maxTokensPerDay: 50000,
    maxTokensPerMonth: 500000,
    isActive: true,
    priority: 10,
  },
  {
    role: Role.SECRETARIA,
    modelSlug: "claude-3-haiku-20240307",
    assistantSlug: "doc-reviewer",
    maxRequestsPerDay: 50,
    maxTokensPerDay: 30000,
    maxTokensPerMonth: 300000,
    isActive: true,
    priority: 8,
  },
  // Árbitro
  {
    role: Role.ARBITRO,
    modelSlug: "claude-3-5-sonnet-20241022",
    assistantSlug: "arbitro-assistant",
    maxRequestsPerDay: 50,
    maxTokensPerDay: 100000,
    maxTokensPerMonth: 1000000,
    isActive: true,
    priority: 10,
  },
  {
    role: Role.ARBITRO,
    modelSlug: "gpt-4-turbo",
    assistantSlug: "doc-reviewer",
    maxRequestsPerDay: 30,
    maxTokensPerDay: 50000,
    maxTokensPerMonth: 500000,
    isActive: true,
    priority: 9,
  },
  // Demandante
  {
    role: Role.DEMANDANTE,
    modelSlug: "gpt-4o-mini",
    assistantSlug: "legal-general",
    maxRequestsPerDay: 20,
    maxTokensPerDay: 10000,
    maxTokensPerMonth: 100000,
    isActive: true,
    priority: 10,
  },
  // Demandado
  {
    role: Role.DEMANDADO,
    modelSlug: "gpt-4o-mini",
    assistantSlug: "legal-general",
    maxRequestsPerDay: 20,
    maxTokensPerDay: 10000,
    maxTokensPerMonth: 100000,
    isActive: true,
    priority: 10,
  },
];

async function seedAI() {
  console.log("🤖 Iniciando seed de IA...");

  // 1. Crear modelos de IA
  console.log("\n📦 Creando modelos de IA...");
  for (const model of AI_MODELS) {
    const existing = await prisma.aIModel.findUnique({
      where: {
        provider_modelId: {
          provider: model.provider,
          modelId: model.modelId,
        },
      },
    });

    if (existing) {
      await prisma.aIModel.update({
        where: { id: existing.id },
        data: model,
      });
      console.log(`  ✓ Actualizado: ${model.name}`);
    } else {
      await prisma.aIModel.create({ data: model });
      console.log(`  + Creado: ${model.name}`);
    }
  }

  // 2. Crear asistentes
  console.log("\n🤖 Creando asistentes de IA...");
  for (const assistant of AI_ASSISTANTS) {
    const existing = await prisma.aIAssistant.findUnique({
      where: { slug: assistant.slug },
    });

    if (existing) {
      await prisma.aIAssistant.update({
        where: { id: existing.id },
        data: assistant,
      });
      console.log(`  ✓ Actualizado: ${assistant.name}`);
    } else {
      await prisma.aIAssistant.create({ data: assistant });
      console.log(`  + Creado: ${assistant.name}`);
    }
  }

  // 3. Crear configuraciones por rol
  console.log("\n⚙️ Configurando modelos por rol...");
  for (const config of ROLE_CONFIGS) {
    const model = await prisma.aIModel.findFirst({
      where: { modelId: config.modelSlug },
    });

    const assistant = await prisma.aIAssistant.findUnique({
      where: { slug: config.assistantSlug },
    });

    if (!model) {
      console.log(`  ⚠ Modelo no encontrado: ${config.modelSlug}`);
      continue;
    }

    const existing = await prisma.aIRoleModel.findFirst({
      where: {
        role: config.role,
        modelId: model.id,
        assistantId: assistant?.id || null,
      },
    });

    const roleConfig = {
      role: config.role,
      modelId: model.id,
      assistantId: assistant?.id || null,
      maxRequestsPerDay: config.maxRequestsPerDay,
      maxTokensPerDay: config.maxTokensPerDay,
      maxTokensPerMonth: config.maxTokensPerMonth,
      isActive: config.isActive,
      priority: config.priority,
    };

    if (existing) {
      await prisma.aIRoleModel.update({
        where: { id: existing.id },
        data: roleConfig,
      });
      console.log(`  ✓ Actualizado: ${config.role} -> ${config.modelSlug}`);
    } else {
      await prisma.aIRoleModel.create({ data: roleConfig });
      console.log(`  + Creado: ${config.role} -> ${config.modelSlug}`);
    }
  }

  // 4. Crear cuota del sistema
  console.log("\n📊 Configurando cuotas del sistema...");
  const existingQuota = await prisma.aISystemQuota.findFirst({
    where: { isActive: true },
  });

  if (!existingQuota) {
    await prisma.aISystemQuota.create({
      data: {
        isActive: true,
        maxTotalTokensPerDay: 1000000, // 1M tokens por día
        maxTotalTokensPerMonth: 20000000, // 20M tokens por mes
        maxTotalCostPerDay: 5000, // $50 por día
        maxTotalCostPerMonth: 100000, // $1000 por mes
        alertAtPercentage: 80,
        alertEmail: "admin@caardpe.com",
      },
    });
    console.log("  + Cuota del sistema creada");
  } else {
    console.log("  ✓ Cuota del sistema ya existe");
  }

  console.log("\n✅ Seed de IA completado exitosamente!");
}

seedAI()
  .catch((e) => {
    console.error("❌ Error en seed de IA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
