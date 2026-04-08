/**
 * Re-migra docs faltantes desde /v2 SQL.
 * Match por nro_exp (sin prefijo "Exp. ").
 * Sube los archivos a Drive (en la estructura SCA CAARD) y crea CaseDocument.
 */
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/prisma";
import { google } from "googleapis";

const SQL_PATH = "/Users/eduardogonzalez/Downloads/localhost.sql";
const FILES_DIR = path.join(process.cwd(), "public/v2/files");
const SCA_CAARD_ROOT = "1muHi99MxtkhfG9KswQWmP2rgtPzUaaL2";

function parseInsertRows(sql: string, table: string): string[][] {
  const re = new RegExp(`INSERT INTO \`${table}\`[^(]*\\([^)]*\\) VALUES\\s*([\\s\\S]*?);`, "m");
  const m = sql.match(re);
  if (!m) return [];
  const body = m[1];
  const rows: string[][] = [];
  let i = 0;
  while (i < body.length) {
    if (body[i] !== "(") { i++; continue; }
    let j = i + 1, depth = 1, inStr = false;
    for (; j < body.length && depth > 0; j++) {
      const ch = body[j];
      if (inStr) {
        if (ch === "\\") { j++; continue; }
        if (ch === "'") inStr = false;
        continue;
      }
      if (ch === "'") inStr = true;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
    }
    const row = body.slice(i + 1, j - 1);
    // split fields
    const fields: string[] = [];
    let cur = "", q = false;
    for (let k = 0; k < row.length; k++) {
      const ch = row[k];
      if (q) {
        if (ch === "\\") { cur += row[++k]; continue; }
        if (ch === "'") { q = false; continue; }
        cur += ch;
      } else {
        if (ch === "'") { q = true; continue; }
        if (ch === ",") { fields.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
    }
    fields.push(cur.trim());
    rows.push(fields);
    i = j;
  }
  return rows;
}

function normalizeCode(s: string) {
  return s.replace(/^Exp\.\s*/i, "").replace(/\s+/g, "").toLowerCase();
}

async function main() {
  console.log("Loading SQL...");
  const sql = fs.readFileSync(SQL_PATH, "utf-8");
  const expRows = parseInsertRows(sql, "expedientes"); // id, nro_exp, nombre_usuario, code_usuario, ...
  const detRows = parseInsertRows(sql, "expedientes_detalle"); // id, idExp, idTipo, titulo, file, ...
  console.log(`expedientes: ${expRows.length}, detalle: ${detRows.length}`);

  // Map oldExpId -> nro_exp
  const oldIdToCode = new Map<string, string>();
  for (const r of expRows) oldIdToCode.set(r[0], r[1]);

  // Group docs by old nro_exp
  const docsByCode = new Map<string, Array<{ idTipo: string; titulo: string; file: string }>>();
  for (const r of detRows) {
    const code = oldIdToCode.get(r[1]);
    if (!code) continue;
    const arr = docsByCode.get(code) || [];
    arr.push({ idTipo: r[2], titulo: r[3], file: r[4] });
    docsByCode.set(code, arr);
  }

  // Our cases without docs
  const ourCases = await prisma.case.findMany({
    include: { folders: true, _count: { select: { documents: true } } },
  });
  const missing = ourCases.filter((c) => c._count.documents === 0);
  console.log(`Cases sin docs: ${missing.length}`);

  // Google Drive
  const center = await prisma.center.findFirst({ select: { id: true, notificationSettings: true } });
  const rt = (center?.notificationSettings as any)?.googleRefreshToken;
  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
  );
  oauth.setCredentials({ refresh_token: rt });
  const drive = google.drive({ version: "v3", auth: oauth });

  async function findOrCreate(name: string, parent: string): Promise<string> {
    const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`;
    const r = await drive.files.list({ q, fields: "files(id)", pageSize: 1 });
    if (r.data.files && r.data.files[0]) return r.data.files[0].id!;
    const c = await drive.files.create({
      requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parent] },
      fields: "id",
    });
    return c.data.id!;
  }

  const yearCache = new Map<number, string>();
  let stats = { matched: 0, docsCreated: 0, skippedNoFile: 0, errors: 0 };

  for (const c of missing) {
    const ourNorm = normalizeCode(c.code);
    // find matching code in old
    let oldCode: string | undefined;
    for (const k of docsByCode.keys()) {
      if (normalizeCode(k) === ourNorm) { oldCode = k; break; }
    }
    if (!oldCode) continue;
    const docs = docsByCode.get(oldCode)!;
    stats.matched++;

    // ensure case folder
    const year = c.year || new Date(c.createdAt).getFullYear();
    let yearFolderId = yearCache.get(year);
    if (!yearFolderId) { yearFolderId = await findOrCreate(String(year), SCA_CAARD_ROOT); yearCache.set(year, yearFolderId); }
    let caseFolderDrive = c.driveFolderId;
    if (!caseFolderDrive) {
      caseFolderDrive = await findOrCreate(c.code.replace(/[\/\\:*?"<>|]/g, "-"), yearFolderId);
      await prisma.case.update({ where: { id: c.id }, data: { driveFolderId: caseFolderDrive } });
    }

    // ensure escritos & resoluciones case folders
    async function ensureFolder(key: string, name: string) {
      let f = c.folders.find((x) => x.key === key);
      if (!f) {
        f = await prisma.caseFolder.create({ data: { caseId: c.id, key, name } });
        c.folders.push(f);
      }
      if (!f.driveFolderId) {
        const fid = await findOrCreate(name, caseFolderDrive!);
        f = await prisma.caseFolder.update({ where: { id: f.id }, data: { driveFolderId: fid } });
        const idx = c.folders.findIndex((x) => x.id === f!.id);
        c.folders[idx] = f;
      }
      return f;
    }
    const escritosFolder = await ensureFolder("escritos", "Escritos");
    const resolucionesFolder = await ensureFolder("resoluciones", "Resoluciones");

    for (const d of docs) {
      if (!d.file) { stats.skippedNoFile++; continue; }
      const filePath = path.join(FILES_DIR, d.file);
      if (!fs.existsSync(filePath)) { stats.skippedNoFile++; continue; }
      const isEscrito = d.idTipo === "1";
      const targetFolder = isEscrito ? escritosFolder : resolucionesFolder;
      const driveParent = targetFolder.driveFolderId!;
      try {
        const { Readable } = await import("stream");
        const buf = fs.readFileSync(filePath);
        const up = await drive.files.create({
          requestBody: { name: d.file, parents: [driveParent] },
          media: { mimeType: "application/pdf", body: Readable.from(buf) },
          fields: "id, webViewLink",
        });
        await prisma.caseDocument.create({
          data: {
            caseId: c.id,
            folderId: targetFolder.id,
            documentType: isEscrito ? "Escrito" : "Resolución",
            description: d.titulo || null,
            originalFileName: d.file,
            mimeType: "application/pdf",
            sizeBytes: BigInt(buf.length),
            driveFileId: up.data.id!,
            driveWebViewLink: up.data.webViewLink || null,
          },
        });
        stats.docsCreated++;
      } catch (e: any) {
        stats.errors++;
        console.warn(`  ${c.code} - ${d.file}: ${e.message}`);
      }
    }
    console.log(`[${c.code}] → ${docs.length} docs procesados (total creados: ${stats.docsCreated})`);
  }

  console.log("\nDone:", stats);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
