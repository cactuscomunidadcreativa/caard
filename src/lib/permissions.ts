/**
 * CAARD - Sistema de permisos granulares por módulo.
 *
 * Cada permiso es un string `modulo.accion` (ej. `cases.delete`). La matriz
 * por defecto por rol se declara aquí (source of truth). Las excepciones
 * puntuales se guardan en la tabla UserPermissionOverride y se consultan
 * al generar el JWT, así cada request trae los permisos en memoria sin
 * queries adicionales.
 *
 * SUPER_ADMIN tiene el wildcard "*" que matchea todo.
 */
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

// ======================================================================
// Catálogo de permisos
// ======================================================================

export const PERMISSIONS = {
  // Cases / Expedientes
  CASES_VIEW: "cases.view",
  CASES_READ: "cases.read",
  CASES_CREATE: "cases.create",
  CASES_UPDATE: "cases.update",
  CASES_DELETE: "cases.delete",
  CASES_ASSIGN_ARBITRATOR: "cases.assign_arbitrator",
  CASES_BLOCK: "cases.block",
  CASES_EXPORT: "cases.export",

  // Members (del caso)
  MEMBERS_VIEW: "members.view",
  MEMBERS_CREATE: "members.create",
  MEMBERS_UPDATE: "members.update",
  MEMBERS_DELETE: "members.delete",

  // Documents / Escritos
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_CREATE: "documents.create",
  DOCUMENTS_UPDATE: "documents.update",
  DOCUMENTS_DELETE: "documents.delete",
  DOCUMENTS_DOWNLOAD: "documents.download",
  DOCUMENTS_PROVEER: "documents.proveer", // árbitro emite resolución

  // Deadlines / Plazos
  DEADLINES_VIEW: "deadlines.view",
  DEADLINES_CREATE: "deadlines.create",
  DEADLINES_UPDATE: "deadlines.update",
  DEADLINES_DELETE: "deadlines.delete",

  // Hearings / Audiencias
  HEARINGS_VIEW: "hearings.view",
  HEARINGS_CREATE: "hearings.create",
  HEARINGS_UPDATE: "hearings.update",
  HEARINGS_DELETE: "hearings.delete",

  // Payments / Pagos
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_UPDATE: "payments.update",
  PAYMENTS_DELETE: "payments.delete",
  PAYMENTS_REFUND: "payments.refund",
  PAYMENTS_CONFIRM: "payments.confirm",

  // Installments / Fraccionamientos
  INSTALLMENTS_VIEW: "installments.view",
  INSTALLMENTS_CREATE: "installments.create",
  INSTALLMENTS_UPDATE: "installments.update",
  INSTALLMENTS_DELETE: "installments.delete",
  INSTALLMENTS_APPROVE: "installments.approve",

  // Liquidations
  LIQUIDATIONS_VIEW: "liquidations.view",
  LIQUIDATIONS_CREATE: "liquidations.create",
  LIQUIDATIONS_UPDATE: "liquidations.update",
  LIQUIDATIONS_DELETE: "liquidations.delete",
  LIQUIDATIONS_APPROVE: "liquidations.approve",

  // Emergencies
  EMERGENCIES_VIEW: "emergencies.view",
  EMERGENCIES_CREATE: "emergencies.create",
  EMERGENCIES_UPDATE: "emergencies.update",
  EMERGENCIES_VERIFY: "emergencies.verify",
  EMERGENCIES_DESIGNATE: "emergencies.designate",

  // Recusations
  RECUSATIONS_VIEW: "recusations.view",
  RECUSATIONS_CREATE: "recusations.create",
  RECUSATIONS_RESPOND: "recusations.respond",
  RECUSATIONS_DECIDE: "recusations.decide",

  // Sanctions
  SANCTIONS_VIEW: "sanctions.view",
  SANCTIONS_CREATE: "sanctions.create",
  SANCTIONS_UPDATE: "sanctions.update",
  SANCTIONS_DELETE: "sanctions.delete",

  // Arbitrators
  ARBITRATORS_VIEW: "arbitrators.view",
  ARBITRATORS_CREATE: "arbitrators.create",
  ARBITRATORS_UPDATE: "arbitrators.update",
  ARBITRATORS_DELETE: "arbitrators.delete",
  ARBITRATORS_APPROVE: "arbitrators.approve",
  ARBITRATORS_SANCTION: "arbitrators.sanction",

  // Users
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_IMPERSONATE: "users.impersonate",

  // CMS
  CMS_VIEW: "cms.view",
  CMS_CREATE: "cms.create",
  CMS_UPDATE: "cms.update",
  CMS_DELETE: "cms.delete",
  CMS_PUBLISH: "cms.publish",

  // Notifications
  NOTIFICATIONS_VIEW: "notifications.view",
  NOTIFICATIONS_SEND: "notifications.send",
  NOTIFICATIONS_TEMPLATES: "notifications.templates",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  // AI
  AI_USE: "ai.use",
  AI_ADMIN: "ai.admin", // gestionar modelos, cuotas, roles

  // Integrations
  INTEGRATIONS_VIEW: "integrations.view",
  INTEGRATIONS_MANAGE: "integrations.manage",

  // System
  SYSTEM_RULES: "system.rules",
  SYSTEM_TARIFFS: "system.tariffs",
  SYSTEM_HOLIDAYS: "system.holidays",
  SYSTEM_CENTER: "system.center",

  // Audit
  AUDIT_VIEW: "audit.view",
  AUDIT_EXPORT: "audit.export",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ======================================================================
// Matriz de permisos por rol (defaults)
// ======================================================================

const ALL_PERMS = Object.values(PERMISSIONS);

// Shortcuts para grupos comunes
const CASES_READ_ALL = [
  PERMISSIONS.CASES_VIEW,
  PERMISSIONS.CASES_READ,
  PERMISSIONS.MEMBERS_VIEW,
  PERMISSIONS.DOCUMENTS_VIEW,
  PERMISSIONS.DOCUMENTS_DOWNLOAD,
  PERMISSIONS.DEADLINES_VIEW,
  PERMISSIONS.HEARINGS_VIEW,
  PERMISSIONS.PAYMENTS_VIEW,
];

const CASES_WRITE = [
  PERMISSIONS.CASES_CREATE,
  PERMISSIONS.CASES_UPDATE,
  PERMISSIONS.MEMBERS_CREATE,
  PERMISSIONS.MEMBERS_UPDATE,
  PERMISSIONS.DOCUMENTS_CREATE,
  PERMISSIONS.DOCUMENTS_UPDATE,
  PERMISSIONS.DEADLINES_CREATE,
  PERMISSIONS.DEADLINES_UPDATE,
  PERMISSIONS.HEARINGS_CREATE,
  PERMISSIONS.HEARINGS_UPDATE,
];

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: ["*" as Permission], // wildcard
  ADMIN: [
    ...CASES_READ_ALL,
    ...CASES_WRITE,
    PERMISSIONS.CASES_ASSIGN_ARBITRATOR,
    PERMISSIONS.CASES_BLOCK,
    PERMISSIONS.CASES_EXPORT,
    PERMISSIONS.MEMBERS_DELETE,
    PERMISSIONS.DOCUMENTS_DELETE,
    PERMISSIONS.DEADLINES_DELETE,
    PERMISSIONS.HEARINGS_DELETE,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_UPDATE,
    PERMISSIONS.PAYMENTS_DELETE,
    PERMISSIONS.PAYMENTS_REFUND,
    PERMISSIONS.PAYMENTS_CONFIRM,
    PERMISSIONS.INSTALLMENTS_VIEW,
    PERMISSIONS.INSTALLMENTS_CREATE,
    PERMISSIONS.INSTALLMENTS_UPDATE,
    PERMISSIONS.INSTALLMENTS_DELETE,
    PERMISSIONS.INSTALLMENTS_APPROVE,
    PERMISSIONS.LIQUIDATIONS_VIEW,
    PERMISSIONS.LIQUIDATIONS_CREATE,
    PERMISSIONS.LIQUIDATIONS_UPDATE,
    PERMISSIONS.LIQUIDATIONS_APPROVE,
    PERMISSIONS.EMERGENCIES_VIEW,
    PERMISSIONS.EMERGENCIES_CREATE,
    PERMISSIONS.EMERGENCIES_UPDATE,
    PERMISSIONS.EMERGENCIES_VERIFY,
    PERMISSIONS.EMERGENCIES_DESIGNATE,
    PERMISSIONS.RECUSATIONS_VIEW,
    PERMISSIONS.RECUSATIONS_DECIDE,
    PERMISSIONS.SANCTIONS_VIEW,
    PERMISSIONS.SANCTIONS_CREATE,
    PERMISSIONS.SANCTIONS_UPDATE,
    PERMISSIONS.ARBITRATORS_VIEW,
    PERMISSIONS.ARBITRATORS_CREATE,
    PERMISSIONS.ARBITRATORS_UPDATE,
    PERMISSIONS.ARBITRATORS_APPROVE,
    PERMISSIONS.ARBITRATORS_SANCTION,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.CMS_VIEW,
    PERMISSIONS.CMS_CREATE,
    PERMISSIONS.CMS_UPDATE,
    PERMISSIONS.CMS_DELETE,
    PERMISSIONS.CMS_PUBLISH,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.NOTIFICATIONS_TEMPLATES,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.AI_USE,
    PERMISSIONS.INTEGRATIONS_VIEW,
    PERMISSIONS.SYSTEM_RULES,
    PERMISSIONS.SYSTEM_TARIFFS,
    PERMISSIONS.SYSTEM_HOLIDAYS,
    PERMISSIONS.SYSTEM_CENTER,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_EXPORT,
  ],
  SECRETARIA: [
    ...CASES_READ_ALL,
    ...CASES_WRITE,
    PERMISSIONS.CASES_ASSIGN_ARBITRATOR,
    PERMISSIONS.CASES_BLOCK,
    PERMISSIONS.CASES_EXPORT,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_UPDATE,
    PERMISSIONS.PAYMENTS_CONFIRM,
    PERMISSIONS.INSTALLMENTS_VIEW,
    PERMISSIONS.INSTALLMENTS_CREATE,
    PERMISSIONS.INSTALLMENTS_UPDATE,
    PERMISSIONS.INSTALLMENTS_APPROVE,
    PERMISSIONS.LIQUIDATIONS_VIEW,
    PERMISSIONS.LIQUIDATIONS_CREATE,
    PERMISSIONS.LIQUIDATIONS_UPDATE,
    PERMISSIONS.LIQUIDATIONS_APPROVE,
    PERMISSIONS.EMERGENCIES_VIEW,
    PERMISSIONS.EMERGENCIES_CREATE,
    PERMISSIONS.EMERGENCIES_UPDATE,
    PERMISSIONS.EMERGENCIES_VERIFY,
    PERMISSIONS.EMERGENCIES_DESIGNATE,
    PERMISSIONS.RECUSATIONS_VIEW,
    PERMISSIONS.RECUSATIONS_DECIDE,
    PERMISSIONS.SANCTIONS_VIEW,
    PERMISSIONS.SANCTIONS_CREATE,
    PERMISSIONS.SANCTIONS_UPDATE,
    PERMISSIONS.ARBITRATORS_VIEW,
    PERMISSIONS.ARBITRATORS_UPDATE,
    PERMISSIONS.ARBITRATORS_APPROVE,
    PERMISSIONS.ARBITRATORS_SANCTION,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.AI_USE,
    PERMISSIONS.SYSTEM_HOLIDAYS,
    PERMISSIONS.AUDIT_VIEW,
  ],
  CENTER_STAFF: [
    ...CASES_READ_ALL,
    PERMISSIONS.CASES_CREATE,
    PERMISSIONS.CASES_UPDATE,
    PERMISSIONS.MEMBERS_CREATE,
    PERMISSIONS.MEMBERS_UPDATE,
    PERMISSIONS.DOCUMENTS_CREATE,
    PERMISSIONS.DEADLINES_UPDATE,
    PERMISSIONS.HEARINGS_CREATE,
    PERMISSIONS.HEARINGS_UPDATE,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.INSTALLMENTS_VIEW,
    PERMISSIONS.LIQUIDATIONS_VIEW,
    PERMISSIONS.EMERGENCIES_VIEW,
    PERMISSIONS.RECUSATIONS_VIEW,
    PERMISSIONS.ARBITRATORS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.AI_USE,
  ],
  ARBITRO: [
    PERMISSIONS.CASES_VIEW, // ve sus asignados
    PERMISSIONS.CASES_READ,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_CREATE,
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    PERMISSIONS.DOCUMENTS_PROVEER,
    PERMISSIONS.DEADLINES_VIEW,
    PERMISSIONS.HEARINGS_VIEW,
    PERMISSIONS.HEARINGS_CREATE, // sugerir audiencia
    PERMISSIONS.EMERGENCIES_VIEW,
    PERMISSIONS.RECUSATIONS_VIEW,
    PERMISSIONS.RECUSATIONS_RESPOND,
    PERMISSIONS.LIQUIDATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.USERS_VIEW, // ve su propio perfil
    PERMISSIONS.ARBITRATORS_UPDATE, // edita su propio perfil
  ],
  ABOGADO: [
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_CREATE,
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    PERMISSIONS.DEADLINES_VIEW,
    PERMISSIONS.HEARINGS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.INSTALLMENTS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.USERS_VIEW,
  ],
  DEMANDANTE: [
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.CASES_CREATE, // puede iniciar nueva demanda
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_CREATE, // sube escritos
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    PERMISSIONS.DEADLINES_VIEW,
    PERMISSIONS.HEARINGS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW, // ve sus órdenes
    PERMISSIONS.INSTALLMENTS_VIEW,
    PERMISSIONS.INSTALLMENTS_CREATE,
    PERMISSIONS.EMERGENCIES_VIEW,
    PERMISSIONS.EMERGENCIES_CREATE,
    PERMISSIONS.RECUSATIONS_CREATE,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.USERS_VIEW,
  ],
  DEMANDADO: [
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_CREATE,
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    PERMISSIONS.DEADLINES_VIEW,
    PERMISSIONS.HEARINGS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.INSTALLMENTS_VIEW,
    PERMISSIONS.INSTALLMENTS_CREATE,
    PERMISSIONS.RECUSATIONS_CREATE,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.USERS_VIEW,
  ],
  ESTUDIANTE: [PERMISSIONS.AI_USE, PERMISSIONS.USERS_VIEW],
};

// ======================================================================
// Helpers
// ======================================================================

export interface SessionWithPerms {
  id: string;
  role: Role;
  perms?: string[];
}

/**
 * Verifica si la sesión tiene un permiso. Acepta tanto el array explícito
 * (si fue poblado en el JWT) como fallback al default por rol.
 */
export function hasPermission(
  user: SessionWithPerms | null | undefined,
  permission: Permission | string
): boolean {
  if (!user) return false;
  // SUPER_ADMIN siempre puede todo, independientemente de los perms calculados.
  // Esto blinda el sistema contra JWTs antiguos que no tienen perms[] cargado.
  if (user.role === "SUPER_ADMIN") return true;
  // Si el token trae permisos calculados (incluso vacío), úsalos.
  // Si vienen como undefined, caemos al default del rol.
  const effective =
    user.perms !== undefined && user.perms.length > 0
      ? user.perms
      : defaultsForRole(user.role);
  if (effective.includes("*")) return true;
  return effective.includes(permission);
}

/** Tiene al menos uno de los permisos dados. */
export function hasAnyPermission(
  user: SessionWithPerms | null | undefined,
  permissions: Array<Permission | string>
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/** Tiene todos los permisos dados. */
export function hasAllPermissions(
  user: SessionWithPerms | null | undefined,
  permissions: Array<Permission | string>
): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/** Lanza Response 403 si no tiene el permiso (uso desde API routes). */
export function requirePermission(
  user: SessionWithPerms | null | undefined,
  permission: Permission | string
): void {
  if (!hasPermission(user, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: string) {
    super(`Permission denied: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

function defaultsForRole(role: Role): string[] {
  return [...(ROLE_DEFAULT_PERMISSIONS[role] || [])];
}

// ======================================================================
// Cálculo de permisos efectivos (defaults + overrides)
// ======================================================================

/**
 * Resuelve los permisos efectivos para un usuario combinando:
 *  - Defaults por rol
 *  - UserPermissionOverride (granted=true añade, granted=false revoca)
 *  - Filtro por fecha de expiración (si expiresAt <= ahora, se ignora)
 *
 * Debe usarse en el JWT callback o donde se arme la sesión.
 */
export async function computeEffectivePermissions(
  userId: string,
  role: Role
): Promise<string[]> {
  const defaults = defaultsForRole(role);
  if (defaults.includes("*")) return ["*"];

  let overrides: Array<{ permission: string; granted: boolean }> = [];
  try {
    overrides = await prisma.userPermissionOverride.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { permission: true, granted: true },
    });
  } catch {
    overrides = [];
  }

  const set = new Set(defaults);
  for (const o of overrides) {
    if (o.granted) set.add(o.permission);
    else set.delete(o.permission);
  }
  return [...set];
}

// ======================================================================
// Catálogo plano (útil para UI admin)
// ======================================================================

export const PERMISSION_CATALOG = Object.values(PERMISSIONS).map((p) => {
  const [module, action] = p.split(".");
  return { key: p, module, action };
});
