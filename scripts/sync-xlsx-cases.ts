/**
 * Sincroniza datos del Excel "LISTA DE EXPEDIENTES ARBITRALES" hacia Case.
 * Extrae: partes (demandante - demandado), estado, fechas, tribunal mode, montos.
 */
import * as xlsx from "xlsx";
import { prisma } from "../src/lib/prisma";

const XLSX_PATH = "/Users/eduardogonzalez/Downloads/LISTA DE EXPEDIENTES ARBITRALES (1).xlsx";

function normalizeCode(s: string) {
  return s.replace(/^Exp\.\s*/i, "").replace(/\s+/g, "").toLowerCase();
}

function excelDate(serial: any): Date | null {
  if (typeof serial !== "number" || serial < 1) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  if (isNaN(d.getTime())) return null;
  return d;
}

function mapStatus(s: string): string | null {
  const u = (s || "").toUpperCase().trim();
  if (u.includes("LAUDADO") || u.includes("ARCHIVADO")) return "CLOSED";
  if (u.includes("PROCESO") || u.includes("TRAMITE") || u.includes("TRÁMITE")) return "IN_PROCESS";
  if (u.includes("SUSPEND")) return "SUSPENDED";
  if (u.includes("ADMIT")) return "ADMITTED";
  if (u.includes("OBSERV")) return "OBSERVED";
  if (u.includes("RECHAZ") || u.includes("DENEG")) return "REJECTED";
  return null;
}

function mapTribunal(s: string): string | null {
  const u = (s || "").toUpperCase().trim();
  if (u.includes("TRIBUNAL")) return "TRIBUNAL_3";
  if (u.includes("ÚNICO") || u.includes("UNICO")) return "SOLE_ARBITRATOR";
  return null;
}

function splitParts(p: string): { claimant: string; respondent: string } {
  if (!p) return { claimant: "", respondent: "" };
  // Common separator " - " or " / " or " VS "
  const seps = [/\s+-\s+/, /\s+\/\s+/, /\s+VS\.?\s+/i, /\s+V\.?\s+/i];
  for (const re of seps) {
    const parts = p.split(re);
    if (parts.length >= 2) {
      return { claimant: parts[0].trim(), respondent: parts.slice(1).join(" - ").trim() };
    }
  }
  return { claimant: p.trim(), respondent: "" };
}

async function main() {
  const wb = xlsx.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<any>(ws, { header: 1, defval: "" });

  const data = new Map<string, any>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const code = String(r[0] || "").trim();
    if (!code || !code.includes("ARB")) continue;
    const parts = splitParts(String(r[1] || ""));
    data.set(normalizeCode(code), {
      code,
      claimant: parts.claimant,
      respondent: parts.respondent,
      estado: String(r[2] || ""),
      fechaPresentacion: excelDate(r[3]),
      fechaFin: excelDate(r[4]),
      duracion: String(r[5] || ""),
      consejo: String(r[6] || ""),
      composicion: String(r[7] || ""),
      gastosCentro: Number(r[8] || 0),
      tasa: Number(r[9] || 0),
      totalTasa: Number(r[10] || 0),
    });
  }
  console.log(`Excel parseado: ${data.size} expedientes`);

  const ourCases = await prisma.case.findMany({ select: { id: true, code: true, title: true } });
  console.log(`Cases DB: ${ourCases.length}`);

  let updated = 0, notFound = 0;
  for (const c of ourCases) {
    const row = data.get(normalizeCode(c.code));
    if (!row) continue;
    const updates: any = {};
    if (row.claimant) updates.claimantName = row.claimant;
    if (row.respondent) updates.respondentName = row.respondent;
    const status = mapStatus(row.estado);
    if (status) updates.status = status;
    const trib = mapTribunal(row.composicion);
    if (trib) updates.tribunalMode = trib;
    if (row.fechaPresentacion) updates.submittedAt = row.fechaPresentacion;
    if (row.fechaFin && (status === "CLOSED")) updates.closedAt = row.fechaFin;
    // title: use partes if our title is empty or generic
    if (row.claimant && row.respondent && (!c.title || c.title.trim().length < 5)) {
      updates.title = `${row.claimant} vs ${row.respondent}`;
    }
    await prisma.case.update({ where: { id: c.id }, data: updates });
    updated++;
  }
  // Extra: excel items not in DB
  for (const [norm, row] of data) {
    const exists = ourCases.some((c) => normalizeCode(c.code) === norm);
    if (!exists) notFound++;
  }
  console.log(`Cases actualizados: ${updated}, xlsx no matched: ${notFound}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
