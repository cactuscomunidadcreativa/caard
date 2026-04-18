import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const caseCode = process.argv[2] || "Exp. 002-2026-ARBEME/CAARD";
const folderName = process.argv[3] || "CAUCIÓN JURATORIA";

const c = await prisma.case.findFirst({ where: { code: caseCode } });
console.log("case:", c?.id);
const f = await prisma.caseFolder.findFirst({
  where: { caseId: c.id, name: folderName },
});
console.log("folder:", f?.id, f?.name);
if (!f) process.exit(1);

// Reproduce the API query
const centerId = c.centerId;
const where = {
  case: { centerId },
  status: "ACTIVE",
  caseId: c.id,
  folderId: f.id,
};
console.log("WHERE:", JSON.stringify(where));
const docs = await prisma.caseDocument.findMany({
  where,
  take: 10,
  select: {
    id: true,
    originalFileName: true,
    status: true,
    folderId: true,
    caseId: true,
  },
});
console.log(`DOCS FOUND: ${docs.length}`);
for (const d of docs) console.log(" -", d.originalFileName, "folder:", d.folderId);

const count = await prisma.caseDocument.count({ where });
console.log("TOTAL COUNT:", count);

await prisma.$disconnect();
