/**
 * Merge manual de los 5 árbitros históricos sin match automático.
 * Se requiere inspección humana porque los nombres son similares
 * pero no idénticos.
 *
 * Decisiones:
 *   - Patricia Mary Lora Rios   → Patricia Lora Rios   (p.lorarios@gmail.com)
 *   - Carlos Armas              → Armas Gamarra, Carlos Antonio
 *   - Raúl Leonid Salazar Rivera → Raul Salazar Rivera  (estudiosalazar@gmail.com)
 *   - Juan Valdivieso           → se queda (no está en Excel v6, árbitro histórico real)
 *   - Jashim Valdivieso         → se queda (igual que anterior)
 */
import { prisma } from "../src/lib/prisma";

const DRY = !!process.env.DRY_RUN;

async function mergeUser(sourceId: string, targetId: string, reason: string) {
  if (sourceId === targetId) return;
  console.log(`  ↳ merge ${sourceId} → ${targetId} (${reason})`);
  if (DRY) return;

  await prisma.$transaction(
    async (tx) => {
      const memberships = await tx.caseMember.findMany({
        where: { userId: sourceId },
        select: { id: true, caseId: true, role: true },
      });
      for (const m of memberships) {
        const dupe = await tx.caseMember.findFirst({
          where: { caseId: m.caseId, role: m.role, userId: targetId },
        });
        if (dupe) await tx.caseMember.delete({ where: { id: m.id } });
        else await tx.caseMember.update({ where: { id: m.id }, data: { userId: targetId } });
      }
      await tx.auditLog.updateMany({ where: { userId: sourceId }, data: { userId: targetId } });
      try { await tx.notification.updateMany({ where: { userId: sourceId }, data: { userId: targetId } }); } catch {}
      const sourceReg = await tx.arbitratorRegistry.findUnique({ where: { userId: sourceId } });
      const targetReg = await tx.arbitratorRegistry.findUnique({ where: { userId: targetId } });
      if (sourceReg) {
        if (targetReg) await tx.arbitratorRegistry.delete({ where: { id: sourceReg.id } });
        else await tx.arbitratorRegistry.update({ where: { id: sourceReg.id }, data: { userId: targetId } });
      }
      try { await tx.account.deleteMany({ where: { userId: sourceId } }); } catch {}
      try { await tx.session.deleteMany({ where: { userId: sourceId } }); } catch {}
      await tx.user.delete({ where: { id: sourceId } });
      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "User",
          entityId: sourceId,
          meta: {
            operation: "MERGE_DUPLICATE_USER_MANUAL",
            mergedIntoUserId: targetId,
            reason,
          },
        },
      });
    },
    { timeout: 60000, maxWait: 10000 }
  );
}

async function main() {
  console.log(`\n=== MERGE MANUAL HISTÓRICOS ${DRY ? "(DRY RUN)" : ""} ===\n`);

  const merges = [
    {
      sourceEmail: "patricia.mary.lora.rios@arbitro-historico.caard.pe",
      targetEmail: "p.lorarios@gmail.com",
      reason: "patricia_mary_lora_rios ≡ patricia_lora_rios",
    },
    {
      sourceEmail: "carlos.armas@arbitro-historico.caard.pe",
      targetEmail: "antoniocorralesgonzales@gmail.com",
      reason: "carlos_armas ≡ armas_gamarra_carlos_antonio (email compartido en Excel)",
    },
    {
      sourceEmail: "raul.leonid.salazar.rivera@arbitro-historico.caard.pe",
      targetEmail: "estudiosalazar@gmail.com",
      reason: "raul_leonid_salazar ≡ raul_salazar_rivera",
    },
  ];

  for (const m of merges) {
    const source = await prisma.user.findUnique({ where: { email: m.sourceEmail } });
    const target = await prisma.user.findUnique({ where: { email: m.targetEmail } });
    if (!source) {
      console.log(`  ! ya borrado: ${m.sourceEmail}`);
      continue;
    }
    if (!target) {
      console.log(`  ! target no existe: ${m.targetEmail} — salto`);
      continue;
    }
    await mergeUser(source.id, target.id, m.reason);
  }

  console.log("\n▶ Valdivieso (Juan, Jashim) — se dejan como históricos activos");
  const valdivieso = await prisma.user.findMany({
    where: { email: { in: ["juan.valdivieso@arbitro-historico.caard.pe", "jashim.valdivieso@arbitro-historico.caard.pe"] } },
    select: { name: true, email: true, _count: { select: { caseMemberships: true } } },
  });
  for (const v of valdivieso) {
    console.log(`  · ${v.name} (${v.email}) — ${v._count.caseMemberships} memberships`);
  }

  console.log("\n✅ Listo.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
