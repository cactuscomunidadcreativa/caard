/**
 * CAARD - Migración: agregar valor FINANZAS al enum Role.
 *
 * Postgres requiere ALTER TYPE para añadir valores a un enum. Prisma db push
 * a veces se niega y pide --accept-data-loss; este script lo hace seguro y
 * de forma idempotente (si el valor ya existe, no hace nada).
 *
 * Corre automáticamente como parte del build en Vercel (ver vercel.json).
 * Para correrlo manualmente: `npx tsx scripts/migrate-add-finanzas.ts`.
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("⏭️  DATABASE_URL no configurado, salto migración FINANZAS (es esperado en builds locales sin .env)");
    return;
  }

  // ¿Ya existe el valor del enum?
  const existing: Array<{ enumlabel: string }> = await prisma.$queryRawUnsafe(
    `SELECT enumlabel FROM pg_enum
     WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
       AND enumlabel = 'FINANZAS'`
  );
  if (existing.length === 0) {
    console.log("➕ Agregando FINANZAS al enum Role…");
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE 'FINANZAS'`);
    console.log("✓ Enum Role actualizado.");
  } else {
    console.log("✓ Rol FINANZAS ya existe en el enum.");
  }

  // Columna CmsMedia.metadata (JSONB) — guarda config visual del hero.
  console.log("➕ Asegurando columna CmsMedia.metadata…");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "CmsMedia" ADD COLUMN IF NOT EXISTS "metadata" JSONB`
  );
  console.log("✓ Columna OK.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("✗ Error en migración FINANZAS:", e?.message || e);
    prisma.$disconnect().finally(() => process.exit(1));
  });
