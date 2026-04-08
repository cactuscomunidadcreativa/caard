/**
 * CAARD - Motor de Pagos
 * =======================
 * Gestiona todas las reglas de pagos, tasas y devoluciones.
 *
 * REGLA PRINCIPAL:
 * El sistema exige obligatoriamente el pago de la tasa de presentación.
 * Dicha tasa es condición habilitante del proceso y no es reembolsable.
 *
 * Mientras el pago no se encuentre validado:
 * - El expediente no puede avanzar
 * - No puede asignarse árbitro
 * - No pueden generarse actuaciones procesales
 * - No puede notificarse admisión
 */

import {
  TASAS_NACIONAL,
  TASAS_INTERNACIONAL,
  PLAZOS_REGULAR,
  PLAZOS_EMERGENCIA,
  ETAPAS_PROCESALES,
  PAYMENT_CONCEPTS,
  PAYMENT_ORDER_STATUS,
  type PaymentConcept,
  type EtapaProcesal,
} from "./constants";

import type {
  ArbitrationType,
  FeeCalculation,
  RefundCalculation,
  PaymentOrder,
} from "./types";

import { addBusinessDays, isDeadlineOverdue } from "./business-days";
import {
  calculateCaardFees,
  type Scope,
  type TribunalMode,
  type ProcedureType,
} from "@/lib/fees/caard-tariffs";

// =============================================================================
// LIQUIDACIÓN OFICIAL — engine central CAARD (6 tablas oficiales)
// =============================================================================

/**
 * Devuelve honorarios del tribunal/árbitro + gastos del centro según el
 * reglamento oficial CAARD. Es la fuente de verdad para órdenes de pago,
 * liquidaciones, calculadora pública y admin.
 */
export function liquidateCase(params: {
  scope: Scope;
  tribunalMode: TribunalMode;
  procedureType?: ProcedureType;
  disputeAmount: number;
}) {
  return calculateCaardFees({
    scope: params.scope,
    mode: params.tribunalMode,
    procedureType: params.procedureType,
    amount: params.disputeAmount,
  });
}

// =============================================================================
// CÁLCULO DE TASAS
// =============================================================================

/**
 * Calcula la tasa de presentación según el tipo de arbitraje
 */
export function calculatePresentationFee(
  arbitrationType: ArbitrationType
): FeeCalculation {
  if (arbitrationType === "INTERNACIONAL") {
    return {
      baseFee: TASAS_INTERNACIONAL.PRESENTACION,
      igv: 0,
      totalFee: TASAS_INTERNACIONAL.PRESENTACION,
      currency: TASAS_INTERNACIONAL.CURRENCY,
      concept: PAYMENT_CONCEPTS.TASA_PRESENTACION,
      description: "Tasa de presentación de solicitud arbitral - Internacional",
    };
  }

  const baseFee = TASAS_NACIONAL.PRESENTACION;
  const igv = Math.round(baseFee * TASAS_NACIONAL.IGV_RATE);

  return {
    baseFee,
    igv,
    totalFee: baseFee + igv,
    currency: TASAS_NACIONAL.CURRENCY,
    concept: PAYMENT_CONCEPTS.TASA_PRESENTACION,
    description: "Tasa de presentación de solicitud arbitral - Nacional (incluye IGV)",
  };
}

/**
 * Calcula la tasa de árbitro de emergencia según el tipo de arbitraje
 */
export function calculateEmergencyFee(
  arbitrationType: ArbitrationType
): FeeCalculation {
  if (arbitrationType === "INTERNACIONAL") {
    return {
      baseFee: TASAS_INTERNACIONAL.ARBITRO_EMERGENCIA,
      igv: 0,
      totalFee: TASAS_INTERNACIONAL.ARBITRO_EMERGENCIA,
      currency: TASAS_INTERNACIONAL.CURRENCY,
      concept: PAYMENT_CONCEPTS.TASA_EMERGENCIA,
      description: "Tasa de árbitro de emergencia - Internacional",
    };
  }

  const baseFee = TASAS_NACIONAL.ARBITRO_EMERGENCIA;
  const igv = Math.round(baseFee * TASAS_NACIONAL.IGV_RATE);

  return {
    baseFee,
    igv,
    totalFee: baseFee + igv,
    currency: TASAS_NACIONAL.CURRENCY,
    concept: PAYMENT_CONCEPTS.TASA_EMERGENCIA,
    description: "Tasa de árbitro de emergencia - Nacional (incluye IGV)",
  };
}

/**
 * Calcula una tasa genérica con o sin IGV
 */
export function calculateFee(
  baseFeeInCents: number,
  currency: "PEN" | "USD",
  concept: PaymentConcept,
  description: string,
  applyIGV: boolean = true
): FeeCalculation {
  const igv = applyIGV && currency === "PEN"
    ? Math.round(baseFeeInCents * TASAS_NACIONAL.IGV_RATE)
    : 0;

  return {
    baseFee: baseFeeInCents,
    igv,
    totalFee: baseFeeInCents + igv,
    currency,
    concept,
    description,
  };
}

// =============================================================================
// CREACIÓN DE ÓRDENES DE PAGO
// =============================================================================

/**
 * Crea una orden de pago para tasa de presentación
 */
export function createPresentationPaymentOrder(
  caseId: string,
  arbitrationType: ArbitrationType,
  issuedAt: Date = new Date()
): Omit<PaymentOrder, "id"> {
  const feeCalculation = calculatePresentationFee(arbitrationType);
  const dueAt = addBusinessDays(issuedAt, PLAZOS_REGULAR.PAGO_GASTOS_ADMINISTRATIVOS);

  return {
    caseId,
    concept: feeCalculation.concept,
    description: feeCalculation.description,
    amountCents: feeCalculation.totalFee,
    currency: feeCalculation.currency,
    includesIGV: feeCalculation.igv > 0,
    igvAmountCents: feeCalculation.igv,
    issuedAt,
    dueAt,
    status: PAYMENT_ORDER_STATUS.PENDING,
  };
}

/**
 * Crea una orden de pago para arbitraje de emergencia
 */
export function createEmergencyPaymentOrder(
  caseId: string,
  arbitrationType: ArbitrationType,
  issuedAt: Date = new Date()
): Omit<PaymentOrder, "id"> {
  const feeCalculation = calculateEmergencyFee(arbitrationType);
  // En emergencia, el plazo es de 1 día hábil
  const dueAt = addBusinessDays(issuedAt, PLAZOS_EMERGENCIA.SUBSANACION_Y_PAGO);

  return {
    caseId,
    concept: feeCalculation.concept,
    description: feeCalculation.description,
    amountCents: feeCalculation.totalFee,
    currency: feeCalculation.currency,
    includesIGV: feeCalculation.igv > 0,
    igvAmountCents: feeCalculation.igv,
    issuedAt,
    dueAt,
    status: PAYMENT_ORDER_STATUS.PENDING,
  };
}

/**
 * Crea una orden de pago genérica
 */
export function createPaymentOrder(
  caseId: string,
  feeCalculation: FeeCalculation,
  businessDaysDue: number,
  issuedAt: Date = new Date(),
  metadata?: Record<string, unknown>
): Omit<PaymentOrder, "id"> {
  const dueAt = addBusinessDays(issuedAt, businessDaysDue);

  return {
    caseId,
    concept: feeCalculation.concept,
    description: feeCalculation.description,
    amountCents: feeCalculation.totalFee,
    currency: feeCalculation.currency,
    includesIGV: feeCalculation.igv > 0,
    igvAmountCents: feeCalculation.igv,
    issuedAt,
    dueAt,
    status: PAYMENT_ORDER_STATUS.PENDING,
    metadata,
  };
}

// =============================================================================
// VERIFICACIÓN DE PAGOS
// =============================================================================

/**
 * Resultado de verificación de pago
 */
export interface PaymentVerificationResult {
  isComplete: boolean;
  isPending: boolean;
  isOverdue: boolean;
  status: typeof PAYMENT_ORDER_STATUS[keyof typeof PAYMENT_ORDER_STATUS];
  amountPending: number;
  amountPaid: number;
  dueAt: Date;
  daysOverdue?: number;
  message: string;
}

/**
 * Verifica el estado de una orden de pago
 */
export function verifyPaymentOrder(
  order: PaymentOrder,
  currentDate: Date = new Date()
): PaymentVerificationResult {
  // Verificar si está vencido
  const overdue = isDeadlineOverdue(order.dueAt, currentDate);

  // Calcular días de retraso
  let daysOverdue: number | undefined;
  if (overdue) {
    const diffTime = currentDate.getTime() - order.dueAt.getTime();
    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determinar estado y mensaje
  switch (order.status) {
    case PAYMENT_ORDER_STATUS.PAID:
      return {
        isComplete: true,
        isPending: false,
        isOverdue: false,
        status: order.status,
        amountPending: 0,
        amountPaid: order.amountCents,
        dueAt: order.dueAt,
        message: "Pago completado",
      };

    case PAYMENT_ORDER_STATUS.PARTIAL:
      const amountPaid = order.metadata?.amountPaid as number || 0;
      return {
        isComplete: false,
        isPending: true,
        isOverdue: overdue,
        status: overdue ? PAYMENT_ORDER_STATUS.OVERDUE : order.status,
        amountPending: order.amountCents - amountPaid,
        amountPaid,
        dueAt: order.dueAt,
        daysOverdue,
        message: overdue
          ? `Pago parcial - Vencido hace ${daysOverdue} días`
          : "Pago parcial - Pendiente de completar",
      };

    case PAYMENT_ORDER_STATUS.OVERDUE:
      return {
        isComplete: false,
        isPending: false,
        isOverdue: true,
        status: order.status,
        amountPending: order.amountCents,
        amountPaid: 0,
        dueAt: order.dueAt,
        daysOverdue,
        message: `Plazo de pago vencido hace ${daysOverdue} días. El expediente ha sido suspendido.`,
      };

    case PAYMENT_ORDER_STATUS.CANCELLED:
      return {
        isComplete: false,
        isPending: false,
        isOverdue: false,
        status: order.status,
        amountPending: 0,
        amountPaid: 0,
        dueAt: order.dueAt,
        message: "Orden de pago cancelada",
      };

    case PAYMENT_ORDER_STATUS.REFUNDED:
      return {
        isComplete: false,
        isPending: false,
        isOverdue: false,
        status: order.status,
        amountPending: 0,
        amountPaid: 0,
        dueAt: order.dueAt,
        message: "Pago devuelto",
      };

    case PAYMENT_ORDER_STATUS.PENDING:
    default:
      return {
        isComplete: false,
        isPending: true,
        isOverdue: overdue,
        status: overdue ? PAYMENT_ORDER_STATUS.OVERDUE : PAYMENT_ORDER_STATUS.PENDING,
        amountPending: order.amountCents,
        amountPaid: 0,
        dueAt: order.dueAt,
        daysOverdue,
        message: overdue
          ? `Plazo de pago vencido hace ${daysOverdue} días`
          : `Pendiente de pago. Vence el ${order.dueAt.toLocaleDateString("es-PE")}`,
      };
  }
}

/**
 * Verifica si un expediente puede avanzar según su estado de pago
 */
export function canCaseProceed(
  pendingOrders: PaymentOrder[]
): { canProceed: boolean; blockingOrders: PaymentOrder[]; message: string } {
  const blockingOrders = pendingOrders.filter(order => {
    const verification = verifyPaymentOrder(order);
    // Bloquean: pagos pendientes, parciales o vencidos
    return verification.isPending || verification.isOverdue;
  });

  if (blockingOrders.length === 0) {
    return {
      canProceed: true,
      blockingOrders: [],
      message: "Todos los pagos requeridos han sido completados",
    };
  }

  // Calcular total pendiente
  const totalPending = blockingOrders.reduce((sum, order) => {
    const verification = verifyPaymentOrder(order);
    return sum + verification.amountPending;
  }, 0);

  const currency = blockingOrders[0]?.currency || "PEN";
  const hasOverdue = blockingOrders.some(order => verifyPaymentOrder(order).isOverdue);

  return {
    canProceed: false,
    blockingOrders,
    message: hasOverdue
      ? `El expediente está suspendido por pago vencido. Monto pendiente: ${currency} ${(totalPending / 100).toFixed(2)}`
      : `Existen pagos pendientes por ${currency} ${(totalPending / 100).toFixed(2)}. El expediente no puede avanzar.`,
  };
}

// =============================================================================
// CÁLCULO DE DEVOLUCIONES
// =============================================================================

/**
 * Calcula la devolución de honorarios según la etapa procesal
 */
export function calculateRefund(
  originalAmountCents: number,
  currency: "PEN" | "USD",
  currentStage: EtapaProcesal
): RefundCalculation {
  const stageConfig = ETAPAS_PROCESALES[currentStage];

  if (!stageConfig) {
    throw new Error(`Etapa procesal "${currentStage}" no reconocida`);
  }

  const refundPercentage = stageConfig.refundPercentage;
  const refundAmount = Math.round((originalAmountCents * refundPercentage) / 100);
  const retainedAmount = originalAmountCents - refundAmount;

  return {
    originalAmount: originalAmountCents,
    refundPercentage,
    refundAmount,
    retainedAmount,
    currency,
    stage: currentStage,
    stageName: stageConfig.name,
  };
}

/**
 * Obtiene la tabla completa de devoluciones para un monto
 */
export function getRefundTable(
  originalAmountCents: number,
  currency: "PEN" | "USD"
): RefundCalculation[] {
  const stages = Object.keys(ETAPAS_PROCESALES) as EtapaProcesal[];

  return stages
    .map(stage => calculateRefund(originalAmountCents, currency, stage))
    .sort((a, b) => {
      const stageA = ETAPAS_PROCESALES[a.stage as keyof typeof ETAPAS_PROCESALES];
      const stageB = ETAPAS_PROCESALES[b.stage as keyof typeof ETAPAS_PROCESALES];
      return stageA.order - stageB.order;
    });
}

/**
 * Formatea una tabla de devoluciones para mostrar
 */
export function formatRefundTable(
  originalAmountCents: number,
  currency: "PEN" | "USD"
): string {
  const table = getRefundTable(originalAmountCents, currency);
  const originalFormatted = `${currency} ${(originalAmountCents / 100).toFixed(2)}`;

  let output = `\nTABLA DE DEVOLUCIONES\n`;
  output += `Monto original: ${originalFormatted}\n`;
  output += `${"─".repeat(60)}\n`;
  output += `${"Etapa".padEnd(25)} ${"% Dev.".padStart(8)} ${"Devolución".padStart(12)} ${"Retención".padStart(12)}\n`;
  output += `${"─".repeat(60)}\n`;

  for (const row of table) {
    const refundFormatted = `${currency} ${(row.refundAmount / 100).toFixed(2)}`;
    const retainedFormatted = `${currency} ${(row.retainedAmount / 100).toFixed(2)}`;

    output += `${row.stageName.padEnd(25)} ${(row.refundPercentage + "%").padStart(8)} ${refundFormatted.padStart(12)} ${retainedFormatted.padStart(12)}\n`;
  }

  output += `${"─".repeat(60)}\n`;

  return output;
}

// =============================================================================
// RELIQUIDACIONES
// =============================================================================

/**
 * Calcula si se requiere reliquidación por cambio de cuantía
 */
export function calculateReliquidation(
  originalAmountCents: number,
  newAmountCents: number,
  currency: "PEN" | "USD"
): {
  requiresReliquidation: boolean;
  differenceAmount: number;
  newPaymentOrder?: FeeCalculation;
  message: string;
} {
  const difference = newAmountCents - originalAmountCents;

  if (difference <= 0) {
    return {
      requiresReliquidation: false,
      differenceAmount: 0,
      message: "No se requiere reliquidación. El monto nuevo es igual o menor al original.",
    };
  }

  // Calcular nueva tasa sobre la diferencia (ejemplo simplificado)
  // En producción, esto dependería de las tablas de aranceles específicas
  const newFee = calculateFee(
    difference,
    currency,
    PAYMENT_CONCEPTS.RELIQUIDACION,
    `Reliquidación por aumento de cuantía de ${currency} ${(originalAmountCents / 100).toFixed(2)} a ${currency} ${(newAmountCents / 100).toFixed(2)}`,
    currency === "PEN"
  );

  return {
    requiresReliquidation: true,
    differenceAmount: difference,
    newPaymentOrder: newFee,
    message: `Se requiere reliquidación. Diferencia: ${currency} ${(difference / 100).toFixed(2)}. Nueva tasa: ${currency} ${(newFee.totalFee / 100).toFixed(2)}`,
  };
}

// =============================================================================
// UTILIDADES DE FORMATO
// =============================================================================

/**
 * Formatea un monto en céntimos a moneda legible
 */
export function formatCurrency(amountCents: number, currency: "PEN" | "USD"): string {
  const amount = amountCents / 100;
  const symbol = currency === "PEN" ? "S/" : "USD";
  return `${symbol} ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Genera un resumen de orden de pago para notificaciones
 */
export function generatePaymentOrderSummary(order: Omit<PaymentOrder, "id">): string {
  const amount = formatCurrency(order.amountCents, order.currency as "PEN" | "USD");
  const dueDate = order.dueAt.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
ORDEN DE PAGO
─────────────────────────────
Concepto: ${order.description}
Monto: ${amount}
${order.includesIGV ? `(Base: ${formatCurrency(order.amountCents - (order.igvAmountCents || 0), order.currency as "PEN" | "USD")} + IGV: ${formatCurrency(order.igvAmountCents || 0, order.currency as "PEN" | "USD")})` : ""}
Fecha de emisión: ${order.issuedAt.toLocaleDateString("es-PE")}
Fecha límite de pago: ${dueDate}
─────────────────────────────

IMPORTANTE: El expediente no podrá avanzar hasta que este pago sea completado.
Si el pago no se realiza antes de la fecha límite, el expediente será suspendido automáticamente.
  `.trim();
}
