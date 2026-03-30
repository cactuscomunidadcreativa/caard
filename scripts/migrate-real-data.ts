/**
 * CAARD - Migration Script for Real Production Data
 * ==================================================
 * Ejecutar con: npx tsx scripts/migrate-real-data.ts
 *
 * This script:
 * 1. Deletes all existing data (respecting foreign keys)
 * 2. Creates the CAARD center
 * 3. Creates super admin, staff, and arbitrator users
 * 4. Creates ArbitratorRegistry entries
 * 5. Creates ArbitrationTypes
 * 6. Creates Cases (51 cases)
 * 7. Creates CaseMembers
 * 8. Creates CaseFolders for each case
 */

import { PrismaClient, Role, CaseStatus, ArbitrationScope, ProcedureType, TribunalMode, ProcessStage, ArbitratorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// =============================================================================
// CONSTANTS
// =============================================================================

const PASSWORD = "Caard2025!";
const SALT_ROUNDS = 10;

const CASE_FOLDER_STRUCTURE = [
  { key: "01_Solicitud", name: "01. Solicitud" },
  { key: "02_Admision", name: "02. Admisión" },
  { key: "03_Contestacion", name: "03. Contestación" },
  { key: "04_Reconvencion", name: "04. Reconvención" },
  { key: "05_Pruebas", name: "05. Pruebas" },
  { key: "06_Audiencias", name: "06. Audiencias" },
  { key: "07_Alegatos", name: "07. Alegatos" },
  { key: "08_Laudo", name: "08. Laudo" },
  { key: "09_Pagos", name: "09. Pagos" },
  { key: "99_Otros", name: "99. Otros" },
];

// Maps to track created IDs
const userIdMap = new Map<string, string>(); // excelId -> realDbId
const emailToUserIdMap = new Map<string, string>(); // email -> realDbId
const nameToUserIdMap = new Map<string, string>(); // name -> realDbId
const caseIdMap = new Map<string, string>(); // excelCaseId -> realDbId
const arbitrationTypeMap = new Map<string, string>(); // excelTypeId -> realDbId
let centerId = "";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function cleanEmail(raw: string): string {
  // Take only the first email if multiple are separated by newlines or spaces
  const first = raw.split(/[\n\r]+/)[0].trim();
  // Also handle space-separated emails
  const parts = first.split(/\s+/);
  return parts[0].replace(/,$/,"").trim();
}

// =============================================================================
// STEP 1: DELETE ALL EXISTING DATA
// =============================================================================

async function deleteAllData() {
  console.log("\n=== STEP 1: Deleting all existing data ===\n");

  // Delete in correct order to respect foreign keys
  const deletions = [
    { name: "ArbitratorProfile", fn: () => prisma.arbitratorProfile.deleteMany() },
    { name: "ArbitratorSanction", fn: () => prisma.arbitratorSanction.deleteMany() },
    { name: "SystemAuditLog", fn: () => prisma.systemAuditLog.deleteMany() },
    { name: "AuditLog", fn: () => prisma.auditLog.deleteMany() },
    { name: "NotificationQueue", fn: () => prisma.notificationQueue.deleteMany() },
    { name: "Notification", fn: () => prisma.notification.deleteMany() },
    { name: "NotificationPreference", fn: () => prisma.notificationPreference.deleteMany() },
    { name: "CaseNote", fn: () => prisma.caseNote.deleteMany() },
    { name: "CaseStageHistory", fn: () => prisma.caseStageHistory.deleteMany() },
    { name: "CaseHearing", fn: () => prisma.caseHearing.deleteMany() },
    { name: "CaseDeadline", fn: () => prisma.caseDeadline.deleteMany() },
    { name: "CaseDocument", fn: () => prisma.caseDocument.deleteMany() },
    { name: "CaseFolder", fn: () => prisma.caseFolder.deleteMany() },
    { name: "CaseLawyer", fn: () => prisma.caseLawyer.deleteMany() },
    { name: "CaseMember", fn: () => prisma.caseMember.deleteMany() },
    { name: "Payment", fn: () => prisma.payment.deleteMany() },
    { name: "PaymentOrder", fn: () => prisma.paymentOrder.deleteMany() },
    { name: "PaymentInstallmentPlan", fn: () => prisma.paymentInstallmentPlan.deleteMany() },
    { name: "CaseLiquidation", fn: () => prisma.caseLiquidation.deleteMany() },
    { name: "ProcessDeadline", fn: () => prisma.processDeadline.deleteMany() },
    { name: "MeetingParticipant", fn: () => prisma.meetingParticipant.deleteMany() },
    { name: "ScheduledMeeting", fn: () => prisma.scheduledMeeting.deleteMany() },
    { name: "Case", fn: () => prisma.case.deleteMany() },
    { name: "ArbitratorRegistry", fn: () => prisma.arbitratorRegistry.deleteMany() },
    { name: "Recusation", fn: () => prisma.recusation.deleteMany() },
    { name: "EmergencyRequest", fn: () => prisma.emergencyRequest.deleteMany() },
    { name: "OtpToken", fn: () => prisma.otpToken.deleteMany() },
    { name: "Session", fn: () => prisma.session.deleteMany() },
    { name: "Account", fn: () => prisma.account.deleteMany() },
    { name: "AIConversation", fn: () => prisma.aIConversation.deleteMany() },
    { name: "AIUsageLog", fn: () => prisma.aIUsageLog.deleteMany() },
    { name: "ArbitrationTypes", fn: () => prisma.arbitrationType.deleteMany() },
    // Delete users except the two super admins (they will be upserted)
    { name: "User (all)", fn: () => prisma.user.deleteMany() },
  ];

  for (const { name, fn } of deletions) {
    try {
      const result = await fn();
      console.log(`  Deleted ${name}: ${result.count} records`);
    } catch (error: any) {
      console.log(`  Warning deleting ${name}: ${error.message}`);
    }
  }

  console.log("  Data deletion complete.\n");
}

// =============================================================================
// STEP 2: CREATE/UPDATE CENTER
// =============================================================================

async function createCenter() {
  console.log("=== STEP 2: Creating CAARD Center ===\n");

  const center = await prisma.center.upsert({
    where: { code: "CAARD" },
    update: {
      name: "Centro de Arbitraje CAARD",
      legalName: "Centro de Administración de Arbitrajes y Resolución de Disputas S.A.C.",
      taxId: "20123456789",
      primaryColorHex: "#0B2A5B",
      accentColorHex: "#D66829",
      neutralColorHex: "#9A9A9E",
    },
    create: {
      code: "CAARD",
      name: "Centro de Arbitraje CAARD",
      legalName: "Centro de Administración de Arbitrajes y Resolución de Disputas S.A.C.",
      taxId: "20123456789",
      primaryColorHex: "#0B2A5B",
      accentColorHex: "#D66829",
      neutralColorHex: "#9A9A9E",
    },
  });

  centerId = center.id;
  console.log(`  Center created: ${center.code} (${center.id})\n`);
}

// =============================================================================
// STEP 3: CREATE SUPER ADMIN USERS
// =============================================================================

async function createSuperAdmins() {
  console.log("=== STEP 3: Creating Super Admin Users ===\n");

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const superAdmins = [
    { email: "eduardo@cactuscomunidadcreativa.com", name: "Eduardo Gonzalez" },
    { email: "sis@caardpe.com", name: "Eduardo Gonzalez - SIS" },
  ];

  for (const admin of superAdmins) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        role: "SUPER_ADMIN" as Role,
        isActive: true,
        centerId,
        passwordHash,
      },
      create: {
        email: admin.email,
        name: admin.name,
        role: "SUPER_ADMIN" as Role,
        isActive: true,
        centerId,
        passwordHash,
      },
    });

    // Map the excel IDs for SIS
    if (admin.email === "sis@caardpe.com") {
      userIdMap.set("USR_001", user.id);
    }
    emailToUserIdMap.set(admin.email, user.id);
    nameToUserIdMap.set(admin.name, user.id);

    console.log(`  Super Admin: ${admin.email} -> ${user.id}`);
  }
  console.log("");
}

// =============================================================================
// STEP 4: CREATE STAFF USERS
// =============================================================================

async function createStaffUsers() {
  console.log("=== STEP 4: Creating Staff Users ===\n");

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const staff: Array<{ excelId: string; email: string; name: string; role: Role }> = [
    { excelId: "USR_002", email: "administracion@caardpe.com", name: "Natalia Tincopa", role: "ADMIN" },
    { excelId: "USR_003", email: "aboluarte@caardpe.com", name: "Anais Boluarte", role: "SECRETARIA" },
    { excelId: "USR_004", email: "vramos@caardpe.com", name: "Vivian Ramos", role: "SECRETARIA" },
    { excelId: "USR_005", email: "fmunoz@caardpe.com", name: "Fabrizio Muñoz", role: "CENTER_STAFF" },
  ];

  for (const s of staff) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        role: s.role,
        isActive: true,
        centerId,
        passwordHash,
      },
      create: {
        email: s.email,
        name: s.name,
        role: s.role,
        isActive: true,
        centerId,
        passwordHash,
      },
    });

    userIdMap.set(s.excelId, user.id);
    emailToUserIdMap.set(s.email, user.id);
    nameToUserIdMap.set(s.name, user.id);
    console.log(`  Staff: ${s.email} (${s.role}) -> ${user.id}`);
  }
  console.log("");
}

// =============================================================================
// STEP 5: CREATE ARBITRATOR USERS
// =============================================================================

async function createArbitratorUsers() {
  console.log("=== STEP 5: Creating Arbitrator Users ===\n");

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const arbitrators: Array<{ excelId: string; email: string; name: string }> = [
    { excelId: "USR_006", email: "ahmed.manyari@amz.pe", name: "Ahmed Manyari Zea" },
    { excelId: "USR_007", email: "albertomolero@gmail.com", name: "Alberto Molero Rentaria" },
    { excelId: "USR_008", email: "ajmontezuma@montezumaabogados.com", name: "Alberto Montezuma Chirinos" },
    { excelId: "USR_009", email: "aretamozo@outlook.com", name: "Alberto Retamozo Linares" },
    { excelId: "USR_010", email: "alfredobalbi@hotmail.com", name: "Alfredo Balbi Gatjens" },
    { excelId: "USR_011", email: "abedoyad@gmail.com", name: "Alonso Bedoya Denegri" },
    { excelId: "USR_012", email: "gonzalezdiaarco@gmail.com", name: "Álvaro Gonzáles Peláez" },
    { excelId: "USR_013", email: "arcarrerad@gmail.com", name: "Alvaro Rodrigo Carrera Dongo" },
    { excelId: "USR_014", email: "acriado@criadoleonabogados.com", name: "Andrés Augusto Criado León" },
    { excelId: "USR_015", email: "antoniocorralesgonzales@gmail.com", name: "Antonio Corrales Gonzales" },
    // USR_016 - Armas Gamarra, Carlos Antonio - SKIP (duplicate email with USR_015)
    { excelId: "USR_017", email: "augustomillones@gmail.com", name: "Augusto Millones Santa Gadea" },
    { excelId: "USR_018", email: "camila.mariategui@gmail.com", name: "Camila Ferández Stoll" },
    { excelId: "USR_019", email: "carlosenriquealvarezsolis@gmail.com", name: "Carlos Enrique Alvarez Solis" },
    { excelId: "USR_020", email: "asesorcontratacionescz@gmail.com", name: "Carlos Orlando Zapata Rios" },
    { excelId: "USR_021", email: "eperamas@hotmail.com", name: "Cesar Eduardo Peramás Ayala" },
    { excelId: "USR_022", email: "cesantillansalazar@gmail.com", name: "César Eduardo Santillán Salazar" },
    { excelId: "USR_023", email: "cecilia.lau.legal@gmail.com", name: "Claudia Lau Buendia" },
    { excelId: "USR_024", email: "daniel.malca@amctaxperu.com", name: "Daniel Malca Saavedra" },
    { excelId: "USR_025", email: "italo_roldan@yahoo.es", name: "Dennis Ítalo Roldan Rodriguez" },
    { excelId: "USR_026", email: "martinez.villacorta.diego@gmail.com", name: "Diego Renato Martinez Villacorta" },
    { excelId: "USR_027", email: "mgomeza80@hotmail.com", name: "Martín Gómez Aguilar" },
    { excelId: "USR_028", email: "elio-otiniano@otinianoabogados.com.pe", name: "Elio Otiniano Sánchez" },
    { excelId: "USR_029", email: "mlrubillas@gmail.com", name: "Enrique Martín La Rosa Ubillas" },
    { excelId: "USR_030", email: "enrique.varsi@arbitro.caard.pe", name: "Enrique Varsi Rospigliosi" },
    { excelId: "USR_031", email: "ecubam@gmail.com", name: "Erick Cuba Meneses" },
    { excelId: "USR_032", email: "ggrellaud@gylabogados.com", name: "Gullermo D. Grellaud Guzmán" },
    { excelId: "USR_033", email: "h.enrrique.lama.pj@gmail.com", name: "Héctor Enrique Lama More" },
    { excelId: "USR_034", email: "torres.hector@pucp.pe", name: "Héctor Iván Torres Rivera" },
    // USR_035 has duplicate email (daniel.malca@amctaxperu.com) with USR_024
    { excelId: "USR_036", email: "helenamurguiag@gmail.com", name: "Helena Úrsula Murguia García" },
    { excelId: "USR_037", email: "hschpe@yahoo.es", name: "Homero Absalon Salazar Chavez" },
    { excelId: "USR_038", email: "hfa@hfabogados.com", name: "Humberto Flores Arévalo" },
    { excelId: "USR_039", email: "casiano.ia@pucp.pe", name: "Ivan Alexander Casiano Lossio" },
    { excelId: "USR_040", email: "ifr.shv@gmail.com", name: "Ivan Fonseca Ramos" },
    { excelId: "USR_041", email: "ivanparedez@gmail.com", name: "Ivan Magno Parédez Neyra" },
    { excelId: "USR_042", email: "estudio.jchengabogados@gmail.com", name: "Jaime Cheng Amaya" },
    { excelId: "USR_043", email: "jaimesergio62@hotmail.com", name: "Jaime Rodriguez Talavera" },
    { excelId: "USR_044", email: "javier.cavero@arbitro.caard.pe", name: "Javier Cavero Egusquiza Zariquiey" },
    { excelId: "USR_045", email: "jgarcia@shv-abogados.com", name: "Javier García Locatelli" },
    { excelId: "USR_046", email: "jennifer.vilches@outlook.com", name: "Jennifer Vilchez Mendoza" },
    { excelId: "USR_047", email: "jessicaulffe@gmail.com", name: "Jessica Ulffe Carrera" },
    { excelId: "USR_048", email: "jbalbi@balbiconsultores.com", name: "Jorge Alberto Balbi Calmet" },
    { excelId: "USR_049", email: "jorgemunozwells@gmail.com", name: "Jorge Muñoz Wells" },
    { excelId: "USR_050", email: "j.trelles@pucp.pe", name: "José Antonio Trelles Castillo" },
    { excelId: "USR_051", email: "jmcarrilloc@outlook.com.pe", name: "Jose Miguel Carrillo Cuestas" },
    { excelId: "USR_052", email: "aquintana@jimenezquintana.com.pe", name: "Juan Alberto Quintana Sanchez" },
    { excelId: "USR_053", email: "jcmedinaflores@gmail.com", name: "Juan Carlos Medina Flores" },
    { excelId: "USR_054", email: "pintoescobedo@gmail.com", name: "Juan Carlos Pinto Escobedo" },
    { excelId: "USR_055", email: "estudiosalazar@gmail.com", name: "Leoni Raúl Amaya Ayala" },
    { excelId: "USR_056", email: "leslie.ds@hotmail.com", name: "Leslie Diaz Sanchez" },
    { excelId: "USR_057", email: "amesperalta@gmail.com", name: "Luis Enrique Ames Peralta" },
    { excelId: "USR_058", email: "luis.marcionelli@arbitro.caard.pe", name: "Luis Felipe Domingo Marcionelli Rodriguez" },
    { excelId: "USR_059", email: "lherreraromeroconsultor@gmail.com", name: "Luis Herrera Romero" },
    { excelId: "USR_060", email: "luis@puglianini.com", name: "Luis Puglianini Guerra" },
    { excelId: "USR_061", email: "magalird@hotmail.com", name: "Magali Rojas Delgado" },
    { excelId: "USR_062", email: "martinez.zamora@gmail.com", name: "Marco Antonio Martinez Villacorta" },
    { excelId: "USR_063", email: "mariano.linares@arbitro.caard.pe", name: "Mariano Jose Linares Vivanco" },
    { excelId: "USR_064", email: "mlinares@mariolinaresabogados.com", name: "Mario Ernesto Linares Jara" },
    { excelId: "USR_065", email: "alexismorales2000@gmail.com", name: "Marko Alexis Morales Martínez" },
    { excelId: "USR_066", email: "moreguer@yahoo.es", name: "Martín Gregorio Oré Guerrero" },
    { excelId: "USR_067", email: "nataliatincopa@gmail.com", name: "Natalia Patricia Tincopa Cebrian" },
    { excelId: "USR_068", email: "ncosta@costanestor.com", name: "Nestor Antonio Costa Lopez" },
    { excelId: "USR_069", email: "ohe@hgnabogados.com", name: "Oswaldo Hundskoff Exebio" },
    { excelId: "USR_070", email: "p.lorarios@gmail.com", name: "Patricia Lora Rios" },
    { excelId: "USR_071", email: "phurtado@hurtadoabogados.com.pe", name: "Patrick Hurtado Tueros" },
    { excelId: "USR_072", email: "pedro.patron.bedoya47@gmail.com", name: "Pedro Patrón Bedoya" },
    // USR_073 - Raul Salazar Rivera has duplicate email (estudiosalazar@gmail.com) with USR_055
    { excelId: "USR_074", email: "ricardo.rodriguez@arbitro.caard.pe", name: "Ricardo Rodriguez Ardiles" },
    { excelId: "USR_075", email: "martintirado.richard@gmail.com", name: "Richard Martin Tirado" },
    { excelId: "USR_076", email: "r.freitas@pucp.pe", name: "Rodrigo Andrés Freitas Cabanillas" },
    { excelId: "USR_077", email: "salome.reynoso.romero@gmail.com", name: "Salomé Teresa Reynoso Romero" },
    { excelId: "USR_078", email: "stafur@tafurconsultores.com", name: "Sergio Alberto Tafur Sánchez" },
    { excelId: "USR_079", email: "uzavala1@gmail.com", name: "Ursula Carmen Zavala Cadenillas" },
    { excelId: "USR_080", email: "vicentefernando@estudiotincopa.com", name: "Vicente Fernando Tincopa Cebrian" },
    { excelId: "USR_081", email: "vickhy.goicochea@hotmail.com", name: "Vickhy Goicochea Lecca" },
  ];

  const createdEmails = new Set<string>();

  for (const arb of arbitrators) {
    const email = arb.email.trim().toLowerCase();

    if (createdEmails.has(email)) {
      console.log(`  SKIP duplicate email: ${email} (${arb.name})`);
      // Still map the excel ID to the existing user
      const existingId = emailToUserIdMap.get(email);
      if (existingId) {
        userIdMap.set(arb.excelId, existingId);
      }
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: arb.name,
        role: "ARBITRO" as Role,
        isActive: true,
        centerId,
        passwordHash,
      },
      create: {
        email,
        name: arb.name,
        role: "ARBITRO" as Role,
        isActive: true,
        centerId,
        passwordHash,
      },
    });

    createdEmails.add(email);
    userIdMap.set(arb.excelId, user.id);
    emailToUserIdMap.set(email, user.id);
    nameToUserIdMap.set(arb.name, user.id);
    console.log(`  Arbitrator: ${email} (${arb.name}) -> ${user.id}`);
  }

  // Handle USR_016 (Armas Gamarra) - maps to same user as USR_015 (duplicate email)
  const usr015Id = userIdMap.get("USR_015");
  if (usr015Id) {
    userIdMap.set("USR_016", usr015Id);
    nameToUserIdMap.set("Armas Gamarra, Carlos Antonio", usr015Id);
    nameToUserIdMap.set("Carlos Antonio Armas Gamarra", usr015Id);
  }

  // Handle USR_035 (Hector Mujica Acurio) - has duplicate email with USR_024
  // Create with a unique email since this is a different person
  const usr035Email = "hector.mujica@arbitro.caard.pe";
  const usr035 = await prisma.user.upsert({
    where: { email: usr035Email },
    update: {
      name: "Hector Mujica Acurio",
      role: "ARBITRO" as Role,
      isActive: true,
      centerId,
      passwordHash,
    },
    create: {
      email: usr035Email,
      name: "Hector Mujica Acurio",
      role: "ARBITRO" as Role,
      isActive: true,
      centerId,
      passwordHash,
    },
  });
  userIdMap.set("USR_035", usr035.id);
  emailToUserIdMap.set(usr035Email, usr035.id);
  nameToUserIdMap.set("Hector Mujica Acurio", usr035.id);
  console.log(`  Arbitrator: ${usr035Email} (Hector Mujica Acurio) -> ${usr035.id}`);

  // Handle USR_073 (Raul Salazar Rivera) - has duplicate email with USR_055
  const usr073Email = "raul.salazar@arbitro.caard.pe";
  const usr073 = await prisma.user.upsert({
    where: { email: usr073Email },
    update: {
      name: "Raul Salazar Rivera",
      role: "ARBITRO" as Role,
      isActive: true,
      centerId,
      passwordHash,
    },
    create: {
      email: usr073Email,
      name: "Raul Salazar Rivera",
      role: "ARBITRO" as Role,
      isActive: true,
      centerId,
      passwordHash,
    },
  });
  userIdMap.set("USR_073", usr073.id);
  emailToUserIdMap.set(usr073Email, usr073.id);
  nameToUserIdMap.set("Raul Salazar Rivera", usr073.id);
  console.log(`  Arbitrator: ${usr073Email} (Raul Salazar Rivera) -> ${usr073.id}`);

  console.log(`\n  Total arbitrator users created/mapped: ${arbitrators.length + 3}\n`);
}

// =============================================================================
// STEP 6: CREATE ARBITRATOR REGISTRY ENTRIES
// =============================================================================

async function createArbitratorRegistry() {
  console.log("=== STEP 6: Creating Arbitrator Registry Entries ===\n");

  // Map from USR excel ID to specializations
  const registryData: Array<{
    excelId: string;
    userId: string;
    specializations: string[];
  }> = [
    { excelId: "USR_006", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_007", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_008", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_009", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_010", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_011", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_012", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_013", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_014", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_015", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_016", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_017", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_018", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_019", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_020", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_021", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_022", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_023", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_024", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_025", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_026", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_027", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_028", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_029", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_030", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_031", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_032", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_033", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_034", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_035", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_036", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_037", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_038", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_039", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_040", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_041", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_042", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_043", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_044", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_045", userId: "", specializations: ["Civil", "Comercial", "Laboral"] },
    { excelId: "USR_046", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_047", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_048", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_049", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_050", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_051", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_052", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_053", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_054", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_055", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_056", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_057", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_058", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_059", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_060", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_061", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_062", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_063", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_064", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_065", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_066", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_067", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_068", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_069", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_070", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_071", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_072", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_073", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_074", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_075", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_076", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_077", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_078", userId: "", specializations: ["Contratación Pública"] },
    { excelId: "USR_079", userId: "", specializations: ["Civil", "Comercial"] },
    { excelId: "USR_080", userId: "", specializations: ["Contratación Pública", "Civil"] },
    { excelId: "USR_081", userId: "", specializations: ["Contratación Pública", "Civil"] },
  ];

  // Track which userIds have already been registered (for duplicates like USR_016)
  const registeredUserIds = new Set<string>();
  let count = 0;

  for (const entry of registryData) {
    const userId = userIdMap.get(entry.excelId);
    if (!userId) {
      console.log(`  SKIP: No user found for ${entry.excelId}`);
      continue;
    }

    // Skip if this userId already has a registry entry (handles USR_016 -> USR_015 case)
    if (registeredUserIds.has(userId)) {
      console.log(`  SKIP: User ${entry.excelId} already registered (duplicate userId)`);
      continue;
    }

    try {
      await prisma.arbitratorRegistry.upsert({
        where: { userId },
        update: {
          centerId,
          status: "ACTIVE" as ArbitratorStatus,
          specializations: entry.specializations,
        },
        create: {
          centerId,
          userId,
          status: "ACTIVE" as ArbitratorStatus,
          specializations: entry.specializations,
          approvalDate: new Date("2024-02-01"),
        },
      });
      registeredUserIds.add(userId);
      count++;
    } catch (error: any) {
      console.log(`  Error creating registry for ${entry.excelId}: ${error.message}`);
    }
  }

  console.log(`  Created ${count} ArbitratorRegistry entries.\n`);
}

// =============================================================================
// STEP 7: CREATE ARBITRATION TYPES
// =============================================================================

async function createArbitrationTypes() {
  console.log("=== STEP 7: Creating Arbitration Types ===\n");

  const types = [
    {
      excelId: "TIPO_001",
      code: "COMERCIAL_NAC",
      name: "Arbitraje Comercial Nacional",
      description: "Controversias comerciales nacionales",
      kind: "INSTITUTIONAL" as const,
      tribunalMode: "SOLE_ARBITRATOR" as const,
      baseFeeCents: 50000,
      currency: "PEN",
    },
    {
      excelId: "TIPO_002",
      code: "COMERCIAL_INT",
      name: "Arbitraje Comercial Internacional",
      description: "Controversias internacionales",
      kind: "INSTITUTIONAL" as const,
      tribunalMode: "TRIBUNAL_3" as const,
      baseFeeCents: 100000,
      currency: "USD",
    },
    {
      excelId: "TIPO_003",
      code: "CONTRATACIONES",
      name: "Contrataciones del Estado",
      description: "Controversias con el Estado",
      kind: "INSTITUTIONAL" as const,
      tribunalMode: "TRIBUNAL_3" as const,
      baseFeeCents: 75000,
      currency: "PEN",
    },
    {
      excelId: "TIPO_004",
      code: "EMERGENCIA",
      name: "Arbitraje de Emergencia",
      description: "Medidas cautelares urgentes",
      kind: "INSTITUTIONAL" as const,
      tribunalMode: "SOLE_ARBITRATOR" as const,
      baseFeeCents: 200000,
      currency: "PEN",
    },
  ];

  for (const t of types) {
    const arbType = await prisma.arbitrationType.upsert({
      where: { centerId_code: { centerId, code: t.code } },
      update: {
        name: t.name,
        description: t.description,
        kind: t.kind,
        tribunalMode: t.tribunalMode,
        baseFeeCents: t.baseFeeCents,
        currency: t.currency,
        isActive: true,
      },
      create: {
        centerId,
        code: t.code,
        name: t.name,
        description: t.description,
        kind: t.kind,
        tribunalMode: t.tribunalMode,
        baseFeeCents: t.baseFeeCents,
        currency: t.currency,
        isActive: true,
      },
    });

    arbitrationTypeMap.set(t.excelId, arbType.id);
    console.log(`  ArbitrationType: ${t.code} -> ${arbType.id}`);
  }
  console.log("");
}

// =============================================================================
// STEP 8: CREATE ENTITY USERS (DEMANDANTES / DEMANDADOS)
// =============================================================================

async function createEntityUsers() {
  console.log("=== STEP 8: Creating Entity Users (Demandantes/Demandados) ===\n");

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  // All entities from the Excel (USR_082 to USR_159)
  const entities: Array<{ excelId: string; rawEmail: string; name: string; role: Role }> = [
    { excelId: "USR_082", rawEmail: "cncgsac@gmail.com", name: "CONSORCIO NACIONAL CONTRATISTAS GENERALES S.A.C.", role: "DEMANDANTE" },
    { excelId: "USR_083", rawEmail: "ygarayr@sedapal.com.pe", name: "SERVICIO DE AGUA POTABLE Y ALCANTARILLADO DE LIMA- SEDAPAL", role: "DEMANDADO" },
    { excelId: "USR_084", rawEmail: "consultores29112013@gmail.com", name: "CONSORCIO SUPERVISOR CHINCHA", role: "DEMANDANTE" },
    { excelId: "USR_085", rawEmail: "procuraduria@regionica.gob.pe", name: "GOBIERNO REGIONAL DE ICA", role: "DEMANDADO" },
    { excelId: "USR_086", rawEmail: "tadeosac@hotmail.com", name: "CONSORCIO SHALOM", role: "DEMANDANTE" },
    { excelId: "USR_087", rawEmail: "ppm@munitalara.gob.pe", name: "MUNICIPALIDAD PROVINCIAL DE TALARA", role: "DEMANDADO" },
    { excelId: "USR_088", rawEmail: "azizold@tair.pe", name: "TRANSPORTES ÁNGEL IBARCENA S.A.C.", role: "DEMANDANTE" },
    { excelId: "USR_089", rawEmail: "paj@mininter.gob.pe", name: "REGIÓN POLICIAL LIMA", role: "DEMANDADO" },
    { excelId: "USR_094", rawEmail: "dianapompacortez@gmail.com", name: "CONSORCIO PACHERRES", role: "DEMANDANTE" },
    { excelId: "USR_095", rawEmail: "procuraduriagorelambayeque@gmail.com", name: "GERENCIA REGIONAL DE AGRICULTURA GOBIERNO REGIONAL DE LAMBAYEQUE", role: "DEMANDADO" },
    { excelId: "USR_096", rawEmail: "companiajhorogue@gmail.com", name: "CONSORCIO CARRETERO SISO", role: "DEMANDANTE" },
    { excelId: "USR_097", rawEmail: "procuraduria@munichachapoyas.gob.pe", name: "INSTITUTO DE VIALIDAD MUNICIPAL DE LA PROVINCIA DE CHACHAPOYAS", role: "DEMANDADO" },
    { excelId: "USR_098", rawEmail: "jguevara@mariolinaresabogados.com", name: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A.", role: "DEMANDANTE" },
    { excelId: "USR_099", rawEmail: "abogado.arbitra4@essalud.gob.pe", name: "SEGURO SOCIAL DE SALUD - ESSALUD", role: "DEMANDADO" },
    { excelId: "USR_100", rawEmail: "administracion@grupogerencialperu.com", name: "CONSORCIO ADMINISTRACIÓN DE SERVICIOS COMPLEMENTARIOS S.A.C Y GRUPO GERENCIAL ASESORÍA Y SERVICIOS INTEGRALES S.R.L.TDA", role: "DEMANDANTE" },
    { excelId: "USR_101", rawEmail: "hospitalregionallambayeque@hrlamb.gob.pe", name: "HOSPITAL REGIONAL LAMBAYEQUE", role: "DEMANDADO" },
    { excelId: "USR_102", rawEmail: "corporacionsensussa@yahoo.com", name: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A.", role: "DEMANDANTE" },
    { excelId: "USR_103", rawEmail: "conciliacionarbitrajegrc@regioncajamarca.gob.pe", name: "GERENCIA SUB REGIONAL DE JAEN", role: "DEMANDADO" },
    { excelId: "USR_106", rawEmail: "covanor@hotmail.com", name: "CONSTRUCTORA VANESSA ORIETTA S.R.L.", role: "DEMANDANTE" },
    { excelId: "USR_107", rawEmail: "mps.procuraduria@gmail.com", name: "MUNICIPALIDAD PROVINCIAL DEL SANTA", role: "DEMANDADO" },
    { excelId: "USR_109", rawEmail: "arbitraje.gaj@essalud.gob.pe", name: "SEGURO SOCIAL DE SALUD - ESSALUD", role: "DEMANDADO" },
    { excelId: "USR_110", rawEmail: "arealegal.grupodrassa@gmail.com", name: "GRUPO DRASSA S.R.L.", role: "DEMANDANTE" },
    { excelId: "USR_111", rawEmail: "procuraduria@minedu.gob.pe", name: "UNIDAD EJECUTORA 108 PROGRAMA NACIONAL DE INFRAESTRUCTURA EDUCATIVA - PRONIED", role: "DEMANDADO" },
    { excelId: "USR_112", rawEmail: "cncgsac.0@gmail.com", name: "CONSORCIO NACIONAL CONTRATISTAS GENERALES S.A.C.", role: "DEMANDANTE" },
    { excelId: "USR_113", rawEmail: "cmsanchezg@sedapal.com.pe", name: "SERVICIO DE AGUA POTABLE Y ALCANTARILLADO DE LIMA", role: "DEMANDADO" },
    { excelId: "USR_114", rawEmail: "melidsnmatter@gmail.com", name: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A.", role: "DEMANDANTE" },
    { excelId: "USR_115", rawEmail: "arbitraje.gaj@essalud.gob.pe", name: "SEGURO SOCIAL DE SALUD - ESSALUD", role: "DEMANDADO" },
    { excelId: "USR_116", rawEmail: "administracion@peruinvestment.pe", name: "CONSORCIO NOVO HORIZONTE 3", role: "DEMANDANTE" },
    { excelId: "USR_117", rawEmail: "arbitraje2020@mtc.gob.pe", name: "PROYECTO ESPECIAL DE INFRAESTRUCTURA TRANSPORTE NACIONAL - PROVÍAS NACIONAL", role: "DEMANDADO" },
    { excelId: "USR_118", rawEmail: "covanor@hotmail.com", name: "CONSORCIO DELTA II", role: "DEMANDANTE" },
    { excelId: "USR_119", rawEmail: "pac.asesoriasedalib@gmail.com", name: "SEDALIB S.A.", role: "DEMANDADO" },
    { excelId: "USR_120", rawEmail: "rbonon@paramax.pe", name: "CONSTRUCTORA PARAMAX S.A.C", role: "DEMANDANTE" },
    { excelId: "USR_121", rawEmail: "procuraduriagorelambayeque@gmail.com", name: "GERENCIA REGIONAL DE AGRICULTURA GOBIERNO REGIONAL DE LAMBAYEQUE", role: "DEMANDADO" },
    { excelId: "USR_122", rawEmail: "cesarvalz1505@gmail.com", name: "DITRANSERVA S.A.C.", role: "DEMANDANTE" },
    { excelId: "USR_123", rawEmail: "ppmmdchabogada@gmail.com", name: "MUNICIPALIDAD DISTRITAL DE CHORRILLOS", role: "DEMANDADO" },
    { excelId: "USR_124", rawEmail: "mmendoza@rubio.pe", name: "VIETTEL PERU S.A.C.", role: "DEMANDANTE" },
    { excelId: "USR_125", rawEmail: "procuraduriaminam@pge.gob.pe", name: "SERVICIO NACIONAL DE ÁREAS NATURALES PROTEGIDAS POR EL ESTADO", role: "DEMANDADO" },
    { excelId: "USR_130", rawEmail: "consultores29112013@gmail.com", name: "CONSORCIO JEPALSA", role: "DEMANDANTE" },
    { excelId: "USR_131", rawEmail: "arbitrajes_ppr@regionpiura.gob.pe", name: "UNIDAD EJECUTORA INSTITUTOS SUPERIORES DE EDUCACION PUBLICA REGIONAL DE PIURA", role: "DEMANDADO" },
    { excelId: "USR_133", rawEmail: "procuraduria@regionica.gob.pe", name: "DIRECCIÓN REGIONAL DE EDUCACIÓN DE ICA", role: "DEMANDADO" },
    { excelId: "USR_134", rawEmail: "consorciomontegrande45@gmail.com", name: "CONSORCIO MONTEGRANDE", role: "DEMANDANTE" },
    { excelId: "USR_135", rawEmail: "municipalidadsantacruzcaj@gmail.com", name: "MUNICIPALIDAD PROVINCIAL DE SANTA CRUZ", role: "DEMANDADO" },
    { excelId: "USR_136", rawEmail: "efigueroa@estudiofigueroa.com", name: "GRUPO PANA S.A.", role: "DEMANDANTE" },
    { excelId: "USR_137", rawEmail: "jcollantes@corpac.gob.pe", name: "CORPORACIÓN PERUANA DE AEROPUERTOS Y AVIACIÓN COMERCIAL S.A.", role: "DEMANDADO" },
    { excelId: "USR_138", rawEmail: "admconsorciosierracentro@gmail.com", name: "CONSORCIO SIERRA CENTRO", role: "DEMANDANTE" },
    { excelId: "USR_139", rawEmail: "vcanoppmtc@gmail.com", name: "PROYECTO ESPECIAL DE INFRAESTRUCTURA DE TRANSPORTE NACIONAL - PROVÍAS NACIONAL", role: "DEMANDADO" },
    { excelId: "USR_140", rawEmail: "consorciochugay2025@outlook.com", name: "CONSORCIO CHUGAY", role: "DEMANDANTE" },
    { excelId: "USR_141", rawEmail: "procuraduria@regionlalibertad.gob.pe", name: "GOBIERNO REGIONAL LA LIBERTAD", role: "DEMANDADO" },
    { excelId: "USR_143", rawEmail: "geto-prov@mtc.gob.pe", name: "PROGRAMA NACIONAL DE TELECOMUNICACIONES - PRONATEL", role: "DEMANDADO" },
    { excelId: "USR_146", rawEmail: "covanor@hotmail.com", name: "CONSTRUCTORA VANESSA ORIETTA S.R.L.", role: "DEMANDANTE" },
    { excelId: "USR_147", rawEmail: "procuraduriavivienda@vivienda.gob.pe", name: "PROGRAMA NACIONAL DE SANEAMIENTO URBANO (PNSU)", role: "DEMANDADO" },
    { excelId: "USR_148", rawEmail: "ventas@ibrighter.com", name: "BRIGHTER PERU S.A.C.", role: "DEMANDANTE" },
    { excelId: "USR_149", rawEmail: "procuraduriamunicipalmdvy@gmail.com", name: "MUNICIPALIDAD DISTRITAL DE YARABAMBA", role: "DEMANDADO" },
    { excelId: "USR_150", rawEmail: "llopez@qubitsconsulting.com", name: "QUBITS CONSULTING S.A.C.", role: "DEMANDANTE" },
    { excelId: "USR_151", rawEmail: "universidad.trujillo@entity.caard.pe", name: "Universidad Nacional de Trujillo", role: "DEMANDADO" },
    { excelId: "USR_152", rawEmail: "cmirandaplaza@gmail.com", name: "UNIVERSIDAD NACIONAL DE INGENIERÍA", role: "DEMANDANTE" },
    { excelId: "USR_153", rawEmail: "gerencia.asesoria.juridica@epsgrau.com.pe", name: "ENTIDAD PRESTADORA DE SERVICIOS DE SANEAMIENTO GRAU S.A.", role: "DEMANDADO" },
    { excelId: "USR_154", rawEmail: "asistente@allok.pe", name: "CONSORCIO ALLOK Y ASOCIADOS - SUR", role: "DEMANDANTE" },
    { excelId: "USR_155", rawEmail: "procuraduria@mpfn.gob.pe", name: "MINISTERIO PÚBLICO", role: "DEMANDADO" },
    { excelId: "USR_156", rawEmail: "parmasp@regionlalibertad.gob.pe", name: "GOBIERNO REGIONAL DE LA LIBERTAD", role: "DEMANDANTE" },
    { excelId: "USR_157", rawEmail: "contractual@lcecconstructora.com", name: "CONSORCIO VÍAS HUANCHACO", role: "DEMANDADO" },
    { excelId: "USR_158", rawEmail: "ventas@caypecargo.com", name: "CONSORCIO CA & PE", role: "DEMANDANTE" },
    { excelId: "USR_159", rawEmail: "procuraduriaautoritativacivil@pj.gob.pe", name: "PODER JUDICIAL DE LA REPÚBLICA DEL PERÚ - UNIDAD EJECUTORA No 003 - CORTE SUPERIOR DE JUSTICIA DE LIMA", role: "DEMANDADO" },
  ];

  let count = 0;

  for (const entity of entities) {
    const email = cleanEmail(entity.rawEmail).toLowerCase();

    // If this email already exists, just map the excel ID to the existing user
    if (emailToUserIdMap.has(email)) {
      const existingId = emailToUserIdMap.get(email)!;
      userIdMap.set(entity.excelId, existingId);
      console.log(`  Entity mapped (existing email): ${entity.excelId} -> ${email} -> ${existingId}`);
      continue;
    }

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name: entity.name,
          role: entity.role,
          isActive: true,
          centerId,
          passwordHash,
        },
        create: {
          email,
          name: entity.name,
          role: entity.role,
          isActive: true,
          centerId,
          passwordHash,
        },
      });

      userIdMap.set(entity.excelId, user.id);
      emailToUserIdMap.set(email, user.id);
      nameToUserIdMap.set(entity.name, user.id);
      count++;
      console.log(`  Entity: ${email} (${entity.name.substring(0, 50)}) -> ${user.id}`);
    } catch (error: any) {
      console.log(`  Error creating entity ${entity.excelId}: ${error.message}`);
    }
  }

  // Handle duplicate USR entries that reference the same entities in different cases
  // USR_090, USR_092 -> same as USR_088 (TRANSPORTES ANGEL IBARCENA)
  for (const dup of ["USR_090", "USR_092", "USR_104", "USR_108", "USR_126", "USR_128", "USR_132", "USR_142", "USR_144"]) {
    const baseId = getDuplicateBaseId(dup);
    if (baseId && userIdMap.has(baseId)) {
      userIdMap.set(dup, userIdMap.get(baseId)!);
    }
  }
  // USR_091, USR_093 -> same as USR_089 (REGIÓN POLICIAL LIMA)
  for (const dup of ["USR_091", "USR_093", "USR_105", "USR_115", "USR_121", "USR_127", "USR_129", "USR_133", "USR_145"]) {
    const baseId = getDuplicateBaseId(dup);
    if (baseId && userIdMap.has(baseId)) {
      userIdMap.set(dup, userIdMap.get(baseId)!);
    }
  }

  console.log(`\n  Created ${count} entity users.\n`);
}

// Helper to get the base USR ID for duplicate entity references
function getDuplicateBaseId(excelId: string): string | null {
  const duplicateMap: Record<string, string> = {
    // TRANSPORTES ANGEL IBARCENA duplicates
    "USR_090": "USR_088",
    "USR_092": "USR_088",
    // REGION POLICIAL LIMA duplicates
    "USR_091": "USR_089",
    "USR_093": "USR_089",
    // CORPSENSUS duplicates
    "USR_104": "USR_102",
    "USR_108": "USR_102",
    // GERENCIA SUB REGIONAL DE JAEN
    "USR_105": "USR_103",
    // ESSALUD duplicates
    "USR_115": "USR_109",
    // GORE LAMBAYEQUE
    "USR_121": "USR_095",
    // PROVIAS NACIONAL
    "USR_127": "USR_117",
    // SERNANP
    "USR_129": "USR_125",
    // DIRECCION REGIONAL ICA
    "USR_133": "USR_085",
    // VIETTEL duplicates
    "USR_128": "USR_124",
    "USR_132": "USR_124",
    "USR_142": "USR_124",
    "USR_144": "USR_124",
    // PRONATEL
    "USR_145": "USR_143",
  };

  return duplicateMap[excelId] || null;
}

// =============================================================================
// STEP 9: CREATE CASES
// =============================================================================

async function createCases() {
  console.log("=== STEP 9: Creating Cases ===\n");

  interface CaseData {
    excelId: string;
    typeId: string;
    year: number;
    sequence: number;
    code: string;
    title: string;
    status: CaseStatus;
    scope: ArbitrationScope;
    procedureType: ProcedureType;
    tribunalMode?: TribunalMode;
    currentStage?: ProcessStage;
    isBlocked?: boolean;
    blockReason?: string;
    disputeAmountCents?: bigint;
    currency?: string;
    claimantName?: string;
    respondentName?: string;
    submittedAt?: Date;
    admittedAt?: Date;
    closedAt?: Date;
  }

  const cases: CaseData[] = [
    { excelId: "CASO_001", typeId: "TIPO_001", year: 2022, sequence: 1, code: "Exp. 018-2022-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3", currentStage: "PROBATORIA", disputeAmountCents: BigInt(50000000), currency: "PEN", claimantName: "Empresa Comercial A S.A.C.", respondentName: "Empresa Industrial B S.A.", submittedAt: new Date("2024-01-15"), admittedAt: new Date("2024-02-01") },
    { excelId: "CASO_002", typeId: "TIPO_001", year: 2022, sequence: 2, code: "Exp. 020-2022-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3", currentStage: "DEMANDA", isBlocked: true, blockReason: "Pendiente de pago", disputeAmountCents: BigInt(100000000), currency: "USD", claimantName: "International Corp Inc.", respondentName: "Peruvian Company S.A.C.", submittedAt: new Date("2024-02-20") },
    { excelId: "CASO_003", typeId: "TIPO_001", year: 2022, sequence: 3, code: "Exp. 021-2022-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3", currentStage: "LAUDO", disputeAmountCents: BigInt(75000000), currency: "PEN", claimantName: "Constructora Nacional S.A.", respondentName: "Municipalidad de Lima", submittedAt: new Date("2024-01-05"), admittedAt: new Date("2024-01-20"), closedAt: new Date("2024-06-15") },
    { excelId: "CASO_004", typeId: "TIPO_001", year: 2023, sequence: 4, code: "Exp. 011-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_005", typeId: "TIPO_001", year: 2023, sequence: 5, code: "Exp. 012-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_006", typeId: "TIPO_001", year: 2023, sequence: 6, code: "Exp. 017-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_007", typeId: "TIPO_001", year: 2023, sequence: 7, code: "Exp. 023-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_008", typeId: "TIPO_001", year: 2023, sequence: 8, code: "Exp. 025-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_009", typeId: "TIPO_001", year: 2023, sequence: 9, code: "Exp. 029-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_010", typeId: "TIPO_001", year: 2023, sequence: 10, code: "Exp. 031-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_011", typeId: "TIPO_001", year: 2023, sequence: 11, code: "Exp. 032-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_012", typeId: "TIPO_001", year: 2023, sequence: 12, code: "Exp. 033-2023-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_013", typeId: "TIPO_001", year: 2024, sequence: 13, code: "Exp. 001-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_014", typeId: "TIPO_001", year: 2024, sequence: 14, code: "Exp. 004-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_015", typeId: "TIPO_001", year: 2024, sequence: 15, code: "Exp. 006-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_016", typeId: "TIPO_001", year: 2024, sequence: 16, code: "Exp. 007-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_017", typeId: "TIPO_001", year: 2024, sequence: 17, code: "Exp. 009-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_018", typeId: "TIPO_001", year: 2024, sequence: 18, code: "Exp. 012-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_019", typeId: "TIPO_001", year: 2024, sequence: 19, code: "Exp. 019-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_020", typeId: "TIPO_001", year: 2024, sequence: 20, code: "Exp. 020-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_021", typeId: "TIPO_001", year: 2024, sequence: 21, code: "Exp. 021-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_022", typeId: "TIPO_001", year: 2024, sequence: 22, code: "Exp. 022-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_023", typeId: "TIPO_001", year: 2024, sequence: 23, code: "Exp. 024-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_024", typeId: "TIPO_001", year: 2024, sequence: 24, code: "Exp. 025-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_025", typeId: "TIPO_001", year: 2024, sequence: 25, code: "Exp. 026-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_026", typeId: "TIPO_001", year: 2024, sequence: 26, code: "Exp. 028-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_027", typeId: "TIPO_001", year: 2024, sequence: 27, code: "Exp. 031-2024-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_028", typeId: "TIPO_001", year: 2025, sequence: 28, code: "Exp. 001-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_029", typeId: "TIPO_001", year: 2025, sequence: 29, code: "Exp. 006-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_030", typeId: "TIPO_001", year: 2025, sequence: 30, code: "Exp. 007-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_031", typeId: "TIPO_001", year: 2025, sequence: 31, code: "Exp. 008-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_032", typeId: "TIPO_001", year: 2025, sequence: 32, code: "Exp. 009-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_033", typeId: "TIPO_001", year: 2025, sequence: 33, code: "Exp. 011-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_034", typeId: "TIPO_001", year: 2025, sequence: 34, code: "Exp. 012-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_035", typeId: "TIPO_001", year: 2025, sequence: 35, code: "Exp. 013-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_036", typeId: "TIPO_001", year: 2025, sequence: 36, code: "Exp. 014-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_037", typeId: "TIPO_001", year: 2025, sequence: 37, code: "Exp. 015-2025-ARB/CAARD", title: "Controversia Empresa A vs Empresa B", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_038", typeId: "TIPO_001", year: 2025, sequence: 38, code: "Exp. 016-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_039", typeId: "TIPO_001", year: 2025, sequence: 39, code: "Exp. 017-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_040", typeId: "TIPO_001", year: 2025, sequence: 40, code: "Exp. 018-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_041", typeId: "TIPO_001", year: 2025, sequence: 41, code: "Exp. 020-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_042", typeId: "TIPO_001", year: 2025, sequence: 42, code: "Exp. 021-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_043", typeId: "TIPO_001", year: 2025, sequence: 43, code: "Exp. 022-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "TRIBUNAL_3" },
    { excelId: "CASO_044", typeId: "TIPO_001", year: 2025, sequence: 44, code: "Exp. 023-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR", tribunalMode: "SOLE_ARBITRATOR" },
    { excelId: "CASO_045", typeId: "TIPO_001", year: 2025, sequence: 45, code: "Exp. 024-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR" },
    { excelId: "CASO_046", typeId: "TIPO_001", year: 2025, sequence: 46, code: "Exp. 025-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR" },
    { excelId: "CASO_047", typeId: "TIPO_001", year: 2025, sequence: 47, code: "Exp. 026-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR" },
    { excelId: "CASO_048", typeId: "TIPO_001", year: 2025, sequence: 48, code: "Exp. 027-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR" },
    { excelId: "CASO_049", typeId: "TIPO_001", year: 2025, sequence: 49, code: "Exp. 028-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR" },
    { excelId: "CASO_050", typeId: "TIPO_001", year: 2025, sequence: 50, code: "Exp. 029-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR" },
    { excelId: "CASO_051", typeId: "TIPO_001", year: 2025, sequence: 51, code: "Exp. 030-2025-ARB/CAARD", title: "Controversia Contratación Pública", status: "IN_PROCESS", scope: "NACIONAL", procedureType: "REGULAR" },
  ];

  for (const c of cases) {
    const arbitrationTypeId = arbitrationTypeMap.get(c.typeId);
    if (!arbitrationTypeId) {
      console.log(`  ERROR: No arbitration type found for ${c.typeId}`);
      continue;
    }

    try {
      const caseRecord = await prisma.case.upsert({
        where: { code: c.code },
        update: {
          centerId,
          arbitrationTypeId,
          year: c.year,
          sequence: c.sequence,
          title: c.title,
          status: c.status,
          scope: c.scope,
          procedureType: c.procedureType,
          tribunalMode: c.tribunalMode || "SOLE_ARBITRATOR",
          currentStage: c.currentStage || null,
          isBlocked: c.isBlocked || false,
          blockReason: c.blockReason || null,
          disputeAmountCents: c.disputeAmountCents || null,
          currency: c.currency || "PEN",
          claimantName: c.claimantName || null,
          respondentName: c.respondentName || null,
          submittedAt: c.submittedAt || null,
          admittedAt: c.admittedAt || null,
          closedAt: c.closedAt || null,
        },
        create: {
          centerId,
          arbitrationTypeId,
          year: c.year,
          sequence: c.sequence,
          code: c.code,
          title: c.title,
          status: c.status,
          scope: c.scope,
          procedureType: c.procedureType,
          tribunalMode: c.tribunalMode || "SOLE_ARBITRATOR",
          currentStage: c.currentStage || null,
          isBlocked: c.isBlocked || false,
          blockReason: c.blockReason || null,
          disputeAmountCents: c.disputeAmountCents || null,
          currency: c.currency || "PEN",
          claimantName: c.claimantName || null,
          respondentName: c.respondentName || null,
          submittedAt: c.submittedAt || null,
          admittedAt: c.admittedAt || null,
          closedAt: c.closedAt || null,
        },
      });

      caseIdMap.set(c.excelId, caseRecord.id);
      console.log(`  Case: ${c.code} -> ${caseRecord.id}`);
    } catch (error: any) {
      console.log(`  Error creating case ${c.excelId} (${c.code}): ${error.message}`);
    }
  }

  console.log(`\n  Created ${caseIdMap.size} cases.\n`);
}

// =============================================================================
// STEP 10: CREATE CASE MEMBERS
// =============================================================================

async function createCaseMembers() {
  console.log("=== STEP 10: Creating Case Members ===\n");

  // Each member entry: caseExcelId, userExcelId, role, displayName
  interface MemberEntry {
    caseId: string;
    userId: string | null; // null for PENDIENTE members
    role: Role;
    displayName: string;
    email?: string;
    isPrimary?: boolean;
  }

  const members: MemberEntry[] = [
    // CASO_001
    { caseId: "CASO_001", userId: "USR_082", role: "DEMANDANTE", displayName: "CONSORCIO NACIONAL CONTRATISTAS GENERALES S.A.C.", isPrimary: true },
    { caseId: "CASO_001", userId: "USR_083", role: "DEMANDADO", displayName: "SERVICIO DE AGUA POTABLE Y ALCANTARILLADO DE LIMA- SEDAPAL", isPrimary: true },
    { caseId: "CASO_001", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian", isPrimary: true },
    { caseId: "CASO_001", userId: "USR_028", role: "ARBITRO", displayName: "Elio Otiniano Sánchez" },
    { caseId: "CASO_001", userId: "USR_065", role: "ARBITRO", displayName: "Marko Alexis Morales Martínez" },
    { caseId: "CASO_001", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_002
    { caseId: "CASO_002", userId: "USR_084", role: "DEMANDANTE", displayName: "CONSORCIO SUPERVISOR CHINCHA" },
    { caseId: "CASO_002", userId: "USR_085", role: "DEMANDADO", displayName: "GOBIERNO REGIONAL DE ICA" },
    { caseId: "CASO_002", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_002", userId: "USR_014", role: "ARBITRO", displayName: "Andrés Augusto Criado León" },
    { caseId: "CASO_002", userId: "USR_035", role: "ARBITRO", displayName: "Hector Mujica Acurio" },
    { caseId: "CASO_002", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_003
    { caseId: "CASO_003", userId: "USR_086", role: "DEMANDANTE", displayName: "CONSORCIO SHALOM" },
    { caseId: "CASO_003", userId: "USR_087", role: "DEMANDADO", displayName: "MUNICIPALIDAD PROVINCIAL DE TALARA" },
    { caseId: "CASO_003", userId: "USR_035", role: "ARBITRO", displayName: "Hector Mujica Acurio" },
    { caseId: "CASO_003", userId: "USR_067", role: "ARBITRO", displayName: "Natalia Patricia Tincopa Cebrian" },
    { caseId: "CASO_003", userId: "USR_013", role: "ARBITRO", displayName: "Alvaro Rodrigo Carrera Dongo" },
    { caseId: "CASO_003", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_004
    { caseId: "CASO_004", userId: "USR_088", role: "DEMANDANTE", displayName: "TRANSPORTES ÁNGEL IBARCENA S.A.C." },
    { caseId: "CASO_004", userId: "USR_089", role: "DEMANDADO", displayName: "REGIÓN POLICIAL LIMA" },
    { caseId: "CASO_004", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_004", userId: "USR_050", role: "ARBITRO", displayName: "José Antonio Trelles Castillo" },
    { caseId: "CASO_004", userId: "USR_060", role: "ARBITRO", displayName: "Luis Puglianini Guerra" },
    { caseId: "CASO_004", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_005
    { caseId: "CASO_005", userId: "USR_088", role: "DEMANDANTE", displayName: "TRANSPORTES ÁNGEL IBARCENA S.A.C." },
    { caseId: "CASO_005", userId: "USR_089", role: "DEMANDADO", displayName: "REGIÓN POLICIAL LIMA" },
    { caseId: "CASO_005", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_005", userId: "USR_050", role: "ARBITRO", displayName: "José Antonio Trelles Castillo" },
    { caseId: "CASO_005", userId: "USR_060", role: "ARBITRO", displayName: "Luis Puglianini Guerra" },
    { caseId: "CASO_005", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_006
    { caseId: "CASO_006", userId: "USR_088", role: "DEMANDANTE", displayName: "TRANSPORTES ÁNGEL IBARCENA S.A.C." },
    { caseId: "CASO_006", userId: "USR_089", role: "DEMANDADO", displayName: "REGIÓN POLICIAL LIMA" },
    { caseId: "CASO_006", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_006", userId: "USR_050", role: "ARBITRO", displayName: "José Antonio Trelles Castillo" },
    { caseId: "CASO_006", userId: "USR_060", role: "ARBITRO", displayName: "Luis Puglianini Guerra" },
    { caseId: "CASO_006", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_007
    { caseId: "CASO_007", userId: "USR_094", role: "DEMANDANTE", displayName: "CONSORCIO PACHERRES" },
    { caseId: "CASO_007", userId: "USR_095", role: "DEMANDADO", displayName: "GERENCIA REGIONAL DE AGRICULTURA GOBIERNO REGIONAL DE LAMBAYEQUE" },
    { caseId: "CASO_007", userId: "USR_067", role: "ARBITRO", displayName: "Natalia Patricia Tincopa Cebrian" },
    { caseId: "CASO_007", userId: "USR_009", role: "ARBITRO", displayName: "Alberto Retamozo Linares" },
    { caseId: "CASO_007", userId: "USR_031", role: "ARBITRO", displayName: "Erick Cuba Meneses" },
    { caseId: "CASO_007", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_008
    { caseId: "CASO_008", userId: "USR_096", role: "DEMANDANTE", displayName: "CONSORCIO CARRETERO SISO" },
    { caseId: "CASO_008", userId: "USR_097", role: "DEMANDADO", displayName: "INSTITUTO DE VIALIDAD MUNICIPAL DE LA PROVINCIA DE CHACHAPOYAS" },
    { caseId: "CASO_008", userId: "USR_025", role: "ARBITRO", displayName: "Dennis Ítalo Roldan Rodriguez" },
    { caseId: "CASO_008", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_009
    { caseId: "CASO_009", userId: "USR_098", role: "DEMANDANTE", displayName: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A." },
    { caseId: "CASO_009", userId: "USR_099", role: "DEMANDADO", displayName: "SEGURO SOCIAL DE SALUD - ESSALUD" },
    { caseId: "CASO_009", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_009", userId: "USR_039", role: "ARBITRO", displayName: "Ivan Alexander Casiano Lossio" },
    { caseId: "CASO_009", userId: "USR_019", role: "ARBITRO", displayName: "Carlos Enrique Alvarez Solis" },
    { caseId: "CASO_009", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_010
    { caseId: "CASO_010", userId: "USR_100", role: "DEMANDANTE", displayName: "CONSORCIO ADMINISTRACIÓN DE SERVICIOS COMPLEMENTARIOS S.A.C Y GRUPO GERENCIAL" },
    { caseId: "CASO_010", userId: "USR_101", role: "DEMANDADO", displayName: "HOSPITAL REGIONAL LAMBAYEQUE" },
    { caseId: "CASO_010", userId: "USR_067", role: "ARBITRO", displayName: "Natalia Patricia Tincopa Cebrian" },
    { caseId: "CASO_010", userId: "USR_009", role: "ARBITRO", displayName: "Alberto Retamozo Linares" },
    { caseId: "CASO_010", userId: "USR_031", role: "ARBITRO", displayName: "Erick Cuba Meneses" },
    { caseId: "CASO_010", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_011
    { caseId: "CASO_011", userId: "USR_102", role: "DEMANDANTE", displayName: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A." },
    { caseId: "CASO_011", userId: "USR_103", role: "DEMANDADO", displayName: "GERENCIA SUB REGIONAL DE JAEN" },
    { caseId: "CASO_011", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_011", userId: "USR_039", role: "ARBITRO", displayName: "Ivan Alexander Casiano Lossio" },
    { caseId: "CASO_011", userId: "USR_065", role: "ARBITRO", displayName: "Marko Alexis Morales Martínez" },
    { caseId: "CASO_011", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_012
    { caseId: "CASO_012", userId: "USR_102", role: "DEMANDANTE", displayName: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A." },
    { caseId: "CASO_012", userId: "USR_103", role: "DEMANDADO", displayName: "GERENCIA SUB REGIONAL DE JAEN" },
    { caseId: "CASO_012", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_012", userId: "USR_039", role: "ARBITRO", displayName: "Ivan Alexander Casiano Lossio" },
    { caseId: "CASO_012", userId: "USR_019", role: "ARBITRO", displayName: "Carlos Enrique Alvarez Solis" },
    { caseId: "CASO_012", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_013
    { caseId: "CASO_013", userId: "USR_106", role: "DEMANDANTE", displayName: "CONSTRUCTORA VANESSA ORIETTA S.R.L." },
    { caseId: "CASO_013", userId: "USR_107", role: "DEMANDADO", displayName: "MUNICIPALIDAD PROVINCIAL DEL SANTA" },
    { caseId: "CASO_013", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_013", userId: "USR_008", role: "ARBITRO", displayName: "Alberto Montezuma Chirinos" },
    { caseId: "CASO_013", userId: "USR_066", role: "ARBITRO", displayName: "Martín Gregorio Oré Guerrero" },
    { caseId: "CASO_013", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_014
    { caseId: "CASO_014", userId: "USR_102", role: "DEMANDANTE", displayName: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A." },
    { caseId: "CASO_014", userId: "USR_109", role: "DEMANDADO", displayName: "SEGURO SOCIAL DE SALUD - ESSALUD" },
    { caseId: "CASO_014", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_014", userId: "USR_060", role: "ARBITRO", displayName: "Luis Puglianini Guerra" },
    { caseId: "CASO_014", userId: "USR_051", role: "ARBITRO", displayName: "Jose Miguel Carrillo Cuestas" },
    { caseId: "CASO_014", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_015
    { caseId: "CASO_015", userId: "USR_110", role: "DEMANDANTE", displayName: "GRUPO DRASSA S.R.L." },
    { caseId: "CASO_015", userId: "USR_111", role: "DEMANDADO", displayName: "UNIDAD EJECUTORA 108 PROGRAMA NACIONAL DE INFRAESTRUCTURA EDUCATIVA - PRONIED" },
    { caseId: "CASO_015", userId: "USR_036", role: "ARBITRO", displayName: "Helena Úrsula Murguia García" },
    { caseId: "CASO_015", userId: "USR_076", role: "ARBITRO", displayName: "Rodrigo Andrés Freitas Cabanillas" },
    { caseId: "CASO_015", userId: "USR_053", role: "ARBITRO", displayName: "Juan Carlos Medina Flores" },
    { caseId: "CASO_015", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_016
    { caseId: "CASO_016", userId: "USR_112", role: "DEMANDANTE", displayName: "CONSORCIO NACIONAL CONTRATISTAS GENERALES S.A.C." },
    { caseId: "CASO_016", userId: "USR_113", role: "DEMANDADO", displayName: "SERVICIO DE AGUA POTABLE Y ALCANTARILLADO DE LIMA" },
    { caseId: "CASO_016", userId: "USR_060", role: "ARBITRO", displayName: "Luis Puglianini Guerra" },
    { caseId: "CASO_016", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_017
    { caseId: "CASO_017", userId: "USR_114", role: "DEMANDANTE", displayName: "CORPORACIÓN SENSUS SOCIEDAD ANÓNIMA - CORPSENSUS S.A." },
    { caseId: "CASO_017", userId: "USR_109", role: "DEMANDADO", displayName: "SEGURO SOCIAL DE SALUD - ESSALUD" },
    { caseId: "CASO_017", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_017", userId: "USR_050", role: "ARBITRO", displayName: "José Antonio Trelles Castillo" },
    { caseId: "CASO_017", userId: "USR_025", role: "ARBITRO", displayName: "Dennis Ítalo Roldan Rodriguez" },
    { caseId: "CASO_017", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_018
    { caseId: "CASO_018", userId: "USR_116", role: "DEMANDANTE", displayName: "CONSORCIO NOVO HORIZONTE 3" },
    { caseId: "CASO_018", userId: "USR_117", role: "DEMANDADO", displayName: "PROYECTO ESPECIAL DE INFRAESTRUCTURA TRANSPORTE NACIONAL - PROVÍAS NACIONAL" },
    { caseId: "CASO_018", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_018", userId: "USR_006", role: "ARBITRO", displayName: "Ahmed Manyari Zea" },
    { caseId: "CASO_018", userId: "USR_054", role: "ARBITRO", displayName: "Juan Carlos Pinto Escobedo" },
    { caseId: "CASO_018", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_019
    { caseId: "CASO_019", userId: "USR_118", role: "DEMANDANTE", displayName: "CONSORCIO DELTA II" },
    { caseId: "CASO_019", userId: "USR_119", role: "DEMANDADO", displayName: "SEDALIB S.A." },
    { caseId: "CASO_019", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_019", userId: "USR_016", role: "ARBITRO", displayName: "Carlos Antonio Armas Gamarra" },
    { caseId: "CASO_019", userId: "USR_065", role: "ARBITRO", displayName: "Marko Alexis Morales Martínez" },
    { caseId: "CASO_019", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_020
    { caseId: "CASO_020", userId: "USR_120", role: "DEMANDANTE", displayName: "CONSTRUCTORA PARAMAX S.A.C" },
    { caseId: "CASO_020", userId: "USR_095", role: "DEMANDADO", displayName: "GERENCIA REGIONAL DE AGRICULTURA GOBIERNO REGIONAL DE LAMBAYEQUE" },
    { caseId: "CASO_020", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_020", userId: "USR_009", role: "ARBITRO", displayName: "Alberto Retamozo Linares" },
    { caseId: "CASO_020", userId: "USR_075", role: "ARBITRO", displayName: "Richard Martin Tirado" },
    { caseId: "CASO_020", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_021
    { caseId: "CASO_021", userId: "USR_122", role: "DEMANDANTE", displayName: "DITRANSERVA S.A.C." },
    { caseId: "CASO_021", userId: "USR_123", role: "DEMANDADO", displayName: "MUNICIPALIDAD DISTRITAL DE CHORRILLOS" },
    { caseId: "CASO_021", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_021", userId: "USR_009", role: "ARBITRO", displayName: "Alberto Retamozo Linares" },
    { caseId: "CASO_021", userId: "USR_070", role: "ARBITRO", displayName: "Patricia Lora Rios" },
    { caseId: "CASO_021", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_022
    { caseId: "CASO_022", userId: "USR_124", role: "DEMANDANTE", displayName: "VIETTEL PERU S.A.C." },
    { caseId: "CASO_022", userId: "USR_125", role: "DEMANDADO", displayName: "SERVICIO NACIONAL DE ÁREAS NATURALES PROTEGIDAS POR EL ESTADO" },
    { caseId: "CASO_022", userId: "USR_042", role: "ARBITRO", displayName: "Jaime Cheng Amaya" },
    { caseId: "CASO_022", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_023
    { caseId: "CASO_023", userId: "USR_116", role: "DEMANDANTE", displayName: "CONSORCIO NOVO HORIZONTE 3" },
    { caseId: "CASO_023", userId: "USR_117", role: "DEMANDADO", displayName: "PROYECTO ESPECIAL DE INFRAESTRUCTURA TRANSPORTE NACIONAL - PROVÍAS NACIONAL" },
    { caseId: "CASO_023", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_023", userId: "USR_006", role: "ARBITRO", displayName: "Ahmed Manyari Zea" },
    { caseId: "CASO_023", userId: "USR_054", role: "ARBITRO", displayName: "Juan Carlos Pinto Escobedo" },
    { caseId: "CASO_023", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_024
    { caseId: "CASO_024", userId: "USR_124", role: "DEMANDANTE", displayName: "VIETTEL PERU S.A.C." },
    { caseId: "CASO_024", userId: "USR_125", role: "DEMANDADO", displayName: "SERVICIO NACIONAL DE ÁREAS NATURALES PROTEGIDAS POR EL ESTADO" },
    { caseId: "CASO_024", userId: "USR_042", role: "ARBITRO", displayName: "Jaime Cheng Amaya" },
    { caseId: "CASO_024", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_025
    { caseId: "CASO_025", userId: "USR_084", role: "DEMANDANTE", displayName: "CONSORCIO JEPALSA" },
    { caseId: "CASO_025", userId: "USR_131", role: "DEMANDADO", displayName: "UNIDAD EJECUTORA INSTITUTOS SUPERIORES DE EDUCACION PUBLICA REGIONAL DE PIURA" },
    { caseId: "CASO_025", userId: "USR_009", role: "ARBITRO", displayName: "Alberto Retamozo Linares" },
    { caseId: "CASO_025", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_026
    { caseId: "CASO_026", userId: "USR_124", role: "DEMANDANTE", displayName: "VIETTEL PERU S.A.C." },
    { caseId: "CASO_026", userId: "USR_085", role: "DEMANDADO", displayName: "DIRECCIÓN REGIONAL DE EDUCACIÓN DE ICA" },
    { caseId: "CASO_026", userId: "USR_025", role: "ARBITRO", displayName: "Dennis Ítalo Roldan Rodriguez" },
    { caseId: "CASO_026", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_027
    { caseId: "CASO_027", userId: "USR_134", role: "DEMANDANTE", displayName: "CONSORCIO MONTEGRANDE" },
    { caseId: "CASO_027", userId: "USR_135", role: "DEMANDADO", displayName: "MUNICIPALIDAD PROVINCIAL DE SANTA CRUZ" },
    { caseId: "CASO_027", userId: "USR_067", role: "ARBITRO", displayName: "Natalia Patricia Tincopa Cebrian" },
    { caseId: "CASO_027", userId: "USR_070", role: "ARBITRO", displayName: "Patricia Lora Rios" },
    { caseId: "CASO_027", userId: "USR_009", role: "ARBITRO", displayName: "Alberto Retamozo Linares" },
    { caseId: "CASO_027", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_028
    { caseId: "CASO_028", userId: "USR_136", role: "DEMANDANTE", displayName: "GRUPO PANA S.A." },
    { caseId: "CASO_028", userId: "USR_137", role: "DEMANDADO", displayName: "CORPORACIÓN PERUANA DE AEROPUERTOS Y AVIACIÓN COMERCIAL S.A." },
    { caseId: "CASO_028", userId: "USR_011", role: "ARBITRO", displayName: "Alonso Bedoya Denegri" },
    { caseId: "CASO_028", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_029
    { caseId: "CASO_029", userId: "USR_138", role: "DEMANDANTE", displayName: "CONSORCIO SIERRA CENTRO" },
    { caseId: "CASO_029", userId: "USR_139", role: "DEMANDADO", displayName: "PROYECTO ESPECIAL DE INFRAESTRUCTURA DE TRANSPORTE NACIONAL - PROVÍAS NACIONAL" },
    { caseId: "CASO_029", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_030
    { caseId: "CASO_030", userId: "USR_140", role: "DEMANDANTE", displayName: "CONSORCIO CHUGAY" },
    { caseId: "CASO_030", userId: "USR_141", role: "DEMANDADO", displayName: "GOBIERNO REGIONAL LA LIBERTAD" },
    { caseId: "CASO_030", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_030", userId: "USR_065", role: "ARBITRO", displayName: "Marko Alexis Morales Martínez" },
    { caseId: "CASO_030", userId: "USR_022", role: "ARBITRO", displayName: "César Eduardo Santillán Salazar" },
    { caseId: "CASO_030", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_031
    { caseId: "CASO_031", userId: "USR_124", role: "DEMANDANTE", displayName: "VIETTEL PERU S.A.C." },
    { caseId: "CASO_031", userId: "USR_143", role: "DEMANDADO", displayName: "PROGRAMA NACIONAL DE TELECOMUNICACIONES - PRONATEL" },
    { caseId: "CASO_031", userId: "USR_064", role: "ARBITRO", displayName: "Mario Ernesto Linares Jara" },
    { caseId: "CASO_031", userId: "USR_025", role: "ARBITRO", displayName: "Dennis Ítalo Roldan Rodriguez" },
    { caseId: "CASO_031", userId: "USR_041", role: "ARBITRO", displayName: "Ivan Magno Parédez Neyra" },
    { caseId: "CASO_031", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_032
    { caseId: "CASO_032", userId: "USR_124", role: "DEMANDANTE", displayName: "VIETTEL PERU S.A.C." },
    { caseId: "CASO_032", userId: "USR_143", role: "DEMANDADO", displayName: "PROGRAMA NACIONAL DE TELECOMUNICACIONES - PRONATEL" },
    { caseId: "CASO_032", userId: "USR_064", role: "ARBITRO", displayName: "Mario Ernesto Linares Jara" },
    { caseId: "CASO_032", userId: "USR_025", role: "ARBITRO", displayName: "Dennis Ítalo Roldan Rodriguez" },
    { caseId: "CASO_032", userId: "USR_041", role: "ARBITRO", displayName: "Ivan Magno Parédez Neyra" },
    { caseId: "CASO_032", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_033
    { caseId: "CASO_033", userId: "USR_106", role: "DEMANDANTE", displayName: "CONSTRUCTORA VANESSA ORIETTA S.R.L." },
    { caseId: "CASO_033", userId: "USR_147", role: "DEMANDADO", displayName: "PROGRAMA NACIONAL DE SANEAMIENTO URBANO (PNSU)" },
    { caseId: "CASO_033", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_034
    { caseId: "CASO_034", userId: "USR_148", role: "DEMANDANTE", displayName: "BRIGHTER PERU S.A.C." },
    { caseId: "CASO_034", userId: "USR_149", role: "DEMANDADO", displayName: "MUNICIPALIDAD DISTRITAL DE YARABAMBA" },
    { caseId: "CASO_034", userId: "USR_067", role: "ARBITRO", displayName: "Natalia Patricia Tincopa Cebrian" },
    { caseId: "CASO_034", userId: "USR_073", role: "ARBITRO", displayName: "Raul Salazar Rivera" },
    { caseId: "CASO_034", userId: "USR_022", role: "ARBITRO", displayName: "César Eduardo Santillán Salazar" },
    { caseId: "CASO_034", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_035
    { caseId: "CASO_035", userId: "USR_150", role: "DEMANDANTE", displayName: "QUBITS CONSULTING S.A.C." },
    { caseId: "CASO_035", userId: "USR_151", role: "DEMANDADO", displayName: "Universidad Nacional de Trujillo" },
    { caseId: "CASO_035", userId: "USR_029", role: "ARBITRO", displayName: "Enrique Martín La Rosa Ubillas" },
    { caseId: "CASO_035", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_036
    { caseId: "CASO_036", userId: "USR_152", role: "DEMANDANTE", displayName: "UNIVERSIDAD NACIONAL DE INGENIERÍA" },
    { caseId: "CASO_036", userId: "USR_153", role: "DEMANDADO", displayName: "ENTIDAD PRESTADORA DE SERVICIOS DE SANEAMIENTO GRAU S.A." },
    { caseId: "CASO_036", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_036", userId: "USR_075", role: "ARBITRO", displayName: "Richard Martin Tirado" },
    { caseId: "CASO_036", userId: "USR_073", role: "ARBITRO", displayName: "Raul Salazar Rivera" },
    { caseId: "CASO_036", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_037
    { caseId: "CASO_037", userId: "USR_154", role: "DEMANDANTE", displayName: "CONSORCIO ALLOK Y ASOCIADOS - SUR" },
    { caseId: "CASO_037", userId: "USR_155", role: "DEMANDADO", displayName: "MINISTERIO PÚBLICO" },
    { caseId: "CASO_037", userId: "USR_017", role: "ARBITRO", displayName: "Augusto Millones Santa Gadea" },
    { caseId: "CASO_037", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_038
    { caseId: "CASO_038", userId: "USR_156", role: "DEMANDANTE", displayName: "GOBIERNO REGIONAL DE LA LIBERTAD" },
    { caseId: "CASO_038", userId: "USR_157", role: "DEMANDADO", displayName: "CONSORCIO VÍAS HUANCHACO" },
    { caseId: "CASO_038", userId: "USR_080", role: "ARBITRO", displayName: "Vicente Fernando Tincopa Cebrian" },
    { caseId: "CASO_038", userId: "USR_060", role: "ARBITRO", displayName: "Luis Puglianini Guerra" },
    { caseId: "CASO_038", userId: "USR_041", role: "ARBITRO", displayName: "Ivan Magno Parédez Neyra" },
    { caseId: "CASO_038", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
    // CASO_039
    { caseId: "CASO_039", userId: "USR_158", role: "DEMANDANTE", displayName: "CONSORCIO CA & PE" },
    { caseId: "CASO_039", userId: "USR_159", role: "DEMANDADO", displayName: "PODER JUDICIAL DE LA REPÚBLICA DEL PERÚ" },
    { caseId: "CASO_039", userId: "USR_069", role: "ARBITRO", displayName: "Oswaldo Hundskoff Exebio" },
    { caseId: "CASO_039", userId: "USR_003", role: "SECRETARIA", displayName: "Anais Boluarte" },
  ];

  let count = 0;

  for (const m of members) {
    const realCaseId = caseIdMap.get(m.caseId);
    if (!realCaseId) {
      console.log(`  SKIP: No case found for ${m.caseId}`);
      continue;
    }

    const realUserId = m.userId ? userIdMap.get(m.userId) : null;

    try {
      await prisma.caseMember.create({
        data: {
          caseId: realCaseId,
          userId: realUserId || null,
          role: m.role,
          displayName: m.displayName,
          isPrimary: m.isPrimary || false,
        },
      });
      count++;
    } catch (error: any) {
      console.log(`  Error creating member for ${m.caseId}: ${error.message}`);
    }
  }

  console.log(`\n  Created ${count} case members.\n`);
}

// =============================================================================
// STEP 11: CREATE CASE FOLDERS
// =============================================================================

async function createCaseFolders() {
  console.log("=== STEP 11: Creating Case Folders ===\n");

  let count = 0;

  const caseEntries = Array.from(caseIdMap.entries());
  for (const [excelId, realCaseId] of caseEntries) {
    for (const folder of CASE_FOLDER_STRUCTURE) {
      try {
        await prisma.caseFolder.upsert({
          where: {
            caseId_key: {
              caseId: realCaseId,
              key: folder.key,
            },
          },
          update: {
            name: folder.name,
          },
          create: {
            caseId: realCaseId,
            key: folder.key,
            name: folder.name,
          },
        });
        count++;
      } catch (error: any) {
        // Ignore duplicates
      }
    }
  }

  console.log(`  Created ${count} case folders.\n`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("========================================");
  console.log("CAARD - Real Data Migration Script");
  console.log("========================================\n");

  try {
    await deleteAllData();
    await createCenter();
    await createSuperAdmins();
    await createStaffUsers();
    await createArbitratorUsers();
    await createEntityUsers();
    await createArbitratorRegistry();
    await createArbitrationTypes();
    await createCases();
    await createCaseMembers();
    await createCaseFolders();

    console.log("========================================");
    console.log("Migration completed successfully!");
    console.log("========================================\n");
    console.log(`Summary:`);
    console.log(`  - Users created: ${emailToUserIdMap.size}`);
    console.log(`  - Cases created: ${caseIdMap.size}`);
    console.log(`  - ArbitrationTypes: ${arbitrationTypeMap.size}`);
    console.log(`  - Center: ${centerId}`);
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
