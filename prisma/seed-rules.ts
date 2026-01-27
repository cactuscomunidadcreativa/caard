/**
 * CAARD - Seed de Configuración del Sistema de Reglas
 * =====================================================
 * Inicializa la configuración base del sistema de reglas según
 * la Matriz Maestra de Reglas de Control.
 *
 * Ejecutar con: npx tsx prisma/seed-rules.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================================================
// CONFIGURACIÓN DE TASAS Y ARANCELES
// =============================================================================

const FEES_CONFIG = [
  // Tasas Nacionales
  {
    scope: "NACIONAL",
    concept: "TASA_PRESENTACION",
    name: "Tasa de Presentación - Nacional",
    description: "Tasa de presentación de solicitud arbitral para arbitraje nacional",
    amountCents: 50000, // S/ 500.00
    currency: "PEN",
    includesIGV: false, // Se agrega aparte
    igvRate: 0.18,
  },
  {
    scope: "NACIONAL",
    concept: "TASA_EMERGENCIA",
    name: "Tasa de Árbitro de Emergencia - Nacional",
    description: "Tasa para procedimiento de arbitraje de emergencia nacional",
    amountCents: 180000, // S/ 1,800.00
    currency: "PEN",
    includesIGV: false,
    igvRate: 0.18,
  },

  // Tasas Internacionales
  {
    scope: "INTERNACIONAL",
    concept: "TASA_PRESENTACION",
    name: "Tasa de Presentación - Internacional",
    description: "Tasa de presentación de solicitud arbitral para arbitraje internacional",
    amountCents: 40000, // USD 400.00
    currency: "USD",
    includesIGV: false,
    igvRate: 0,
  },
  {
    scope: "INTERNACIONAL",
    concept: "TASA_EMERGENCIA",
    name: "Tasa de Árbitro de Emergencia - Internacional",
    description: "Tasa para procedimiento de arbitraje de emergencia internacional",
    amountCents: 150000, // USD 1,500.00
    currency: "USD",
    includesIGV: false,
    igvRate: 0,
  },
];

// =============================================================================
// CONFIGURACIÓN DE PLAZOS
// =============================================================================

const DEADLINE_CONFIG = [
  // Plazos para arbitraje NACIONAL REGULAR
  {
    scope: "NACIONAL",
    procedureType: "REGULAR",
    deadlineType: "PAYMENT",
    name: "Pago de Gastos Administrativos",
    description: "Plazo para completar el pago de tasas y gastos administrativos",
    businessDays: 10,
    onOverdueAction: {
      type: "SUSPEND",
      changeStateTo: "SUSPENDED",
      notifyRoles: ["DEMANDANTE", "DEMANDADO", "SECRETARIA"],
      message: "El expediente ha sido suspendido por falta de pago.",
    },
    reminderDays: [3, 1, 0],
  },
  {
    scope: "NACIONAL",
    procedureType: "REGULAR",
    deadlineType: "CONTESTACION",
    name: "Contestación de Demanda",
    description: "Plazo para presentar contestación de demanda",
    businessDays: 20,
    onOverdueAction: {
      type: "NOTIFY",
      notifyRoles: ["DEMANDADO", "SECRETARIA", "ARBITRO"],
      message: "El plazo para contestar la demanda ha vencido.",
    },
    reminderDays: [5, 2, 0],
  },
  {
    scope: "NACIONAL",
    procedureType: "REGULAR",
    deadlineType: "RECONVENCION",
    name: "Presentación de Reconvención",
    description: "Plazo para presentar reconvención",
    businessDays: 20,
    onOverdueAction: {
      type: "NOTIFY",
      notifyRoles: ["DEMANDADO", "SECRETARIA"],
      message: "El plazo para presentar reconvención ha vencido.",
    },
    reminderDays: [5, 2, 0],
  },
  {
    scope: "NACIONAL",
    procedureType: "REGULAR",
    deadlineType: "RECUSACION_ABSOLUCION",
    name: "Absolución de Recusación",
    description: "Plazo para absolver traslado de recusación",
    businessDays: 5,
    onOverdueAction: {
      type: "ESCALATE",
      notifyRoles: ["SECRETARIA", "ADMIN"],
      message: "El plazo para absolver la recusación ha vencido. El Consejo decidirá.",
    },
    reminderDays: [2, 1, 0],
  },
  {
    scope: "NACIONAL",
    procedureType: "REGULAR",
    deadlineType: "DESIGNACION_ARBITRO",
    name: "Designación de Árbitro por las Partes",
    description: "Plazo para que las partes designen árbitro",
    businessDays: 15,
    onOverdueAction: {
      type: "ESCALATE",
      notifyRoles: ["SECRETARIA", "ADMIN"],
      message: "El plazo para designación de árbitro ha vencido. El Consejo procederá a designar.",
    },
    reminderDays: [5, 2, 0],
  },

  // Plazos para ARBITRAJE DE EMERGENCIA
  {
    scope: "NACIONAL",
    procedureType: "EMERGENCY",
    deadlineType: "EMERGENCY_VERIFICATION",
    name: "Verificación Formal de Emergencia",
    description: "Plazo máximo para verificación formal de solicitud de emergencia",
    businessDays: 1,
    onOverdueAction: {
      type: "NOTIFY",
      notifyRoles: ["SECRETARIA", "ADMIN"],
      message: "ALERTA: El plazo de verificación de emergencia está venciendo.",
    },
    reminderDays: [0],
  },
  {
    scope: "NACIONAL",
    procedureType: "EMERGENCY",
    deadlineType: "EMERGENCY_PAYMENT",
    name: "Subsanación y Pago de Emergencia",
    description: "Plazo para subsanar observaciones y pagar tasa de emergencia",
    businessDays: 1,
    onOverdueAction: {
      type: "AUTO_REJECT",
      changeStateTo: "ARCHIVED",
      notifyRoles: ["DEMANDANTE", "SECRETARIA"],
      message: "La solicitud de emergencia ha sido archivada por falta de subsanación o pago.",
    },
    reminderDays: [0],
  },
  {
    scope: "NACIONAL",
    procedureType: "EMERGENCY",
    deadlineType: "EMERGENCY_DESIGNATION",
    name: "Designación de Árbitro de Emergencia",
    description: "Plazo para que el Consejo designe árbitro de emergencia",
    businessDays: 4,
    onOverdueAction: {
      type: "ESCALATE",
      notifyRoles: ["ADMIN", "SUPER_ADMIN"],
      message: "CRÍTICO: El plazo para designar árbitro de emergencia ha vencido.",
    },
    reminderDays: [1, 0],
  },
  {
    scope: "NACIONAL",
    procedureType: "EMERGENCY",
    deadlineType: "EMERGENCY_RESOLUTION",
    name: "Resolución de Árbitro de Emergencia",
    description: "Plazo para que el árbitro de emergencia emita resolución",
    businessDays: 4,
    onOverdueAction: {
      type: "ESCALATE",
      notifyRoles: ["SECRETARIA", "ADMIN"],
      message: "ALERTA: El plazo de resolución de emergencia está vencido.",
    },
    reminderDays: [1, 0],
  },
  {
    scope: "NACIONAL",
    procedureType: "EMERGENCY",
    deadlineType: "EMERGENCY_PRINCIPAL_REQUEST",
    name: "Presentación de Solicitud Principal",
    description: "Plazo para presentar solicitud arbitral principal tras medida de emergencia",
    businessDays: 15,
    onOverdueAction: {
      type: "EXPIRE_EMERGENCY",
      changeStateTo: "EXPIRED",
      notifyRoles: ["DEMANDANTE", "SECRETARIA"],
      message: "La medida de emergencia ha caducado por no presentar la solicitud principal.",
    },
    reminderDays: [5, 2, 1, 0],
  },
];

// =============================================================================
// TABLA DE DEVOLUCIONES POR ETAPA
// =============================================================================

const REFUND_RATES = [
  { stage: "DEMANDA", stageName: "Etapa de Demanda", stageOrder: 1, refundPercentage: 96 },
  { stage: "CONTESTACION", stageName: "Etapa de Contestación", stageOrder: 2, refundPercentage: 93 },
  { stage: "RECONVENCION", stageName: "Etapa de Reconvención", stageOrder: 3, refundPercentage: 90 },
  { stage: "PROBATORIA", stageName: "Etapa Probatoria", stageOrder: 4, refundPercentage: 55 },
  { stage: "AUDIENCIA_PRUEBAS", stageName: "Audiencia de Pruebas", stageOrder: 5, refundPercentage: 40 },
  { stage: "INFORMES_ORALES", stageName: "Informes Orales", stageOrder: 6, refundPercentage: 25 },
  { stage: "LAUDO", stageName: "Laudo", stageOrder: 7, refundPercentage: 0 },
];

// =============================================================================
// FERIADOS DE PERÚ 2024-2030
// =============================================================================

const HOLIDAYS_PERU = [
  // Feriados fijos (se repiten cada año)
  { month: 1, day: 1, name: "Año Nuevo", isRecurring: true },
  { month: 5, day: 1, name: "Día del Trabajo", isRecurring: true },
  { month: 6, day: 29, name: "San Pedro y San Pablo", isRecurring: true },
  { month: 7, day: 28, name: "Fiestas Patrias", isRecurring: true },
  { month: 7, day: 29, name: "Fiestas Patrias", isRecurring: true },
  { month: 8, day: 6, name: "Batalla de Junín", isRecurring: true },
  { month: 8, day: 30, name: "Santa Rosa de Lima", isRecurring: true },
  { month: 10, day: 8, name: "Combate de Angamos", isRecurring: true },
  { month: 11, day: 1, name: "Día de Todos los Santos", isRecurring: true },
  { month: 12, day: 8, name: "Inmaculada Concepción", isRecurring: true },
  { month: 12, day: 9, name: "Batalla de Ayacucho", isRecurring: true },
  { month: 12, day: 25, name: "Navidad", isRecurring: true },

  // Semana Santa (varía cada año)
  { year: 2024, month: 3, day: 28, name: "Jueves Santo 2024" },
  { year: 2024, month: 3, day: 29, name: "Viernes Santo 2024" },
  { year: 2025, month: 4, day: 17, name: "Jueves Santo 2025" },
  { year: 2025, month: 4, day: 18, name: "Viernes Santo 2025" },
  { year: 2026, month: 4, day: 2, name: "Jueves Santo 2026" },
  { year: 2026, month: 4, day: 3, name: "Viernes Santo 2026" },
  { year: 2027, month: 3, day: 25, name: "Jueves Santo 2027" },
  { year: 2027, month: 3, day: 26, name: "Viernes Santo 2027" },
  { year: 2028, month: 4, day: 13, name: "Jueves Santo 2028" },
  { year: 2028, month: 4, day: 14, name: "Viernes Santo 2028" },
  { year: 2029, month: 3, day: 29, name: "Jueves Santo 2029" },
  { year: 2029, month: 3, day: 30, name: "Viernes Santo 2029" },
  { year: 2030, month: 4, day: 18, name: "Jueves Santo 2030" },
  { year: 2030, month: 4, day: 19, name: "Viernes Santo 2030" },
];

// =============================================================================
// REGLAS DEL SISTEMA
// =============================================================================

const SYSTEM_RULES = [
  // Regla: Suspender expediente por pago vencido
  {
    code: "PAYMENT_OVERDUE_SUSPEND",
    name: "Suspensión automática por pago vencido",
    description: "Suspende automáticamente el expediente cuando el plazo de pago vence",
    triggerType: "DEADLINE",
    triggerDeadlineType: "PAYMENT",
    conditions: [
      { field: "deadline.status", operator: "EQ", value: "OVERDUE" },
      { field: "case.status", operator: "NOT_IN", value: ["SUSPENDED", "CLOSED", "ARCHIVED"] },
    ],
    actions: [
      {
        type: "CHANGE_STATE",
        params: { newState: "SUSPENDED", reason: "Pago vencido - Suspensión automática" },
      },
      {
        type: "SEND_NOTIFICATION",
        params: { event: "PAYMENT_OVERDUE", channels: ["EMAIL", "SMS"] },
      },
      {
        type: "LOG",
        params: { action: "SYSTEM_AUTO_SUSPEND", message: "Expediente suspendido por pago vencido" },
      },
    ],
    priority: 100,
  },

  // Regla: Reactivar expediente al confirmar pago
  {
    code: "PAYMENT_CONFIRMED_REACTIVATE",
    name: "Reactivación automática por pago confirmado",
    description: "Reactiva el expediente cuando se confirma el pago pendiente",
    triggerType: "EVENT",
    triggerEvent: "PAYMENT_RECEIVED",
    conditions: [
      { field: "case.status", operator: "IN", value: ["AWAITING_PAYMENT", "PAYMENT_OVERDUE", "SUSPENDED"] },
      { field: "payment.status", operator: "EQ", value: "PAID" },
    ],
    actions: [
      {
        type: "CHANGE_STATE",
        params: { newState: "IN_PROCESS", reason: "Pago confirmado - Reactivación automática" },
      },
      {
        type: "SEND_NOTIFICATION",
        params: { event: "PAYMENT_RECEIVED", channels: ["EMAIL"] },
      },
      {
        type: "LOG",
        params: { action: "PAYMENT_RECEIVE", message: "Pago confirmado, expediente reactivado" },
      },
    ],
    priority: 90,
  },

  // Regla: Caducidad de medida de emergencia
  {
    code: "EMERGENCY_EXPIRE",
    name: "Caducidad de medida de emergencia",
    description: "Caduca la medida de emergencia si no se presenta solicitud principal",
    triggerType: "DEADLINE",
    triggerDeadlineType: "EMERGENCY_PRINCIPAL_REQUEST",
    conditions: [
      { field: "emergency.status", operator: "EQ", value: "PENDING_MAIN_CASE" },
      { field: "emergency.mainCaseId", operator: "NOT_EXISTS", value: null },
    ],
    actions: [
      {
        type: "CHANGE_STATE",
        params: { newState: "EXPIRED", reason: "No se presentó solicitud principal en plazo" },
      },
      {
        type: "SEND_NOTIFICATION",
        params: { event: "EMERGENCY_EXPIRED", channels: ["EMAIL", "SMS"] },
      },
      {
        type: "LOG",
        params: { action: "SYSTEM_RULE_TRIGGER", message: "Medida de emergencia caducada" },
      },
    ],
    priority: 100,
  },

  // Regla: Alerta por designación de árbitro de emergencia vencida
  {
    code: "EMERGENCY_DESIGNATION_OVERDUE_ALERT",
    name: "Alerta de designación de emergencia vencida",
    description: "Genera alerta crítica al Consejo cuando vence el plazo de designación",
    triggerType: "DEADLINE",
    triggerDeadlineType: "EMERGENCY_DESIGNATION",
    conditions: [
      { field: "emergency.status", operator: "IN", value: ["PENDING_DESIGNATION", "DESIGNATION_OVERDUE"] },
    ],
    actions: [
      {
        type: "SEND_NOTIFICATION",
        params: {
          event: "EMERGENCY_ARBITRATOR_DESIGNATED",
          channels: ["EMAIL", "SMS"],
          targetRoles: ["ADMIN", "SUPER_ADMIN"],
        },
      },
      {
        type: "LOG",
        params: { action: "SYSTEM_RULE_TRIGGER", message: "ALERTA CRÍTICA: Designación de árbitro de emergencia vencida" },
      },
    ],
    priority: 100,
  },

  // Regla: Bloquear actuaciones en estados bloqueados
  {
    code: "BLOCK_ACTIONS_SUSPENDED",
    name: "Bloquear actuaciones en expediente suspendido",
    description: "Impide cualquier actuación procesal en expedientes suspendidos",
    triggerType: "EVENT",
    triggerEvent: "DOCUMENT_UPLOADED",
    conditions: [
      { field: "case.status", operator: "IN", value: ["SUSPENDED", "PAYMENT_OVERDUE", "CLOSED", "ARCHIVED"] },
    ],
    actions: [
      {
        type: "BLOCK_CASE",
        params: { reason: "El expediente no admite actuaciones en su estado actual" },
      },
    ],
    priority: 200,
  },

  // Regla: Recordatorio de pago 3 días antes
  {
    code: "PAYMENT_REMINDER_3_DAYS",
    name: "Recordatorio de pago - 3 días",
    description: "Envía recordatorio de pago 3 días antes del vencimiento",
    triggerType: "CRON",
    triggerCron: "0 9 * * *", // Todos los días a las 9am
    conditions: [
      { field: "paymentOrder.status", operator: "EQ", value: "PENDING" },
      { field: "paymentOrder.daysUntilDue", operator: "EQ", value: 3 },
    ],
    actions: [
      {
        type: "SEND_NOTIFICATION",
        params: { event: "PAYMENT_REMINDER", channels: ["EMAIL"] },
      },
    ],
    priority: 50,
  },

  // Regla: Recordatorio urgente de pago 1 día antes
  {
    code: "PAYMENT_REMINDER_1_DAY",
    name: "Recordatorio urgente de pago - 1 día",
    description: "Envía recordatorio urgente de pago 1 día antes del vencimiento",
    triggerType: "CRON",
    triggerCron: "0 9 * * *",
    conditions: [
      { field: "paymentOrder.status", operator: "EQ", value: "PENDING" },
      { field: "paymentOrder.daysUntilDue", operator: "EQ", value: 1 },
    ],
    actions: [
      {
        type: "SEND_NOTIFICATION",
        params: { event: "PAYMENT_URGENT", channels: ["EMAIL", "SMS"] },
      },
    ],
    priority: 60,
  },
];

// =============================================================================
// FUNCIÓN PRINCIPAL DE SEED
// =============================================================================

async function seedRulesConfig() {
  console.log("🚀 Iniciando seed de configuración del sistema de reglas...\n");

  // Obtener el centro por defecto (CAARD)
  const center = await prisma.center.findFirst({
    where: { code: "CAARD" },
  });

  if (!center) {
    console.log("⚠️  No se encontró el centro CAARD. Creando...");
    const newCenter = await prisma.center.create({
      data: {
        code: "CAARD",
        name: "Centro de Arbitraje CAARD",
        legalName: "Centro de Arbitraje y Resolución de Disputas",
        primaryColorHex: "#0B2A5B",
        accentColorHex: "#D66829",
        neutralColorHex: "#9A9A9E",
      },
    });
    console.log(`✅ Centro CAARD creado: ${newCenter.id}\n`);
  }

  const centerId = center?.id || (await prisma.center.findFirst())?.id;

  if (!centerId) {
    throw new Error("No se pudo obtener o crear el centro");
  }

  console.log(`📍 Usando centro: ${centerId}\n`);

  // Nota: Los siguientes modelos requieren que se agreguen al schema.prisma
  // Por ahora, solo mostraremos lo que se crearía

  console.log("📋 CONFIGURACIÓN DE TASAS A CREAR:");
  console.log("─".repeat(60));
  for (const fee of FEES_CONFIG) {
    const total = fee.includesIGV ? fee.amountCents : fee.amountCents * (1 + fee.igvRate);
    console.log(`  ${fee.scope} - ${fee.concept}`);
    console.log(`    ${fee.name}`);
    console.log(`    Base: ${fee.currency} ${(fee.amountCents / 100).toFixed(2)}`);
    console.log(`    Total (con IGV): ${fee.currency} ${(total / 100).toFixed(2)}`);
    console.log("");
  }

  console.log("\n📅 CONFIGURACIÓN DE PLAZOS A CREAR:");
  console.log("─".repeat(60));
  for (const deadline of DEADLINE_CONFIG) {
    console.log(`  ${deadline.scope} ${deadline.procedureType} - ${deadline.deadlineType}`);
    console.log(`    ${deadline.name}`);
    console.log(`    Días hábiles: ${deadline.businessDays}`);
    console.log(`    Acción al vencer: ${deadline.onOverdueAction.type}`);
    console.log("");
  }

  console.log("\n💰 TABLA DE DEVOLUCIONES:");
  console.log("─".repeat(60));
  console.log("  Etapa".padEnd(25) + "Devolución");
  console.log("─".repeat(60));
  for (const rate of REFUND_RATES) {
    console.log(`  ${rate.stageName.padEnd(25)}${rate.refundPercentage}%`);
  }

  console.log("\n\n📅 FERIADOS A CREAR:");
  console.log("─".repeat(60));
  console.log(`  Total: ${HOLIDAYS_PERU.length} feriados (2024-2030)`);
  const recurring = HOLIDAYS_PERU.filter(h => h.isRecurring);
  const variable = HOLIDAYS_PERU.filter(h => !h.isRecurring);
  console.log(`  - Recurrentes: ${recurring.length}`);
  console.log(`  - Variables (Semana Santa): ${variable.length}`);

  console.log("\n\n⚙️ REGLAS DEL SISTEMA A CREAR:");
  console.log("─".repeat(60));
  for (const rule of SYSTEM_RULES) {
    console.log(`  [${rule.code}] ${rule.name}`);
    console.log(`    Trigger: ${rule.triggerType}`);
    console.log(`    Prioridad: ${rule.priority}`);
    console.log("");
  }

  console.log("\n" + "═".repeat(60));
  console.log("⚠️  NOTA: Para aplicar esta configuración a la base de datos,");
  console.log("   primero debe agregar los modelos de schema-rules.prisma");
  console.log("   al archivo schema.prisma principal y ejecutar:");
  console.log("   npx prisma migrate dev --name add_rules_system");
  console.log("═".repeat(60));

  console.log("\n✅ Seed de configuración completado (solo visualización)");
}

// Ejecutar
seedRulesConfig()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
