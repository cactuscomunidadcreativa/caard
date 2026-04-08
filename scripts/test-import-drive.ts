/**
 * Ejecuta el import-from-drive directamente desde la BD (sin pasar por HTTP).
 * Útil para debuggear y para correr el primer import sin timeout de Vercel.
 */
import { prisma } from "../src/lib/prisma";
import { google } from "googleapis";

function norm(s: string): string {
  if (!s) return "";
  const m = s.match(/(\d{1,4})-(\d{4})-([A-Za-z]+)/);
  if (m) return `${parseInt(m[1], 10)}-${m[2]}-${m[3].toUpperCase()}`;
  return s
    .replace(/^Exp\.?\s*N[°º]?\s*/i, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function main() {
  const center = await prisma.center.findFirst({
    select: { id: true, driveRootFolderId: true, notificationSettings: true },
  });
  if (!center?.driveRootFolderId) throw new Error("No hay carpeta raíz configurada");
  const rt = (center.notificationSettings as any)?.googleRefreshToken;
  if (!rt) throw new Error("No google token");

  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
  );
  oauth.setCredentials({ refresh_token: rt });
  const drive = google.drive({ version: "v3", auth: oauth });

  const cases = await prisma.case.findMany({ select: { id: true, code: true } });
  const caseByNorm = new Map<string, { id: string; code: string }>();
  for (const c of cases) caseByNorm.set(norm(c.code), { id: c.id, code: c.code });

  const stats = {
    foldersScanned: 0,
    casesMatched: 0,
    filesIndexed: 0,
    filesSkipped: 0,
  };

  type Job = { id: string; depth: number };
  const queue: Job[] = [{ id: center.driveRootFolderId, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const job = queue.shift()!;
    if (visited.has(job.id)) continue;
    visited.add(job.id);
    stats.foldersScanned++;

    let pageToken: string | undefined;
    do {
      const r = await drive.files.list({
        q: `'${job.id}' in parents and trashed=false`,
        fields: "nextPageToken, files(id,name,mimeType,size,webViewLink,modifiedTime,createdTime)",
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      pageToken = r.data.nextPageToken || undefined;
      for (const f of r.data.files || []) {
        if (f.mimeType === "application/vnd.google-apps.folder") {
          const match = caseByNorm.get(norm(f.name || ""));
          if (match) {
            stats.casesMatched++;
            await prisma.case.update({ where: { id: match.id }, data: { driveFolderId: f.id! } });
            await indexCaseFolder(drive, f.id!, match.id, stats);
            console.log(`✓ ${match.code} (${stats.filesIndexed} files so far)`);
          } else if (job.depth < 3) {
            queue.push({ id: f.id!, depth: job.depth + 1 });
          }
        }
      }
    } while (pageToken);
  }

  console.log("\n=== DONE ===", stats);
  await prisma.$disconnect();
}

async function indexCaseFolder(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  caseId: string,
  stats: { filesIndexed: number; filesSkipped: number }
) {
  type J = { id: string; subKey: string | null; subName: string | null };
  const q: J[] = [{ id: folderId, subKey: null, subName: null }];
  while (q.length > 0) {
    const j = q.shift()!;
    let pageToken: string | undefined;
    do {
      const r = await drive.files.list({
        q: `'${j.id}' in parents and trashed=false`,
        fields: "nextPageToken, files(id,name,mimeType,size,webViewLink,modifiedTime,createdTime)",
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      pageToken = r.data.nextPageToken || undefined;
      for (const f of r.data.files || []) {
        if (f.mimeType === "application/vnd.google-apps.folder") {
          const key = (f.name || "").toLowerCase().replace(/\s+/g, "_").slice(0, 50);
          try {
            const cf = await prisma.caseFolder.upsert({
              where: { caseId_key: { caseId, key } },
              update: { driveFolderId: f.id!, name: f.name || key },
              create: { caseId, key, name: f.name || key, driveFolderId: f.id! },
            });
            q.push({ id: f.id!, subKey: cf.id, subName: f.name ?? null });
          } catch (e: any) {
            console.warn(`folder ${f.name}: ${e.message}`);
          }
        } else {
          try {
            const existing = await prisma.caseDocument.findFirst({
              where: { driveFileId: f.id! },
              select: { id: true },
            });
            const docType = j.subName
              ? /escrit/i.test(j.subName)
                ? "Escrito"
                : /resol/i.test(j.subName)
                ? "Resolución"
                : j.subName
              : "Documento";
            const driveDate = (f as any).modifiedTime || (f as any).createdTime;
            if (existing) {
              await prisma.caseDocument.update({
                where: { id: existing.id },
                data: {
                  caseId,
                  folderId: j.subKey,
                  driveWebViewLink: f.webViewLink || null,
                  originalFileName: f.name || "",
                  mimeType: f.mimeType || "application/octet-stream",
                  sizeBytes: f.size ? BigInt(f.size) : BigInt(0),
                  ...(driveDate ? { createdAt: new Date(driveDate) } : {}),
                },
              });
            } else {
              await prisma.caseDocument.create({
                data: {
                  caseId,
                  folderId: j.subKey,
                  documentType: docType,
                  originalFileName: f.name || "",
                  mimeType: f.mimeType || "application/octet-stream",
                  sizeBytes: f.size ? BigInt(f.size) : BigInt(0),
                  driveFileId: f.id!,
                  driveWebViewLink: f.webViewLink || null,
                  ...(driveDate ? { createdAt: new Date(driveDate) } : {}),
                },
              });
            }
            stats.filesIndexed++;
          } catch (err: any) {
            stats.filesSkipped++;
            console.warn(`file ${f.name}: ${err.message}`);
          }
        }
      }
    } while (pageToken);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
