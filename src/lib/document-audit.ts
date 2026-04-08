/**
 * Helper para registrar cambios sobre CaseDocument en CaseDocumentAudit.
 * Lo consume el SUPER_ADMIN en la vista estilo "Get Info" de Mac.
 */
import { prisma } from "./prisma";

export type DocAuditAction =
  | "CREATED"
  | "UPDATED"
  | "VIEWED"
  | "DOWNLOADED"
  | "MOVED"
  | "REPLACED"
  | "DELETED"
  | "RESTORED"
  | "VISIBILITY_CHANGED";

export async function logDocumentAudit(params: {
  documentId: string;
  action: DocAuditAction;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  changes?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.caseDocumentAudit.create({
      data: {
        documentId: params.documentId,
        action: params.action,
        actorId: params.actorId || null,
        actorName: params.actorName || null,
        actorRole: params.actorRole || null,
        changes: params.changes || undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (e: any) {
    // No fallar la operación principal por un error de auditoría
    console.warn("logDocumentAudit error:", e?.message);
  }
}
