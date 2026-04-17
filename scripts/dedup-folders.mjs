/**
 * Deduplica CaseFolder que apunten al mismo driveFolderId dentro de un mismo case.
 * Esto ocurrió porque al cambiar la lógica de `key` (prefijo del parent), el re-import
 * creó una fila nueva sin borrar la anterior.
 *
 * Estrategia:
 * 1. Para cada case, agrupar CaseFolder por driveFolderId (ignorando los null)
 * 2. Si hay más de una fila con el mismo driveFolderId:
 *    - Mantener la que tenga parentId correcto (la nueva importación)
 *    - Reasignar documentos de la(s) fila(s) huérfana(s) al mantenida
 *    - Borrar las huérfanas
 * 3. También detectar folders por (caseId, name) con parentId=null que sean duplicados
 *    de uno con parentId=algo (caso típico: "Anexos" existe en raíz Y anidado).
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.case.findMany({
    select: { id: true, code: true },
  });

  let totalMerged = 0;
  let totalDocsReassigned = 0;
  let totalDeleted = 0;

  for (const c of cases) {
    const folders = await prisma.caseFolder.findMany({
      where: { caseId: c.id },
      orderBy: [{ createdAt: "asc" }],
    });

    if (folders.length === 0) continue;

    // Group 1: por driveFolderId (no null)
    const byDriveId = new Map();
    for (const f of folders) {
      if (!f.driveFolderId) continue;
      if (!byDriveId.has(f.driveFolderId)) byDriveId.set(f.driveFolderId, []);
      byDriveId.get(f.driveFolderId).push(f);
    }

    for (const [driveId, group] of byDriveId.entries()) {
      if (group.length <= 1) continue;
      // Elegir la "ganadora":
      //   1) la que tenga parentId seteado (si aplicable)
      //   2) la de mayor sortOrder (última creada)
      //   3) la más reciente por createdAt
      const winner =
        group.find((g) => g.parentId) ||
        group.reduce((a, b) =>
          (a.sortOrder || 0) >= (b.sortOrder || 0) ? a : b
        );
      const losers = group.filter((g) => g.id !== winner.id);

      for (const loser of losers) {
        // Reasignar docs del loser al winner
        const r = await prisma.caseDocument.updateMany({
          where: { folderId: loser.id },
          data: { folderId: winner.id },
        });
        totalDocsReassigned += r.count;

        // Reasignar subcarpetas que tengan al loser como parent
        await prisma.caseFolder.updateMany({
          where: { parentId: loser.id },
          data: { parentId: winner.id },
        });

        // Borrar el loser
        await prisma.caseFolder.delete({ where: { id: loser.id } });
        totalDeleted++;
      }
      totalMerged++;
      console.log(
        `  [${c.code}] merge driveId=${driveId.slice(0, 12)}… keep="${winner.name}" removed ${losers.length} duplicates`
      );
    }

    // Group 2: por (name, parentId=null) que también exista anidado
    const rootDuplicates = folders.filter(
      (f) => !f.parentId && f.name // folders raíz con nombre
    );
    for (const rootFolder of rootDuplicates) {
      // Si este folder YA fue merged por group 1, salta
      const stillExists = await prisma.caseFolder.findUnique({
        where: { id: rootFolder.id },
      });
      if (!stillExists) continue;
      // Buscar un folder anidado con el mismo nombre en el mismo caso
      const nested = await prisma.caseFolder.findFirst({
        where: {
          caseId: c.id,
          name: rootFolder.name,
          parentId: { not: null },
          id: { not: rootFolder.id },
        },
      });
      if (nested) {
        // El folder de raíz es huérfano de la jerarquía real. Si no tiene docs propios, borrar.
        const docCount = await prisma.caseDocument.count({
          where: { folderId: rootFolder.id },
        });
        if (docCount === 0) {
          // Borrar sin más
          await prisma.caseFolder.delete({ where: { id: rootFolder.id } });
          totalDeleted++;
          console.log(
            `  [${c.code}] borrado folder raíz huérfano "${rootFolder.name}" (vacío, existe anidado)`
          );
        } else {
          // Mover sus docs al nested y borrar
          const r = await prisma.caseDocument.updateMany({
            where: { folderId: rootFolder.id },
            data: { folderId: nested.id },
          });
          totalDocsReassigned += r.count;
          await prisma.caseFolder.delete({ where: { id: rootFolder.id } });
          totalDeleted++;
          console.log(
            `  [${c.code}] movidos ${r.count} docs de "${rootFolder.name}" (raíz) a nested y borrado raíz`
          );
        }
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`  Grupos con duplicados merged: ${totalMerged}`);
  console.log(`  Folders eliminados: ${totalDeleted}`);
  console.log(`  Documentos reasignados: ${totalDocsReassigned}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
