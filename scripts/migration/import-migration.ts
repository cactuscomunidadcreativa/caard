/**
 * CAARD - Script de Migración de Datos
 * =====================================
 * Este script procesa los archivos CSV y crea los registros en la base de datos.
 *
 * Uso:
 *   npx ts-node scripts/migration/import-migration.ts
 *   npx ts-node scripts/migration/import-migration.ts --validate-only
 *   npx ts-node scripts/migration/import-migration.ts --table=cases
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mapeo de archivos CSV a tablas
const MIGRATION_FILES = [
  { file: '01_centers.csv', table: 'center', handler: importCenters },
  { file: '02_users.csv', table: 'user', handler: importUsers },
  { file: '03_arbitrator_registry.csv', table: 'arbitratorRegistry', handler: importArbitratorRegistry },
  { file: '04_arbitration_types.csv', table: 'arbitrationType', handler: importArbitrationTypes },
  { file: '05_cases.csv', table: 'case', handler: importCases },
  { file: '16_case_folders.csv', table: 'caseFolder', handler: importCaseFolders },
  { file: '06_case_members.csv', table: 'caseMember', handler: importCaseMembers },
  { file: '07_case_lawyers.csv', table: 'caseLawyer', handler: importCaseLawyers },
  { file: '08_case_documents.csv', table: 'caseDocument', handler: importCaseDocuments },
  { file: '10_payment_orders.csv', table: 'paymentOrder', handler: importPaymentOrders },
  { file: '09_payments.csv', table: 'payment', handler: importPayments },
  { file: '11_case_deadlines.csv', table: 'caseDeadline', handler: importCaseDeadlines },
  { file: '12_case_hearings.csv', table: 'caseHearing', handler: importCaseHearings },
  { file: '15_case_notes.csv', table: 'caseNote', handler: importCaseNotes },
  { file: '13_holidays.csv', table: 'holiday', handler: importHolidays },
  { file: '14_fee_configuration.csv', table: 'feeConfiguration', handler: importFeeConfiguration },
];

// Mapeo de IDs temporales a IDs reales
const idMap: Record<string, Record<string, string>> = {
  centers: {},
  users: {},
  arbitrationTypes: {},
  cases: {},
  caseFolders: {},
  caseMembers: {},
  documents: {},
  payments: {},
  paymentOrders: {},
};

interface MigrationResult {
  table: string;
  total: number;
  success: number;
  errors: Array<{ row: number; error: string }>;
}

// ============================================
// FUNCIONES DE IMPORTACIÓN POR TABLA
// ============================================

async function importCenters(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Center', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const center = await prisma.center.create({
        data: {
          code: record.code,
          name: record.name,
          legalName: record.legalName || null,
          taxId: record.taxId || null,
          driveRootFolderId: record.driveRootFolderId || null,
          driveSharedDriveId: record.driveSharedDriveId || null,
          primaryColorHex: record.primaryColorHex || null,
          accentColorHex: record.accentColorHex || null,
          neutralColorHex: record.neutralColorHex || null,
        },
      });
      idMap.centers[record.id] = center.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importUsers(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'User', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      // Generar hash de contraseña temporal si tiene marcador
      let passwordHash = record.passwordHash;
      if (passwordHash === '[HASH_BCRYPT]') {
        // Contraseña temporal: Caard2024!
        passwordHash = await bcrypt.hash('Caard2024!', 10);
      }

      const user = await prisma.user.create({
        data: {
          email: record.email,
          name: record.name || null,
          image: record.image || null,
          phoneE164: record.phoneE164 || null,
          passwordHash: passwordHash || null,
          role: record.role,
          isActive: record.isActive === 'true',
          centerId: record.centerId ? idMap.centers[record.centerId] : null,
        },
      });
      idMap.users[record.id] = user.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importArbitratorRegistry(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'ArbitratorRegistry', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await prisma.arbitratorRegistry.create({
        data: {
          centerId: idMap.centers[record.centerId],
          userId: idMap.users[record.userId],
          status: record.status || 'PENDING_APPROVAL',
          barNumber: record.barNumber || null,
          barAssociation: record.barAssociation || null,
          specializations: record.specializations ? record.specializations.split(',').map((s: string) => s.trim()) : [],
          applicationDate: record.applicationDate ? new Date(record.applicationDate) : new Date(),
          approvalDate: record.approvalDate ? new Date(record.approvalDate) : null,
          ethicsDeclarationDocId: record.ethicsDeclarationDocId || null,
          cvDocId: record.cvDocId || null,
          independenceDocId: record.independenceDocId || null,
          maxConcurrentCases: parseInt(record.maxConcurrentCases) || 10,
          acceptsEmergency: record.acceptsEmergency === 'true',
          notes: record.notes || null,
        },
      });
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importArbitrationTypes(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'ArbitrationType', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const arbitrationType = await prisma.arbitrationType.create({
        data: {
          centerId: idMap.centers[record.centerId],
          code: record.code,
          name: record.name,
          description: record.description || null,
          kind: record.kind || 'INSTITUTIONAL',
          tribunalMode: record.tribunalMode || 'SOLE_ARBITRATOR',
          baseFeeCents: parseInt(record.baseFeeCents) || null,
          currency: record.currency || 'PEN',
          isActive: record.isActive === 'true',
        },
      });
      idMap.arbitrationTypes[record.id] = arbitrationType.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importCases(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Case', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const caseRecord = await prisma.case.create({
        data: {
          centerId: idMap.centers[record.centerId],
          arbitrationTypeId: idMap.arbitrationTypes[record.arbitrationTypeId],
          year: parseInt(record.year),
          sequence: parseInt(record.sequence),
          code: record.code,
          title: record.title || null,
          status: record.status || 'SUBMITTED',
          scope: record.scope || 'NACIONAL',
          procedureType: record.procedureType || 'REGULAR',
          tribunalMode: record.tribunalMode || 'SOLE_ARBITRATOR',
          currentStage: record.currentStage || null,
          isBlocked: record.isBlocked === 'true',
          blockReason: record.blockReason || null,
          disputeAmountCents: record.disputeAmountCents ? BigInt(record.disputeAmountCents) : null,
          currency: record.currency || 'PEN',
          claimantName: record.claimantName || null,
          respondentName: record.respondentName || null,
          driveFolderId: record.driveFolderId || null,
          submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
          admittedAt: record.admittedAt ? new Date(record.admittedAt) : null,
          closedAt: record.closedAt ? new Date(record.closedAt) : null,
        },
      });
      idMap.cases[record.id] = caseRecord.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importCaseFolders(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'CaseFolder', total: records.length, success: 0, errors: [] };

  // Primero importar carpetas sin padre
  const rootFolders = records.filter(r => !r.parentId);
  const childFolders = records.filter(r => r.parentId);

  for (const record of rootFolders) {
    try {
      const folder = await prisma.caseFolder.create({
        data: {
          caseId: idMap.cases[record.caseId],
          key: record.key,
          name: record.name,
          driveFolderId: record.driveFolderId || null,
          drivePath: record.drivePath || null,
        },
      });
      idMap.caseFolders[record.id] = folder.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: records.indexOf(record) + 2, error: error.message });
    }
  }

  // Luego importar subcarpetas
  for (const record of childFolders) {
    try {
      const folder = await prisma.caseFolder.create({
        data: {
          caseId: idMap.cases[record.caseId],
          key: record.key,
          name: record.name,
          parentId: idMap.caseFolders[record.parentId],
          driveFolderId: record.driveFolderId || null,
          drivePath: record.drivePath || null,
        },
      });
      idMap.caseFolders[record.id] = folder.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: records.indexOf(record) + 2, error: error.message });
    }
  }

  return result;
}

async function importCaseMembers(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'CaseMember', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const member = await prisma.caseMember.create({
        data: {
          caseId: idMap.cases[record.caseId],
          userId: record.userId ? idMap.users[record.userId] : null,
          role: record.role,
          displayName: record.displayName || null,
          email: record.email || null,
          phoneE164: record.phoneE164 || null,
          isPrimary: record.isPrimary === 'true',
        },
      });
      idMap.caseMembers[record.id] = member.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importCaseLawyers(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'CaseLawyer', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await prisma.caseLawyer.create({
        data: {
          caseId: idMap.cases[record.caseId],
          lawyerId: idMap.users[record.lawyerId],
          representedMemberId: record.representedMemberId ? idMap.caseMembers[record.representedMemberId] : null,
          representationType: record.representationType || 'DEMANDANTE',
          caseNumber: record.caseNumber || null,
          barAssociation: record.barAssociation || null,
          powerOfAttorneyDoc: record.powerOfAttorneyDoc || null,
          isActive: record.isActive === 'true',
          isLead: record.isLead === 'true',
          authorizedAt: record.authorizedAt ? new Date(record.authorizedAt) : null,
          revokedAt: record.revokedAt ? new Date(record.revokedAt) : null,
          notes: record.notes || null,
        },
      });
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importCaseDocuments(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'CaseDocument', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const document = await prisma.caseDocument.create({
        data: {
          caseId: idMap.cases[record.caseId],
          folderId: record.folderId ? idMap.caseFolders[record.folderId] : null,
          uploadedById: record.uploadedById ? idMap.users[record.uploadedById] : null,
          documentType: record.documentType,
          description: record.description || null,
          originalFileName: record.originalFileName,
          storedFileName: record.storedFileName || null,
          mimeType: record.mimeType,
          sizeBytes: BigInt(record.sizeBytes),
          checksumSha256: record.checksumSha256 || null,
          driveFileId: record.driveFileId,
          driveWebViewLink: record.driveWebViewLink || null,
          driveDownloadLink: record.driveDownloadLink || null,
          version: parseInt(record.version) || 1,
          status: record.status || 'ACTIVE',
        },
      });
      idMap.documents[record.id] = document.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importPaymentOrders(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'PaymentOrder', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const order = await prisma.paymentOrder.create({
        data: {
          caseId: idMap.cases[record.caseId],
          orderNumber: record.orderNumber,
          concept: record.concept,
          description: record.description,
          amountCents: parseInt(record.amountCents),
          igvCents: parseInt(record.igvCents) || 0,
          totalCents: parseInt(record.totalCents),
          currency: record.currency || 'PEN',
          issuedAt: record.issuedAt ? new Date(record.issuedAt) : new Date(),
          dueAt: new Date(record.dueAt),
          paidAt: record.paidAt ? new Date(record.paidAt) : null,
          status: record.status || 'PENDING',
          blocksCase: record.blocksCase === 'true',
          refundedAt: record.refundedAt ? new Date(record.refundedAt) : null,
          refundAmount: record.refundAmount ? parseInt(record.refundAmount) : null,
          refundReason: record.refundReason || null,
          createdById: record.createdById ? idMap.users[record.createdById] : null,
          approvedById: record.approvedById ? idMap.users[record.approvedById] : null,
          approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
        },
      });
      idMap.paymentOrders[record.id] = order.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importPayments(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Payment', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const payment = await prisma.payment.create({
        data: {
          caseId: idMap.cases[record.caseId],
          provider: record.provider || 'CULQI',
          status: record.status || 'PENDING',
          currency: record.currency || 'PEN',
          amountCents: parseInt(record.amountCents),
          concept: record.concept,
          description: record.description || null,
          culqiChargeId: record.culqiChargeId || null,
          culqiOrderId: record.culqiOrderId || null,
          voucherDocumentId: record.voucherDocumentId ? idMap.documents[record.voucherDocumentId] : null,
          dueAt: record.dueAt ? new Date(record.dueAt) : null,
          paidAt: record.paidAt ? new Date(record.paidAt) : null,
        },
      });
      idMap.payments[record.id] = payment.id;
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importCaseDeadlines(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'CaseDeadline', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await prisma.caseDeadline.create({
        data: {
          caseId: idMap.cases[record.caseId],
          title: record.title,
          description: record.description || null,
          dueAt: new Date(record.dueAt),
          timezone: record.timezone || 'America/Lima',
          isCompleted: record.isCompleted === 'true',
          completedAt: record.completedAt ? new Date(record.completedAt) : null,
        },
      });
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importCaseHearings(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'CaseHearing', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await prisma.caseHearing.create({
        data: {
          caseId: idMap.cases[record.caseId],
          title: record.title,
          hearingAt: new Date(record.hearingAt),
          timezone: record.timezone || 'America/Lima',
          location: record.location || null,
          meetingUrl: record.meetingUrl || null,
          notes: record.notes || null,
        },
      });
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importCaseNotes(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'CaseNote', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await prisma.caseNote.create({
        data: {
          caseId: idMap.cases[record.caseId],
          authorId: record.authorId ? idMap.users[record.authorId] : null,
          title: record.title || null,
          content: record.content,
          isPrivate: record.isPrivate !== 'false',
        },
      });
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importHolidays(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'Holiday', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await prisma.holiday.create({
        data: {
          centerId: record.centerId ? idMap.centers[record.centerId] : null,
          date: new Date(record.date),
          name: record.name,
          description: record.description || null,
          isNational: record.isNational !== 'false',
          isRecurring: record.isRecurring === 'true',
        },
      });
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

async function importFeeConfiguration(records: any[]): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'FeeConfiguration', total: records.length, success: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await prisma.feeConfiguration.create({
        data: {
          centerId: idMap.centers[record.centerId],
          code: record.code,
          name: record.name,
          description: record.description || null,
          scope: record.scope || 'NACIONAL',
          concept: record.concept,
          amountCents: parseInt(record.amountCents),
          currency: record.currency || 'PEN',
          includesIGV: record.includesIGV === 'true',
          igvRate: parseFloat(record.igvRate) || 0.18,
          isActive: record.isActive !== 'false',
          effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : new Date(),
          effectiveUntil: record.effectiveUntil ? new Date(record.effectiveUntil) : null,
        },
      });
      result.success++;
    } catch (error: any) {
      result.errors.push({ row: i + 2, error: error.message });
    }
  }

  return result;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function parseCSV(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Filtrar líneas de comentarios
  const lines = content.split('\n').filter(line => !line.trim().startsWith('#'));
  const cleanContent = lines.join('\n');

  return parse(cleanContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

async function runMigration(validateOnly: boolean = false, specificTable?: string) {
  console.log('========================================');
  console.log('CAARD - Migración de Datos');
  console.log('========================================');
  console.log(`Modo: ${validateOnly ? 'VALIDACIÓN' : 'IMPORTACIÓN'}`);
  if (specificTable) {
    console.log(`Tabla específica: ${specificTable}`);
  }
  console.log('----------------------------------------\n');

  const migrationDir = path.join(__dirname);
  const results: MigrationResult[] = [];

  const filesToProcess = specificTable
    ? MIGRATION_FILES.filter(f => f.table.toLowerCase() === specificTable.toLowerCase())
    : MIGRATION_FILES;

  for (const migrationFile of filesToProcess) {
    const filePath = path.join(migrationDir, migrationFile.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${migrationFile.file}`);
      continue;
    }

    console.log(`📄 Procesando: ${migrationFile.file}`);

    try {
      const records = parseCSV(filePath);

      if (records.length === 0) {
        console.log(`   ⏭️  Sin datos para importar`);
        continue;
      }

      if (validateOnly) {
        console.log(`   ✅ ${records.length} registros validados`);
        results.push({
          table: migrationFile.table,
          total: records.length,
          success: records.length,
          errors: [],
        });
      } else {
        const result = await migrationFile.handler(records);
        results.push(result);

        if (result.errors.length > 0) {
          console.log(`   ⚠️  ${result.success}/${result.total} importados (${result.errors.length} errores)`);
          result.errors.forEach(err => {
            console.log(`      Fila ${err.row}: ${err.error}`);
          });
        } else {
          console.log(`   ✅ ${result.success}/${result.total} importados correctamente`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('');
  }

  // Resumen final
  console.log('========================================');
  console.log('RESUMEN');
  console.log('========================================');

  let totalRecords = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const result of results) {
    totalRecords += result.total;
    totalSuccess += result.success;
    totalErrors += result.errors.length;
  }

  console.log(`Total de registros: ${totalRecords}`);
  console.log(`Importados: ${totalSuccess}`);
  console.log(`Errores: ${totalErrors}`);
  console.log('========================================\n');

  // Guardar log de errores si los hay
  if (totalErrors > 0 && !validateOnly) {
    const errorLog = results
      .filter(r => r.errors.length > 0)
      .map(r => ({
        table: r.table,
        errors: r.errors,
      }));

    const errorLogPath = path.join(migrationDir, `migration-errors-${Date.now()}.json`);
    fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
    console.log(`📝 Log de errores guardado en: ${errorLogPath}`);
  }
}

// ============================================
// EJECUCIÓN
// ============================================

const args = process.argv.slice(2);
const validateOnly = args.includes('--validate-only');
const tableArg = args.find(a => a.startsWith('--table='));
const specificTable = tableArg ? tableArg.split('=')[1] : undefined;

runMigration(validateOnly, specificTable)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
