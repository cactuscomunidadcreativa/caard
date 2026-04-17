/**
 * Importa la estructura de Google Drive a la BD sin descargar archivos.
 * - Recorre la carpeta raíz configurada (driveRootFolderId del Center)
 * - Cada subcarpeta intenta matchearse con un Case por código
 * - Cada PDF dentro queda registrado como CaseDocument apuntando al driveFileId
 * - Idempotente: usa upsert por (caseId, driveFileId)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export const maxDuration = 300; // 5 min en Vercel Pro
export const dynamic = "force-dynamic";

/**
 * Extrae una clave canónica del nombre de una carpeta o caso.
 * Acepta variantes como: "Exp. 006-2026-ARBEME/CAARD", "EXP. N° 006-2026-ARBEME-CAARD",
 * "006-2026-ARB", "Exp. ADHOC", etc.
 * Usa el primer patrón \d{1,4}-\d{4}-[A-Z]+ que encuentre, sino normaliza alfanuméricamente.
 */
function norm(s: string): string {
  if (!s) return "";
  const m = s.match(/(\d{1,4})-(\d{4})-([A-Za-z]+)/);
  if (m) return `${parseInt(m[1], 10)}-${m[2]}-${m[3].toUpperCase()}`;
  return s
    .replace(/^Exp\.?\s*N[°º]?\s*/i, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const center = await prisma.center.findUnique({
      where: { id: session.user.centerId! },
      select: { id: true, driveRootFolderId: true, notificationSettings: true },
    });
    if (!center?.driveRootFolderId)
      return NextResponse.json({ error: "Configura primero la carpeta raíz" }, { status: 400 });

    const rt = (center.notificationSettings as any)?.googleRefreshToken;
    if (!rt) return NextResponse.json({ error: "Google no conectado" }, { status: 400 });

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    // Cargar todos los casos para matcheo
    const cases = await prisma.case.findMany({
      select: { id: true, code: true, driveFolderId: true },
    });
    const caseByNorm = new Map<string, { id: string; code: string }>();
    for (const c of cases) caseByNorm.set(norm(c.code), { id: c.id, code: c.code });

    // BFS sobre la carpeta raíz hasta profundidad 4 buscando subcarpetas que matcheen
    type Job = { id: string; depth: number };
    const queue: Job[] = [{ id: center.driveRootFolderId, depth: 0 }];
    const stats = {
      foldersScanned: 0,
      casesMatched: 0,
      filesIndexed: 0,
      filesSkipped: 0,
      errors: [] as string[],
    };
    const matchedCaseIds = new Set<string>();

    while (queue.length > 0) {
      const job = queue.shift()!;
      stats.foldersScanned++;
      if (stats.foldersScanned > 500) break; // safety

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
            // Try match this folder name to a case code
            const match = caseByNorm.get(norm(f.name || ""));
            if (match) {
              matchedCaseIds.add(match.id);
              stats.casesMatched++;
              await prisma.case.update({ where: { id: match.id }, data: { driveFolderId: f.id! } });
              // Index files within this case folder (recursive shallow)
              await indexCaseFolder(drive, f.id!, match.id, stats);
            } else if (job.depth < 3) {
              queue.push({ id: f.id!, depth: job.depth + 1 });
            }
          }
        }
      } while (pageToken);
    }

    return NextResponse.json({
      success: true,
      stats: {
        foldersScanned: stats.foldersScanned,
        casesMatched: stats.casesMatched,
        filesIndexed: stats.filesIndexed,
        filesSkipped: stats.filesSkipped,
        uniqueCases: matchedCaseIds.size,
      },
    });
  } catch (e: any) {
    console.error("import-from-drive error:", e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || "Error desconocido", details: String(e) }, { status: 500 });
  }
}

async function indexCaseFolder(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  caseId: string,
  stats: { filesIndexed: number; filesSkipped: number; errors: string[] }
) {
  // BFS preservando jerarquía (parentId) y orden de Drive (sortOrder incremental).
  // j.parentDbId = CaseFolder.id del padre en la BD (null si es la raíz del caso).
  type J = { id: string; parentDbId: string | null; parentName: string | null };
  const q: J[] = [{ id: folderId, parentDbId: null, parentName: null }];
  let folderOrderCounter = 0;
  while (q.length > 0) {
    const j = q.shift()!;
    let pageToken: string | undefined;
    do {
      const r = await drive.files.list({
        q: `'${j.id}' in parents and trashed=false`,
        // orderBy: folder primero, luego por nombre — mismo orden que la UI de Drive
        orderBy: "folder,name",
        fields: "nextPageToken, files(id,name,mimeType,size,webViewLink,modifiedTime,createdTime)",
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      pageToken = r.data.nextPageToken || undefined;
      for (const f of r.data.files || []) {
        if (f.mimeType === "application/vnd.google-apps.folder") {
          // Folder = create or reuse CaseFolder con parentId + sortOrder
          // Key debe ser único por caso: si una subcarpeta se llama igual que otra
          // subcarpeta bajo otro padre, incluimos el path del padre.
          const baseKey = (f.name || "").toLowerCase().replace(/\s+/g, "_").slice(0, 50);
          const key = j.parentDbId
            ? `${j.parentDbId.slice(0, 8)}_${baseKey}`.slice(0, 60)
            : baseKey;
          const cf = await prisma.caseFolder.upsert({
            where: { caseId_key: { caseId, key } },
            update: {
              driveFolderId: f.id!,
              name: f.name || key,
              parentId: j.parentDbId,
              sortOrder: folderOrderCounter++,
            },
            create: {
              caseId,
              key,
              name: f.name || key,
              driveFolderId: f.id!,
              parentId: j.parentDbId,
              sortOrder: folderOrderCounter++,
            },
          });
          q.push({ id: f.id!, parentDbId: cf.id, parentName: f.name ?? null });
        } else {
          // File = upsert CaseDocument by driveFileId
          try {
            const existing = await prisma.caseDocument.findFirst({
              where: { driveFileId: f.id! },
              select: { id: true },
            });
            const isPdf = (f.mimeType || "").includes("pdf");
            const docType = j.parentName
              ? /escrit/i.test(j.parentName)
                ? "Escrito"
                : /resol/i.test(j.parentName)
                ? "Resolución"
                : j.parentName
              : "Documento";
            const driveDate = (f as any).modifiedTime || (f as any).createdTime;
            if (existing) {
              await prisma.caseDocument.update({
                where: { id: existing.id },
                data: {
                  caseId,
                  folderId: j.parentDbId,
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
                  folderId: j.parentDbId,
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
            if (stats.errors.length < 20) stats.errors.push(`${f.name}: ${err.message}`);
          }
        }
      }
    } while (pageToken);
  }
}
