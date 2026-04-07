/**
 * CAARD - Importar pagos y liquidaciones desde Cuadros de Honorarios
 * Crea Payment y CaseLiquidation para cada expediente
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const p = new PrismaClient();

interface PaymentData {
  arancel: number;
  honorariosTotal: number;
  gastosAdmin: number;
  arbitros: string[];
}

async function main() {
  console.log("=== Importar pagos y liquidaciones ===\n");

  const data: Record<string, PaymentData> = JSON.parse(
    fs.readFileSync("/tmp/payments_data.json", "utf-8")
  );

  // Clean previous demo payments
  console.log("Limpiando pagos previos...");
  const cleanResults = {
    payments: await p.payment.deleteMany(),
    paymentOrders: await p.paymentOrder.deleteMany(),
  };
  console.log(`  Pagos eliminados: ${cleanResults.payments.count}`);
  console.log(`  Órdenes eliminadas: ${cleanResults.paymentOrders.count}`);

  // Try to clean liquidations if model exists
  try {
    await p.caseLiquidation.deleteMany();
  } catch (e) {
    // ignore if not present
  }

  let createdPayments = 0;
  let createdLiquidations = 0;
  let skipped = 0;

  for (const [excelCode, payData] of Object.entries(data)) {
    const dbCase = await p.case.findFirst({
      where: { code: { contains: excelCode } },
    });

    if (!dbCase) {
      skipped++;
      continue;
    }

    // 1. Create payment for arancel/tasa de presentación
    if (payData.arancel > 0) {
      try {
        await p.payment.create({
          data: {
            caseId: dbCase.id,
            provider: "MANUAL_VOUCHER",
            status: "CONFIRMED",
            currency: "PEN",
            amountCents: Math.round(payData.arancel * 100),
            concept: "Tasa de presentación",
            description: `Tasa de presentación de solicitud arbitral`,
            paidAt: dbCase.submittedAt || new Date(),
          },
        });
        createdPayments++;
      } catch (e) {}
    }

    // 2. Create payment for gastos administrativos
    if (payData.gastosAdmin > 0) {
      try {
        await p.payment.create({
          data: {
            caseId: dbCase.id,
            provider: "MANUAL_VOUCHER",
            status: dbCase.status === "CLOSED" || dbCase.status === "ARCHIVED" ? "CONFIRMED" : "PENDING",
            currency: "PEN",
            amountCents: Math.round(payData.gastosAdmin * 100),
            concept: "Gastos administrativos del centro",
            description: `Gastos administrativos del expediente`,
            paidAt: dbCase.status === "CLOSED" || dbCase.status === "ARCHIVED" ? dbCase.closedAt : null,
          },
        });
        createdPayments++;
      } catch (e) {}
    }

    // 3. Create payment for honorarios arbitrales (total)
    if (payData.honorariosTotal > 0) {
      try {
        await p.payment.create({
          data: {
            caseId: dbCase.id,
            provider: "MANUAL_VOUCHER",
            status: dbCase.status === "CLOSED" || dbCase.status === "ARCHIVED" ? "CONFIRMED" : "PENDING",
            currency: "PEN",
            amountCents: Math.round(payData.honorariosTotal * 100),
            concept: "Honorarios arbitrales",
            description: `Honorarios del tribunal arbitral (${payData.arbitros.length} árbitros)`,
            paidAt: dbCase.status === "CLOSED" || dbCase.status === "ARCHIVED" ? dbCase.closedAt : null,
          },
        });
        createdPayments++;
      } catch (e) {}
    }

    // 4. Create payment order with summary
    const totalCents = Math.round((payData.arancel + payData.gastosAdmin + payData.honorariosTotal) * 100);
    if (totalCents > 0) {
      try {
        await p.paymentOrder.create({
          data: {
            caseId: dbCase.id,
            currency: "PEN",
            totalAmountCents: totalCents,
            paidAmountCents: dbCase.status === "CLOSED" || dbCase.status === "ARCHIVED" ? totalCents : Math.round(payData.arancel * 100),
            status: dbCase.status === "CLOSED" || dbCase.status === "ARCHIVED" ? "PAID" : "PARTIAL",
            issuedAt: dbCase.submittedAt || new Date(),
          },
        });
      } catch (e) {}
    }

    // 5. Create liquidation if model exists
    try {
      const liq = await p.caseLiquidation.create({
        data: {
          caseId: dbCase.id,
          totalAmountCents: totalCents,
          status: dbCase.status === "CLOSED" || dbCase.status === "ARCHIVED" ? "PAID" : "PENDING_PAYMENT",
        } as any,
      });
      createdLiquidations++;
    } catch (e) {
      // Model might require different fields - skip silently
    }
  }

  console.log(`\n✓ Pagos creados: ${createdPayments}`);
  console.log(`✓ Liquidaciones creadas: ${createdLiquidations}`);
  console.log(`  Casos no encontrados: ${skipped}`);

  // Stats
  const totalPayments = await p.payment.count();
  const paidPayments = await p.payment.count({ where: { status: "CONFIRMED" } });
  const pendingPayments = await p.payment.count({ where: { status: "PENDING" } });
  const totalAmount = await p.payment.aggregate({
    _sum: { amountCents: true },
    where: { status: "CONFIRMED" },
  });

  console.log(`\n=== FINAL ===`);
  console.log(`Total pagos: ${totalPayments}`);
  console.log(`  PAID: ${paidPayments}`);
  console.log(`  PENDING: ${pendingPayments}`);
  console.log(`Total recaudado: S/ ${((totalAmount._sum.amountCents || 0) / 100).toLocaleString("es-PE")}`);

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
