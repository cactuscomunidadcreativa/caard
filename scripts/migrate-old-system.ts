/**
 * CAARD - Migración del sistema viejo /v2 al CAARD nuevo
 *
 * Importa:
 * - 150 expedientes (nro_exp, nombre_usuario, code_usuario)
 * - 2,388 documentos detalle (escritos y resoluciones)
 *
 * Vincula los expedientes viejos con los casos ya existentes en el CAARD nuevo.
 * Crea CaseDocument para cada PDF.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const p = new PrismaClient();

const SQL_PATH = "/Users/eduardogonzalez/Downloads/localhost (1).sql";
const PDF_BASE_URL = "https://old.caardpe.com/v2/files/";

interface OldExpediente {
  id: number;
  nro_exp: string;
  nombre_usuario: string;
  code_usuario: string;
  status: number;
}

interface OldDetalle {
  id: number;
  idExp: number;
  idTipo: number; // 1=escritos, 2=resoluciones
  titulo: string;
  file: string;
  status: number;
}

function parseSqlInserts<T = any>(sql: string, tableName: string): T[] {
  // Find all INSERT INTO statements for this table
  const pattern = new RegExp(
    `INSERT INTO \`${tableName}\`[^;]*?VALUES\\s*([\\s\\S]*?);`,
    "g"
  );
  const matches = sql.matchAll(pattern);
  const rows: any[] = [];

  for (const match of matches) {
    const valuesText = match[1];
    // Parse value tuples - careful with strings containing commas
    const tuplePattern = /\(((?:[^()']|'(?:[^'\\]|\\.)*')*)\)/g;
    const tupleMatches = valuesText.matchAll(tuplePattern);

    for (const tupleMatch of tupleMatches) {
      const values = parseValues(tupleMatch[1]);
      rows.push(values);
    }
  }
  return rows;
}

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

  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

function parseValue(v: string): any {
  if (v === "NULL") return null;
  if (/^-?\d+$/.test(v)) return parseInt(v);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

// Normalize expediente code - remove "EXPEDIENTE N°", spaces, convert ARB-CAARD to ARB/CAARD
function normalizeCode(raw: string): string {
  return raw
    .replace(/EXPEDIENTE\s*N[°º]?\s*/i, "")
    .replace(/-CAARD$/i, "/CAARD")
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

async function main() {
  console.log("=== Migración Sistema Viejo /v2 → CAARD nuevo ===\n");

  const sql = fs.readFileSync(SQL_PATH, "utf-8");

  // Parse expedientes
  const expRows = parseSqlInserts(sql, "expedientes");
  const expedientes: OldExpediente[] = expRows.map((r) => ({
    id: r[0],
    nro_exp: r[1] || "",
    nombre_usuario: r[2] || "",
    code_usuario: r[3] || "",
    status: r[4],
  }));
  console.log(`Expedientes parseados: ${expedientes.length}`);

  // Parse detalles
  const detRows = parseSqlInserts(sql, "expedientes_detalle");
  const detalles: OldDetalle[] = detRows.map((r) => ({
    id: r[0],
    idExp: r[1],
    idTipo: r[2],
    titulo: r[3] || "",
    file: r[4] || "",
    status: r[5],
  }));
  console.log(`Documentos parseados: ${detalles.length}`);

  // Get center
  const center = await p.center.findFirst({ where: { code: "CAARD" } });
  if (!center) throw new Error("No center");

  const author = await p.user.findFirst({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
  });
  if (!author) throw new Error("No author");

  // Get all current cases for matching
  const allCases = await p.case.findMany({
    select: { id: true, code: true },
  });
  console.log(`Casos actuales en CAARD nuevo: ${allCases.length}`);

  // Build lookup by normalized code
  const caseByCode = new Map<string, string>();
  for (const c of allCases) {
    const normalized = normalizeCode(c.code);
    caseByCode.set(normalized, c.id);
    // Also try without "Exp." prefix
    const noExp = normalized.replace(/^EXP\.?/, "").trim();
    caseByCode.set(noExp, c.id);
  }

  // Process expedientes - link to existing cases or create new ones
  const expIdToCaseId = new Map<number, string>();
  let matched = 0;
  let created = 0;
  let inactive = 0;
  const passwordHash = await bcrypt.hash("Caard2025!", 12);

  console.log("\n=== Procesando expedientes ===");
  for (const exp of expedientes) {
    if (exp.status !== 1) {
      inactive++;
      // Don't skip - still process docs but mark accordingly
    }

    const normalized = normalizeCode(exp.nro_exp);
    let caseId = caseByCode.get(normalized);

    // Try variations
    if (!caseId) {
      // Try without /CAARD
      const noCaard = normalized.replace(/\/CAARD$/, "");
      caseId = caseByCode.get(noCaard) || caseByCode.get(noCaard + "/CAARD");
    }

    if (caseId) {
      expIdToCaseId.set(exp.id, caseId);
      matched++;
    } else {
      // Create new case for orphan expedientes (those not in the new CAARD)
      try {
        const yearMatch = exp.nro_exp.match(/(\d{4})/);
        const seqMatch = exp.nro_exp.match(/(\d{1,3})-/);
        const year = yearMatch ? parseInt(yearMatch[1]) : 2022;
        const sequence = seqMatch ? parseInt(seqMatch[1]) : 0;

        const arbType = await p.arbitrationType.findFirst({
          where: { centerId: center.id, code: "SOLICITUD_ARBITRAJE" },
        });

        if (arbType) {
          const newCase = await p.case.create({
            data: {
              centerId: center.id,
              arbitrationTypeId: arbType.id,
              year,
              sequence,
              code: `Exp. ${normalized}`,
              title: `Expediente ${exp.nro_exp}`,
              status: "ARCHIVED",
              scope: "NACIONAL",
              procedureType: "REGULAR",
              tribunalMode: "TRIBUNAL_3",
              claimantName: "Por completar",
              respondentName: "Por completar",
              currency: "PEN",
              isBlocked: true,
              blockReason: "Expediente migrado del sistema viejo - faltan datos",
            },
          });
          expIdToCaseId.set(exp.id, newCase.id);
          created++;
        }
      } catch (e: any) {
        // Skip duplicates
      }
    }

    // Create access user for the expediente client
    if (caseId || expIdToCaseId.has(exp.id)) {
      const finalCaseId = expIdToCaseId.get(exp.id)!;
      const cleanUsername = exp.nombre_usuario.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (cleanUsername.length > 3) {
        const userEmail = `${cleanUsername}@cliente.caard.pe`;

        try {
          // Use the original code_usuario as password (hashed)
          const clientPasswordHash = await bcrypt.hash(exp.code_usuario, 12);

          let user = await p.user.findUnique({ where: { email: userEmail } });
          if (!user) {
            user = await p.user.create({
              data: {
                email: userEmail,
                name: exp.nombre_usuario || `Cliente ${exp.nro_exp}`,
                role: "DEMANDANTE",
                centerId: center.id,
                passwordHash: clientPasswordHash,
                isActive: true,
              },
            });
          }

          // Link user to case as member if not already
          const existing = await p.caseMember.findFirst({
            where: { caseId: finalCaseId, userId: user.id },
          });
          if (!existing) {
            await p.caseMember.create({
              data: {
                caseId: finalCaseId,
                userId: user.id,
                role: "DEMANDANTE",
                displayName: exp.nombre_usuario,
                email: userEmail,
                isPrimary: false,
              },
            });
          }
        } catch (e: any) {
          // Skip duplicates
        }
      }
    }
  }

  console.log(`  ✓ Vinculados a casos existentes: ${matched}`);
  console.log(`  + Nuevos casos creados: ${created}`);
  console.log(`  - Inactivos (skip): ${inactive}`);

  // Process documents
  console.log("\n=== Procesando documentos ===");
  let docsCreated = 0;
  let docsSkipped = 0;

  console.log(`  Map size: ${expIdToCaseId.size} (deberían estar todos)`);
  console.log(`  Sample map entries:`, Array.from(expIdToCaseId.entries()).slice(0, 3));
  console.log(`  First 3 detalles to process:`, detalles.slice(0, 3));

  for (const det of detalles) {
    if (!det.file) {
      docsSkipped++;
      continue;
    }

    const caseId = expIdToCaseId.get(det.idExp);
    if (!caseId) {
      if (docsSkipped < 5) console.log(`    Skip det.id=${det.id} idExp=${det.idExp} no map entry`);
      docsSkipped++;
      continue;
    }

    // Find the right folder (escritos or resoluciones)
    const folderKey = det.idTipo === 1 ? "escritos" : "resoluciones";
    let folder = await p.caseFolder.findFirst({
      where: { caseId, key: folderKey },
    });

    if (!folder) {
      // Create the folder if it doesn't exist
      folder = await p.caseFolder.create({
        data: {
          caseId,
          key: folderKey,
          name: det.idTipo === 1 ? "Escritos" : "Resoluciones",
        },
      });
    }

    const fileUrl = PDF_BASE_URL + det.file;
    const docTitle = det.titulo || (det.idTipo === 1 ? "Escrito" : "Resolución");

    try {
      await p.caseDocument.create({
        data: {
          caseId,
          folderId: folder.id,
          uploadedById: author.id,
          originalFileName: docTitle ? `${docTitle}.pdf` : det.file,
          storedFileName: det.file,
          mimeType: "application/pdf",
          sizeBytes: BigInt(0),
          checksumSha256: `migrated-${det.id}`,
          driveFileId: "",
          driveWebViewLink: fileUrl,
          driveDownloadLink: fileUrl,
          status: det.status === 1 ? "ACTIVE" : "REPLACED",
        },
      });
      docsCreated++;
    } catch (e: any) {
      docsSkipped++;
    }
  }

  console.log(`  ✓ Documentos creados: ${docsCreated}`);
  console.log(`  - Omitidos (sin archivo o caso): ${docsSkipped}`);

  // Final stats
  const totalDocs = await p.caseDocument.count();
  const totalCases = await p.case.count();
  const totalUsers = await p.user.count();

  console.log("\n=== RESUMEN FINAL ===");
  console.log(`Total casos en CAARD: ${totalCases}`);
  console.log(`Total documentos: ${totalDocs}`);
  console.log(`Total usuarios: ${totalUsers}`);
  console.log("\nLos clientes pueden acceder con:");
  console.log("  Email: <usuario_normalizado>@cliente.caard.pe");
  console.log("  Password: el code_usuario original del sistema viejo");

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
