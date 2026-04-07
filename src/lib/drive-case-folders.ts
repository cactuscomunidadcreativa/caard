/**
 * Helper para crear la estructura de carpetas de un caso en Google Drive
 * Estructura: SCA CAARD / {year} / {case code} / {folder name}
 */
import { google } from "googleapis";
import { prisma } from "./prisma";

export const SCA_CAARD_ROOT_ID = "1muHi99MxtkhfG9KswQWmP2rgtPzUaaL2";

function sanitize(s: string) {
  return s.replace(/[\/\\:*?"<>|]/g, "-").trim().slice(0, 120);
}

async function getDriveClient(centerId: string) {
  const center = await prisma.center.findUnique({
    where: { id: centerId },
    select: { notificationSettings: true },
  });
  const rt = (center?.notificationSettings as any)?.googleRefreshToken;
  if (!rt) return null;
  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
  );
  oauth.setCredentials({ refresh_token: rt });
  return google.drive({ version: "v3", auth: oauth });
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parent: string
): Promise<string> {
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`;
  const r = await drive.files.list({ q, fields: "files(id)", pageSize: 1 });
  if (r.data.files && r.data.files.length > 0) return r.data.files[0].id!;
  const c = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parent] },
    fields: "id",
  });
  return c.data.id!;
}

/**
 * Crea (o reutiliza) la estructura de carpetas del caso en Drive
 * y actualiza Case.driveFolderId + CaseFolder.driveFolderId.
 * Tolerante a fallos: si Drive no responde, no lanza.
 */
export async function ensureCaseDriveFolders(caseId: string): Promise<void> {
  try {
    const c = await prisma.case.findUnique({
      where: { id: caseId },
      include: { folders: true },
    });
    if (!c) return;

    const drive = await getDriveClient(c.centerId);
    if (!drive) return;

    const year = c.year || new Date(c.createdAt).getFullYear();
    const yearFolderId = await findOrCreateFolder(drive, String(year), SCA_CAARD_ROOT_ID);

    let caseFolderId = c.driveFolderId;
    if (!caseFolderId) {
      caseFolderId = await findOrCreateFolder(drive, sanitize(c.code), yearFolderId);
      await prisma.case.update({ where: { id: c.id }, data: { driveFolderId: caseFolderId } });
    }

    for (const f of c.folders) {
      if (f.driveFolderId) continue;
      const fid = await findOrCreateFolder(drive, f.name, caseFolderId);
      await prisma.caseFolder.update({ where: { id: f.id }, data: { driveFolderId: fid } });
    }
  } catch (err: any) {
    console.error("ensureCaseDriveFolders error:", err?.message || err);
  }
}
