/**
 * CAARD - Sistema de Autorización de Casos
 * Controla el acceso a casos según el rol del usuario
 * Incluye aislamiento por centro (center isolation)
 */

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Roles que pueden ver TODOS los casos del centro (pero solo de su centro)
const FULL_ACCESS_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "CENTER_STAFF",
  "SECRETARIA",
];

// Roles que solo ven sus propios casos
const RESTRICTED_ROLES: Role[] = [
  "ARBITRO",
  "ABOGADO",
  "DEMANDANTE",
  "DEMANDADO",
];

// Solo SUPER_ADMIN puede ver casos de todos los centros
const CROSS_CENTER_ROLES: Role[] = ["SUPER_ADMIN"];

export interface CaseAccessResult {
  hasAccess: boolean;
  reason?: string;
  accessLevel: "full" | "own" | "none";
}

export interface CenterIsolationResult {
  isAllowed: boolean;
  reason?: string;
}

/**
 * Verifica el aislamiento por centro
 * Asegura que un usuario solo pueda acceder a recursos de su centro
 */
export async function verifyCenterIsolation(
  userRole: Role,
  userCenterId: string | null | undefined,
  resourceCenterId: string | null | undefined
): Promise<CenterIsolationResult> {
  // SUPER_ADMIN puede acceder a todos los centros
  if (CROSS_CENTER_ROLES.includes(userRole)) {
    return { isAllowed: true };
  }

  // Si el usuario no tiene centro asignado, denegar acceso
  if (!userCenterId) {
    return {
      isAllowed: false,
      reason: "Usuario sin centro asignado",
    };
  }

  // Si el recurso no tiene centro, permitir (recursos globales)
  if (!resourceCenterId) {
    return { isAllowed: true };
  }

  // Verificar que los centros coincidan
  if (userCenterId !== resourceCenterId) {
    return {
      isAllowed: false,
      reason: "No tienes acceso a recursos de otro centro",
    };
  }

  return { isAllowed: true };
}

/**
 * Verifica si un usuario tiene acceso a un caso específico
 * Incluye verificación de aislamiento por centro
 */
export async function canAccessCase(
  userId: string,
  userRole: Role,
  caseId: string,
  userCenterId?: string | null
): Promise<CaseAccessResult> {
  // Primero obtener el caso para verificar el centro
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, centerId: true },
  });

  if (!caseData) {
    return {
      hasAccess: false,
      reason: "Expediente no encontrado",
      accessLevel: "none",
    };
  }

  // Verificar aislamiento por centro (excepto SUPER_ADMIN)
  if (userCenterId !== undefined) {
    const centerCheck = await verifyCenterIsolation(userRole, userCenterId, caseData.centerId);
    if (!centerCheck.isAllowed) {
      return {
        hasAccess: false,
        reason: centerCheck.reason,
        accessLevel: "none",
      };
    }
  }

  // Roles con acceso completo a casos de su centro
  if (FULL_ACCESS_ROLES.includes(userRole)) {
    return { hasAccess: true, accessLevel: "full" };
  }

  // Para roles restringidos, verificar vinculación al caso
  const membership = await checkCaseMembership(userId, userRole, caseId);

  if (membership.isMember) {
    return { hasAccess: true, accessLevel: "own" };
  }

  return {
    hasAccess: false,
    reason: "No tienes acceso a este expediente",
    accessLevel: "none",
  };
}

/**
 * Verifica la membresía de un usuario en un caso
 */
async function checkCaseMembership(
  userId: string,
  userRole: Role,
  caseId: string
): Promise<{ isMember: boolean; membershipType?: string }> {
  // Verificar si es miembro directo del caso (DEMANDANTE, DEMANDADO, ARBITRO)
  const caseMember = await prisma.caseMember.findFirst({
    where: {
      caseId,
      userId,
    },
  });

  if (caseMember) {
    return { isMember: true, membershipType: "direct" };
  }

  // Verificar si es abogado asignado al caso
  if (userRole === "ABOGADO") {
    const lawyerAssignment = await prisma.caseLawyer.findFirst({
      where: {
        caseId,
        lawyerId: userId,
        isActive: true,
      },
    });

    if (lawyerAssignment) {
      return { isMember: true, membershipType: "lawyer" };
    }
  }

  return { isMember: false };
}

/**
 * Obtiene los filtros de casos según el rol del usuario
 * Retorna un objeto where de Prisma para filtrar casos
 * Incluye filtro por centro para aislamiento
 */
export function getCaseFilters(
  userId: string,
  userRole: Role,
  userCenterId?: string | null
): object {
  const filters: any = {};

  // Filtro de centro (excepto SUPER_ADMIN que puede ver todos)
  if (!CROSS_CENTER_ROLES.includes(userRole) && userCenterId) {
    filters.centerId = userCenterId;
  }

  // Roles con acceso completo a casos de su centro
  if (FULL_ACCESS_ROLES.includes(userRole)) {
    return filters;
  }

  // Para abogados: casos donde están asignados
  if (userRole === "ABOGADO") {
    return {
      ...filters,
      OR: [
        { members: { some: { userId } } },
        { lawyers: { some: { lawyerId: userId, isActive: true } } },
      ],
    };
  }

  // Para demandantes, demandados y árbitros: solo sus casos
  return {
    ...filters,
    members: { some: { userId } },
  };
}

/**
 * Obtiene los filtros de documentos según el caso y rol
 */
export async function getDocumentFilters(
  userId: string,
  userRole: Role
): Promise<object> {
  // Roles con acceso completo
  if (FULL_ACCESS_ROLES.includes(userRole)) {
    return {};
  }

  // Obtener IDs de casos a los que el usuario tiene acceso
  const accessibleCaseIds = await getAccessibleCaseIds(userId, userRole);

  return {
    caseId: { in: accessibleCaseIds },
  };
}

/**
 * Obtiene los IDs de casos accesibles para un usuario
 */
export async function getAccessibleCaseIds(
  userId: string,
  userRole: Role
): Promise<string[]> {
  // Roles con acceso completo - devolver array vacío (significa sin filtro)
  if (FULL_ACCESS_ROLES.includes(userRole)) {
    return [];
  }

  // Para abogados: incluir casos como miembro y como abogado
  if (userRole === "ABOGADO") {
    const [memberCases, lawyerCases] = await Promise.all([
      prisma.caseMember.findMany({
        where: { userId },
        select: { caseId: true },
      }),
      prisma.caseLawyer.findMany({
        where: { lawyerId: userId, isActive: true },
        select: { caseId: true },
      }),
    ]);

    const caseIds = new Set([
      ...memberCases.map((m) => m.caseId),
      ...lawyerCases.map((l) => l.caseId),
    ]);

    return Array.from(caseIds);
  }

  // Para otros roles: solo casos donde son miembros
  const memberCases = await prisma.caseMember.findMany({
    where: { userId },
    select: { caseId: true },
  });

  return memberCases.map((m) => m.caseId);
}

/**
 * Verifica si un usuario puede remover a un abogado de un caso
 */
export async function canRemoveLawyer(
  userId: string,
  userRole: Role,
  caseId: string,
  lawyerId: string
): Promise<{ canRemove: boolean; reason?: string }> {
  // Admins y Super Admins pueden remover cualquier abogado
  if (["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
    return { canRemove: true };
  }

  // Obtener la asignación del abogado
  const lawyerAssignment = await prisma.caseLawyer.findFirst({
    where: {
      caseId,
      lawyerId,
      isActive: true,
    },
    include: {
      representedMember: true,
    },
  });

  if (!lawyerAssignment) {
    return { canRemove: false, reason: "Abogado no encontrado en este caso" };
  }

  // La parte que el abogado representa puede removerlo
  if (lawyerAssignment.representedMemberId) {
    const isRepresentedParty = await prisma.caseMember.findFirst({
      where: {
        id: lawyerAssignment.representedMemberId,
        userId,
      },
    });

    if (isRepresentedParty) {
      return { canRemove: true };
    }
  }

  // Si no hay miembro representado específico, verificar por tipo
  const memberByType = await prisma.caseMember.findFirst({
    where: {
      caseId,
      userId,
      role: lawyerAssignment.representationType === "DEMANDANTE"
        ? "DEMANDANTE"
        : "DEMANDADO",
    },
  });

  if (memberByType) {
    return { canRemove: true };
  }

  return {
    canRemove: false,
    reason: "Solo la parte representada o un administrador puede remover al abogado",
  };
}

/**
 * Verifica si un usuario puede remover a un árbitro de un caso
 * Requiere aprobación del centro (ADMIN/SUPER_ADMIN)
 */
export async function canRemoveArbitrator(
  userId: string,
  userRole: Role,
  caseId: string,
  arbitratorId: string
): Promise<{ canRemove: boolean; requiresApproval: boolean; reason?: string }> {
  // Solo SUPER_ADMIN y ADMIN pueden remover árbitros directamente
  if (["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
    return { canRemove: true, requiresApproval: false };
  }

  // Secretaría puede solicitar la remoción, pero requiere aprobación
  if (userRole === "SECRETARIA") {
    return {
      canRemove: false,
      requiresApproval: true,
      reason: "Requiere aprobación de un administrador",
    };
  }

  // Las partes pueden solicitar recusación, pero siempre requiere aprobación
  const isCaseMember = await prisma.caseMember.findFirst({
    where: {
      caseId,
      userId,
      role: { in: ["DEMANDANTE", "DEMANDADO"] },
    },
  });

  if (isCaseMember) {
    return {
      canRemove: false,
      requiresApproval: true,
      reason: "La recusación de árbitro requiere aprobación del centro",
    };
  }

  return {
    canRemove: false,
    requiresApproval: false,
    reason: "No tienes permisos para solicitar la remoción del árbitro",
  };
}

/**
 * Verifica si el usuario tiene acceso completo (puede ver todo)
 */
export function hasFullAccess(userRole: Role): boolean {
  return FULL_ACCESS_ROLES.includes(userRole);
}

/**
 * Verifica si el usuario es un rol restringido
 */
export function isRestrictedRole(userRole: Role): boolean {
  return RESTRICTED_ROLES.includes(userRole);
}

/**
 * Verifica si el usuario puede acceder a múltiples centros
 */
export function canAccessAllCenters(userRole: Role): boolean {
  return CROSS_CENTER_ROLES.includes(userRole);
}

/**
 * Middleware helper para verificar acceso a un caso en API routes
 * Retorna el caso si tiene acceso, null si no
 */
export async function requireCaseAccess(
  userId: string,
  userRole: Role,
  caseId: string,
  userCenterId?: string | null
): Promise<{
  allowed: boolean;
  case?: any;
  error?: string;
  statusCode?: number;
}> {
  // Verificar acceso al caso
  const accessResult = await canAccessCase(userId, userRole, caseId, userCenterId);

  if (!accessResult.hasAccess) {
    return {
      allowed: false,
      error: accessResult.reason || "Sin acceso al expediente",
      statusCode: 403,
    };
  }

  // Obtener datos del caso
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!caseData) {
    return {
      allowed: false,
      error: "Expediente no encontrado",
      statusCode: 404,
    };
  }

  return {
    allowed: true,
    case: caseData,
  };
}

/**
 * Verifica aislamiento de centro para cualquier recurso con centerId
 */
export async function requireCenterAccess(
  userRole: Role,
  userCenterId: string | null | undefined,
  resourceCenterId: string | null | undefined
): Promise<{ allowed: boolean; error?: string }> {
  const result = await verifyCenterIsolation(userRole, userCenterId, resourceCenterId);

  if (!result.isAllowed) {
    return {
      allowed: false,
      error: result.reason || "Acceso denegado",
    };
  }

  return { allowed: true };
}
