/**
 * Importa datos de CAARD_Plantilla_Migracion.xlsx a la BD.
 * Upsert de casos por código y sincroniza members.
 */
import * as xlsx from "xlsx";
import { prisma } from "../src/lib/prisma";

const XLSX_PATH = "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Migracion (1).xlsx";

const normCode = (s: string) =>
  s.replace(/^Exp\.?\s*/i, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

function excelDate(serial: any): Date | null {
  if (!serial) return null;
  if (typeof serial === "string") {
    const d = new Date(serial);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof serial === "number" && serial > 1) {
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

async function main() {
  const wb = xlsx.readFile(XLSX_PATH);

  // Helper to read a sheet - finds the first row that looks like headers
  function readSheet(name: string): Record<string, any>[] {
    const raw = xlsx.utils.sheet_to_json<any>(wb.Sheets[name], { header: 1, defval: "" });
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(5, raw.length); i++) {
      const r = raw[i];
      if (Array.isArray(r) && r.some((c: any) => String(c).trim() === "id")) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx < 0) return [];
    const headers = raw[headerRowIdx].map((h: any) => String(h).replace(/\*$/, "").trim());
    const rows: Record<string, any>[] = [];
    for (let i = headerRowIdx + 1; i < raw.length; i++) {
      const r = raw[i];
      if (!r || !r[0]) continue;
      const obj: any = {};
      headers.forEach((h: string, idx: number) => (obj[h] = r[idx]));
      rows.push(obj);
    }
    return rows;
  }

  const casesPlantilla = readSheet("05_Cases");
  const membersPlantilla = readSheet("06_CaseMembers");
  console.log(`Plantilla: ${casesPlantilla.length} cases, ${membersPlantilla.length} members`);

  // Map plantillaCaseId -> realCaseId
  const plantillaToReal = new Map<string, string>();
  const center = await prisma.center.findFirst();
  if (!center) throw new Error("No center");
  const dbCases = await prisma.case.findMany({ select: { id: true, code: true } });
  const dbByNorm = new Map(dbCases.map((c) => [normCode(c.code), c.id]));
  const arbTypes = await prisma.arbitrationType.findMany();
  const defaultType = arbTypes.find((t) => t.code === "ARB") || arbTypes[0];
  const emergencyType = arbTypes.find((t) => t.code === "EMERGENCIA") || defaultType;

  let updated = 0, created = 0;
  for (const row of casesPlantilla) {
    const code = String(row.code || "").trim();
    if (!code) continue;
    const norm = normCode(code);
    const existingId = dbByNorm.get(norm);
    const isEmergency = row.procedureType === "EMERGENCY" || /ARBEME/i.test(code);
    const typeId = isEmergency ? emergencyType.id : defaultType.id;

    const data: any = {
      title: row.title || undefined,
      status: row.status || undefined,
      scope: row.scope || undefined,
      procedureType: row.procedureType || undefined,
      tribunalMode: row.tribunalMode || undefined,
      currentStage: row.currentStage || undefined,
      claimantName: row.claimantName || undefined,
      respondentName: row.respondentName || undefined,
      currency: row.currency || undefined,
    };
    if (row.disputeAmountCents) {
      try { data.disputeAmountCents = BigInt(String(row.disputeAmountCents)); } catch {}
    }
    if (row.submittedAt) data.submittedAt = excelDate(row.submittedAt);
    if (row.admittedAt) data.admittedAt = excelDate(row.admittedAt);
    if (row.closedAt) data.closedAt = excelDate(row.closedAt);

    // Limpiar undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    if (existingId) {
      await prisma.case.update({ where: { id: existingId }, data });
      plantillaToReal.set(String(row.id), existingId);
      updated++;
    } else {
      // Create
      try {
        const c = await prisma.case.create({
          data: {
            ...data,
            code,
            year: Number(row.year) || new Date().getFullYear(),
            sequence: Number(row.sequence) || 0,
            centerId: center.id,
            arbitrationTypeId: typeId,
            status: data.status || "IN_PROCESS",
            scope: data.scope || "NACIONAL",
            procedureType: data.procedureType || (isEmergency ? "EMERGENCY" : "REGULAR"),
            title: data.title || code,
          } as any,
        });
        plantillaToReal.set(String(row.id), c.id);
        created++;
      } catch (e: any) {
        console.warn(`case ${code}: ${e.message}`);
      }
    }
  }
  console.log(`Cases: ${updated} updated, ${created} created`);

  // Members
  let memCreated = 0, memSkipped = 0;
  for (const row of membersPlantilla) {
    const plCase = String(row.caseId || "").trim();
    const realCaseId = plantillaToReal.get(plCase);
    if (!realCaseId) { memSkipped++; continue; }
    const role = String(row.role || "").trim();
    if (!role) { memSkipped++; continue; }
    const displayName = String(row.displayName || "").trim();
    if (!displayName) { memSkipped++; continue; }
    // Upsert: check if already exists with same caseId + role + displayName
    const exist = await prisma.caseMember.findFirst({
      where: { caseId: realCaseId, role: role as any, displayName },
    });
    if (exist) { memSkipped++; continue; }
    try {
      await prisma.caseMember.create({
        data: {
          caseId: realCaseId,
          role: role as any,
          displayName,
          email: (String(row.email || "").split(/[\r\n,]/)[0] || "").trim() || null,
          phoneE164: String(row.phoneE164 || "").trim() || null,
          isPrimary: String(row.isPrimary || "").toLowerCase() === "true",
        },
      });
      memCreated++;
    } catch (e: any) {
      memSkipped++;
      console.warn(`member ${displayName} -> ${e.message}`);
    }
  }
  console.log(`Members: ${memCreated} created, ${memSkipped} skipped`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
