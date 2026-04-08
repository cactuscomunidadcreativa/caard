/**
 * Verifica si los casos sin documentos en nuestra BD
 * tenían documentos en el SQL viejo (expedientes_detalle).
 */
import * as fs from "fs";
import { prisma } from "../src/lib/prisma";

const SQL_PATH = "/Users/eduardogonzalez/Downloads/localhost.sql";

function parseInsertValues(sql: string, table: string): string[][] {
  const re = new RegExp(`INSERT INTO \`${table}\`[^(]*\\([^)]*\\) VALUES\\s*(.*?);`, "s");
  const m = sql.match(re);
  if (!m) return [];
  const body = m[1];
  // Naive row split
  const rows: string[][] = [];
  let i = 0;
  while (i < body.length) {
    if (body[i] !== "(") { i++; continue; }
    // find matching ) respecting quotes
    let depth = 0;
    let j = i;
    let inStr = false;
    for (; j < body.length; j++) {
      const ch = body[j];
      if (inStr) {
        if (ch === "\\") { j++; continue; }
        if (ch === "'") inStr = false;
        continue;
      }
      if (ch === "'") { inStr = true; continue; }
      if (ch === "(") depth++;
      else if (ch === ")") { depth--; if (depth === 0) { j++; break; } }
    }
    const row = body.slice(i + 1, j - 1);
    // split fields
    const fields: string[] = [];
    let k = 0, cur = "", q = false;
    for (; k < row.length; k++) {
      const ch = row[k];
      if (q) {
        if (ch === "\\") { cur += ch + row[++k]; continue; }
        if (ch === "'") { q = false; continue; }
        cur += ch;
      } else {
        if (ch === "'") { q = true; continue; }
        if (ch === ",") { fields.push(cur); cur = ""; continue; }
        cur += ch;
      }
    }
    fields.push(cur);
    rows.push(fields.map((f) => f.trim()));
    i = j;
  }
  return rows;
}

async function main() {
  const sql = fs.readFileSync(SQL_PATH, "utf-8");

  // expedientes: id, numero (codigo), ...
  const expRows = parseInsertValues(sql, "expedientes");
  const detRows = parseInsertValues(sql, "expedientes_detalle");

  // Group detalle by idExp
  const docsByExp = new Map<string, number>();
  for (const r of detRows) {
    const idExp = r[1];
    docsByExp.set(idExp, (docsByExp.get(idExp) || 0) + 1);
  }

  // Build map: exp number (code) -> id -> docs count
  // Find column positions via CREATE TABLE
  const expCreate = sql.match(/CREATE TABLE `expedientes` \(([\s\S]*?)\) ENGINE/)![1];
  const cols = [...expCreate.matchAll(/`(\w+)`/g)].map((m) => m[1]);
  const iId = cols.indexOf("id");
  // guess code column
  const codeIdx = cols.findIndex((c) => /numero|codigo|nro/i.test(c));

  const expByCode = new Map<string, { id: string; docs: number }>();
  for (const r of expRows) {
    const id = r[iId];
    const code = (r[codeIdx] || "").replace(/['"]/g, "");
    expByCode.set(code, { id, docs: docsByExp.get(id) || 0 });
  }

  console.log("Total expedientes en SQL:", expRows.length);
  console.log("Total expedientes_detalle en SQL:", detRows.length);
  console.log("Exp con >0 docs en SQL:", [...docsByExp.values()].filter((n) => n > 0).length);
  console.log("Columna código detectada:", cols[codeIdx]);

  // Now check our cases without docs
  const ourCases = await prisma.case.findMany({
    select: { id: true, code: true, _count: { select: { documents: true } } },
  });
  const ourWithoutDocs = ourCases.filter((c) => c._count.documents === 0);

  let foundInOld = 0;
  let foundWithDocs = 0;
  const samples: any[] = [];
  for (const c of ourWithoutDocs) {
    // try to match by extracting number like "030-2024"
    const m = c.code.match(/(\d+)\s*-\s*(\d{4})/);
    if (!m) continue;
    const num = m[1];
    const year = m[2];
    // Find exp in SQL whose code contains num and year
    let match: { id: string; docs: number } | null = null;
    for (const [code, data] of expByCode) {
      if (code.includes(num) && code.includes(year)) { match = data; break; }
    }
    if (match) {
      foundInOld++;
      if (match.docs > 0) {
        foundWithDocs++;
        if (samples.length < 10) samples.push({ code: c.code, oldId: match.id, oldDocs: match.docs });
      }
    }
  }

  console.log(`\nCasos nuestros SIN docs: ${ourWithoutDocs.length}`);
  console.log(`  encontrados en SQL viejo: ${foundInOld}`);
  console.log(`  que SÍ tenían docs en SQL viejo: ${foundWithDocs}`);
  console.log("\nEjemplos con docs en SQL viejo:");
  console.table(samples);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
