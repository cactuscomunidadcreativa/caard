/**
 * CAARD - Migración FINAL del sistema viejo
 * Versión simplificada que SÍ funciona
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";

const p = new PrismaClient();
const SQL_PATH = "/Users/eduardogonzalez/Downloads/localhost (1).sql";
const PDF_BASE_URL = "https://old.caardpe.com/v2/files/";

// Parse a single tuple line from SQL
function parseValues(text: string): any[] {
  const values: any[] = [];
  let current = "";
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\" && i + 1 < text.length) {
        current += text[i + 1];
        i += 2;
        continue;
      }
      if (ch === "'") {
        inString = false;
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    }
    if (ch === "'") {
      inString = true;
      i++;
      continue;
    }
    if (ch === ",") {
      values.push(parseValue(current.trim()));
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  if (current.trim()) values.push(parseValue(current.trim()));
  return values;
}

function parseValue(v: string): any {
  if (v === "NULL") return null;
  if (/^-?\d+$/.test(v)) return parseInt(v);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

function extractRows(sql: string, tableName: string): any[][] {
  const escapedTable = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `INSERT INTO \`${escapedTable}\`[^;]*?VALUES\\s*([\\s\\S]*?);`,
    "g"
  );
  const matches = sql.matchAll(pattern);
  const rows: any[][] = [];
  for (const match of matches) {
    const valuesText = match[1];
    const tuplePattern = /\(((?:[^()']|'(?:[^'\\]|\\.)*')*)\)/g;
    const tupleMatches = valuesText.matchAll(tuplePattern);
    for (const tupleMatch of tupleMatches) {
      rows.push(parseValues(tupleMatch[1]));
    }
  }
  return rows;
}

function normalizeCode(raw: string): string {
  return raw
    .replace(/EXPEDIENTE\s*N[°º]?\s*/i, "")
    .replace(/-CAARD$/i, "/CAARD")
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

async function main() {
  console.log("=== MIGRACIÓN FINAL ===\n");

  const sql = fs.readFileSync(SQL_PATH, "utf-8");

  // 1. Parse expedientes
  const expRows = extractRows(sql, "expedientes");
  console.log(`Expedientes en SQL: ${expRows.length}`);

  // 2. Parse detalles
  const detRows = extractRows(sql, "expedientes_detalle");
  console.log(`Documentos en SQL: ${detRows.length}\n`);

  const center = await p.center.findFirst({ where: { code: "CAARD" } });
  if (!center) throw new Error("No center");

  const author = await p.user.findFirst({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
  });
  if (!author) throw new Error("No author");

  const arbType = await p.arbitrationType.findFirst({
    where: { centerId: center.id, code: "SOLICITUD_ARBITRAJE" },
  });
  if (!arbType) throw new Error("No arb type");

  // 3. Get all current cases
  const allCases = await p.case.findMany({ select: { id: true, code: true } });
  console.log(`Casos en DB nueva: ${allCases.length}`);

  // Build lookup map for case matching
  const caseByCode = new Map<string, string>();
  for (const c of allCases) {
    const norm = normalizeCode(c.code);
    caseByCode.set(norm, c.id);
    // Without /CAARD suffix
    const noCaard = norm.replace(/\/CAARD$/, "");
    caseByCode.set(noCaard, c.id);
    // Without "EXP." prefix
    caseByCode.set(norm.replace(/^EXP\.?/, ""), c.id);
  }

  // 4. Process expedientes - build idExp -> caseId map
  const expIdToCaseId = new Map<number, string>();
  const passwordHash = await bcrypt.hash("Caard2025!", 12);
  let matched = 0;
  let createdCases = 0;
  let usersCreated = 0;

  console.log("\n📋 Procesando expedientes...");
  for (const row of expRows) {
    const id = row[0];
    const nro_exp = row[1] || "";
    const nombre = row[2] || "";
    const code = row[3] || "";

    const normalized = normalizeCode(nro_exp);
    let caseId = caseByCode.get(normalized);
    if (!caseId) {
      caseId = caseByCode.get(normalized.replace(/\/CAARD$/, ""));
    }
    if (!caseId) {
      caseId = caseByCode.get("EXP." + normalized);
    }

    if (caseId) {
      expIdToCaseId.set(id, caseId);
      matched++;
    } else {
      // Create new case
      try {
        const yearMatch = nro_exp.match(/(\d{4})/);
        const seqMatch = nro_exp.match(/(\d{1,3})-/);
        const year = yearMatch ? parseInt(yearMatch[1]) : 2022;
        const sequence = seqMatch ? parseInt(seqMatch[1]) : 0;

        const newCase = await p.case.create({
          data: {
            centerId: center.id,
            arbitrationTypeId: arbType.id,
            year,
            sequence,
            code: `Exp. ${normalized}`,
            title: `Expediente ${nro_exp}`,
            status: "ARCHIVED",
            scope: "NACIONAL",
            procedureType: "REGULAR",
            tribunalMode: "TRIBUNAL_3",
            claimantName: nombre || "Por completar",
            respondentName: "Por completar",
            currency: "PEN",
            isBlocked: true,
            blockReason: "Migrado del sistema viejo - faltan datos",
          },
        });
        expIdToCaseId.set(id, newCase.id);
        createdCases++;
      } catch (e: any) {
        // skip
      }
    }

    // Create cliente user
    const finalCaseId = expIdToCaseId.get(id);
    if (finalCaseId && nombre && code) {
      const cleanUsername = nombre.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (cleanUsername.length > 3) {
        const userEmail = `${cleanUsername}@cliente.caard.pe`;
        try {
          const clientHash = await bcrypt.hash(code, 12);
          const user = await p.user.upsert({
            where: { email: userEmail },
            update: { passwordHash: clientHash },
            create: {
              email: userEmail,
              name: nombre,
              role: "DEMANDANTE",
              centerId: center.id,
              passwordHash: clientHash,
              isActive: true,
            },
          });

          const existing = await p.caseMember.findFirst({
            where: { caseId: finalCaseId, userId: user.id },
          });
          if (!existing) {
            await p.caseMember.create({
              data: {
                caseId: finalCaseId,
                userId: user.id,
                role: "DEMANDANTE",
                displayName: nombre,
                email: userEmail,
                isPrimary: false,
              },
            });
            usersCreated++;
          }
        } catch {}
      }
    }
  }

  console.log(`  ✓ Vinculados: ${matched}`);
  console.log(`  + Casos nuevos: ${createdCases}`);
  console.log(`  + Usuarios cliente: ${usersCreated}`);
  console.log(`  Map size: ${expIdToCaseId.size}`);

  // 5. Process documents
  console.log("\n📎 Procesando documentos...");
  let docsCreated = 0;
  let docsSkipped = 0;
  const folderCache = new Map<string, string>();

  for (const row of detRows) {
    const id = row[0];
    const idExp = row[1];
    const idTipo = row[2];
    const titulo = row[3] || "";
    const file = row[4] || "";
    const status = row[5];

    if (!file || file === "NULL") {
      docsSkipped++;
      continue;
    }

    const caseId = expIdToCaseId.get(idExp);
    if (!caseId) {
      docsSkipped++;
      continue;
    }

    const folderKey = idTipo === 1 ? "escritos" : "resoluciones";
    const cacheKey = `${caseId}-${folderKey}`;
    let folderId = folderCache.get(cacheKey);

    if (!folderId) {
      let folder = await p.caseFolder.findFirst({
        where: { caseId, key: folderKey },
      });
      if (!folder) {
        folder = await p.caseFolder.create({
          data: {
            caseId,
            key: folderKey,
            name: idTipo === 1 ? "Escritos" : "Resoluciones",
          },
        });
      }
      folderId = folder.id;
      folderCache.set(cacheKey, folderId);
    }

    const fileUrl = PDF_BASE_URL + file;
    const docTitle = titulo || (idTipo === 1 ? "Escrito" : "Resolución");

    try {
      await p.caseDocument.create({
        data: {
          caseId,
          folderId,
          uploadedById: author.id,
          documentType: idTipo === 1 ? "Escrito" : "Resolución",
          description: docTitle,
          originalFileName: `${docTitle}.pdf`,
          storedFileName: file,
          mimeType: "application/pdf",
          sizeBytes: BigInt(0),
          checksumSha256: `migrated-${id}`,
          driveFileId: `migrated-${id}`,
          driveWebViewLink: fileUrl,
          driveDownloadLink: fileUrl,
          status: status === 1 ? "ACTIVE" : "REPLACED",
        },
      });
      docsCreated++;
      if (docsCreated % 100 === 0) console.log(`  ... ${docsCreated} docs`);
    } catch (e: any) {
      docsSkipped++;
      if (docsSkipped < 5) console.log(`    Error doc ${id}: ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n  ✓ Documentos creados: ${docsCreated}`);
  console.log(`  - Omitidos: ${docsSkipped}`);

  // Final stats
  const finalDocs = await p.caseDocument.count();
  const finalCases = await p.case.count();
  const finalUsers = await p.user.count();

  console.log(`\n=== TOTALES ===`);
  console.log(`Casos: ${finalCases}`);
  console.log(`Documentos: ${finalDocs}`);
  console.log(`Usuarios: ${finalUsers}`);

  await p.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
