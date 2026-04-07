/**
 * CAARD - Descargar PDFs del sistema viejo y subirlos a Google Drive
 * Actualiza CaseDocument con los nuevos URLs de Drive
 */

import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

const p = new PrismaClient();

const LOCAL_PDF_DIR = "/Users/eduardogonzalez/Desktop/caard/public/v2/files";
const PARENT_DRIVE_FOLDER_ID = "1_yb3ov8hyfI8WVIVHKka3sSh1poTRZza"; // Existing parent folder
const ROOT_FOLDER_NAME = "SCA CAARD"; // New folder to create inside parent

// Setup Google Drive client
async function getDriveClient() {
  const center = await p.center.findFirst({
    where: { code: "CAARD" },
    select: { notificationSettings: true },
  });
  const settings = center?.notificationSettings as any;
  const refreshToken = settings?.googleRefreshToken;

  if (!refreshToken) {
    throw new Error("Google no autorizado. Autoriza primero en /admin/integrations");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

function downloadFile(url: string, dest: string): Promise<{ ok: boolean; size: number }> {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          if (response.headers.location) {
            downloadFile(response.headers.location, dest).then(resolve);
            return;
          }
          resolve({ ok: false, size: 0 });
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          resolve({ ok: false, size: 0 });
          return;
        }
        let totalSize = 0;
        response.on("data", (chunk) => (totalSize += chunk.length));
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve({ ok: true, size: totalSize });
        });
      })
      .on("error", () => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        resolve({ ok: false, size: 0 });
      });
  });
}

async function getOrCreateFolder(
  drive: any,
  name: string,
  parentId: string | null
): Promise<string> {
  // Search for existing folder
  const query = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentId ? ` and '${parentId}' in parents` : ""}`;
  const list = await drive.files.list({ q: query, fields: "files(id, name)", spaces: "drive" });

  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id;
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId && { parents: [parentId] }),
    },
    fields: "id",
  });
  return folder.data.id;
}

async function uploadToDrive(
  drive: any,
  filePath: string,
  fileName: string,
  parentFolderId: string
): Promise<{ id: string; webViewLink: string; webContentLink: string } | null> {
  try {
    const fileSize = fs.statSync(filePath).size;
    if (fileSize === 0) return null;

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [parentFolderId],
        mimeType: "application/pdf",
      },
      media: {
        mimeType: "application/pdf",
        body: fs.createReadStream(filePath),
      },
      fields: "id, webViewLink, webContentLink",
    });

    // Make file viewable by anyone with link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink || "",
      webContentLink: response.data.webContentLink || "",
    };
  } catch (e: any) {
    console.error(`  ✗ Upload failed: ${e.message?.substring(0, 100)}`);
    return null;
  }
}

async function main() {
  console.log("=== Migración PDFs a Google Drive ===\n");

  const drive = await getDriveClient();
  console.log("✓ Google Drive conectado");

  // Create "SCA CAARD" folder inside the parent folder
  const rootFolderId = await getOrCreateFolder(drive, ROOT_FOLDER_NAME, PARENT_DRIVE_FOLDER_ID);
  console.log(`✓ Carpeta "${ROOT_FOLDER_NAME}" creada/encontrada: ${rootFolderId}`);

  // Get all migrated documents
  const docs = await p.caseDocument.findMany({
    where: { driveFileId: { startsWith: "migrated-" } },
    include: {
      case: { select: { id: true, code: true } },
    },
  });
  console.log(`\n📎 Documentos a migrar: ${docs.length}\n`);

  // Group by case
  const docsByCase = new Map<string, typeof docs>();
  for (const doc of docs) {
    const caseId = doc.case.id;
    if (!docsByCase.has(caseId)) docsByCase.set(caseId, []);
    docsByCase.get(caseId)!.push(doc);
  }

  console.log(`📁 Casos a procesar: ${docsByCase.size}\n`);

  // Cache for case folders in Drive
  const caseFolderCache = new Map<string, string>();

  let uploaded = 0;
  let downloadFailed = 0;
  let uploadFailed = 0;
  let alreadyMigrated = 0;
  const startTime = Date.now();

  for (const [caseId, caseDocs] of docsByCase.entries()) {
    const caseCode = caseDocs[0].case.code;
    const safeName = caseCode.replace(/[/\\]/g, "_");

    // Get/create case folder in Drive
    let caseFolderId = caseFolderCache.get(caseId);
    if (!caseFolderId) {
      try {
        caseFolderId = await getOrCreateFolder(drive, safeName, rootFolderId);
        caseFolderCache.set(caseId, caseFolderId);
      } catch (e: any) {
        console.error(`✗ No se pudo crear carpeta ${safeName}: ${e.message}`);
        continue;
      }
    }

    for (const doc of caseDocs) {
      // Skip if already has real Drive ID (not migrated-X)
      if (doc.driveFileId && !doc.driveFileId.startsWith("migrated-")) {
        alreadyMigrated++;
        continue;
      }

      const fileName = doc.storedFileName || doc.originalFileName;
      const localPath = path.join(LOCAL_PDF_DIR, fileName);

      // Check local file exists
      if (!fs.existsSync(localPath)) {
        downloadFailed++;
        continue;
      }

      const fileSize = fs.statSync(localPath).size;
      if (fileSize === 0) {
        downloadFailed++;
        continue;
      }

      // Upload to Drive directly from local
      const driveFile = await uploadToDrive(
        drive,
        localPath,
        doc.originalFileName || fileName,
        caseFolderId
      );

      if (!driveFile) {
        uploadFailed++;
        continue;
      }

      // Update DB
      await p.caseDocument.update({
        where: { id: doc.id },
        data: {
          driveFileId: driveFile.id,
          driveWebViewLink: driveFile.webViewLink,
          driveDownloadLink: driveFile.webContentLink,
          sizeBytes: BigInt(fileSize),
        },
      });

      uploaded++;
      if (uploaded % 25 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = uploaded / elapsed;
        const remaining = (docs.length - uploaded - downloadFailed - uploadFailed) / rate;
        console.log(
          `  ${uploaded}/${docs.length} subidos | ${rate.toFixed(1)}/s | quedan ~${Math.ceil(remaining / 60)}min`
        );
      }
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`✓ Subidos exitosamente: ${uploaded}`);
  console.log(`- Ya migrados: ${alreadyMigrated}`);
  console.log(`✗ Archivo local no encontrado: ${downloadFailed}`);
  console.log(`✗ Falla upload: ${uploadFailed}`);

  await p.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
