/**
 * Diagnóstico: muestra el árbol de folders y conteo de docs
 * para un case específico (por código).
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const code = process.argv[2] || "Exp. 009-2025-ARB/CAARD";
  const c = await prisma.case.findFirst({
    where: { code },
    select: {
      id: true,
      code: true,
      driveFolderId: true,
      _count: { select: { documents: true, folders: true } },
    },
  });
  if (!c) {
    console.log("NOT FOUND:", code);
    return;
  }
  console.log(`\n=== ${c.code} ===`);
  console.log(`id=${c.id}`);
  console.log(`driveFolderId=${c.driveFolderId}`);
  console.log(`Total docs=${c._count.documents}, Total folders=${c._count.folders}\n`);

  const folders = await prisma.caseFolder.findMany({
    where: { caseId: c.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      parentId: true,
      sortOrder: true,
      driveFolderId: true,
      _count: { select: { documents: true } },
    },
  });

  console.log(`Folders found: ${folders.length}\n`);

  const byParent = new Map();
  for (const f of folders) {
    const k = f.parentId ?? "ROOT";
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(f);
  }

  function print(parentId, depth) {
    const arr = byParent.get(parentId) || [];
    for (const f of arr) {
      const pad = "  ".repeat(depth);
      console.log(
        `${pad}📁 ${f.name} [${f._count.documents} docs, sortOrder=${f.sortOrder}, id=${f.id.slice(0, 8)}${f.driveFolderId ? ", drive=" + f.driveFolderId.slice(0, 10) : ""}]`
      );
      print(f.id, depth + 1);
    }
  }
  print("ROOT", 0);

  // Docs sin carpeta
  const noFolder = await prisma.caseDocument.count({
    where: { caseId: c.id, folderId: null, status: "ACTIVE" },
  });
  console.log(`\nDocs sin folder (folderId=null): ${noFolder}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
