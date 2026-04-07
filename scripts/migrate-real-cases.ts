/**
 * CAARD - Migración de los 128 expedientes reales del Excel
 * Borra los casos demo y crea los reales con sus partes, fechas, montos
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const p = new PrismaClient();

interface ExcelCase {
  code: string;
  parts: string;
  state: string;
  submittedAt: string | null;
  closedAt: string | null;
  duration: string;
  consejo: string;
  tribunal: string;
  gastosCenter: number;
  tasa: number;
  total: number;
}

// Mapeo estado Excel -> CaseStatus enum
const STATUS_MAP: Record<string, string> = {
  LAUDADO: "CLOSED",
  ARCHIVADO: "ARCHIVED",
  VIGENTE: "IN_PROCESS",
  "?": "UNDER_REVIEW",
};

const TRIBUNAL_MAP: Record<string, string> = {
  "TRIBUNAL ARBITRAL": "TRIBUNAL_3",
  "ÁRBITRO ÚNICO": "SOLE_ARBITRATOR",
  "": "TRIBUNAL_3",
  "-": "TRIBUNAL_3",
};

function parseCode(code: string): { sequence: number; year: number } {
  // Format: "001-2022-ARB/CAARD" or "001-2022-ARBEME/CAARD"
  const match = code.match(/^(\d+)-(\d{4})/);
  if (match) {
    return { sequence: parseInt(match[1]), year: parseInt(match[2]) };
  }
  return { sequence: 0, year: new Date().getFullYear() };
}

function parseParts(parts: string): { claimant: string; respondent: string } {
  // Format: "DEMANDANTE - DEMANDADO"
  const dashIndex = parts.indexOf(" - ");
  if (dashIndex > 0) {
    return {
      claimant: parts.substring(0, dashIndex).trim(),
      respondent: parts.substring(dashIndex + 3).trim(),
    };
  }
  return { claimant: parts, respondent: "" };
}

async function main() {
  console.log("=== Migración de 128 expedientes reales ===\n");

  // Read Excel data
  const cases: ExcelCase[] = JSON.parse(fs.readFileSync("/tmp/excel_cases.json", "utf-8"));
  console.log("Casos en Excel:", cases.length);

  const center = await p.center.findFirst({ where: { code: "CAARD" } });
  if (!center) throw new Error("No center");

  // Get arbitration types
  const solicitudType = await p.arbitrationType.findFirst({
    where: { centerId: center.id, code: "SOLICITUD_ARBITRAJE" },
  });
  const emergenciaType = await p.arbitrationType.findFirst({
    where: { centerId: center.id, code: "EMERGENCIA" },
  });

  if (!solicitudType) throw new Error("No SOLICITUD_ARBITRAJE type");

  // STEP 1: Delete all existing cases and dependents
  console.log("\n1. Borrando casos existentes...");
  const deleteCounts = {
    notes: await p.caseNote.deleteMany(),
    deadlines: await p.caseDeadline.deleteMany(),
    documents: await p.caseDocument.deleteMany(),
    folders: await p.caseFolder.deleteMany(),
    payments: await p.payment.deleteMany(),
    paymentOrders: await p.paymentOrder.deleteMany(),
    members: await p.caseMember.deleteMany(),
    cases: await p.case.deleteMany(),
  };
  Object.entries(deleteCounts).forEach(([k, v]) => console.log(`   - ${k}: ${v.count}`));

  // STEP 2: Create the 128 real cases
  console.log("\n2. Creando 128 casos reales...");
  let created = 0;
  let skipped = 0;

  for (const ec of cases) {
    try {
      const { sequence, year } = parseCode(ec.code);
      const { claimant, respondent } = parseParts(ec.parts);
      const isEmergency = ec.code.includes("ARBEME");
      const arbitrationTypeId = isEmergency && emergenciaType ? emergenciaType.id : solicitudType.id;
      const status = STATUS_MAP[ec.state] || "UNDER_REVIEW";
      const tribunalMode = TRIBUNAL_MAP[ec.tribunal] || "TRIBUNAL_3";

      // Build the full code with /CAARD suffix
      const fullCode = `Exp. ${ec.code}`;

      // Title from parts
      const title = `${claimant} vs ${respondent}`.substring(0, 300);

      // Calculate dispute amount in cents from total
      const disputeAmountCents = ec.total > 0 ? BigInt(Math.round(ec.total * 100)) : null;

      const newCase = await p.case.create({
        data: {
          centerId: center.id,
          arbitrationTypeId,
          year,
          sequence,
          code: fullCode,
          title,
          status: status as any,
          scope: "NACIONAL",
          procedureType: isEmergency ? "EMERGENCY" : "REGULAR",
          tribunalMode: tribunalMode as any,
          claimantName: claimant,
          respondentName: respondent,
          disputeAmountCents,
          currency: "PEN",
          submittedAt: ec.submittedAt ? new Date(ec.submittedAt) : null,
          closedAt: ec.closedAt ? new Date(ec.closedAt) : null,
          admittedAt: ec.submittedAt ? new Date(ec.submittedAt) : null,
        },
      });

      // Create members
      await p.caseMember.create({
        data: {
          caseId: newCase.id,
          role: "DEMANDANTE",
          displayName: claimant,
          isPrimary: true,
        },
      });

      if (respondent) {
        await p.caseMember.create({
          data: {
            caseId: newCase.id,
            role: "DEMANDADO",
            displayName: respondent,
            isPrimary: true,
          },
        });
      }

      created++;
      if (created % 20 === 0) console.log(`   ... ${created} creados`);
    } catch (e: any) {
      skipped++;
      console.error(`   Error en ${ec.code}: ${e.message}`);
    }
  }

  console.log(`\n3. Resultado:`);
  console.log(`   - Creados: ${created}`);
  console.log(`   - Omitidos: ${skipped}`);

  // Stats
  const total = await p.case.count();
  const byStatus = await p.case.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log(`\n=== TOTAL: ${total} casos ===`);
  byStatus.forEach((s) => console.log(`   ${s.status}: ${s._count}`));

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
