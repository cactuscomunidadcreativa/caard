/**
 * CAARD - Triggers automáticos por cambio de etapa/status
 *
 * Cuando un caso cambia de etapa o status, este módulo:
 * 1. Crea los plazos procesales correspondientes
 * 2. Registra el historial de cambio
 * 3. Puede bloquear el caso si hay pagos pendientes
 *
 * Se llama desde PATCH /api/cases/[id] después de actualizar.
 */
import { prisma } from "./prisma";
import { PLAZOS_REGULARES, PLAZOS_EMERGENCIA, type PlazoReglamentario } from "./fees/caard-plazos";
import { calculateDeadline } from "./rules";

type Stage = string;
type Status = string;

interface TriggerContext {
  caseId: string;
  previousStage?: Stage | null;
  newStage?: Stage | null;
  previousStatus?: Status | null;
  newStatus?: Status | null;
  procedureType: string;
  userId?: string;
}

/**
 * Mapeo: cuando se entra a una etapa, qué plazos se crean
 */
const STAGE_PLAZOS: Record<string, string[]> = {
  // Al admitir → contestación + pago + designación
  DEMANDA: ["PAYMENT", "CONTESTACION", "DESIGNACION_ARBITRO"],
  // Al contestar → reconvención
  CONTESTACION: ["RECONVENCION", "CONTESTACION_RECONVENCION"],
  // Reconvención → contestación de reconvención
  RECONVENCION: ["CONTESTACION_RECONVENCION"],
  // Probatoria → (los plazos los pone el tribunal)
  PROBATORIA: [],
  // Audiencia
  AUDIENCIA_PRUEBAS: [],
  // Alegatos
  INFORMES_ORALES: ["ALEGATOS"],
  // Laudo → emisión de laudo
  LAUDO: [],
};

/**
 * Mapeo: cuando el status cambia, qué plazos se crean
 */
const STATUS_PLAZOS: Record<string, string[]> = {
  ADMITTED: ["PAYMENT", "CONTESTACION", "DESIGNACION_ARBITRO"],
  IN_PROCESS: [],
  CLOSED: [],
};

/**
 * Ejecuta los triggers después de un cambio de etapa o status.
 * Es idempotente: no crea plazos duplicados.
 */
export async function executeStageTriggers(ctx: TriggerContext): Promise<{
  plazosCreated: number;
  historyLogged: boolean;
}> {
  let plazosCreated = 0;

  const isEmergency = ctx.procedureType === "EMERGENCY";
  const allPlazos = isEmergency ? PLAZOS_EMERGENCIA : PLAZOS_REGULARES;

  // Determinar qué plazos crear
  const plazoTypes = new Set<string>();

  if (ctx.newStage && ctx.newStage !== ctx.previousStage) {
    const types = STAGE_PLAZOS[ctx.newStage] || [];
    types.forEach((t) => plazoTypes.add(t));
  }

  if (ctx.newStatus && ctx.newStatus !== ctx.previousStatus) {
    const types = STATUS_PLAZOS[ctx.newStatus] || [];
    types.forEach((t) => plazoTypes.add(t));
  }

  // Crear plazos que no existan aún
  for (const plazoType of plazoTypes) {
    const plazo = allPlazos.find((p) => p.type === plazoType);
    if (!plazo) continue;

    // Check si ya existe este tipo de plazo activo para este caso
    const existing = await prisma.processDeadline.findFirst({
      where: {
        caseId: ctx.caseId,
        type: plazo.type as any,
        status: { in: ["ACTIVE", "EXTENDED"] },
      },
    });
    if (existing) continue;

    try {
      const now = new Date();
      const result = calculateDeadline(now, plazo.businessDays, "America/Lima");
      await prisma.processDeadline.create({
        data: {
          caseId: ctx.caseId,
          type: plazo.type as any,
          title: plazo.title,
          description: `${plazo.description} (Ref: ${plazo.source})`,
          startsAt: now,
          businessDays: plazo.businessDays,
          dueAt: result.dueDate,
          timezone: "America/Lima",
          status: "ACTIVE",
          onOverdueAction: plazo.onOverdueAction || "NOTIFY",
          notifyRoles: ["SECRETARIA", "ADMIN"],
        },
      });
      plazosCreated++;
    } catch (e: any) {
      console.warn(`trigger plazo ${plazo.type} for ${ctx.caseId}: ${e.message}`);
    }
  }

  // Registrar historial de cambio
  let historyLogged = false;
  try {
    if (ctx.newStage !== ctx.previousStage || ctx.newStatus !== ctx.previousStatus) {
      await prisma.caseStageHistory.create({
        data: {
          caseId: ctx.caseId,
          fromStage: ctx.previousStage as any,
          toStage: ctx.newStage as any,
          fromStatus: ctx.previousStatus as any,
          toStatus: ctx.newStatus as any,
          reason: `Cambio automático: ${ctx.previousStage || ctx.previousStatus} → ${ctx.newStage || ctx.newStatus}`,
          triggeredBy: ctx.userId ? "USER" : "SYSTEM",
          userId: ctx.userId,
        },
      });
      historyLogged = true;
    }
  } catch (e: any) {
    console.warn("stage history log:", e.message);
  }

  return { plazosCreated, historyLogged };
}
