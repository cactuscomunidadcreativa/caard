/**
 * Sincroniza ARBEMEs desde LISTA DE EXPEDIENTES DE EMERGENCIA.xlsx
 * Columnas: N° EXP, PARTES, FECHA PRESENTACIÓN, PROCESO PRINCIPAL, ESTADO, GASTOS, TASA, TOTAL
 */
import * as xlsx from "xlsx";
import { prisma } from "../src/lib/prisma";

const XLSX = "/Users/eduardogonzalez/Downloads/LISTA DE EXPEDIENTES DE EMERGENCIA (1).xlsx";

const norm = (s: string) => s.replace(/^Exp\.\s*/i, "").replace(/\s+/g, "").toLowerCase();
const excelDate = (n: any) => (typeof n === "number" && n > 1 ? new Date(Date.UTC(1899, 11, 30) + n * 86400000) : null);

function mapStatus(s: string) {
  const u = (s || "").toUpperCase().trim();
  if (u.includes("LAUDADO")) return "CLOSED";
  if (u.includes("ARCHIVADO")) return "ARCHIVED";
  if (u.includes("VIGENTE") || u.includes("PROCESO")) return "IN_PROCESS";
  return "IN_PROCESS";
}
function splitParts(p: string) {
  const seps = [/\s+-\s+/, /\s+VS\.?\s+/i];
  for (const re of seps) {
    const parts = p.split(re);
    if (parts.length >= 2) return { c: parts[0].trim(), r: parts.slice(1).join(" - ").trim() };
  }
  return { c: p.trim(), r: "" };
}

async function main() {
  const wb = xlsx.readFile(XLSX);
  const rows: any[] = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });

  const center = await prisma.center.findFirst({ select: { id: true } });
  const types = await prisma.arbitrationType.findMany({ select: { id: true, code: true } });
  const arbemeId = types.find((t) => t.code.toUpperCase() === "ARBEME")?.id || types[0].id;

  const existing = await prisma.case.findMany({ select: { id: true, code: true } });
  const existingMap = new Map(existing.map((c) => [norm(c.code), c.id]));

  let updated = 0, created = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const code = String(r[0] || "").trim();
    if (!code || !code.includes("ARBEME")) continue;
    const parts = splitParts(String(r[1] || ""));
    const m = code.match(/(\d+)-(\d{4})-/);
    const data: any = {
      code: `Exp. ${code}`,
      year: m ? parseInt(m[2], 10) : 2023,
      sequence: m ? parseInt(m[1], 10) : 0,
      title: parts.c && parts.r ? `${parts.c} vs ${parts.r}` : parts.c || code,
      claimantName: parts.c,
      respondentName: parts.r,
      submittedAt: excelDate(r[2]),
      relatedMainCaseCode: String(r[3] || "").trim() || null,
      status: mapStatus(String(r[4] || "")) as any,
      centerFeeCents: r[5] ? BigInt(Math.round(Number(r[5]) * 100)) : null,
      taxCents: r[6] ? BigInt(Math.round(Number(r[6]) * 100)) : null,
      totalAdminFeeCents: r[7] ? BigInt(Math.round(Number(r[7]) * 100)) : null,
      tribunalMode: "SOLE_ARBITRATOR" as any,
      procedureType: "EMERGENCY" as any,
      currency: "PEN",
      arbitrationTypeId: arbemeId,
    };
    const existingId = existingMap.get(norm(code));
    if (existingId) {
      await prisma.case.update({ where: { id: existingId }, data });
      updated++;
    } else {
      try {
        await prisma.case.create({
          data: { ...data, centerId: center!.id, scope: "NACIONAL", currentStage: "DEMANDA" },
        });
        created++;
      } catch (e: any) {
        console.warn(`create ${code}: ${e.message}`);
      }
    }
  }
  console.log(`ARBEMEs: updated ${updated}, created ${created}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
