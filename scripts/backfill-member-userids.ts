/**
 * Backfill: enlaza CaseMember.userId y CaseLawyer a partir del email
 * cuando el User ya existe pero el link no se creó.
 *
 * Uso: npx tsx scripts/backfill-member-userids.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  // Cargar todos los users por email (lowercase)
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  const byEmail = new Map<string, string>();
  for (const u of users) {
    if (u.email) byEmail.set(u.email.toLowerCase().trim(), u.id);
  }

  // CaseMember sin userId pero con email
  const members = await prisma.caseMember.findMany({
    where: { userId: null, email: { not: null } },
    select: { id: true, email: true, role: true },
  });
  let linkedMembers = 0;
  for (const m of members) {
    const email = m.email!.toLowerCase().trim();
    const uid = byEmail.get(email);
    if (!uid) continue;
    await prisma.caseMember.update({
      where: { id: m.id },
      data: { userId: uid },
    });
    linkedMembers++;
  }
  console.log(`CaseMember linkados: ${linkedMembers}/${members.length}`);

  // CaseLawyer sin lawyerId sería raro, pero verificamos estado
  // (lawyerId es NOT NULL en el schema, así que siempre está)

  // Árbitros con CaseMember ARBITRO pero sin registry → info
  const missingRegistry = await prisma.user.findMany({
    where: {
      role: "ARBITRO",
      arbitratorRegistry: null,
    },
    select: { id: true, email: true, name: true },
  });
  console.log(
    `Árbitros (User) sin ArbitratorRegistry: ${missingRegistry.length}`
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
