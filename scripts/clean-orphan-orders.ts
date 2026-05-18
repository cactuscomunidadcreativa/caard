/**
 * CAARD - Limpia órdenes de pago huérfanas en BD.
 *
 * "Huérfana" = una PaymentOrder en BD que NO tiene contraparte en el Excel
 * actual (mismo caso + concepto + monto). Estas surgen de imports previos,
 * datos de seeds o ediciones manuales que después se borraron del Excel.
 *
 * Por defecto corre en modo DRY (solo lista). Para borrar de verdad,
 * pasá DELETE=1.
 *
 * Uso:
 *   XLSX_PATH="..." npx tsx scripts/clean-orphan-orders.ts
 *   XLSX_PATH="..." DELETE=1 npx tsx scripts/clean-orphan-orders.ts
 *
 * Reglas de seguridad:
 *   - NO borra órdenes con status PAID, PARTIAL ni REFUNDED.
 *   - NO borra órdenes con pagos asociados (Payment.paymentOrderId).
 *   - NO borra órdenes con plan de fraccionamiento activo.
 *   - Borra solo PENDING, OVERDUE, CANCELLED sin movimientos.
 *   - Las que no se pueden borrar las marca como CANCELLED en su lugar.
 */
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

const XLSX_PATH =
  process.env.XLSX_PATH ||
  "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (10).xlsx";

const DELETE = process.env.DELETE === "1";

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
    if (r.some((c) => c && typeof c === "string" && c.trim().endsWith("*"))) {
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

async function main() {
  console.log(`📂 ${XLSX_PATH}`);
  console.log(`Modo: ${DELETE ? "🔥 DELETE (borrado real)" : "🔍 DRY RUN"}\n`);

  const wb = XLSX.read(require("fs").readFileSync(XLSX_PATH), {
    type: "buffer",
    cellDates: true,
  });

  const xlsxRows = readSheet(wb, "08_OrdenesPago");
  const xlsxKeys = new Set<string>();
  for (const r of xlsxRows) {
    const code = normCaseCode(r.codigo_caso);
    const concept = normStr(r.concepto);
    const cents = normCents(r.monto_centimos);
    if (!code || !concept || cents === null) continue;
    xlsxKeys.add(`${code}|${concept}|${cents}`);
  }
  console.log(`📄 Excel: ${xlsxKeys.size} órdenes (después de dedup)`);

  const dbOrders = await prisma.paymentOrder.findMany({
    include: {
      case: { select: { code: true } },
    },
  });
  console.log(`💾 BD: ${dbOrders.length} órdenes\n`);

  const orphans = dbOrders.filter((o) => {
    if (!o.case?.code) return false;
    const code = normCaseCode(o.case.code) || o.case.code;
    return !xlsxKeys.has(`${code}|${o.concept}|${o.amountCents}`);
  });

  console.log(`👻 Huérfanas detectadas: ${orphans.length}\n`);

  // Buscar todos los planes de fraccionamiento que apunten a estas órdenes,
  // de una sola query para no martillar la DB.
  const orphanIds = orphans.map((o) => o.id);
  const plansByOrder = new Map<string, number>();
  if (orphanIds.length > 0) {
    const plans = await prisma.paymentInstallmentPlan.findMany({
      where: { paymentOrderId: { in: orphanIds } },
      select: { paymentOrderId: true },
    });
    for (const p of plans) {
      plansByOrder.set(p.paymentOrderId, (plansByOrder.get(p.paymentOrderId) || 0) + 1);
    }
  }

  let toDelete = 0;
  let toCancel = 0;
  let skipped = 0;

  for (const o of orphans) {
    const planCount = plansByOrder.get(o.id) || 0;
    // Tiene Payment asociado? PaymentOrder.paymentId es FK a Payment.
    const hasPayments = o.paymentId ? 1 : 0;

    const safeToDelete =
      ["PENDING", "OVERDUE", "CANCELLED"].includes(o.status) &&
      planCount === 0 &&
      hasPayments === 0;

    if (!safeToDelete) {
      // No borrar: si está PAID/PARTIAL/REFUNDED o tiene pagos/planes asociados.
      // Si está PENDING/OVERDUE pero con dependencias, marcar CANCELLED.
      if (o.status === "PENDING" || o.status === "OVERDUE") {
        toCancel++;
        console.log(`  🚫 CANCELAR | ${o.case?.code} | ${o.concept} | S/ ${(o.amountCents / 100).toFixed(2)} | ${o.status} | pagos=${hasPayments}, planes=${planCount}`);
        if (DELETE) {
          await prisma.paymentOrder.update({
            where: { id: o.id },
            data: {
              status: "CANCELLED",
              metadata: {
                ...((o.metadata as object) || {}),
                cancelledAt: new Date().toISOString(),
                cancellationReason: "Huérfana: no existe en Excel actual (clean-orphan-orders)",
              },
            },
          });
        }
      } else {
        skipped++;
        console.log(`  ⏭️  SKIP    | ${o.case?.code} | ${o.concept} | S/ ${(o.amountCents / 100).toFixed(2)} | ${o.status} (no se toca)`);
      }
    } else {
      toDelete++;
      console.log(`  🗑️  BORRAR  | ${o.case?.code} | ${o.concept} | S/ ${(o.amountCents / 100).toFixed(2)} | ${o.status}`);
      if (DELETE) {
        await prisma.paymentOrder.delete({ where: { id: o.id } });
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`  🗑️  Borradas:  ${toDelete}`);
  console.log(`  🚫 Canceladas: ${toCancel}`);
  console.log(`  ⏭️  Saltadas:   ${skipped}`);
  if (!DELETE) {
    console.log(`\nℹ️  Modo DRY — nada se modificó. Volvé a correr con DELETE=1 para aplicar.`);
  } else {
    console.log(`\n✓ Cambios aplicados.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect().finally(() => process.exit(1));
  });
