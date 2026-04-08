/**
 * FUENTE DE VERDAD: LISTA DE EXPEDIENTES ARBITRALES (2).xlsx
 * Corrige todos los casos conforme a este Excel.
 * - Upsert de cada expediente del Excel
 * - Reporta cases en DB que NO están en el Excel (para decidir qué hacer)
 */
import * as xlsx from "xlsx";
import { prisma } from "../src/lib/prisma";

const XLSX_PATH = "/Users/eduardogonzalez/Downloads/LISTA DE EXPEDIENTES ARBITRALES (2).xlsx";

function normalizeCode(s: string) {
  return s.replace(/^Exp\.\s*/i, "").replace(/\s+/g, "").toLowerCase();
}
function excelDate(serial: any): Date | null {
  if (typeof serial !== "number" || serial < 1) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  return isNaN(d.getTime()) ? null : d;
}
function mapStatus(s: string): string {
  const u = (s || "").toUpperCase().trim();
  if (u.includes("LAUDADO")) return "CLOSED";
  if (u.includes("ARCHIVADO")) return "ARCHIVED";
  if (u.includes("SUSPEND")) return "SUSPENDED";
  if (u.includes("PROCESO") || u.includes("TRÁMITE") || u.includes("TRAMITE")) return "IN_PROCESS";
  if (u.includes("ADMIT")) return "ADMITTED";
  if (u.includes("OBSERV")) return "OBSERVED";
  if (u.includes("RECHAZ") || u.includes("DENEG")) return "REJECTED";
  return "IN_PROCESS";
}
function mapTribunal(s: string): string {
  const u = (s || "").toUpperCase().trim();
  if (u.includes("TRIBUNAL")) return "TRIBUNAL_3";
  if (u.includes("ÚNICO") || u.includes("UNICO")) return "SOLE_ARBITRATOR";
  return "TRIBUNAL_3";
}
function splitParts(p: string): { claimant: string; respondent: string } {
  if (!p) return { claimant: "", respondent: "" };
  const seps = [/\s+-\s+/, /\s+\/\s+/, /\s+VS\.?\s+/i];
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

  type Row = {
    code: string; claimant: string; respondent: string;
    status: string; submittedAt: Date | null; closedAt: Date | null;
    tribunal: string; gastosCentro: number; tasa: number; total: number;
    year: number; sequence: number; typeCode: string;
  };
  const data: Row[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const code = String(r[0] || "").trim();
    if (!code || !/\d+-\d{4}-[A-Z]+\/CAARD/i.test(code)) continue;
    const parts = splitParts(String(r[1] || ""));
    const m = code.match(/(\d+)-(\d{4})-([A-Z]+)\/CAARD/i);
    const duracionTxt = String(r[5] || "").trim();
    const dmatch = duracionTxt.match(/(\d+)/);
    const durationDays = dmatch ? parseInt(dmatch[1], 10) : null;
    const consejoRaw = String(r[6] || "").toUpperCase().trim();
    const hasCouncil = consejoRaw === "SI" ? true : consejoRaw === "NO" ? false : null;
    data.push({
      code,
      claimant: parts.claimant,
      respondent: parts.respondent,
      status: mapStatus(String(r[2] || "")),
      submittedAt: excelDate(r[3]),
      closedAt: excelDate(r[4]),
      tribunal: mapTribunal(String(r[7] || "")),
      gastosCentro: Number(r[8] || 0),
      tasa: Number(r[9] || 0),
      total: Number(r[10] || 0),
      durationText: duracionTxt || null,
      durationDays,
      hasCouncil,
      year: m ? parseInt(m[2], 10) : new Date().getFullYear(),
      sequence: m ? parseInt(m[1], 10) : 0,
      typeCode: m ? m[3].toUpperCase() : "ARB",
    } as any);
  }
  console.log(`Excel: ${data.length} expedientes válidos`);

  // Load center + arbitration types
  const center = await prisma.center.findFirst({ select: { id: true } });
  if (!center) throw new Error("No center");
  const types = await prisma.arbitrationType.findMany({ select: { id: true, code: true } });
  const typeMap = new Map(types.map((t) => [t.code.toUpperCase(), t.id]));
  // default
  const arbId = typeMap.get("ARB") || types[0]?.id;
  const arbemeId = typeMap.get("ARBEME") || arbId;

  const existing = await prisma.case.findMany({ select: { id: true, code: true } });
  const existingMap = new Map(existing.map((c) => [normalizeCode(c.code), c.id]));
  const excelNorms = new Set(data.map((d) => normalizeCode(d.code)));

  let updated = 0, created = 0, skipped = 0;
  for (const d of data) {
    const normalized = normalizeCode(d.code);
    const existingId = existingMap.get(normalized);
    const typeId = d.typeCode === "ARBEME" ? arbemeId : arbId;
    const dx: any = d;
    const commonData: any = {
      code: `Exp. ${d.code}`,
      year: d.year,
      sequence: d.sequence,
      title: d.claimant && d.respondent ? `${d.claimant} vs ${d.respondent}` : (d.claimant || d.code),
      claimantName: d.claimant,
      respondentName: d.respondent,
      status: d.status as any,
      tribunalMode: d.tribunal as any,
      submittedAt: d.submittedAt,
      closedAt: d.status === "CLOSED" ? d.closedAt : null,
      currency: "PEN",
      arbitrationTypeId: typeId!,
      centerFeeCents: d.gastosCentro ? BigInt(Math.round(d.gastosCentro * 100)) : null,
      taxCents: d.tasa ? BigInt(Math.round(d.tasa * 100)) : null,
      totalAdminFeeCents: d.total ? BigInt(Math.round(d.total * 100)) : null,
      durationText: dx.durationText,
      durationDays: dx.durationDays,
      hasCouncil: dx.hasCouncil,
    };
    if (existingId) {
      await prisma.case.update({ where: { id: existingId }, data: commonData });
      updated++;
    } else {
      try {
        await prisma.case.create({
          data: {
            ...commonData,
            centerId: center.id,
            scope: "NACIONAL",
            procedureType: d.typeCode === "ARBEME" ? "EMERGENCY" : "REGULAR",
            currentStage: "DEMANDA",
          } as any,
        });
        created++;
      } catch (e: any) {
        console.warn(`  create fallo ${d.code}: ${e.message}`);
        skipped++;
      }
    }
  }

  // Cases in DB but NOT in Excel
  const orphans = existing.filter((c) => !excelNorms.has(normalizeCode(c.code)));
  console.log(`\n=== Resumen ===`);
  console.log(`Excel: ${data.length}, Updated: ${updated}, Created: ${created}, Failed: ${skipped}`);
  console.log(`Cases en DB que NO están en Excel (${orphans.length}):`);
  orphans.forEach((o) => console.log("  -", o.code));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
