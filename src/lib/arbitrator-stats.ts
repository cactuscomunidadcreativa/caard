/**
 * Calcula estadísticas reales del árbitro a partir de la BD (no campos
 * manuales del registry). Usado por el perfil público, el admin CMS y
 * cualquier otro lugar que quiera mostrar conteos fiables.
 */
import { prisma } from "./prisma";

export interface ArbitratorStats {
  totalCases: number;        // todos los casos en los que figura como ARBITRO
  activeCases: number;       // casos en IN_PROCESS
  closedCases: number;       // casos en CLOSED
  archivedCases: number;     // casos en ARCHIVED
  emergencyCases: number;    // emergencias asignadas
  recusations: number;       // recusaciones contra el árbitro
  sanctions: number;         // sanciones activas
}

/**
 * Estadísticas para un ArbitratorRegistry específico.
 * Pasa el `registryId` o el `userId` (prefiere registryId si ambos llegan).
 */
export async function getArbitratorStats(input: {
  registryId?: string;
  userId?: string;
}): Promise<ArbitratorStats> {
  let userId = input.userId;
  if (!userId && input.registryId) {
    const reg = await prisma.arbitratorRegistry.findUnique({
      where: { id: input.registryId },
      select: { userId: true },
    });
    userId = reg?.userId;
  }

  if (!userId) {
    return {
      totalCases: 0,
      activeCases: 0,
      closedCases: 0,
      archivedCases: 0,
      emergencyCases: 0,
      recusations: 0,
      sanctions: 0,
    };
  }

  const [
    totalCases,
    activeCases,
    closedCases,
    archivedCases,
    emergencyCases,
    recusations,
    sanctions,
  ] = await Promise.all([
    prisma.caseMember.count({
      where: { userId, role: "ARBITRO" },
    }),
    prisma.caseMember.count({
      where: { userId, role: "ARBITRO", case: { status: "IN_PROCESS" } },
    }),
    prisma.caseMember.count({
      where: { userId, role: "ARBITRO", case: { status: "CLOSED" } },
    }),
    prisma.caseMember.count({
      where: { userId, role: "ARBITRO", case: { status: "ARCHIVED" } },
    }),
    prisma.emergencyRequest.count({
      where: { emergencyArbitratorId: userId },
    }),
    prisma.recusation.count({
      where: { arbitrator: { userId } },
    }),
    prisma.arbitratorSanction.count({
      where: { arbitrator: { userId } },
    }),
  ]);

  return {
    totalCases,
    activeCases,
    closedCases,
    archivedCases,
    emergencyCases,
    recusations,
    sanctions,
  };
}

/**
 * Casos reales del árbitro en CAARD, ya listos para poblar `processesHistory`
 * del perfil público. Se fusionan con los externos que el árbitro agrega
 * manualmente; los de CAARD tienen `isCaardCase=true` y no se pueden editar.
 */
export interface CaardCaseForProfile {
  expedienteNumber: string;
  centerName: string;
  rol: "ARBITRO_UNICO" | "PRESIDENTE" | "COARBITRO";
  type: "INSTITUCIONAL";
  status: "VIGENTE" | "LAUDADO" | "ARCHIVADO";
  startDate: string | null;
  claimantName: string | null;
  respondentName: string | null;
  isCaardCase: true;
  caardCaseId: string;
}

export async function getCaardCasesForArbitrator(
  userId: string
): Promise<CaardCaseForProfile[]> {
  const memberships = await prisma.caseMember.findMany({
    where: { userId, role: "ARBITRO" },
    include: {
      case: {
        select: {
          id: true,
          code: true,
          status: true,
          tribunalMode: true,
          claimantName: true,
          respondentName: true,
          submittedAt: true,
          admittedAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { case: { year: "desc" } },
  });

  return memberships.map((m) => {
    const c = m.case;
    const statusMap: Record<string, CaardCaseForProfile["status"]> = {
      IN_PROCESS: "VIGENTE",
      AWAITING_PAYMENT: "VIGENTE",
      ADMITTED: "VIGENTE",
      CLOSED: "LAUDADO",
      ARCHIVED: "ARCHIVADO",
      SUSPENDED: "VIGENTE",
      EMERGENCY_IN_PROCESS: "VIGENTE",
    };
    const rol: CaardCaseForProfile["rol"] =
      c.tribunalMode === "SOLE_ARBITRATOR" ? "ARBITRO_UNICO" : "COARBITRO";
    return {
      expedienteNumber: c.code,
      centerName: "CAARD",
      rol,
      type: "INSTITUCIONAL",
      status: statusMap[c.status as string] || "VIGENTE",
      startDate: (c.admittedAt || c.submittedAt || c.createdAt)
        ?.toISOString()
        .slice(0, 10) || null,
      claimantName: c.claimantName,
      respondentName: c.respondentName,
      isCaardCase: true,
      caardCaseId: c.id,
    };
  });
}

/**
 * Combina los casos reales de CAARD con los externos registrados manualmente
 * por el árbitro en `ArbitratorProfile.processesHistory`. Los de CAARD son
 * autoritativos — si un externo coincide con un caardCaseId, se descarta.
 */
export async function mergeCaardAndManualProcesses(
  userId: string,
  manualHistory: any
): Promise<any[]> {
  const caardCases = await getCaardCasesForArbitrator(userId);
  const externals = Array.isArray(manualHistory)
    ? manualHistory.filter((p: any) => !p?.isCaardCase)
    : [];
  return [...caardCases, ...externals];
}
