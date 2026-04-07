/**
 * Reorganiza SCA CAARD/{year}/{code}/{folder-name}/ y mueve cada PDF
 * a su subcarpeta correcta. Actualiza Case.driveFolderId y CaseFolder.driveFolderId.
 */
import { prisma } from "../src/lib/prisma";
import { google } from "googleapis";

const SCA_CAARD_ID = "1muHi99MxtkhfG9KswQWmP2rgtPzUaaL2";

function sanitize(s: string) {
  return s.replace(/[\/\\:*?"<>|]/g, "-").trim().slice(0, 120);
}

async function main() {
  const center = await prisma.center.findFirst({ select: { notificationSettings: true } });
  const rt = (center?.notificationSettings as any)?.googleRefreshToken;
  if (!rt) throw new Error("No refresh token");

  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
  );
  oauth.setCredentials({ refresh_token: rt });
  const drive = google.drive({ version: "v3", auth: oauth });

  async function findOrCreateFolder(name: string, parent: string): Promise<string> {
    const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`;
    const r = await drive.files.list({ q, fields: "files(id,name)", pageSize: 1 });
    if (r.data.files && r.data.files.length > 0) return r.data.files[0].id!;
    const c = await drive.files.create({
      requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parent] },
      fields: "id",
    });
    return c.data.id!;
  }

  const cases = await prisma.case.findMany({
    include: {
      folders: true,
      documents: { select: { id: true, driveFileId: true, folderId: true } },
    },
    orderBy: [{ year: "asc" }, { sequence: "asc" }],
  });

  console.log(`Processing ${cases.length} cases...`);
  const yearFolderCache = new Map<number, string>();
  let caseIdx = 0;

  for (const c of cases) {
    caseIdx++;
    if (c.documents.length === 0 && c.driveFolderId) continue;

    const year = c.year || new Date(c.createdAt).getFullYear();
    let yearFolderId = yearFolderCache.get(year);
    if (!yearFolderId) {
      yearFolderId = await findOrCreateFolder(String(year), SCA_CAARD_ID);
      yearFolderCache.set(year, yearFolderId);
    }

    const caseFolderName = sanitize(c.code);
    let caseFolderId = c.driveFolderId;
    if (!caseFolderId) {
      caseFolderId = await findOrCreateFolder(caseFolderName, yearFolderId);
      await prisma.case.update({ where: { id: c.id }, data: { driveFolderId: caseFolderId } });
    }

    // subfolders per CaseFolder
    const folderMap = new Map<string, string>(); // CaseFolder.id -> drive folder id
    for (const f of c.folders) {
      let fid = f.driveFolderId;
      if (!fid) {
        fid = await findOrCreateFolder(f.name, caseFolderId);
        await prisma.caseFolder.update({ where: { id: f.id }, data: { driveFolderId: fid } });
      }
      folderMap.set(f.id, fid);
    }

    // move documents
    for (const d of c.documents) {
      if (!d.driveFileId || !d.folderId) continue;
      const target = folderMap.get(d.folderId);
      if (!target) continue;
      try {
        const meta = await drive.files.get({ fileId: d.driveFileId, fields: "parents" });
        const currentParents = (meta.data.parents || []).join(",");
        if (currentParents === target) continue;
        await drive.files.update({
          fileId: d.driveFileId,
          addParents: target,
          removeParents: currentParents,
          fields: "id,parents",
        });
      } catch (e: any) {
        console.warn(`  doc ${d.id} move failed:`, e.message);
      }
    }

    console.log(`[${caseIdx}/${cases.length}] ${c.code} → ${c.documents.length} docs`);
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
