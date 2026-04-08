/**
 * Sincroniza del SQL viejo /v2 hacia Case:
 * - claimantName (nombre_usuario)
 * - Código de cliente asociado (code_usuario) — lo usamos para buscar el User
 *   y linkearlo como CaseMember rol DEMANDANTE si existe.
 */
import * as fs from "fs";
import { prisma } from "../src/lib/prisma";

const SQL_PATH = "/Users/eduardogonzalez/Downloads/localhost.sql";

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
  const sql = fs.readFileSync(SQL_PATH, "utf-8");
  const expRows = parseInsertRows(sql, "expedientes");
  // cols: id, nro_exp, nombre_usuario, code_usuario, status, ...
  const byNorm = new Map<string, { nro_exp: string; nombre: string; code: string }>();
  for (const r of expRows) {
    const nro = r[1];
    const nombre = r[2];
    const code = r[3];
    byNorm.set(normalizeCode(nro), { nro_exp: nro, nombre, code });
  }

  const ourCases = await prisma.case.findMany({ select: { id: true, code: true, claimantName: true } });
  console.log(`Cases: ${ourCases.length}, exp in SQL: ${expRows.length}`);

  let updated = 0;
  for (const c of ourCases) {
    const norm = normalizeCode(c.code);
    const old = byNorm.get(norm);
    if (!old || !old.nombre) continue;
    if (c.claimantName === old.nombre) continue;
    await prisma.case.update({
      where: { id: c.id },
      data: { claimantName: old.nombre },
    });
    updated++;
  }
  console.log(`Cases con claimantName actualizado: ${updated}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
