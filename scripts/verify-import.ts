/**
 * CAARD - Verificador de importación
 *
 * Compara la BD contra el Excel de la plantilla y reporta:
 *  - Órdenes de pago en BD que NO están en el Excel (huérfanos)
 *  - Órdenes de pago en el Excel que NO están en BD (no importados)
 *  - Discrepancias de monto entre Excel y BD
 *  - Planes de pago (fraccionamientos) en el Excel que no están en BD
 *
 * Uso:
 *   XLSX_PATH=/Users/.../CAARD_Plantilla_Completa\ \(10\).xlsx \
 *     npx tsx scripts/verify-import.ts
 *   (sin XLSX_PATH usa el default abajo)
 */
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

const XLSX_PATH =
  process.env.XLSX_PATH ||
  "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (10).xlsx";

function normCents(s: any): number | null {
  if (s === null || s === undefined || s === "") return null;
  const cleaned = String(s).replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const soles = parseFloat(cleaned);
  if (isNaN(soles)) return null;
  return Math.round(soles * 100);
}

function normStr(s: any): string | null {
  if (s === null || s === undefined) return null;
  const v = String(s).trim();
  return v ? v : null;
}

function normCaseCode(s: any): string | null {
  if (!s) return null;
  let v = String(s).trim();
  if (!v) return null;
  if (!/^exp\.?\s*/i.test(v)) v = "Exp. " + v;
  else v = v.replace(/^exp\.?\s*/i, "Exp. ");
  return v;
}

function readSheet(wb: XLSX.WorkBook, name: string): Record<string, any>[] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<any>(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  });
  if (raw.length < 2) return [];
  let headerRow = -1;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const r = raw[i] as any[];
    if (!r) continue;
    const nonNull = r.filter((c) => c !== null && c !== "").length;
    if (nonNull < 2) continue;
    const hasRequired = r.some(
      (c) => c && typeof c === "string" && c.trim().endsWith("*")
    );
    if (hasRequired) {
      headerRow = i;
      break;
    }
  }
  if (headerRow < 0) return [];
  const headers = (raw[headerRow] as any[]).map((h) =>
    h ? String(h).replace(/\*$/, "").trim() : ""
  );
  const rows: Record<string, any>[] = [];
  for (let i = headerRow + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r || (r as any[]).every((c) => c === null || c === "")) continue;
    const obj: any = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (r as any[])[idx];
    });
    rows.push(obj);
  }
  return rows;
}

// Clave para comparar registros: caso + concepto + monto
function orderKey(caseCode: string, concept: string, cents: number) {
  return `${caseCode}|${concept}|${cents}`;
}

async function main() {
  console.log(`📂 Leyendo ${XLSX_PATH}`);
  const wb = XLSX.read(require("fs").readFileSync(XLSX_PATH), {
    type: "buffer",
    cellDates: true,
  });

  // ---------- Órdenes de pago ----------
  const xlsxOrders = readSheet(wb, "08_OrdenesPago");
  console.log(`\n📄 Excel: ${xlsxOrders.length} órdenes de pago`);

  const xlsxOrderMap = new Map<string, { row: any; row_num: number }>();
  for (let i = 0; i < xlsxOrders.length; i++) {
    const r = xlsxOrders[i];
    const code = normCaseCode(r.codigo_caso);
    const concept = normStr(r.concepto);
    const cents = normCents(r.monto_centimos);
    if (!code || !concept || cents === null) continue;
    xlsxOrderMap.set(orderKey(code, concept, cents), { row: r, row_num: i + 1 });
  }

  const dbOrders = await prisma.paymentOrder.findMany({
    include: { case: { select: { code: true } } },
  });
  console.log(`💾 BD: ${dbOrders.length} órdenes de pago`);

  const dbOrderMap = new Map<string, (typeof dbOrders)[number]>();
  for (const o of dbOrders) {
    if (!o.case?.code) continue;
    const caseCode = normCaseCode(o.case.code) || o.case.code;
    dbOrderMap.set(orderKey(caseCode, o.concept, o.amountCents), o);
  }

  // Huérfanos en BD (no están en Excel)
  const orphansInDb: typeof dbOrders = [];
  Array.from(dbOrderMap.entries()).forEach(([key, o]) => {
    if (!xlsxOrderMap.has(key)) orphansInDb.push(o);
  });

  // No importados (en Excel pero no en BD)
  const missingInDb: Array<{ row: any; row_num: number }> = [];
  Array.from(xlsxOrderMap.entries()).forEach(([key, entry]) => {
    if (!dbOrderMap.has(key)) missingInDb.push(entry);
  });

  console.log(`\n━━━ Órdenes de pago ━━━`);
  console.log(`  huérfanas en BD (no están en el Excel actual): ${orphansInDb.length}`);
  if (orphansInDb.length) {
    for (const o of orphansInDb.slice(0, 30)) {
      console.log(`    · ${o.case?.code} | ${o.concept} | S/ ${(o.amountCents / 100).toFixed(2)} | ${o.status} | ${o.orderNumber}`);
    }
    if (orphansInDb.length > 30) console.log(`    ... y ${orphansInDb.length - 30} más`);
  }

  console.log(`  no importadas (en Excel pero no en BD): ${missingInDb.length}`);
  if (missingInDb.length) {
    for (const m of missingInDb.slice(0, 30)) {
      console.log(`    · fila ${m.row_num}: ${m.row.codigo_caso} | ${m.row.concepto} | S/ ${(normCents(m.row.monto_centimos) || 0) / 100}`);
    }
    if (missingInDb.length > 30) console.log(`    ... y ${missingInDb.length - 30} más`);
  }

  // ---------- Planes de pago (fraccionamientos) ----------
  const xlsxPlans = readSheet(wb, "16_PlanesPago");
  console.log(`\n📄 Excel: ${xlsxPlans.length} planes de pago`);

  const dbPlans = await prisma.paymentInstallmentPlan.findMany({
    include: { case: { select: { code: true } } },
  });
  console.log(`💾 BD: ${dbPlans.length} planes de pago`);

  // Match por caso + total
  const dbPlanMap = new Map<string, (typeof dbPlans)[number]>();
  for (const p of dbPlans) {
    if (!p.case?.code) continue;
    const k = `${normCaseCode(p.case.code)}|${p.totalAmountCents}`;
    dbPlanMap.set(k, p);
  }

  const missingPlans: any[] = [];
  for (let i = 0; i < xlsxPlans.length; i++) {
    const r = xlsxPlans[i];
    const code = normCaseCode(r.codigo_caso);
    const total = normCents(r.monto_total_centimos);
    if (!code || total === null) continue;
    const k = `${code}|${total}`;
    if (!dbPlanMap.has(k)) missingPlans.push({ row: r, row_num: i + 1 });
  }

  console.log(`\n━━━ Planes de pago ━━━`);
  console.log(`  no importados: ${missingPlans.length}`);
  for (const m of missingPlans.slice(0, 30)) {
    console.log(`    · fila ${m.row_num}: ${m.row.codigo_caso} | total ${(normCents(m.row.monto_total_centimos) || 0) / 100} | "${String(m.row.razon || "").slice(0, 40)}"`);
  }
  if (missingPlans.length > 30) console.log(`    ... y ${missingPlans.length - 30} más`);

  // ---------- Resumen ----------
  console.log(`\n📊 Resumen:`);
  console.log(`  Órdenes — huérfanas: ${orphansInDb.length}, faltantes: ${missingInDb.length}`);
  console.log(`  Planes  — faltantes: ${missingPlans.length}`);
  console.log(`\nℹ️  Para limpiar huérfanos: revisa la lista de arriba y borrá manualmente`);
  console.log(`    desde el dashboard, o usá un script dedicado.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect().finally(() => process.exit(1));
  });
