/**
 * CAARD - Limpieza de árbitros duplicados
 *
 * Ejecuta:
 *   DRY_RUN=1 npx tsx scripts/cleanup-arbitros-duplicados.ts    # sin escribir
 *   npx tsx scripts/cleanup-arbitros-duplicados.ts              # real
 *
 * Resuelve:
 *   1. Users con email compuesto (contienen \n, \r o espacio interno):
 *      identifica el primer email válido → busca User con ese email limpio →
 *      mergea al User "basura" contra el "bueno":
 *        - mueve todos los CaseMember.userId
 *        - mueve todos los CaseLawyer.lawyerId
 *        - mueve AuditLogs
 *        - borra ArbitratorRegistry + Profile del basura si el bueno ya tiene
 *        - borra el User basura
 *
 *   2. User literal "S/. 29,206.31 + 8% de retención" → borrar (basura).
 *
 *   3. Quita ArbitratorRegistry (y su Profile) de:
 *        - sis@caardpe.com (SUPER_ADMIN, no árbitro)
 *        - administracion@caardpe.com (ADMIN, no árbitro)
 *
 *   4. Users con email @arbitro-historico.caard.pe que tengan un match EXACTO
 *      de nombre con otro User activo: mergear (mismo flujo que #1).
 *      Los que no tengan match se dejan como "histórico" (quitándoles sólo
 *      redundancias si su name incluye un acento distinto).
 *
 * Idempotente: se puede correr varias veces.
 */
import { prisma } from "../src/lib/prisma";

const DRY = !!process.env.DRY_RUN;

function normName(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function firstClean(email: string): string | null {
  if (!email) return null;
  const s = email.toLowerCase().trim().replace(/^["'\s]+|["'\s]+$/g, "");
  const candidates = s
    .split(/[\s,;|]+/)
    .map((c) => c.replace(/^["'<>]+|["'<>]+$/g, ""))
    .filter((c) => c && /^[^@]+@[^@]+\.[^@]+$/.test(c));
  return candidates[0] || null;
}

async function mergeUser(
  sourceId: string,
  targetId: string,
  reason: string
): Promise<void> {
  if (sourceId === targetId) return;
  console.log(`  ↳ merge ${sourceId} → ${targetId} (${reason})`);

  if (DRY) return;

  await prisma.$transaction(async (tx) => {
    // Las operaciones son muchas (memberships + lawyers + audit + registry).
    // Extendemos el timeout a 60s para evitar P2028 en usuarios con mucho histórico.
    // Mover memberships (respeta unique)
    const memberships = await tx.caseMember.findMany({
      where: { userId: sourceId },
      select: { id: true, caseId: true, role: true },
    });
    for (const m of memberships) {
      // Si ya existe el mismo caseId+role con targetId, borramos el source
      const dupe = await tx.caseMember.findFirst({
        where: { caseId: m.caseId, role: m.role, userId: targetId },
      });
      if (dupe) {
        await tx.caseMember.delete({ where: { id: m.id } });
      } else {
        await tx.caseMember.update({
          where: { id: m.id },
          data: { userId: targetId },
        });
      }
    }

    // Mover CaseLawyer respetando unique (caseId, lawyerId, representationType)
    const lawyers = await tx.caseLawyer.findMany({
      where: { lawyerId: sourceId },
      select: { id: true, caseId: true, representationType: true },
    });
    for (const l of lawyers) {
      const dupe = await tx.caseLawyer.findFirst({
        where: {
          caseId: l.caseId,
          lawyerId: targetId,
          representationType: l.representationType,
        },
      });
      if (dupe) {
        await tx.caseLawyer.delete({ where: { id: l.id } });
      } else {
        await tx.caseLawyer.update({
          where: { id: l.id },
          data: { lawyerId: targetId },
        });
      }
    }

    // AuditLogs (puede haber muchos, es OK moverlos)
    await tx.auditLog.updateMany({
      where: { userId: sourceId },
      data: { userId: targetId },
    });

    // Notifications y demás referencias opcionales (si fallan por constraint
    // los ignoramos — son secundarias). Usar try/catch por cada one-to-one.
    try {
      await tx.notification.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });
    } catch {}
    try {
      await tx.otpToken.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });
    } catch {}

    // ArbitratorRegistry — si el target ya tiene, borramos el del source
    const targetReg = await tx.arbitratorRegistry.findUnique({
      where: { userId: targetId },
    });
    const sourceReg = await tx.arbitratorRegistry.findUnique({
      where: { userId: sourceId },
    });
    if (sourceReg) {
      if (targetReg) {
        // El target tiene registry; borra el source (cascade borra profile/sanctions/recusations)
        await tx.arbitratorRegistry.delete({ where: { id: sourceReg.id } });
      } else {
        // El target NO tiene registry: pasa el del source
        await tx.arbitratorRegistry.update({
          where: { id: sourceReg.id },
          data: { userId: targetId },
        });
      }
    }

    // Accounts / Sessions NextAuth (si tiene alguna)
    try {
      await tx.account.deleteMany({ where: { userId: sourceId } });
      await tx.session.deleteMany({ where: { userId: sourceId } });
    } catch {}

    // Finalmente, borrar el User basura
    await tx.user.delete({ where: { id: sourceId } });

    // Audit de la operación
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entity: "User",
        entityId: sourceId,
        meta: {
          operation: "MERGE_DUPLICATE_USER",
          mergedIntoUserId: targetId,
          reason,
        },
      },
    });
  }, { timeout: 60000, maxWait: 10000 });
}

async function main() {
  console.log(`\n=== CLEANUP ÁRBITROS DUPLICADOS ${DRY ? "(DRY RUN)" : ""} ===\n`);

  // -------- PASO 1: Users con email compuesto --------
  console.log("▶ Paso 1: Users con email compuesto (\\r\\n o múltiples)");
  const dirty = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "\n" } },
        { email: { contains: "\r" } },
      ],
    },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(`  ${dirty.length} users con email compuesto`);

  for (const u of dirty) {
    const clean = firstClean(u.email || "");
    if (!clean) {
      console.log(`  ! ${u.name} — no se pudo extraer email limpio de ${JSON.stringify(u.email)}`);
      continue;
    }
    const good = await prisma.user.findUnique({ where: { email: clean } });
    if (!good) {
      // No hay copia "buena"; simplemente limpiamos el email en el mismo user
      console.log(`  → ${u.name}: no existe user con email limpio, arreglando en sitio`);
      if (!DRY) {
        await prisma.user.update({ where: { id: u.id }, data: { email: clean } });
      }
      continue;
    }
    if (good.id === u.id) continue;
    await mergeUser(u.id, good.id, "email_compuesto");
  }

  // -------- PASO 2: User basura --------
  console.log("\n▶ Paso 2: User basura 'S/.'");
  const trash = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "S/." } },
        { name: { contains: "retención", mode: "insensitive" } },
        { email: { startsWith: "s.de.retencion@" } },
      ],
    },
    select: { id: true, email: true, name: true },
  });
  for (const u of trash) {
    console.log(`  - borrar ${u.name} (${u.email})`);
    if (!DRY) {
      try {
        // Mover memberships (si las hay) a nadie (desvincular)
        await prisma.caseMember.updateMany({
          where: { userId: u.id },
          data: { userId: null },
        });
        await prisma.arbitratorRegistry.deleteMany({ where: { userId: u.id } });
        await prisma.account.deleteMany({ where: { userId: u.id } });
        await prisma.session.deleteMany({ where: { userId: u.id } });
        await prisma.user.delete({ where: { id: u.id } });
      } catch (e: any) {
        console.log(`    ! falló: ${e.message}`);
      }
    }
  }

  // -------- PASO 3: Remover Registry de SIS y Administración --------
  console.log("\n▶ Paso 3: ArbitratorRegistry de sis@ y administracion@");
  for (const email of ["sis@caardpe.com", "administracion@caardpe.com"]) {
    const u = await prisma.user.findUnique({
      where: { email },
      include: { arbitratorRegistry: true },
    });
    if (!u?.arbitratorRegistry) {
      console.log(`  ${email}: sin registry (ok)`);
      continue;
    }
    console.log(`  - quitar registry de ${email}`);
    if (!DRY) {
      await prisma.arbitratorRegistry.delete({
        where: { id: u.arbitratorRegistry.id },
      });
    }
  }

  // -------- PASO 4: Merge @arbitro-historico con match de nombre --------
  console.log("\n▶ Paso 4: Users @arbitro-historico vs reales");
  const historicos = await prisma.user.findMany({
    where: { email: { endsWith: "@arbitro-historico.caard.pe" } },
    select: { id: true, email: true, name: true },
  });
  console.log(`  ${historicos.length} users históricos`);
  for (const h of historicos) {
    const keyH = normName(h.name);
    // Buscar User con el mismo nombre normalizado y email NO histórico
    const candidates = await prisma.user.findMany({
      where: {
        NOT: { email: { endsWith: "@arbitro-historico.caard.pe" } },
      },
      select: { id: true, email: true, name: true },
    });
    const match = candidates.find((c) => normName(c.name) === keyH && keyH);
    if (!match) {
      console.log(`  · ${h.name} — sin match, se queda como histórico`);
      continue;
    }
    await mergeUser(h.id, match.id, `historico_match_${match.email}`);
  }

  console.log("\n✅ Cleanup completo.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await prisma.$disconnect();
  process.exit(1);
});
