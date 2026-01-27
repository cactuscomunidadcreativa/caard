/**
 * Genera el archivo Excel de migración
 * Ejecutar: npx ts-node scripts/generate-migration-excel.ts
 */

import * as XLSX from 'xlsx';
import * as path from 'path';

// Definir las hojas del Excel
const sheets: { name: string; data: any[][] }[] = [
  {
    name: '01_Centers',
    data: [
      ['INSTRUCCIONES: Complete los datos del centro de arbitraje. Los campos con * son obligatorios.'],
      [],
      ['id', 'code*', 'name*', 'legalName', 'taxId', 'driveRootFolderId', 'driveSharedDriveId', 'primaryColorHex', 'accentColorHex', 'neutralColorHex'],
      ['CAARD_001', 'CAARD', 'Centro de Arbitraje CAARD', 'Centro de Administración de Arbitrajes y Resolución de Disputas S.A.C.', '20123456789', '', '', '#0B2A5B', '#D66829', '#9A9A9E'],
    ]
  },
  {
    name: '02_Users',
    data: [
      ['INSTRUCCIONES: Lista de usuarios del sistema. Roles: SUPER_ADMIN, ADMIN, CENTER_STAFF, SECRETARIA, ARBITRO, ABOGADO, DEMANDANTE, DEMANDADO'],
      [],
      ['id', 'email*', 'name', 'image', 'phoneE164', 'role*', 'isActive', 'centerId'],
      ['USR_001', 'admin@caard.pe', 'Juan Pérez García', '', '+51999888777', 'SUPER_ADMIN', 'true', 'CAARD_001'],
      ['USR_002', 'secretaria@caard.pe', 'María López Díaz', '', '+51999888666', 'SECRETARIA', 'true', 'CAARD_001'],
      ['USR_003', 'arbitro1@gmail.com', 'Carlos Rodríguez Sánchez', '', '+51999888555', 'ARBITRO', 'true', 'CAARD_001'],
      ['USR_004', 'abogado1@estudio.pe', 'Ana Torres Mendoza', '', '+51999888444', 'ABOGADO', 'true', 'CAARD_001'],
      ['USR_005', 'demandante@empresa.pe', 'Roberto Vargas Castro', '', '+51999888333', 'DEMANDANTE', 'true', 'CAARD_001'],
      ['USR_006', 'demandado@compania.pe', 'Luis García Martínez', '', '+51999888222', 'DEMANDADO', 'true', 'CAARD_001'],
    ]
  },
  {
    name: '03_ArbitratorRegistry',
    data: [
      ['INSTRUCCIONES: Registro de árbitros. Status: PENDING_APPROVAL, ACTIVE, SUSPENDED, SANCTIONED, RETIRED, REJECTED'],
      [],
      ['id', 'centerId*', 'userId*', 'status', 'barNumber', 'barAssociation', 'specializations', 'applicationDate', 'approvalDate', 'maxConcurrentCases', 'acceptsEmergency', 'notes'],
      ['ARB_001', 'CAARD_001', 'USR_003', 'ACTIVE', 'CAL-12345', 'Colegio de Abogados de Lima', 'Comercial,Civil,Construcción', '2024-01-15', '2024-02-01', '10', 'true', 'Árbitro con amplia experiencia'],
    ]
  },
  {
    name: '04_ArbitrationTypes',
    data: [
      ['INSTRUCCIONES: Tipos de arbitraje. Kind: INSTITUTIONAL, AD_HOC. TribunalMode: SOLE_ARBITRATOR, TRIBUNAL_3'],
      [],
      ['id', 'centerId*', 'code*', 'name*', 'description', 'kind', 'tribunalMode', 'baseFeeCents', 'currency', 'isActive'],
      ['TIPO_001', 'CAARD_001', 'COMERCIAL_NAC', 'Arbitraje Comercial Nacional', 'Controversias comerciales nacionales', 'INSTITUTIONAL', 'SOLE_ARBITRATOR', '50000', 'PEN', 'true'],
      ['TIPO_002', 'CAARD_001', 'COMERCIAL_INT', 'Arbitraje Comercial Internacional', 'Controversias internacionales', 'INSTITUTIONAL', 'TRIBUNAL_3', '100000', 'USD', 'true'],
      ['TIPO_003', 'CAARD_001', 'CONTRATACIONES', 'Contrataciones del Estado', 'Controversias con el Estado', 'INSTITUTIONAL', 'TRIBUNAL_3', '75000', 'PEN', 'true'],
      ['TIPO_004', 'CAARD_001', 'EMERGENCIA', 'Arbitraje de Emergencia', 'Medidas cautelares urgentes', 'INSTITUTIONAL', 'SOLE_ARBITRATOR', '200000', 'PEN', 'true'],
    ]
  },
  {
    name: '05_Cases',
    data: [
      ['INSTRUCCIONES: Expedientes. Status: DRAFT, SUBMITTED, UNDER_REVIEW, OBSERVED, ADMITTED, REJECTED, IN_PROCESS, AWAITING_PAYMENT, PAYMENT_OVERDUE, SUSPENDED, CLOSED, ARCHIVED'],
      ['Scope: NACIONAL, INTERNACIONAL. ProcedureType: REGULAR, EMERGENCY. CurrentStage: DEMANDA, CONTESTACION, RECONVENCION, PROBATORIA, AUDIENCIA_PRUEBAS, INFORMES_ORALES, LAUDO'],
      [],
      ['id', 'centerId*', 'arbitrationTypeId*', 'year*', 'sequence*', 'code*', 'title', 'status', 'scope', 'procedureType', 'tribunalMode', 'currentStage', 'isBlocked', 'blockReason', 'disputeAmountCents', 'currency', 'claimantName', 'respondentName', 'submittedAt', 'admittedAt', 'closedAt'],
      ['CASO_001', 'CAARD_001', 'TIPO_001', '2024', '1', 'EXP-2024-CAARD-000001', 'Controversia Empresa A vs Empresa B', 'IN_PROCESS', 'NACIONAL', 'REGULAR', 'SOLE_ARBITRATOR', 'PROBATORIA', 'false', '', '50000000', 'PEN', 'Empresa Comercial A S.A.C.', 'Empresa Industrial B S.A.', '2024-01-15', '2024-02-01', ''],
      ['CASO_002', 'CAARD_001', 'TIPO_002', '2024', '2', 'EXP-2024-CAARD-000002', 'Disputa Internacional XYZ', 'AWAITING_PAYMENT', 'INTERNACIONAL', 'REGULAR', 'TRIBUNAL_3', 'DEMANDA', 'true', 'Pendiente de pago', '100000000', 'USD', 'International Corp Inc.', 'Peruvian Company S.A.C.', '2024-02-20', '', ''],
      ['CASO_003', 'CAARD_001', 'TIPO_003', '2024', '3', 'EXP-2024-CAARD-000003', 'Controversia Contratación Pública', 'CLOSED', 'NACIONAL', 'REGULAR', 'TRIBUNAL_3', 'LAUDO', 'false', '', '75000000', 'PEN', 'Constructora Nacional S.A.', 'Municipalidad de Lima', '2024-01-05', '2024-01-20', '2024-06-15'],
    ]
  },
  {
    name: '06_CaseMembers',
    data: [
      ['INSTRUCCIONES: Miembros del caso. Role: DEMANDANTE, DEMANDADO, ARBITRO, SECRETARIA'],
      [],
      ['id', 'caseId*', 'userId', 'role*', 'displayName', 'email', 'phoneE164', 'isPrimary'],
      ['MEMBER_001', 'CASO_001', 'USR_005', 'DEMANDANTE', 'Empresa Comercial A S.A.C.', 'contacto@empresaa.pe', '+51999111222', 'true'],
      ['MEMBER_002', 'CASO_001', 'USR_006', 'DEMANDADO', 'Empresa Industrial B S.A.', 'legal@empresab.pe', '+51999333444', 'true'],
      ['MEMBER_003', 'CASO_001', 'USR_003', 'ARBITRO', 'Carlos Rodríguez Sánchez', 'arbitro1@gmail.com', '+51999888555', 'true'],
      ['MEMBER_004', 'CASO_001', 'USR_002', 'SECRETARIA', 'María López Díaz', 'secretaria@caard.pe', '+51999888666', 'true'],
    ]
  },
  {
    name: '07_CaseLawyers',
    data: [
      ['INSTRUCCIONES: Abogados del caso. RepresentationType: DEMANDANTE, DEMANDADO, AMBOS'],
      [],
      ['id', 'caseId*', 'lawyerId*', 'representedMemberId', 'representationType*', 'caseNumber', 'barAssociation', 'powerOfAttorneyDoc', 'isActive', 'isLead', 'authorizedAt', 'notes'],
      ['LAWYER_001', 'CASO_001', 'USR_004', 'MEMBER_001', 'DEMANDANTE', 'CAL-54321', 'Colegio de Abogados de Lima', '', 'true', 'true', '2024-01-15', 'Abogado principal'],
    ]
  },
  {
    name: '08_CaseFolders',
    data: [
      ['INSTRUCCIONES: Carpetas del expediente en Google Drive'],
      [],
      ['id', 'caseId*', 'key*', 'name*', 'parentId', 'driveFolderId', 'drivePath'],
      ['FOLDER_001', 'CASO_001', '01_Solicitud', '01 - Solicitud y Demanda', '', '', 'EXP-2024-CAARD-000001/01_Solicitud'],
      ['FOLDER_002', 'CASO_001', '02_Contestacion', '02 - Contestación', '', '', 'EXP-2024-CAARD-000001/02_Contestacion'],
      ['FOLDER_003', 'CASO_001', '03_Resoluciones', '03 - Resoluciones', '', '', 'EXP-2024-CAARD-000001/03_Resoluciones'],
      ['FOLDER_004', 'CASO_001', '04_Pruebas', '04 - Medios Probatorios', '', '', 'EXP-2024-CAARD-000001/04_Pruebas'],
      ['FOLDER_005', 'CASO_001', '05_Audiencias', '05 - Actas de Audiencias', '', '', 'EXP-2024-CAARD-000001/05_Audiencias'],
      ['FOLDER_006', 'CASO_001', '06_Alegatos', '06 - Alegatos', '', '', 'EXP-2024-CAARD-000001/06_Alegatos'],
      ['FOLDER_007', 'CASO_001', '07_Laudo', '07 - Laudo Arbitral', '', '', 'EXP-2024-CAARD-000001/07_Laudo'],
      ['FOLDER_008', 'CASO_001', '08_Pagos', '08 - Comprobantes de Pago', '', '', 'EXP-2024-CAARD-000001/08_Pagos'],
    ]
  },
  {
    name: '09_CaseDocuments',
    data: [
      ['INSTRUCCIONES: Documentos del caso. Status: ACTIVE, REPLACED, VOID'],
      [],
      ['id', 'caseId*', 'folderId', 'uploadedById', 'documentType*', 'description', 'originalFileName*', 'mimeType*', 'sizeBytes*', 'driveFileId*', 'driveWebViewLink', 'version', 'status'],
      ['DOC_001', 'CASO_001', 'FOLDER_001', 'USR_005', 'Demanda', 'Escrito de demanda principal', 'demanda_caso_001.pdf', 'application/pdf', '1548000', 'DRIVE_FILE_001', 'https://drive.google.com/view/001', '1', 'ACTIVE'],
      ['DOC_002', 'CASO_001', 'FOLDER_001', 'USR_005', 'Anexo', 'Contrato materia de controversia', 'contrato_original.pdf', 'application/pdf', '2356000', 'DRIVE_FILE_002', 'https://drive.google.com/view/002', '1', 'ACTIVE'],
      ['DOC_003', 'CASO_001', 'FOLDER_002', 'USR_006', 'Contestación', 'Contestación de demanda', 'contestacion.pdf', 'application/pdf', '1890000', 'DRIVE_FILE_003', 'https://drive.google.com/view/003', '1', 'ACTIVE'],
    ]
  },
  {
    name: '10_PaymentOrders',
    data: [
      ['INSTRUCCIONES: Órdenes de pago. Concept: TASA_PRESENTACION, GASTOS_ADMINISTRATIVOS, HONORARIOS_ARBITRO_UNICO, HONORARIOS_TRIBUNAL, TASA_EMERGENCIA, GASTOS_RECONVENCION, RELIQUIDACION, OTROS'],
      ['Status: PENDING, PARTIAL, PAID, OVERDUE, CANCELLED, REFUNDED. Montos en céntimos (50000 = S/.500.00)'],
      [],
      ['id', 'caseId*', 'orderNumber*', 'concept*', 'description*', 'amountCents*', 'igvCents', 'totalCents*', 'currency', 'issuedAt', 'dueAt*', 'paidAt', 'status', 'blocksCase'],
      ['OP_001', 'CASO_001', 'OP-2024-000001', 'TASA_PRESENTACION', 'Tasa de presentación de solicitud', '42373', '7627', '50000', 'PEN', '2024-01-15', '2024-01-30', '2024-01-18', 'PAID', 'true'],
      ['OP_002', 'CASO_001', 'OP-2024-000002', 'GASTOS_ADMINISTRATIVOS', 'Gastos administrativos', '127119', '22881', '150000', 'PEN', '2024-02-01', '2024-02-15', '2024-02-10', 'PAID', 'true'],
      ['OP_003', 'CASO_001', 'OP-2024-000003', 'HONORARIOS_ARBITRO_UNICO', 'Honorarios del árbitro', '423729', '76271', '500000', 'PEN', '2024-02-15', '2024-03-01', '2024-02-28', 'PAID', 'true'],
    ]
  },
  {
    name: '11_Payments',
    data: [
      ['INSTRUCCIONES: Pagos realizados. Provider: CULQI, MANUAL_VOUCHER. Status: REQUIRED, PENDING, CONFIRMED, FAILED, CANCELLED, OVERDUE, REFUNDED'],
      [],
      ['id', 'caseId*', 'provider', 'status*', 'currency', 'amountCents*', 'concept*', 'description', 'culqiChargeId', 'culqiOrderId', 'voucherDocumentId', 'dueAt', 'paidAt'],
      ['PAY_001', 'CASO_001', 'CULQI', 'CONFIRMED', 'PEN', '50000', 'Tasa de Presentación', 'Tasa de presentación', 'ch_live_123456', 'ord_123456', '', '2024-01-30', '2024-01-18'],
      ['PAY_002', 'CASO_001', 'MANUAL_VOUCHER', 'CONFIRMED', 'PEN', '150000', 'Gastos Administrativos', 'Gastos administrativos', '', '', 'DOC_VOUCHER_001', '2024-02-15', '2024-02-10'],
    ]
  },
  {
    name: '12_CaseDeadlines',
    data: [
      ['INSTRUCCIONES: Plazos del caso'],
      [],
      ['id', 'caseId*', 'title*', 'description', 'dueAt*', 'timezone', 'isCompleted', 'completedAt'],
      ['DEADLINE_001', 'CASO_001', 'Plazo para contestación', 'La parte demandada debe presentar su contestación', '2024-02-15', 'America/Lima', 'true', '2024-02-10'],
      ['DEADLINE_002', 'CASO_001', 'Plazo para presentación de pruebas', 'Ambas partes deben presentar pruebas', '2024-03-15', 'America/Lima', 'true', '2024-03-14'],
      ['DEADLINE_003', 'CASO_001', 'Plazo para alegatos', 'Presentación de alegatos finales', '2024-04-30', 'America/Lima', 'false', ''],
    ]
  },
  {
    name: '13_CaseHearings',
    data: [
      ['INSTRUCCIONES: Audiencias del caso'],
      [],
      ['id', 'caseId*', 'title*', 'hearingAt*', 'timezone', 'location', 'meetingUrl', 'notes'],
      ['HEARING_001', 'CASO_001', 'Audiencia de Instalación', '2024-02-20T10:00:00', 'America/Lima', 'Sala CAARD - Av. Ejemplo 123', 'https://meet.google.com/abc-defg', 'Primera audiencia'],
      ['HEARING_002', 'CASO_001', 'Audiencia de Pruebas', '2024-04-15T15:00:00', 'America/Lima', '', 'https://zoom.us/j/123456789', 'Audiencia virtual'],
    ]
  },
  {
    name: '14_CaseNotes',
    data: [
      ['INSTRUCCIONES: Notas internas del caso'],
      [],
      ['id', 'caseId*', 'authorId', 'title', 'content*', 'isPrivate'],
      ['NOTE_001', 'CASO_001', 'USR_002', 'Observación inicial', 'Se recibió la solicitud completa con todos los anexos requeridos.', 'true'],
      ['NOTE_002', 'CASO_001', 'USR_002', 'Verificación de pago', 'Se verificó el pago de la tasa de presentación.', 'true'],
    ]
  },
  {
    name: '15_Holidays',
    data: [
      ['INSTRUCCIONES: Feriados (para cálculo de días hábiles). Dejar centerId vacío para feriados nacionales.'],
      [],
      ['id', 'centerId', 'date*', 'name*', 'description', 'isNational', 'isRecurring'],
      ['HOL_001', '', '2024-01-01', 'Año Nuevo', 'Feriado por Año Nuevo', 'true', 'true'],
      ['HOL_002', '', '2024-03-28', 'Jueves Santo', 'Semana Santa', 'true', 'false'],
      ['HOL_003', '', '2024-03-29', 'Viernes Santo', 'Semana Santa', 'true', 'false'],
      ['HOL_004', '', '2024-05-01', 'Día del Trabajo', 'Feriado', 'true', 'true'],
      ['HOL_005', '', '2024-06-29', 'San Pedro y San Pablo', 'Feriado', 'true', 'true'],
      ['HOL_006', '', '2024-07-28', 'Fiestas Patrias', 'Independencia del Perú', 'true', 'true'],
      ['HOL_007', '', '2024-07-29', 'Fiestas Patrias', 'Feriado', 'true', 'true'],
      ['HOL_008', '', '2024-08-30', 'Santa Rosa de Lima', 'Feriado', 'true', 'true'],
      ['HOL_009', '', '2024-10-08', 'Combate de Angamos', 'Feriado', 'true', 'true'],
      ['HOL_010', '', '2024-11-01', 'Día de Todos los Santos', 'Feriado', 'true', 'true'],
      ['HOL_011', '', '2024-12-08', 'Inmaculada Concepción', 'Feriado', 'true', 'true'],
      ['HOL_012', '', '2024-12-09', 'Batalla de Ayacucho', 'Feriado', 'true', 'true'],
      ['HOL_013', '', '2024-12-25', 'Navidad', 'Feriado', 'true', 'true'],
    ]
  },
  {
    name: '16_FeeConfiguration',
    data: [
      ['INSTRUCCIONES: Configuración de tarifas. Scope: NACIONAL, INTERNACIONAL'],
      ['Concept: TASA_PRESENTACION, GASTOS_ADMINISTRATIVOS, HONORARIOS_ARBITRO_UNICO, HONORARIOS_TRIBUNAL, TASA_EMERGENCIA, GASTOS_RECONVENCION, RELIQUIDACION, OTROS'],
      [],
      ['id', 'centerId*', 'code*', 'name*', 'description', 'scope', 'concept*', 'amountCents*', 'currency', 'includesIGV', 'igvRate', 'isActive', 'effectiveFrom'],
      ['FEE_001', 'CAARD_001', 'PRESENTACION_NAC', 'Tasa de Presentación Nacional', 'Tasa para arbitrajes nacionales', 'NACIONAL', 'TASA_PRESENTACION', '50000', 'PEN', 'true', '0.18', 'true', '2024-01-01'],
      ['FEE_002', 'CAARD_001', 'PRESENTACION_INT', 'Tasa de Presentación Internacional', 'Tasa para arbitrajes internacionales', 'INTERNACIONAL', 'TASA_PRESENTACION', '100000', 'USD', 'false', '0', 'true', '2024-01-01'],
      ['FEE_003', 'CAARD_001', 'GASTOS_ADMIN_NAC', 'Gastos Administrativos Nacional', 'Gastos administrativos nacionales', 'NACIONAL', 'GASTOS_ADMINISTRATIVOS', '150000', 'PEN', 'true', '0.18', 'true', '2024-01-01'],
      ['FEE_004', 'CAARD_001', 'HONORARIOS_ARB', 'Honorarios Árbitro Único', 'Honorarios base árbitro único', 'NACIONAL', 'HONORARIOS_ARBITRO_UNICO', '500000', 'PEN', 'true', '0.18', 'true', '2024-01-01'],
      ['FEE_005', 'CAARD_001', 'HONORARIOS_TRIB', 'Honorarios Tribunal', 'Honorarios tribunal 3 árbitros', 'NACIONAL', 'HONORARIOS_TRIBUNAL', '1500000', 'PEN', 'true', '0.18', 'true', '2024-01-01'],
      ['FEE_006', 'CAARD_001', 'EMERGENCIA', 'Tasa de Emergencia', 'Tasa arbitraje de emergencia', 'NACIONAL', 'TASA_EMERGENCIA', '200000', 'PEN', 'true', '0.18', 'true', '2024-01-01'],
    ]
  },
  {
    name: 'INSTRUCCIONES',
    data: [
      ['CAARD - PLANTILLA DE MIGRACIÓN DE DATOS'],
      [],
      ['INSTRUCCIONES GENERALES:'],
      ['1. Complete cada hoja con los datos correspondientes'],
      ['2. Los campos marcados con * son OBLIGATORIOS'],
      ['3. No modifique las cabeceras de las columnas'],
      ['4. Use los IDs temporales (ej: CASO_001) para referencias entre tablas'],
      ['5. Los montos están en céntimos (50000 = S/.500.00)'],
      [],
      ['ORDEN DE IMPORTACIÓN:'],
      ['1. 01_Centers - Centros de Arbitraje'],
      ['2. 02_Users - Usuarios del sistema'],
      ['3. 03_ArbitratorRegistry - Registro de Árbitros'],
      ['4. 04_ArbitrationTypes - Tipos de Arbitraje'],
      ['5. 05_Cases - Expedientes'],
      ['6. 06_CaseMembers - Miembros del Caso'],
      ['7. 07_CaseLawyers - Abogados del Caso'],
      ['8. 08_CaseFolders - Carpetas del Expediente'],
      ['9. 09_CaseDocuments - Documentos'],
      ['10. 10_PaymentOrders - Órdenes de Pago'],
      ['11. 11_Payments - Pagos'],
      ['12. 12_CaseDeadlines - Plazos'],
      ['13. 13_CaseHearings - Audiencias'],
      ['14. 14_CaseNotes - Notas'],
      ['15. 15_Holidays - Feriados'],
      ['16. 16_FeeConfiguration - Configuración de Tarifas'],
      [],
      ['ROLES DE USUARIO:'],
      ['SUPER_ADMIN - Administrador del sistema completo'],
      ['ADMIN - Administrador general del centro'],
      ['CENTER_STAFF - Personal del centro'],
      ['SECRETARIA - Secretaría arbitral'],
      ['ARBITRO - Árbitro'],
      ['ABOGADO - Abogado'],
      ['DEMANDANTE - Parte demandante'],
      ['DEMANDADO - Parte demandada'],
      [],
      ['ESTADOS DEL CASO:'],
      ['DRAFT - Borrador'],
      ['SUBMITTED - Presentado'],
      ['UNDER_REVIEW - En Revisión'],
      ['OBSERVED - Observado'],
      ['ADMITTED - Admitido'],
      ['REJECTED - Rechazado'],
      ['IN_PROCESS - En Trámite'],
      ['AWAITING_PAYMENT - Pendiente de Pago'],
      ['PAYMENT_OVERDUE - Pago Vencido'],
      ['SUSPENDED - Suspendido'],
      ['CLOSED - Cerrado'],
      ['ARCHIVED - Archivado'],
      [],
      ['ETAPAS PROCESALES:'],
      ['DEMANDA - Etapa de demanda'],
      ['CONTESTACION - Etapa de contestación'],
      ['RECONVENCION - Etapa de reconvención'],
      ['PROBATORIA - Etapa probatoria'],
      ['AUDIENCIA_PRUEBAS - Audiencia de pruebas'],
      ['INFORMES_ORALES - Informes orales'],
      ['LAUDO - Etapa de laudo'],
      [],
      ['FORMATO DE FECHAS: YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS'],
      ['FORMATO DE BOOLEANOS: true o false (minúsculas)'],
      [],
      ['SOPORTE: soporte@caard.pe'],
    ]
  },
];

// Crear el workbook
const workbook = XLSX.utils.book_new();

// Agregar cada hoja
for (const sheet of sheets) {
  const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);

  // Configurar anchos de columna
  const colWidths = sheet.data[0]?.map(() => ({ wch: 25 })) || [];
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
}

// Guardar el archivo
const outputPath = path.join(__dirname, '..', 'public', 'CAARD_Plantilla_Migracion.xlsx');

// Crear directorio si no existe
const fs = require('fs');
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

XLSX.writeFile(workbook, outputPath);

console.log(`✅ Archivo Excel generado: ${outputPath}`);
console.log('');
console.log('Descarga disponible en: /CAARD_Plantilla_Migracion.xlsx');
