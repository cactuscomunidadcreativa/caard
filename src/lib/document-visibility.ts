/**
 * Control de visibilidad de carpetas y documentos por rol del usuario.
 *
 * Roles:
 *   - SUPER_ADMIN, ADMIN, SECRETARIA, CENTER_STAFF → ven TODO (staff)
 *   - ARBITRO                                      → STAFF_AND_ARBITRATORS + ALL
 *   - DEMANDANTE, DEMANDADO, ABOGADO              → solo ALL
 */
import type { Role } from "@prisma/client";

export type FolderVisibility = "ALL" | "STAFF_AND_ARBITRATORS" | "STAFF_ONLY";
export type DocumentAccessLevel = "ALL" | "STAFF_AND_ARBITRATORS" | "STAFF_ONLY";

const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"] as unknown as Role[];

export function userAccessLevel(role: Role): "STAFF" | "ARBITRO" | "PARTY" {
  if (STAFF_ROLES.includes(role)) return "STAFF";
  if ((role as string) === "ARBITRO") return "ARBITRO";
  return "PARTY";
}

export function canSeeFolder(
  folderVisibility: FolderVisibility | string | null | undefined,
  role: Role
): boolean {
  const level = userAccessLevel(role);
  const v = (folderVisibility || "ALL") as FolderVisibility;
  if (level === "STAFF") return true;
  if (level === "ARBITRO") return v !== "STAFF_ONLY";
  // PARTY (demandante, demandado, abogado)
  return v === "ALL";
}

export function canSeeDocument(
  docAccessLevel: DocumentAccessLevel | string | null | undefined,
  folderVisibility: FolderVisibility | string | null | undefined,
  role: Role
): boolean {
  if (!canSeeFolder(folderVisibility, role)) return false;
  const level = userAccessLevel(role);
  const v = (docAccessLevel || "ALL") as DocumentAccessLevel;
  if (level === "STAFF") return true;
  if (level === "ARBITRO") return v !== "STAFF_ONLY";
  return v === "ALL";
}

/** Devuelve los folders que el rol puede ver. */
export function filterFoldersByRole<T extends { visibility?: string | null }>(
  folders: T[],
  role: Role
): T[] {
  return folders.filter((f) => canSeeFolder(f.visibility, role));
}

/** Devuelve los documentos que el rol puede ver (considerando la carpeta). */
export function filterDocumentsByRole<
  T extends {
    accessLevel?: string | null;
    folder?: { visibility?: string | null } | null;
  }
>(docs: T[], role: Role): T[] {
  return docs.filter((d) => canSeeDocument(d.accessLevel, d.folder?.visibility ?? null, role));
}
