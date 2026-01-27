/**
 * CAARD - Seed Completo de Base de Datos
 * ======================================
 * Ejecutar con: npx prisma db seed
 *
 * Este seed crea todos los datos necesarios para que el sistema funcione:
 * 1. Centro de Arbitraje
 * 2. Tipos de Arbitraje
 * 3. Usuarios (8 roles)
 * 4. Configuración de Roles
 * 5. Expedientes de ejemplo
 * 6. Sistema de Reglas (Tasas, Plazos, Devoluciones)
 * 7. Feriados de Perú
 * 8. CMS (Páginas, Menú, Artículos, Eventos)
 * 9. Sistema de IA (Modelos, Asistentes)
 */

import { PrismaClient, Role, AIProvider, ArbitrationScope, ProcedureType, ProcessStage, PaymentConcept, CaseStatus, DeadlineType, DeadlineStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// =============================================================================
// CONSTANTES Y DATOS
// =============================================================================

// Feriados de Perú 2024-2030
const HOLIDAYS_PERU = [
  // Feriados fijos (se repiten cada año) - usamos 2024 como año base para recurrentes
  { date: new Date("2024-01-01"), name: "Año Nuevo", isRecurring: true },
  { date: new Date("2024-05-01"), name: "Día del Trabajo", isRecurring: true },
  { date: new Date("2024-06-29"), name: "San Pedro y San Pablo", isRecurring: true },
  { date: new Date("2024-07-28"), name: "Fiestas Patrias", isRecurring: true },
  { date: new Date("2024-07-29"), name: "Fiestas Patrias", isRecurring: true },
  { date: new Date("2024-08-06"), name: "Batalla de Junín", isRecurring: true },
  { date: new Date("2024-08-30"), name: "Santa Rosa de Lima", isRecurring: true },
  { date: new Date("2024-10-08"), name: "Combate de Angamos", isRecurring: true },
  { date: new Date("2024-11-01"), name: "Día de Todos los Santos", isRecurring: true },
  { date: new Date("2024-12-08"), name: "Inmaculada Concepción", isRecurring: true },
  { date: new Date("2024-12-09"), name: "Batalla de Ayacucho", isRecurring: true },
  { date: new Date("2024-12-25"), name: "Navidad", isRecurring: true },
  // Semana Santa (varía cada año)
  { date: new Date("2024-03-28"), name: "Jueves Santo 2024" },
  { date: new Date("2024-03-29"), name: "Viernes Santo 2024" },
  { date: new Date("2025-04-17"), name: "Jueves Santo 2025" },
  { date: new Date("2025-04-18"), name: "Viernes Santo 2025" },
  { date: new Date("2026-04-02"), name: "Jueves Santo 2026" },
  { date: new Date("2026-04-03"), name: "Viernes Santo 2026" },
  { date: new Date("2027-03-25"), name: "Jueves Santo 2027" },
  { date: new Date("2027-03-26"), name: "Viernes Santo 2027" },
];

// Configuración de tasas
const FEES_CONFIG = [
  { scope: "NACIONAL" as ArbitrationScope, concept: "TASA_PRESENTACION" as PaymentConcept, code: "PRESENTACION_NACIONAL", name: "Tasa de Presentación - Nacional", amountCents: 50000, currency: "PEN", igvRate: 0.18 },
  { scope: "NACIONAL" as ArbitrationScope, concept: "TASA_EMERGENCIA" as PaymentConcept, code: "EMERGENCIA_NACIONAL", name: "Tasa de Árbitro de Emergencia - Nacional", amountCents: 180000, currency: "PEN", igvRate: 0.18 },
  { scope: "INTERNACIONAL" as ArbitrationScope, concept: "TASA_PRESENTACION" as PaymentConcept, code: "PRESENTACION_INTERNACIONAL", name: "Tasa de Presentación - Internacional", amountCents: 40000, currency: "USD", igvRate: 0 },
  { scope: "INTERNACIONAL" as ArbitrationScope, concept: "TASA_EMERGENCIA" as PaymentConcept, code: "EMERGENCIA_INTERNACIONAL", name: "Tasa de Árbitro de Emergencia - Internacional", amountCents: 150000, currency: "USD", igvRate: 0 },
  { scope: "NACIONAL" as ArbitrationScope, concept: "GASTOS_ADMINISTRATIVOS" as PaymentConcept, code: "GASTOS_ADMIN_NACIONAL", name: "Gastos Administrativos - Nacional", amountCents: 100000, currency: "PEN", igvRate: 0.18 },
  { scope: "NACIONAL" as ArbitrationScope, concept: "HONORARIOS_ARBITRO_UNICO" as PaymentConcept, code: "HONORARIOS_UNICO_NACIONAL", name: "Honorarios Árbitro Único - Nacional", amountCents: 500000, currency: "PEN", igvRate: 0.18 },
];

// Tabla de devoluciones por etapa
const REFUND_RATES = [
  { stage: ProcessStage.DEMANDA, stageName: "Etapa de Demanda", refundPercentage: 96, retainedPercentage: 4 },
  { stage: ProcessStage.CONTESTACION, stageName: "Etapa de Contestación", refundPercentage: 93, retainedPercentage: 7 },
  { stage: ProcessStage.RECONVENCION, stageName: "Etapa de Reconvención", refundPercentage: 90, retainedPercentage: 10 },
  { stage: ProcessStage.PROBATORIA, stageName: "Etapa Probatoria", refundPercentage: 55, retainedPercentage: 45 },
  { stage: ProcessStage.AUDIENCIA_PRUEBAS, stageName: "Audiencia de Pruebas", refundPercentage: 40, retainedPercentage: 60 },
  { stage: ProcessStage.INFORMES_ORALES, stageName: "Informes Orales", refundPercentage: 25, retainedPercentage: 75 },
  { stage: ProcessStage.LAUDO, stageName: "Laudo", refundPercentage: 0, retainedPercentage: 100 },
];

// =============================================================================
// FUNCIÓN PRINCIPAL
// =============================================================================

async function main() {
  console.log("═".repeat(60));
  console.log("🌱 CAARD - SEED COMPLETO DE BASE DE DATOS");
  console.log("═".repeat(60));
  console.log();

  // ==========================================================================
  // 1. CENTRO DE ARBITRAJE
  // ==========================================================================
  console.log("📍 1. Creando Centro de Arbitraje...");

  const center = await prisma.center.upsert({
    where: { code: "CAARD" },
    update: {},
    create: {
      code: "CAARD",
      name: "Centro de Administración de Arbitrajes y Resolución de Disputas",
      legalName: "CAARD S.A.C.",
      taxId: "20123456789",
      primaryColorHex: "#0B2A5B",
      accentColorHex: "#D66829",
      neutralColorHex: "#9A9A9E",
    },
  });
  console.log(`   ✓ Centro: ${center.name}\n`);

  // ==========================================================================
  // 2. TIPOS DE ARBITRAJE
  // ==========================================================================
  console.log("⚖️  2. Creando Tipos de Arbitraje...");

  const tiposArbitraje = [
    { code: "COMERCIAL", name: "Arbitraje Comercial", description: "Controversias derivadas de relaciones comerciales y mercantiles.", kind: "INSTITUTIONAL" as const, tribunalMode: "SOLE_ARBITRATOR" as const, baseFeeCents: 50000, currency: "PEN" },
    { code: "CONSTRUCCION", name: "Arbitraje de Construcción", description: "Controversias de contratos de construcción y obras.", kind: "INSTITUTIONAL" as const, tribunalMode: "TRIBUNAL_3" as const, baseFeeCents: 100000, currency: "PEN" },
    { code: "EMERGENCIA", name: "Arbitraje de Emergencia", description: "Procedimiento acelerado para medidas urgentes.", kind: "INSTITUTIONAL" as const, tribunalMode: "SOLE_ARBITRATOR" as const, baseFeeCents: 75000, currency: "PEN" },
    { code: "CONSUMO", name: "Arbitraje de Consumo", description: "Controversias entre consumidores y proveedores.", kind: "INSTITUTIONAL" as const, tribunalMode: "SOLE_ARBITRATOR" as const, baseFeeCents: 25000, currency: "PEN" },
    { code: "INTERNACIONAL", name: "Arbitraje Internacional", description: "Controversias con elementos de extranjería.", kind: "INSTITUTIONAL" as const, tribunalMode: "TRIBUNAL_3" as const, baseFeeCents: 200000, currency: "USD" },
  ];

  for (const tipo of tiposArbitraje) {
    await prisma.arbitrationType.upsert({
      where: { centerId_code: { centerId: center.id, code: tipo.code } },
      update: {},
      create: { centerId: center.id, ...tipo },
    });
    console.log(`   ✓ ${tipo.name}`);
  }
  console.log();

  // ==========================================================================
  // 3. USUARIOS (8 ROLES)
  // ==========================================================================
  console.log("👥 3. Creando Usuarios para los 8 roles...");

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const users = [
    { email: "superadmin@caard.pe", name: "Super Administrador CAARD", role: Role.SUPER_ADMIN, phone: "+51999000001" },
    { email: "admin@caard.pe", name: "Administrador General", role: Role.ADMIN, phone: "+51999000002" },
    { email: "staff@caard.pe", name: "Personal del Centro", role: Role.CENTER_STAFF, phone: "+51999000003" },
    { email: "secretaria@caard.pe", name: "María García López", role: Role.SECRETARIA, phone: "+51999000004" },
    { email: "arbitro@caard.pe", name: "Dr. Carlos Mendoza Ruiz", role: Role.ARBITRO, phone: "+51999000005" },
    { email: "arbitro2@caard.pe", name: "Dra. Patricia Vargas Soto", role: Role.ARBITRO, phone: "+51999000010" },
    { email: "abogado@caard.pe", name: "Dra. Ana Torres Vega", role: Role.ABOGADO, phone: "+51999000006" },
    { email: "abogado2@caard.pe", name: "Dr. Miguel Fernández", role: Role.ABOGADO, phone: "+51999000011" },
    { email: "demandante@ejemplo.com", name: "Juan Pérez Sánchez", role: Role.DEMANDANTE, phone: "+51999000007" },
    { email: "demandado@ejemplo.com", name: "Empresa ABC S.A.C.", role: Role.DEMANDADO, phone: "+51999000008" },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, passwordHash, role: u.role, centerId: center.id, isActive: true, phoneE164: u.phone },
    });
    createdUsers[u.role] = user.id;
    createdUsers[u.email] = user.id;
    console.log(`   ✓ ${u.role}: ${u.email}`);
  }
  console.log();

  // ==========================================================================
  // 4. CONFIGURACIÓN DE ROLES
  // ==========================================================================
  console.log("🔧 4. Creando Configuración de Roles...");

  const roleConfigs = [
    { role: Role.SUPER_ADMIN, displayName: "Super Administrador", description: "Acceso total al sistema", color: "bg-red-100 text-red-700 border-red-200", icon: "ShieldAlert", canAccessAdmin: true, canAccessCMS: true, canAccessAI: true, canManageUsers: true, canManageCases: true, canManageDocuments: true, canViewReports: true, isSystemRole: true, sortOrder: 1 },
    { role: Role.ADMIN, displayName: "Administrador General", description: "Administración del centro", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "Shield", canAccessAdmin: true, canAccessCMS: true, canAccessAI: true, canManageUsers: true, canManageCases: true, canManageDocuments: true, canViewReports: true, isSystemRole: true, sortOrder: 2 },
    { role: Role.CENTER_STAFF, displayName: "Personal del Centro", description: "Staff administrativo", color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "Building", canAccessAdmin: false, canAccessCMS: true, canAccessAI: true, canManageUsers: false, canManageCases: false, canManageDocuments: true, canViewReports: false, isSystemRole: true, sortOrder: 3 },
    { role: Role.SECRETARIA, displayName: "Secretaría Arbitral", description: "Gestión de expedientes y documentos", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "ClipboardList", canAccessAdmin: false, canAccessCMS: false, canAccessAI: true, canManageUsers: false, canManageCases: true, canManageDocuments: true, canViewReports: true, isSystemRole: true, sortOrder: 4 },
    { role: Role.ARBITRO, displayName: "Árbitro", description: "Resolución de casos asignados", color: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: "Scale", canAccessAdmin: false, canAccessCMS: false, canAccessAI: true, canManageUsers: false, canManageCases: false, canManageDocuments: true, canViewReports: true, maxCasesAssigned: 50, isSystemRole: true, sortOrder: 5 },
    { role: Role.ABOGADO, displayName: "Abogado", description: "Representante legal de partes", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "Briefcase", canAccessAdmin: false, canAccessCMS: false, canAccessAI: true, canManageUsers: false, canManageCases: false, canManageDocuments: true, canViewReports: false, isSystemRole: true, sortOrder: 6 },
    { role: Role.DEMANDANTE, displayName: "Demandante", description: "Parte que inicia el proceso", color: "bg-green-100 text-green-700 border-green-200", icon: "UserCheck", canAccessAdmin: false, canAccessCMS: false, canAccessAI: true, canManageUsers: false, canManageCases: false, canManageDocuments: true, canViewReports: false, isSystemRole: true, sortOrder: 7 },
    { role: Role.DEMANDADO, displayName: "Demandado", description: "Parte contra la cual se dirige la demanda", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "User", canAccessAdmin: false, canAccessCMS: false, canAccessAI: true, canManageUsers: false, canManageCases: false, canManageDocuments: true, canViewReports: false, isSystemRole: true, sortOrder: 8 },
  ];

  for (const config of roleConfigs) {
    await prisma.roleConfig.upsert({
      where: { role: config.role },
      update: config,
      create: { ...config, isActive: true },
    });
  }
  console.log(`   ✓ ${roleConfigs.length} roles configurados\n`);

  // ==========================================================================
  // 5. REGISTRO DE ÁRBITROS
  // ==========================================================================
  console.log("⚖️  5. Creando Registro de Árbitros...");

  const arbitroUser = await prisma.user.findUnique({ where: { email: "arbitro@caard.pe" } });
  const arbitro2User = await prisma.user.findUnique({ where: { email: "arbitro2@caard.pe" } });

  if (arbitroUser) {
    await prisma.arbitratorRegistry.upsert({
      where: { userId: arbitroUser.id },
      update: {},
      create: {
        centerId: center.id,
        userId: arbitroUser.id,
        status: "ACTIVE",
        barNumber: "CAL-12345",
        barAssociation: "Colegio de Abogados de Lima",
        specializations: ["Comercial", "Construcción", "Contrataciones con el Estado"],
        approvalDate: new Date(),
        maxConcurrentCases: 15,
        acceptsEmergency: true,
      },
    });
    console.log(`   ✓ Dr. Carlos Mendoza Ruiz - Árbitro Activo`);
  }

  if (arbitro2User) {
    await prisma.arbitratorRegistry.upsert({
      where: { userId: arbitro2User.id },
      update: {},
      create: {
        centerId: center.id,
        userId: arbitro2User.id,
        status: "ACTIVE",
        barNumber: "CAL-23456",
        barAssociation: "Colegio de Abogados de Lima",
        specializations: ["Comercial", "Consumo", "Internacional"],
        approvalDate: new Date(),
        maxConcurrentCases: 10,
        acceptsEmergency: true,
      },
    });
    console.log(`   ✓ Dra. Patricia Vargas Soto - Árbitro Activo`);
  }
  console.log();

  // ==========================================================================
  // 6. EXPEDIENTES DE EJEMPLO
  // ==========================================================================
  console.log("📁 6. Creando Expedientes de ejemplo...");

  const tipoComercial = await prisma.arbitrationType.findFirst({ where: { centerId: center.id, code: "COMERCIAL" } });
  const tipoConstruccion = await prisma.arbitrationType.findFirst({ where: { centerId: center.id, code: "CONSTRUCCION" } });
  const tipoEmergencia = await prisma.arbitrationType.findFirst({ where: { centerId: center.id, code: "EMERGENCIA" } });

  const casesData = [
    { typeId: tipoComercial?.id, code: "ARB-2025-0001", title: "Incumplimiento de contrato de servicios de software", status: CaseStatus.IN_PROCESS, stage: ProcessStage.CONTESTACION, claimant: "Juan Pérez Sánchez", respondent: "Tech Solutions S.A.C.", amount: 25000000, submittedAt: new Date("2025-01-05"), admittedAt: new Date("2025-01-10") },
    { typeId: tipoComercial?.id, code: "ARB-2025-0002", title: "Disputa por suministro de materiales", status: CaseStatus.ADMITTED, stage: ProcessStage.DEMANDA, claimant: "Importadora del Norte E.I.R.L.", respondent: "Distribuidora Sur S.A.", amount: 15000000, submittedAt: new Date("2025-01-15"), admittedAt: new Date("2025-01-20") },
    { typeId: tipoConstruccion?.id, code: "ARB-2025-0003", title: "Controversia en obra de edificio residencial", status: CaseStatus.IN_PROCESS, stage: ProcessStage.PROBATORIA, claimant: "Constructora Andina S.A.C.", respondent: "Inmobiliaria Central S.A.", amount: 85000000, submittedAt: new Date("2024-11-10"), admittedAt: new Date("2024-11-18") },
    { typeId: tipoComercial?.id, code: "ARB-2025-0004", title: "Resolución de contrato de franquicia", status: CaseStatus.AWAITING_PAYMENT, stage: ProcessStage.DEMANDA, claimant: "Franquicias Perú S.A.C.", respondent: "Operador Local E.I.R.L.", amount: 35000000, submittedAt: new Date("2025-01-22") },
    { typeId: tipoEmergencia?.id, code: "EMG-2025-0001", title: "Medida cautelar urgente - Embargo preventivo", status: CaseStatus.EMERGENCY_IN_PROCESS, claimant: "Exportadora Premium S.A.", respondent: "Comercial Delta S.A.C.", amount: 12000000, submittedAt: new Date("2025-01-24") },
    { typeId: tipoComercial?.id, code: "ARB-2024-0089", title: "Incumplimiento de contrato de distribución", status: CaseStatus.CLOSED, stage: ProcessStage.LAUDO, claimant: "Distribuidora Global S.A.", respondent: "Productos del Campo E.I.R.L.", amount: 18000000, submittedAt: new Date("2024-06-15"), admittedAt: new Date("2024-06-22"), closedAt: new Date("2024-12-20") },
  ];

  for (const caseData of casesData) {
    if (!caseData.typeId) continue;

    const existingCase = await prisma.case.findUnique({ where: { code: caseData.code } });
    if (existingCase) {
      console.log(`   ⏭ ${caseData.code} ya existe`);
      continue;
    }

    const caso = await prisma.case.create({
      data: {
        centerId: center.id,
        arbitrationTypeId: caseData.typeId,
        year: parseInt(caseData.code.split("-")[1]),
        sequence: parseInt(caseData.code.split("-")[2]),
        code: caseData.code,
        title: caseData.title,
        status: caseData.status,
        currentStage: caseData.stage,
        scope: ArbitrationScope.NACIONAL,
        procedureType: caseData.code.startsWith("EMG") ? ProcedureType.EMERGENCY : ProcedureType.REGULAR,
        claimantName: caseData.claimant,
        respondentName: caseData.respondent,
        disputeAmountCents: BigInt(caseData.amount),
        currency: "PEN",
        submittedAt: caseData.submittedAt,
        admittedAt: caseData.admittedAt,
        closedAt: caseData.closedAt,
      },
    });

    // Crear estructura de carpetas
    const folders = [
      { key: "01_Solicitud", name: "01. Solicitud" },
      { key: "02_Admision", name: "02. Admisión" },
      { key: "03_Contestacion", name: "03. Contestación" },
      { key: "04_Reconvencion", name: "04. Reconvención" },
      { key: "05_Pruebas", name: "05. Pruebas" },
      { key: "06_Audiencias", name: "06. Audiencias" },
      { key: "07_Alegatos", name: "07. Alegatos" },
      { key: "08_Laudo", name: "08. Laudo" },
      { key: "09_Pagos", name: "09. Pagos" },
    ];

    for (const folder of folders) {
      await prisma.caseFolder.upsert({
        where: { caseId_key: { caseId: caso.id, key: folder.key } },
        update: {},
        create: { caseId: caso.id, ...folder },
      });
    }

    console.log(`   ✓ ${caso.code}: ${caso.title?.substring(0, 40)}...`);
  }
  console.log();

  // ==========================================================================
  // 7. PLAZOS PROCESALES
  // ==========================================================================
  console.log("📅 7. Creando Plazos Procesales...");

  const activeCases = await prisma.case.findMany({
    where: { centerId: center.id, status: { in: [CaseStatus.IN_PROCESS, CaseStatus.ADMITTED, CaseStatus.AWAITING_PAYMENT] } },
    take: 3,
  });

  const now = new Date();
  for (const caso of activeCases) {
    const deadlinesData = [
      { type: DeadlineType.CONTESTACION, title: "Presentar contestación de demanda", businessDays: 20, daysOffset: 15 },
      { type: DeadlineType.PAYMENT, title: "Completar pago de tasas administrativas", businessDays: 10, daysOffset: 5 },
    ];

    for (const dl of deadlinesData) {
      const dueAt = new Date(now);
      dueAt.setDate(dueAt.getDate() + dl.daysOffset);

      await prisma.processDeadline.create({
        data: {
          caseId: caso.id,
          type: dl.type,
          title: dl.title,
          description: `Plazo para ${dl.title.toLowerCase()}`,
          startsAt: now,
          businessDays: dl.businessDays,
          dueAt: dueAt,
          timezone: "America/Lima",
          status: DeadlineStatus.ACTIVE,
          onOverdueAction: dl.type === DeadlineType.PAYMENT ? "SUSPEND" : "NOTIFY",
          notifyRoles: ["SECRETARIA"],
        },
      });
    }
    console.log(`   ✓ Plazos creados para ${caso.code}`);
  }
  console.log();

  // ==========================================================================
  // 8. ÓRDENES DE PAGO
  // ==========================================================================
  console.log("💰 8. Creando Órdenes de Pago...");

  let orderSequence = 1;
  for (const caso of activeCases) {
    const orderNumber = `OP-2025-${String(orderSequence++).padStart(6, "0")}`;
    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + 10);

    const existingOrder = await prisma.paymentOrder.findUnique({ where: { orderNumber } });
    if (existingOrder) {
      console.log(`   ⏭ ${orderNumber} ya existe`);
      continue;
    }

    await prisma.paymentOrder.create({
      data: {
        caseId: caso.id,
        orderNumber,
        concept: PaymentConcept.GASTOS_ADMINISTRATIVOS,
        description: "Gastos administrativos del proceso arbitral",
        amountCents: 100000,
        igvCents: 18000,
        totalCents: 118000,
        currency: "PEN",
        dueAt,
        status: "PENDING",
        blocksCase: true,
      },
    });
    console.log(`   ✓ ${orderNumber} para ${caso.code}`);
  }
  console.log();

  // ==========================================================================
  // 9. CONFIGURACIÓN DE TASAS
  // ==========================================================================
  console.log("💵 9. Creando Configuración de Tasas...");

  for (const fee of FEES_CONFIG) {
    await prisma.feeConfiguration.upsert({
      where: { centerId_code: { centerId: center.id, code: fee.code } },
      update: {},
      create: {
        centerId: center.id,
        code: fee.code,
        name: fee.name,
        description: `${fee.name} para arbitraje`,
        scope: fee.scope,
        concept: fee.concept,
        amountCents: fee.amountCents,
        currency: fee.currency,
        includesIGV: false,
        igvRate: fee.igvRate,
        isActive: true,
      },
    });
    console.log(`   ✓ ${fee.name}`);
  }
  console.log();

  // ==========================================================================
  // 10. TABLA DE DEVOLUCIONES
  // ==========================================================================
  console.log("↩️  10. Creando Tabla de Devoluciones...");

  for (const rate of REFUND_RATES) {
    await prisma.refundRate.upsert({
      where: { centerId_stage: { centerId: center.id, stage: rate.stage } },
      update: {},
      create: {
        centerId: center.id,
        stage: rate.stage,
        stageName: rate.stageName,
        refundPercentage: rate.refundPercentage,
        retainedPercentage: rate.retainedPercentage,
        isActive: true,
      },
    });
    console.log(`   ✓ ${rate.stageName}: ${rate.refundPercentage}% devolución`);
  }
  console.log();

  // ==========================================================================
  // 11. FERIADOS
  // ==========================================================================
  console.log("🗓️  11. Creando Feriados de Perú...");

  for (const holiday of HOLIDAYS_PERU) {
    try {
      await prisma.holiday.upsert({
        where: { centerId_date: { centerId: center.id, date: holiday.date } },
        update: {},
        create: {
          centerId: center.id,
          date: holiday.date,
          name: holiday.name,
          isNational: true,
          isRecurring: holiday.isRecurring || false,
        },
      });
    } catch {
      // Ignorar duplicados
    }
  }
  console.log(`   ✓ ${HOLIDAYS_PERU.length} feriados creados\n`);

  // ==========================================================================
  // 12. CMS - CONFIGURACIÓN DEL SITIO
  // ==========================================================================
  console.log("🌐 12. Creando CMS - Configuración del Sitio...");

  await prisma.cmsSiteConfig.upsert({
    where: { centerId: center.id },
    update: {},
    create: {
      centerId: center.id,
      siteName: "CAARD",
      siteTagline: "Centro de Administración de Arbitrajes y Resolución de Disputas",
      primaryColor: "#0B2A5B",
      secondaryColor: "#1a3a6b",
      accentColor: "#D66829",
      instagramUrl: "https://www.instagram.com/caardpe",
      linkedinUrl: "https://www.linkedin.com/company/caardpe/",
      whatsappNumber: "+51977236143",
      contactEmail: "mesadepartes@caardpe.com",
      contactPhone: "(511) 977 236 143",
      contactAddress: "Jr Paramonga 311, oficina 702, Santiago de Surco, Lima, Perú",
      defaultMetaTitle: "CAARD | Centro de Arbitraje",
      defaultMetaDescription: "Centro de Administración de Arbitrajes y Resolución de Disputas. Impulsamos el arbitraje como medio eficaz para la solución de controversias.",
      footerText: "El Centro de Administración de Arbitrajes y Resolución de Disputas es una institución arbitral que busca impulsar el arbitraje como medio eficaz para la solución de controversias.",
      copyrightText: "© 2026 CAARD. Todos los derechos reservados.",
    },
  });
  console.log(`   ✓ Configuración del sitio creada\n`);

  // ==========================================================================
  // 13. CMS - MENÚ DE NAVEGACIÓN
  // ==========================================================================
  console.log("📌 13. Creando CMS - Menú de Navegación...");

  // Eliminar menú existente
  await prisma.cmsMenuItem.deleteMany({ where: { centerId: center.id } });

  const menuItems = [
    { label: "El Centro", sortOrder: 1, children: [
      { label: "Presentación", pageSlug: "presentacion", sortOrder: 1 },
      { label: "Secretaría General", pageSlug: "secretaria-general", sortOrder: 2 },
      { label: "Consejo Superior", pageSlug: "consejo-superior", sortOrder: 3 },
      { label: "Sedes", pageSlug: "sedes", sortOrder: 4 },
    ]},
    { label: "Servicios", sortOrder: 2, children: [
      { label: "Arbitraje", pageSlug: "arbitraje", sortOrder: 1 },
      { label: "Arbitraje de Emergencia", pageSlug: "arbitraje-emergencia", sortOrder: 2 },
      { label: "Servicios Ad Hoc", pageSlug: "servicios-ad-hoc", sortOrder: 3 },
      { label: "Registro de Árbitros", pageSlug: "registro-arbitros", sortOrder: 4 },
    ]},
    { label: "Normativa", sortOrder: 3, children: [
      { label: "Reglamentos", pageSlug: "reglamentos", sortOrder: 1 },
      { label: "Cláusula Arbitral", pageSlug: "clausula-arbitral", sortOrder: 2 },
      { label: "Calculadora de Gastos", pageSlug: "calculadora", sortOrder: 3 },
    ]},
    { label: "Consulta de Expedientes", url: "/login", sortOrder: 4 },
    { label: "Contacto", pageSlug: "contacto", sortOrder: 5 },
  ];

  for (const item of menuItems) {
    const parent = await prisma.cmsMenuItem.create({
      data: {
        centerId: center.id,
        label: item.label,
        pageSlug: item.pageSlug,
        url: item.url,
        sortOrder: item.sortOrder,
        isVisible: true,
      },
    });

    if (item.children) {
      for (const child of item.children) {
        await prisma.cmsMenuItem.create({
          data: {
            centerId: center.id,
            parentId: parent.id,
            label: child.label,
            pageSlug: child.pageSlug,
            sortOrder: child.sortOrder,
            isVisible: true,
          },
        });
      }
    }
  }
  console.log(`   ✓ ${menuItems.length} items de menú creados\n`);

  // ==========================================================================
  // 14. CMS - CATEGORÍAS
  // ==========================================================================
  console.log("📁 14. Creando CMS - Categorías...");

  const categories = [
    { slug: "arbitraje", name: "Arbitraje", color: "#0B2A5B" },
    { slug: "mediacion", name: "Mediación", color: "#2563eb" },
    { slug: "legal", name: "Legal", color: "#059669" },
    { slug: "eventos", name: "Eventos", color: "#D66829" },
    { slug: "noticias", name: "Noticias", color: "#7c3aed" },
  ];

  for (const cat of categories) {
    await prisma.cmsCategory.upsert({
      where: { centerId_slug: { centerId: center.id, slug: cat.slug } },
      update: {},
      create: { centerId: center.id, ...cat },
    });
  }
  console.log(`   ✓ ${categories.length} categorías creadas\n`);

  // ==========================================================================
  // 15. CMS - PÁGINAS PRINCIPALES
  // ==========================================================================
  console.log("📄 15. Creando CMS - Páginas Principales...");

  const pages = [
    { slug: "inicio", title: "Inicio", metaTitle: "CAARD | Centro de Arbitraje", isPublished: true },
    { slug: "presentacion", title: "Presentación", metaTitle: "Presentación | CAARD", isPublished: true },
    { slug: "secretaria-general", title: "Secretaría General", metaTitle: "Secretaría General | CAARD", isPublished: true },
    { slug: "consejo-superior", title: "Consejo Superior de Arbitraje", metaTitle: "Consejo Superior | CAARD", isPublished: true },
    { slug: "sedes", title: "Sedes", metaTitle: "Sedes | CAARD", isPublished: true },
    { slug: "arbitraje", title: "Servicios de Arbitraje", metaTitle: "Servicios de Arbitraje | CAARD", isPublished: true },
    { slug: "arbitraje-emergencia", title: "Arbitraje de Emergencia", metaTitle: "Arbitraje de Emergencia | CAARD", isPublished: true },
    { slug: "servicios-ad-hoc", title: "Servicios Ad Hoc", metaTitle: "Servicios Ad Hoc | CAARD", isPublished: true },
    { slug: "registro-arbitros", title: "Registro de Árbitros", metaTitle: "Registro de Árbitros | CAARD", isPublished: true },
    { slug: "reglamentos", title: "Reglamentos", metaTitle: "Reglamentos | CAARD", isPublished: true },
    { slug: "clausula-arbitral", title: "Cláusula Arbitral", metaTitle: "Cláusula Arbitral | CAARD", isPublished: true },
    { slug: "calculadora", title: "Calculadora de Gastos", metaTitle: "Calculadora de Gastos | CAARD", isPublished: true },
    { slug: "contacto", title: "Contacto", metaTitle: "Contacto | CAARD", isPublished: true },
  ];

  for (const page of pages) {
    await prisma.cmsPage.upsert({
      where: { centerId_slug: { centerId: center.id, slug: page.slug } },
      update: {},
      create: { centerId: center.id, ...page, publishedAt: page.isPublished ? new Date() : null },
    });
  }
  console.log(`   ✓ ${pages.length} páginas creadas\n`);

  // ==========================================================================
  // 16. CMS - ARTÍCULOS
  // ==========================================================================
  console.log("📝 16. Creando CMS - Artículos...");

  const arbitrajeCategory = await prisma.cmsCategory.findFirst({ where: { centerId: center.id, slug: "arbitraje" } });

  const articles = [
    { slug: "importancia-clausula-arbitral", title: "La Importancia de la Cláusula Arbitral", excerpt: "Descubra por qué incluir una cláusula arbitral puede ahorrarle tiempo y dinero.", content: "La cláusula arbitral es fundamental en contratos comerciales...", isPublished: true, isFeatured: true },
    { slug: "ventajas-arbitraje-comercial", title: "5 Ventajas del Arbitraje Comercial", excerpt: "El arbitraje ofrece múltiples beneficios para resolver disputas.", content: "El arbitraje comercial presenta ventajas como celeridad, confidencialidad...", isPublished: true },
    { slug: "proceso-arbitral-paso-a-paso", title: "El Proceso Arbitral Paso a Paso", excerpt: "Guía completa sobre las etapas del proceso arbitral.", content: "El proceso arbitral consta de varias etapas claramente definidas...", isPublished: true },
  ];

  for (const article of articles) {
    await prisma.cmsArticle.upsert({
      where: { centerId_slug: { centerId: center.id, slug: article.slug } },
      update: {},
      create: { centerId: center.id, categoryId: arbitrajeCategory?.id, tags: ["arbitraje", "legal"], publishedAt: new Date(), ...article },
    });
    console.log(`   ✓ ${article.title}`);
  }
  console.log();

  // ==========================================================================
  // 17. CMS - EVENTOS
  // ==========================================================================
  console.log("📅 17. Creando CMS - Eventos...");

  const eventCategory = await prisma.cmsCategory.findFirst({ where: { centerId: center.id, slug: "eventos" } });

  const events = [
    { slug: "webinar-arbitraje-2026", title: "Webinar: Arbitraje en el Perú 2026", description: "Actualización sobre tendencias en arbitraje.", type: "WEBINAR" as const, startDate: new Date("2026-03-15T18:00:00"), isOnline: true, isPublished: true, isFeatured: true },
    { slug: "taller-clausulas-arbitrales", title: "Taller: Redacción de Cláusulas Arbitrales", description: "Aprenda a redactar cláusulas efectivas.", type: "WORKSHOP" as const, startDate: new Date("2026-04-10T09:00:00"), isOnline: false, location: "Sede CAARD, Lima", isPublished: true },
  ];

  for (const event of events) {
    await prisma.cmsEvent.upsert({
      where: { centerId_slug: { centerId: center.id, slug: event.slug } },
      update: {},
      create: { centerId: center.id, categoryId: eventCategory?.id, ...event },
    });
    console.log(`   ✓ ${event.title}`);
  }
  console.log();

  // ==========================================================================
  // 18. MODELOS DE IA
  // ==========================================================================
  console.log("🤖 18. Creando Modelos de IA...");

  const aiModels = [
    { provider: AIProvider.OPENAI, modelId: "gpt-4-turbo", name: "GPT-4 Turbo", inputCostPer1k: 1, outputCostPer1k: 3, maxTokens: 4096, maxContextWindow: 128000, isActive: true, isDefault: true, supportsVision: true, supportsFunctions: true, supportsStreaming: true },
    { provider: AIProvider.OPENAI, modelId: "gpt-4o-mini", name: "GPT-4o Mini", inputCostPer1k: 0, outputCostPer1k: 0, maxTokens: 4096, maxContextWindow: 128000, isActive: true, supportsVision: true, supportsFunctions: true, supportsStreaming: true },
    { provider: AIProvider.ANTHROPIC, modelId: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", inputCostPer1k: 0, outputCostPer1k: 2, maxTokens: 8192, maxContextWindow: 200000, isActive: true, supportsVision: true, supportsFunctions: true, supportsStreaming: true },
    { provider: AIProvider.ANTHROPIC, modelId: "claude-3-haiku-20240307", name: "Claude 3 Haiku", inputCostPer1k: 0, outputCostPer1k: 0, maxTokens: 4096, maxContextWindow: 200000, isActive: true, supportsVision: true, supportsFunctions: true, supportsStreaming: true },
  ];

  for (const model of aiModels) {
    await prisma.aIModel.upsert({
      where: { provider_modelId: { provider: model.provider, modelId: model.modelId } },
      update: {},
      create: model,
    });
    console.log(`   ✓ ${model.name}`);
  }
  console.log();

  // ==========================================================================
  // 19. ASISTENTES DE IA
  // ==========================================================================
  console.log("🎯 19. Creando Asistentes de IA...");

  const assistants = [
    { name: "Asistente Legal General", slug: "legal-general", description: "Consultas legales sobre arbitraje", systemPrompt: "Eres un asistente legal especializado en arbitraje en Perú. Ayudas con consultas sobre procedimientos, términos legales y documentación. No das asesoría vinculante.", welcomeMessage: "Hola, soy el asistente legal de CAARD. ¿En qué puedo ayudarte?", temperature: 0.3, maxTokens: 2048, allowedContexts: ["general", "cases"], isActive: true },
    { name: "Revisor de Documentos", slug: "doc-reviewer", description: "Análisis de documentos arbitrales", systemPrompt: "Eres un asistente especializado en revisión de documentos arbitrales. Identificas elementos faltantes y sugieres mejoras.", welcomeMessage: "Soy el asistente de revisión. ¿Qué documento quieres analizar?", temperature: 0.2, maxTokens: 4096, allowedContexts: ["documents", "cases"], isActive: true },
    { name: "Asistente de Secretaría", slug: "secretaria-assistant", description: "Tareas administrativas", systemPrompt: "Eres un asistente administrativo para la secretaría. Ayudas con gestión de expedientes, plazos y coordinación.", welcomeMessage: "Hola, soy el asistente de secretaría. ¿Cómo puedo ayudarte?", temperature: 0.4, maxTokens: 2048, allowedContexts: ["cases", "admin"], isActive: true },
  ];

  for (const assistant of assistants) {
    await prisma.aIAssistant.upsert({
      where: { slug: assistant.slug },
      update: {},
      create: assistant,
    });
    console.log(`   ✓ ${assistant.name}`);
  }
  console.log();

  // ==========================================================================
  // 20. CUOTA GLOBAL DE IA
  // ==========================================================================
  console.log("📊 20. Creando Cuota Global de IA...");

  const existingQuota = await prisma.aISystemQuota.findFirst({ where: { isActive: true } });
  if (!existingQuota) {
    await prisma.aISystemQuota.create({
      data: {
        isActive: true,
        maxTotalTokensPerDay: 1000000,
        maxTotalTokensPerMonth: 20000000,
        maxTotalCostPerDay: 5000,
        maxTotalCostPerMonth: 100000,
        alertAtPercentage: 80,
        alertEmail: "admin@caardpe.com",
      },
    });
    console.log(`   ✓ Cuota del sistema creada\n`);
  } else {
    console.log(`   ⏭ Cuota ya existe\n`);
  }

  // ==========================================================================
  // RESUMEN FINAL
  // ==========================================================================
  console.log("═".repeat(60));
  console.log("✅ SEED COMPLETADO EXITOSAMENTE!");
  console.log("═".repeat(60));
  console.log();
  console.log("📋 CREDENCIALES DE ACCESO (password: Admin123!)");
  console.log("─".repeat(60));
  console.log("   SUPER_ADMIN    │ superadmin@caard.pe");
  console.log("   ADMIN          │ admin@caard.pe");
  console.log("   CENTER_STAFF   │ staff@caard.pe");
  console.log("   SECRETARIA     │ secretaria@caard.pe");
  console.log("   ARBITRO        │ arbitro@caard.pe / arbitro2@caard.pe");
  console.log("   ABOGADO        │ abogado@caard.pe / abogado2@caard.pe");
  console.log("   DEMANDANTE     │ demandante@ejemplo.com");
  console.log("   DEMANDADO      │ demandado@ejemplo.com");
  console.log("─".repeat(60));
  console.log();
  console.log("📊 DATOS CREADOS:");
  console.log(`   • 1 Centro de Arbitraje`);
  console.log(`   • 5 Tipos de Arbitraje`);
  console.log(`   • 10 Usuarios (8 roles)`);
  console.log(`   • 8 Configuraciones de Roles`);
  console.log(`   • 2 Árbitros registrados`);
  console.log(`   • 6 Expedientes de ejemplo`);
  console.log(`   • ${FEES_CONFIG.length} Configuraciones de Tasas`);
  console.log(`   • ${REFUND_RATES.length} Tasas de Devolución`);
  console.log(`   • ${HOLIDAYS_PERU.length} Feriados`);
  console.log(`   • ${pages.length} Páginas CMS`);
  console.log(`   • ${articles.length} Artículos`);
  console.log(`   • ${events.length} Eventos`);
  console.log(`   • ${aiModels.length} Modelos de IA`);
  console.log(`   • ${assistants.length} Asistentes de IA`);
  console.log();
  console.log("🚀 Ejecuta 'npm run dev' para iniciar el servidor");
  console.log();
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
