/**
 * CAARD - Generación de Códigos de Expedientes
 *
 * Formato de códigos:
 * - Arbitraje común: 001-2025-ARB/CAARD
 * - Arbitraje de emergencia: 001-2025-ARBEME/CAARD
 */

import { prisma } from "@/lib/prisma";

export interface CaseCodeResult {
  code: string;
  year: number;
  sequence: number;
  typePrefix: string;
}

/**
 * Genera el código correlativo del expediente
 *
 * @param centerId - ID del centro de arbitraje
 * @param isEmergency - Si es arbitraje de emergencia
 * @returns Objeto con el código, año, secuencia y prefijo de tipo
 *
 * @example
 * // Arbitraje común
 * generateCaseCode("centerId123", false) // => { code: "001-2025-ARB/CAARD", year: 2025, sequence: 1, typePrefix: "ARB" }
 *
 * // Arbitraje de emergencia
 * generateCaseCode("centerId123", true) // => { code: "001-2025-ARBEME/CAARD", year: 2025, sequence: 1, typePrefix: "ARBEME" }
 */
export async function generateCaseCode(
  centerId: string,
  isEmergency: boolean = false,
  tx?: any
): Promise<CaseCodeResult> {
  const db = tx || prisma;
  const year = new Date().getFullYear();

  // Obtener el centro para el código
  const center = await db.center.findUnique({
    where: { id: centerId },
    select: { code: true },
  });

  if (!center) {
    throw new Error("Centro no encontrado");
  }

  // Prefijo según tipo de arbitraje
  const typePrefix = isEmergency ? "ARBEME" : "ARB";

  // Obtener el último número de secuencia del año para este tipo
  const lastCase = await db.case.findFirst({
    where: {
      centerId,
      year,
      code: {
        contains: `-${typePrefix}/`,
      },
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });

  const sequence = (lastCase?.sequence || 0) + 1;
  const paddedSequence = sequence.toString().padStart(3, "0");

  // Formato: 001-2025-ARB/CAARD o 001-2025-ARBEME/CAARD
  const code = `${paddedSequence}-${year}-${typePrefix}/${center.code}`;

  return { code, year, sequence, typePrefix };
}

/**
 * Genera el número de solicitud de emergencia
 *
 * @param centerId - ID del centro de arbitraje
 * @returns El número de solicitud con formato 001-2025-ARBEME/CAARD
 */
export async function generateEmergencyRequestNumber(
  centerId: string
): Promise<string> {
  const year = new Date().getFullYear();

  // Obtener el centro para el código
  const center = await prisma.center.findUnique({
    where: { id: centerId },
    select: { code: true },
  });

  if (!center) {
    throw new Error("Centro no encontrado");
  }

  // Buscar la última solicitud de emergencia del año
  const lastRequest = await prisma.emergencyRequest.findFirst({
    where: {
      centerId,
      requestNumber: { contains: `-${year}-ARBEME/` },
    },
    orderBy: { requestNumber: "desc" },
  });

  let sequence = 1;
  if (lastRequest) {
    // Extraer el número del formato 001-2025-ARBEME/CAARD
    const match = lastRequest.requestNumber.match(/^(\d+)-/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  const paddedSequence = sequence.toString().padStart(3, "0");
  return `${paddedSequence}-${year}-ARBEME/${center.code}`;
}

/**
 * Parsea un código de expediente y extrae sus componentes
 *
 * @param code - Código del expediente (ej: "001-2025-ARB/CAARD")
 * @returns Objeto con los componentes o null si el formato es inválido
 */
export function parseCaseCode(code: string): {
  sequence: number;
  year: number;
  type: "ARB" | "ARBEME";
  centerCode: string;
} | null {
  // Formato esperado: 001-2025-ARB/CAARD o 001-2025-ARBEME/CAARD
  const match = code.match(/^(\d{3})-(\d{4})-(ARB|ARBEME)\/(.+)$/);

  if (!match) {
    return null;
  }

  return {
    sequence: parseInt(match[1]),
    year: parseInt(match[2]),
    type: match[3] as "ARB" | "ARBEME",
    centerCode: match[4],
  };
}

/**
 * Verifica si un código de expediente es de emergencia
 *
 * @param code - Código del expediente
 * @returns true si es de emergencia
 */
export function isEmergencyCase(code: string): boolean {
  return code.includes("-ARBEME/");
}

/**
 * Verifica si un tipo de arbitraje es de emergencia basado en su código
 *
 * @param arbitrationTypeCode - Código del tipo de arbitraje
 * @returns true si es de emergencia
 */
export function isEmergencyArbitrationType(arbitrationTypeCode: string): boolean {
  const upperCode = arbitrationTypeCode.toUpperCase();
  return upperCode.includes("EMERGENCIA") || upperCode.includes("EME");
}
