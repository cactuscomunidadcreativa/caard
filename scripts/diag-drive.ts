import { prisma } from "../src/lib/prisma";

async function main() {
  const totalCases = await prisma.case.count();
  const cases = await prisma.case.findMany({ select: { id: true, driveFolderId: true, year: true } });
  const casesWithFolder = cases.filter((c) => !!c.driveFolderId).length;
  const totalDocs = await prisma.caseDocument.count();
  const docs = await prisma.caseDocument.findMany({ select: { driveFileId: true }, take: 5000 });
  const docsWithFile = docs.filter((d) => !!d.driveFileId).length;
  console.log({ totalCases, casesWithFolder, totalDocs, docsWithFile });
  const s = await prisma.case.findFirst({ select: { id: true, code: true, year: true, driveFolderId: true } });
  console.log("case sample:", s);
  const sd = await prisma.caseDocument.findFirst({ select: { id: true, caseId: true, driveFileId: true, folder: { select: { key: true, name: true } } } });
  console.log("doc sample:", sd);
  await prisma.$disconnect();
}
main();
