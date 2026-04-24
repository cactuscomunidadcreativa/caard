/**
 * CAARD - Importador de la plantilla completa (v5)
 *
 * Sincroniza TODO el contenido de /Downloads/CAARD_Plantilla_Completa (5).xlsx
 * contra la base de datos. Uso:
 *   npx tsx scripts/import-plantilla-completa.ts              # full run
 *   STAGE=users npx tsx scripts/import-plantilla-completa.ts  # solo una etapa
 *   DRY_RUN=1 npx tsx scripts/import-plantilla-completa.ts    # no escribe
 *
 * Preserva a los SUPER_ADMIN (eduardo@cactuscomunidadcreativa.com, sis@caardpe.com)
 * aunque aparezcan en la plantilla con otro rol.
 */
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

const XLSX_PATH =
  process.env.XLSX_PATH ||
  "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (5).xlsx";

const DRY = !!process.env.DRY_RUN;
const STAGE = process.env.STAGE || "all"; // all | users | arbitrators | cases | members | lawyers | deadlines | hearings | notes | orders | payments | holidays | emergencies | recusations | sanctions

const PROTECTED_SUPER_ADMINS = new Set([
  "eduardo@cactuscomunidadcreativa.com",
  "sis@caardpe.com",
]);

// ======================================================================
// Utilities
// ======================================================================

function normEmail(e: any): string | null {
  if (!e) return null;
  // Limpiar comillas envolventes (Excel a veces encierra celdas multilínea
  // con " que terminan pegadas al primer email).
  let s = String(e).trim().toLowerCase();
  s = s.replace(/^["'\s]+|["'\s]+$/g, "");
  if (!s) return null;
  // Partir por cualquier separador de emails múltiples: espacios, \n, \r, coma,
  // punto y coma, pipe. Luego filtrar los que tengan @ y devolver el primero.
  const candidates = s
    .split(/[\s,;|]+/)
    .map((c) => c.replace(/^["'<>]+|["'<>]+$/g, ""))
    .filter((c) => c && c.includes("@") && /^[^@]+@[^@]+\.[^@]+$/.test(c));
  return candidates[0] || null;
}

// Retorna TODOS los emails válidos presentes en una celda (útil para registrar
// el primario como principal y archivar los secundarios en notas).
function allEmails(e: any): string[] {
  if (!e) return [];
  let s = String(e).trim().toLowerCase();
  s = s.replace(/^["'\s]+|["'\s]+$/g, "");
  if (!s) return [];
  return s
    .split(/[\s,;|]+/)
    .map((c) => c.replace(/^["'<>]+|["'<>]+$/g, ""))
    .filter((c) => c && c.includes("@") && /^[^@]+@[^@]+\.[^@]+$/.test(c));
}

function normStr(s: any): string | null {
  if (s === null || s === undefined) return null;
  const v = String(s).trim();
  return v ? v : null;
}

function normBool(s: any, def = false): boolean {
  if (s === null || s === undefined || s === "") return def;
  const v = String(s).trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes", "y", "x"].includes(v);
}

function normInt(s: any): number | null {
  if (s === null || s === undefined || s === "") return null;
  const n = parseInt(String(s).replace(/[^\d-]/g, ""), 10);
  return isNaN(n) ? null : n;
}

function normPhone(s: any): string | null {
  if (s === null || s === undefined || s === "") return null;
  let v = String(s).trim();
  if (!v) return null;
  // Remove all non-digits except leading +
  v = v.replace(/\s+/g, "");
  if (!v.startsWith("+")) {
    // Si son 9 dígitos peruanos, anteponer +51
    const digits = v.replace(/\D/g, "");
    if (digits.length === 9) return "+51" + digits;
    if (digits.length === 11 && digits.startsWith("51")) return "+" + digits;
    return "+" + digits;
  }
  return v;
}

function normBigIntCents(s: any): bigint | null {
  if (s === null || s === undefined || s === "") return null;
  const n = Number(s);
  if (isNaN(n)) return null;
  return BigInt(Math.round(n));
}

function excelDate(serial: any): Date | null {
  if (serial === null || serial === undefined || serial === "") return null;
  if (serial instanceof Date) return serial;
  if (typeof serial === "string") {
    const d = new Date(serial);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof serial === "number" && serial > 1) {
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function normCaseCode(s: any): string | null {
  if (!s) return null;
  let v = String(s).trim();
  if (!v) return null;
  // Si viene "001-2022-ARB/CAARD", anteponer "Exp. "
  if (!/^exp\.?\s*/i.test(v)) {
    v = "Exp. " + v;
  } else {
    v = v.replace(/^exp\.?\s*/i, "Exp. ");
  }
  return v;
}

// Normalize para match case-insensitive sin puntos/espacios
function normCodeKey(s: string): string {
  return s
    .replace(/^Exp\.?\s*/i, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function readSheet(
  wb: XLSX.WorkBook,
  name: string
): Record<string, any>[] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<any>(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  });
  if (raw.length < 2) return [];
  // Auto-detect header row: buscar en las primeras 5 filas una que tenga
  // al menos un valor que termine en '*' (columnas requeridas) o que sea
  // un texto corto sin espacios largos.
  let headerRow = -1;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const r = raw[i] as any[];
    if (!r) continue;
    const nonNull = r.filter((c) => c !== null && c !== "").length;
    if (nonNull < 2) continue;
    const hasRequired = r.some(
      (c) => c && typeof c === "string" && c.trim().endsWith("*")
    );
    if (hasRequired) {
      headerRow = i;
      break;
    }
    // Alternativa: fila con cadenas cortas tipo 'codigo', 'nombre', etc.
    const looksLikeHeader = r.every(
      (c) => c === null || c === "" || (typeof c === "string" && c.length < 40)
    );
    if (looksLikeHeader && nonNull >= 2 && headerRow < 0) {
      headerRow = i;
    }
  }
  if (headerRow < 0) return [];
  const headers = (raw[headerRow] as any[]).map((h) =>
    h ? String(h).replace(/\*$/, "").trim() : ""
  );
  const rows: Record<string, any>[] = [];
  for (let i = headerRow + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r || (r as any[]).every((c) => c === null || c === "")) continue;
    const obj: any = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (r as any[])[idx];
    });
    rows.push(obj);
  }
  return rows;
}

const log = (...args: any[]) => console.log(...args);
const run = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const t0 = Date.now();
  log(`\n━━━ ${name}`);
  const r = await fn();
  log(`   (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return r;
};

// ======================================================================
// Main
// ======================================================================

async function main() {
  log(`Cargando Excel: ${XLSX_PATH}`);
  if (DRY) log("*** DRY RUN — no se escribirá nada ***");
  const wb = XLSX.readFile(XLSX_PATH);

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) throw new Error("No se encontró el centro CAARD");

  const arbTypes = await prisma.arbitrationType.findMany();
  const defaultType =
    arbTypes.find((t) => t.code === "SOLICITUD_ARBITRAJE") || arbTypes[0];
  const emergencyType =
    arbTypes.find((t) => t.code === "EMERGENCIA") || defaultType;

  const want = (s: string) => STAGE === "all" || STAGE === s;

  // Cache de usuarios por email (para FKs)
  const userByEmail = new Map<string, string>(); // email -> userId

  // -------------------- 1) USUARIOS --------------------
  if (want("users")) {
    await run("10_Usuarios", async () => {
      const rows = readSheet(wb, "10_Usuarios");
      let created = 0,
        updated = 0,
        skipped = 0;

      for (const r of rows) {
        const email = normEmail(r.email);
        if (!email) {
          skipped++;
          continue;
        }
        const name = normStr(r.nombre) || email.split("@")[0];
        const phone = normPhone(r.telefono);
        const rolRaw = normStr(r.rol) || "DEMANDANTE";
        const activo = r.activo === "" ? true : normBool(r.activo, true);

        // Mapear rol a enum
        const roleMap: Record<string, string> = {
          SUPER_ADMIN: "SUPER_ADMIN",
          ADMIN: "ADMIN",
          SECRETARIA: "SECRETARIA",
          CENTER_STAFF: "CENTER_STAFF",
          ARBITRO: "ARBITRO",
          ABOGADO: "ABOGADO",
          DEMANDANTE: "DEMANDANTE",
          DEMANDADO: "DEMANDADO",
        };
        let role = roleMap[rolRaw.toUpperCase()] || "DEMANDANTE";

        // Proteger SUPER_ADMINs: si el email está protegido, forzar rol SUPER_ADMIN
        if (PROTECTED_SUPER_ADMINS.has(email)) role = "SUPER_ADMIN";

        if (DRY) {
          log(
            `   [DRY] upsert ${email} role=${role} active=${activo} phone=${phone}`
          );
          continue;
        }

        try {
          const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true },
          });
          if (existing) {
            // No sobrescribir rol de SUPER_ADMIN existentes (precaución extra)
            const finalRole =
              existing.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : role;
            const u = await prisma.user.update({
              where: { email },
              data: {
                name,
                phoneE164: phone || undefined,
                role: finalRole as any,
                isActive: activo,
                centerId: center.id,
              },
            });
            userByEmail.set(email, u.id);
            updated++;
          } else {
            const u = await prisma.user.create({
              data: {
                email,
                name,
                phoneE164: phone,
                role: role as any,
                isActive: activo,
                centerId: center.id,
              },
            });
            userByEmail.set(email, u.id);
            created++;
          }
        } catch (e: any) {
          log(`   ! user ${email}: ${e.message}`);
          skipped++;
        }
      }
      log(
        `   users: ${created} creados, ${updated} actualizados, ${skipped} omitidos`
      );
    });
  }

  // Poblar cache de emails ya existentes (para stages posteriores)
  {
    const all = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    for (const u of all) if (u.email) userByEmail.set(u.email.toLowerCase(), u.id);
  }

  // -------------------- 2) ÁRBITROS --------------------
  if (want("arbitrators")) {
    await run("04_Arbitros", async () => {
      const rows = readSheet(wb, "04_Arbitros");
      let created = 0,
        updated = 0,
        skipped = 0;

      for (const r of rows) {
        const name = normStr(r.nombre);
        const email = normEmail(r.email);
        if (!name && !email) {
          skipped++;
          continue;
        }
        const phone = normPhone(r.telefono);
        const estadoRaw = normStr(r.estado) || "ACTIVE";
        const statusMap: Record<string, string> = {
          ACTIVE: "ACTIVE",
          PENDING_APPROVAL: "PENDING_APPROVAL",
          SUSPENDED: "SUSPENDED",
          SANCTIONED: "SANCTIONED",
          RETIRED: "RETIRED",
          REJECTED: "REJECTED",
        };
        const status = statusMap[estadoRaw.toUpperCase()] || "ACTIVE";
        const colegiatura = normStr(r.nro_colegiatura);
        const colegio = normStr(r.colegio_abogados);
        const especialidades = (normStr(r.especialidades) || "")
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const fechaPost = excelDate(r.fecha_postulacion);
        const fechaAprob = excelDate(r.fecha_aprobacion);
        const maxCasos = normInt(r["max_casos_simultáneos"]) || 10;
        const aceptaEm = normBool(r.acepta_emergencia, true);
        const notas = normStr(r.notas);

        if (!email) {
          skipped++;
          continue;
        }

        if (DRY) {
          log(`   [DRY] arbitro ${email} name=${name} status=${status}`);
          continue;
        }

        try {
          // 1) Upsert user como ARBITRO (salvo que sea super_admin protegido)
          let userId = userByEmail.get(email);
          if (!userId) {
            const u = await prisma.user.create({
              data: {
                email,
                name: name || email.split("@")[0],
                phoneE164: phone,
                role: "ARBITRO" as any,
                isActive: status === "ACTIVE",
                centerId: center.id,
              },
            });
            userId = u.id;
            userByEmail.set(email, userId);
          } else {
            const isProtected = PROTECTED_SUPER_ADMINS.has(email);
            const u = await prisma.user.update({
              where: { id: userId },
              data: {
                name: name || undefined,
                phoneE164: phone || undefined,
                role: isProtected ? "SUPER_ADMIN" : ("ARBITRO" as any),
                centerId: center.id,
              },
            });
            userId = u.id;
          }

          // 2) Upsert ArbitratorRegistry
          const reg = await prisma.arbitratorRegistry.upsert({
            where: { userId },
            update: {
              status: status as any,
              barNumber: colegiatura,
              barAssociation: colegio,
              specializations: especialidades,
              applicationDate: fechaPost || undefined,
              approvalDate: fechaAprob || undefined,
              maxConcurrentCases: maxCasos,
              acceptsEmergency: aceptaEm,
              notes: notas,
            },
            create: {
              userId,
              centerId: center.id,
              status: status as any,
              barNumber: colegiatura,
              barAssociation: colegio,
              specializations: especialidades,
              applicationDate: fechaPost || new Date(),
              approvalDate: fechaAprob,
              maxConcurrentCases: maxCasos,
              acceptsEmergency: aceptaEm,
              notes: notas,
            },
          });

          // 3) Upsert ArbitratorProfile para que aparezca en la web pública
          const slug = (name || email.split("@")[0])
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60);
          await prisma.arbitratorProfile.upsert({
            where: { registryId: reg.id },
            update: {
              displayName: name || email.split("@")[0],
              contactEmail: email,
              phone: phone,
              colegiatura,
              colegio,
              specializations: especialidades,
              especialidad: especialidades[0] || null,
            },
            create: {
              registryId: reg.id,
              slug: slug || `arb-${reg.id.slice(0, 8)}`,
              displayName: name || email.split("@")[0],
              contactEmail: email,
              phone: phone,
              colegiatura,
              colegio,
              specializations: especialidades,
              especialidad: especialidades[0] || null,
            },
          });

          created++;
        } catch (e: any) {
          log(`   ! arbitro ${email}: ${e.message}`);
          skipped++;
        }
      }
      log(`   árbitros: ${created} ok, ${skipped} omitidos`);
    });
  }

  // -------------------- 3) EXPEDIENTES --------------------
  const caseByCode = new Map<string, string>(); // normCode -> caseId
  {
    const existing = await prisma.case.findMany({
      select: { id: true, code: true },
    });
    for (const c of existing) caseByCode.set(normCodeKey(c.code), c.id);
  }

  if (want("cases")) {
    await run("01_Expedientes", async () => {
      const rows = readSheet(wb, "01_Expedientes");
      let created = 0,
        updated = 0,
        skipped = 0;

      for (const r of rows) {
        const code = normCaseCode(r.codigo);
        if (!code) {
          skipped++;
          continue;
        }
        const key = normCodeKey(code);
        const year = normInt(r["año"]) || 0;
        const sequence = normInt(r.secuencia) || 0;
        const title = normStr(r.titulo);
        let estado = normStr(r.estado) || "IN_PROCESS";
        const validStatus = ["DRAFT","SUBMITTED","UNDER_REVIEW","OBSERVED","ADMITTED","REJECTED","IN_PROCESS","AWAITING_PAYMENT","SUSPENDED","CLOSED","ARCHIVED","EMERGENCY_IN_PROCESS"];
        if (!validStatus.includes(estado.toUpperCase())) {
          estado = "IN_PROCESS"; // default para "-" u otros valores inválidos
        }
        estado = estado.toUpperCase();
        const ambito = normStr(r.ambito) || "NACIONAL";
        const tipoProc = normStr(r.tipo_procedimiento) || "REGULAR";
        const composicion = normStr(r.composicion_arbitral) || "TRIBUNAL_3";
        const etapaRaw = normStr(r.etapa_actual);
        // Mapear etapa a ProcessStage enum (solo acepta valores canónicos)
        let etapa: string | null = null;
        if (etapaRaw) {
          const e = etapaRaw.toUpperCase();
          const validStages = ["DEMANDA","CONTESTACION","RECONVENCION","PROBATORIA","AUDIENCIA_PRUEBAS","INFORMES_ORALES","LAUDO"];
          if (validStages.includes(e)) etapa = e;
          else if (e.includes("PROBATORI") || e.includes("MEDIOS PROBATORIOS")) etapa = "PROBATORIA";
          else if (e.includes("INFORMES")) etapa = "INFORMES_ORALES";
          else if (e.includes("AUDIENCIA")) etapa = "AUDIENCIA_PRUEBAS";
          else if (e.includes("LAUDO")) etapa = "LAUDO";
          else if (e.includes("CONTESTACION")) etapa = "CONTESTACION";
          else if (e.includes("DEMANDA")) etapa = "DEMANDA";
          // 'ARCHIVADO' / 'EXP. CONSOLIDADO' → dejar null
        }
        const blockedVal = r.bloqueado;
        const blocked = blockedVal === "" ? false : normBool(blockedVal, false);
        const motivoBlock = normStr(r.motivo_bloqueo);
        const cuantia = normBigIntCents(r.cuantia_centimos);
        const moneda = normStr(r.moneda) || "PEN";
        const demandante = normStr(r.demandante);
        const demandado = normStr(r.demandado);
        const fechaPres = excelDate(r.fecha_presentacion);
        const fechaAdm = excelDate(r.fecha_admision);
        const fechaCierre = excelDate(r.fecha_cierre);
        const consejoSup = normBool(r.consejo_superior);
        const gastosCentro = normBigIntCents(r.gastos_centro_centimos);
        const tasa = normBigIntCents(r.tasa_centimos);
        const totalAdmin = normBigIntCents(r.total_admin_centimos);
        const casoPrinc = normCaseCode(r.caso_principal_emergencia);
        const driveId = normStr(r.carpeta_drive_id);

        const isEmergency = tipoProc === "EMERGENCY" || /ARBEME/i.test(code);
        const isIntl = ambito === "INTERNACIONAL";
        // Elegir el tipo correcto según emergencia + ámbito
        const intlDefault =
          arbTypes.find((t) => t.code === "SOLICITUD_INTERNACIONAL") ||
          defaultType;
        const intlEmergency =
          arbTypes.find((t) => t.code === "EMERGENCIA_INTERNACIONAL") ||
          emergencyType;
        const typeId = isEmergency
          ? isIntl
            ? intlEmergency.id
            : emergencyType.id
          : isIntl
            ? intlDefault.id
            : defaultType.id;
        const currency = moneda;

        const data: any = {
          title: title || code,
          status: estado,
          scope: ambito,
          procedureType: tipoProc,
          tribunalMode: composicion,
          currentStage: etapa,
          claimantName: demandante,
          respondentName: demandado,
          currency,
          isBlocked: blocked,
          blockReason: motivoBlock,
          submittedAt: fechaPres,
          admittedAt: fechaAdm,
          closedAt: fechaCierre,
          hasCouncil: consejoSup,
          relatedMainCaseCode: casoPrinc,
        };
        if (cuantia !== null) data.disputeAmountCents = cuantia;
        if (gastosCentro !== null) data.centerFeeCents = gastosCentro;
        if (tasa !== null) data.taxCents = tasa;
        if (totalAdmin !== null) data.totalAdminFeeCents = totalAdmin;
        if (driveId) data.driveFolderId = driveId;

        Object.keys(data).forEach(
          (k) => (data[k] === null || data[k] === undefined) && delete data[k]
        );

        if (DRY) {
          log(`   [DRY] case ${code} status=${estado}`);
          continue;
        }

        try {
          const existingId = caseByCode.get(key);
          if (existingId) {
            // En UPDATE también corregir arbitrationTypeId para que
            // no queden casos con tipo incorrecto de migraciones previas.
            await prisma.case.update({
              where: { id: existingId },
              data: { ...data, arbitrationTypeId: typeId },
            });
            caseByCode.set(key, existingId);
            updated++;
          } else {
            const c = await prisma.case.create({
              data: {
                ...data,
                code,
                year: year || new Date().getFullYear(),
                sequence: sequence || 0,
                centerId: center.id,
                arbitrationTypeId: typeId,
              },
            });
            caseByCode.set(key, c.id);
            created++;
          }
        } catch (e: any) {
          log(`   ! case ${code}: ${e.message}`);
          skipped++;
        }
      }
      log(
        `   cases: ${created} creados, ${updated} actualizados, ${skipped} omitidos`
      );
    });
  }

  // -------------------- 4) MIEMBROS DEL CASO --------------------
  if (want("members")) {
    await run("02_Miembros", async () => {
      const rows = readSheet(wb, "02_Miembros");
      let created = 0,
        skipped = 0;

      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        let role = normStr(r.rol);
        const name = normStr(r.nombre_completo);
        const email = normEmail(r.email);
        const phone = normPhone(r.telefono_e164);
        const isPrimary = normBool(r.es_principal, false);

        if (!codeRaw || !role || !name) {
          skipped++;
          continue;
        }

        // Mapear variantes de árbitro al enum Role (solo conoce ARBITRO)
        const roleUpper = role.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (
          roleUpper === "PRESIDENTE" ||
          roleUpper === "ARBITRO UNICO" ||
          roleUpper === "ARBITRO DE EMERGENCIA" ||
          roleUpper === "COARBITRO" ||
          roleUpper === "CO-ARBITRO"
        ) {
          role = "ARBITRO";
        }

        const validRoles = ["SUPER_ADMIN","ADMIN","CENTER_STAFF","SECRETARIA","ARBITRO","ABOGADO","DEMANDANTE","DEMANDADO","ESTUDIANTE"];
        if (!validRoles.includes(role)) {
          skipped++;
          continue;
        }

        const key = normCodeKey(codeRaw);
        const caseId = caseByCode.get(key);
        if (!caseId) {
          skipped++;
          continue;
        }

        if (DRY) {
          log(`   [DRY] member ${role} ${name} @ ${codeRaw}`);
          continue;
        }

        try {
          // Upsert por caseId + role + displayName (o email)
          const existing = await prisma.caseMember.findFirst({
            where: {
              caseId,
              role: role as any,
              OR: [{ displayName: name }, ...(email ? [{ email }] : [])],
            },
          });
          if (existing) {
            await prisma.caseMember.update({
              where: { id: existing.id },
              data: {
                displayName: name,
                email: email || existing.email,
                phoneE164: phone || existing.phoneE164,
                isPrimary: isPrimary || existing.isPrimary,
                userId: email ? userByEmail.get(email) || existing.userId : existing.userId,
              },
            });
          } else {
            await prisma.caseMember.create({
              data: {
                caseId,
                role: role as any,
                displayName: name,
                email,
                phoneE164: phone,
                isPrimary,
                userId: email ? userByEmail.get(email) || null : null,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! member ${name} @ ${codeRaw}: ${e.message}`);
          skipped++;
        }
      }
      log(`   members: ${created} creados/actualizados, ${skipped} omitidos`);
    });
  }

  // -------------------- 5) ABOGADOS --------------------
  if (want("lawyers")) {
    await run("03_Abogados", async () => {
      const rows = readSheet(wb, "03_Abogados");
      let created = 0,
        skipped = 0;

      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const name = normStr(r.nombre_abogado);
        const email = normEmail(r.email_abogado);
        const representaA = normStr(r.representa_a) || "DEMANDANTE";
        const colegiatura = normStr(r.nro_colegiatura);
        const colegio = normStr(r.colegio_abogados);
        const isPrimary = normBool(r.es_principal, false);
        const notas = normStr(r.notas);

        if (!codeRaw || !name || !email) {
          skipped++;
          continue;
        }
        const key = normCodeKey(codeRaw);
        const caseId = caseByCode.get(key);
        if (!caseId) {
          skipped++;
          continue;
        }

        if (DRY) {
          log(`   [DRY] abogado ${name} → ${representaA} @ ${codeRaw}`);
          continue;
        }

        try {
          // Crear/actualizar user ABOGADO si no existe
          let userId = userByEmail.get(email);
          if (!userId) {
            const u = await prisma.user.create({
              data: {
                email,
                name,
                role: "ABOGADO" as any,
                centerId: center.id,
              },
            });
            userId = u.id;
            userByEmail.set(email, userId);
          }

          // Buscar el CaseMember al que representa (demandante/demandado principal del caso)
          const repRole = representaA.toUpperCase() === "DEMANDADO" ? "DEMANDADO" : "DEMANDANTE";
          const representedMember = await prisma.caseMember.findFirst({
            where: { caseId, role: repRole as any },
            orderBy: { isPrimary: "desc" },
          });

          // CaseLawyer tiene unique (caseId, lawyerId, representationType)
          const repType = repRole; // DEMANDANTE | DEMANDADO
          const existing = await prisma.caseLawyer.findFirst({
            where: {
              caseId,
              lawyerId: userId,
              representationType: repType as any,
            },
          });
          if (existing) {
            await prisma.caseLawyer.update({
              where: { id: existing.id },
              data: {
                representedMemberId: representedMember?.id || existing.representedMemberId,
                caseNumber: colegiatura || existing.caseNumber,
                barAssociation: colegio || existing.barAssociation,
                isLead: isPrimary || existing.isLead,
                notes: notas || existing.notes,
              },
            });
          } else {
            await prisma.caseLawyer.create({
              data: {
                caseId,
                lawyerId: userId,
                representedMemberId: representedMember?.id,
                representationType: repType as any,
                caseNumber: colegiatura,
                barAssociation: colegio,
                isLead: isPrimary,
                notes: notas,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! abogado ${name} @ ${codeRaw}: ${e.message}`);
          skipped++;
        }
      }
      log(`   abogados: ${created} creados/actualizados, ${skipped} omitidos`);
    });
  }

  // -------------------- 6) PLAZOS --------------------
  if (want("deadlines")) {
    await run("05_Plazos", async () => {
      const rows = readSheet(wb, "05_Plazos");
      let created = 0,
        skipped = 0;
      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const title = normStr(r.titulo);
        const descr = normStr(r.descripcion);
        const due = excelDate(r.fecha_vencimiento);
        const tz = normStr(r.zona_horaria) || "America/Lima";
        const completed = normBool(r.completado);
        const completedAt = excelDate(r.fecha_completado);
        if (!codeRaw || !title || !due) {
          skipped++;
          continue;
        }
        const caseId = caseByCode.get(normCodeKey(codeRaw));
        if (!caseId) {
          skipped++;
          continue;
        }
        if (DRY) {
          log(`   [DRY] plazo ${title} @ ${codeRaw}`);
          continue;
        }
        try {
          // Deduplicar por caseId + title
          const existing = await prisma.caseDeadline.findFirst({
            where: { caseId, title },
          });
          if (existing) {
            await prisma.caseDeadline.update({
              where: { id: existing.id },
              data: {
                description: descr,
                dueAt: due,
                timezone: tz,
                isCompleted: completed,
                completedAt: completed ? completedAt || new Date() : null,
              },
            });
          } else {
            await prisma.caseDeadline.create({
              data: {
                caseId,
                title,
                description: descr,
                dueAt: due,
                timezone: tz,
                isCompleted: completed,
                completedAt: completed ? completedAt : null,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! plazo ${title}: ${e.message}`);
          skipped++;
        }
      }
      log(`   plazos: ${created} creados/actualizados, ${skipped} omitidos`);
    });
  }

  // -------------------- 7) AUDIENCIAS --------------------
  if (want("hearings")) {
    await run("06_Audiencias", async () => {
      const rows = readSheet(wb, "06_Audiencias");
      let created = 0,
        skipped = 0;
      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const title = normStr(r.titulo);
        const dt = excelDate(r.fecha_hora);
        const tz = normStr(r.zona_horaria) || "America/Lima";
        const loc = normStr(r.ubicacion);
        const url = normStr(r.enlace_reunion);
        const notas = normStr(r.notas);
        if (!codeRaw || !title || !dt) {
          skipped++;
          continue;
        }
        const caseId = caseByCode.get(normCodeKey(codeRaw));
        if (!caseId) {
          skipped++;
          continue;
        }
        if (DRY) {
          log(`   [DRY] audiencia ${title} @ ${codeRaw}`);
          continue;
        }
        try {
          const existing = await prisma.caseHearing.findFirst({
            where: { caseId, title, hearingAt: dt },
          });
          if (existing) {
            await prisma.caseHearing.update({
              where: { id: existing.id },
              data: { timezone: tz, location: loc, meetingUrl: url, notes: notas },
            });
          } else {
            await prisma.caseHearing.create({
              data: {
                caseId,
                title,
                hearingAt: dt,
                timezone: tz,
                location: loc,
                meetingUrl: url,
                notes: notas,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! audiencia ${title}: ${e.message}`);
          skipped++;
        }
      }
      log(`   audiencias: ${created} creadas/actualizadas, ${skipped} omitidas`);
    });
  }

  // -------------------- 8) NOTAS --------------------
  if (want("notes")) {
    await run("07_Notas", async () => {
      const rows = readSheet(wb, "07_Notas");
      let created = 0,
        skipped = 0;
      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const title = normStr(r.titulo);
        const content = normStr(r.contenido);
        const priv = normBool(r.es_privada, true);
        const authorEmail = normEmail(r.autor_email);
        if (!codeRaw || !content) {
          skipped++;
          continue;
        }
        const caseId = caseByCode.get(normCodeKey(codeRaw));
        if (!caseId) {
          skipped++;
          continue;
        }
        if (DRY) {
          log(`   [DRY] nota @ ${codeRaw}`);
          continue;
        }
        try {
          // Deduplicar por caseId + content (exact match)
          const existing = await prisma.caseNote.findFirst({
            where: { caseId, content },
          });
          if (!existing) {
            await prisma.caseNote.create({
              data: {
                caseId,
                title,
                content,
                isPrivate: priv,
                authorId: authorEmail ? userByEmail.get(authorEmail) || null : null,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! nota: ${e.message}`);
          skipped++;
        }
      }
      log(`   notas: ${created} creadas, ${skipped} omitidas`);
    });
  }

  // -------------------- 9) ÓRDENES DE PAGO --------------------
  if (want("orders")) {
    await run("08_OrdenesPago", async () => {
      const rows = readSheet(wb, "08_OrdenesPago");
      let created = 0,
        skipped = 0;
      // numerador correlativo anual
      const year = new Date().getFullYear();
      let seq = 0;
      const lastOrder = await prisma.paymentOrder.findFirst({
        where: { orderNumber: { startsWith: `OP-${year}-` } },
        orderBy: { orderNumber: "desc" },
      });
      if (lastOrder?.orderNumber) {
        const p = lastOrder.orderNumber.split("-");
        seq = parseInt(p[2] || "0", 10);
      }

      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const concept = normStr(r.concepto) || "OTROS";
        const descr = normStr(r.descripcion) || `Pago por ${concept}`;
        const currency = normStr(r.moneda) || "PEN";
        const amount = normInt(r.monto_centimos);
        const status = (normStr(r.estado) || "PENDING").toUpperCase();
        const due = excelDate(r.fecha_vencimiento);
        const paid = excelDate(r.fecha_pago);
        if (!codeRaw || amount === null) {
          skipped++;
          continue;
        }
        const caseId = caseByCode.get(normCodeKey(codeRaw));
        if (!caseId) {
          skipped++;
          continue;
        }
        if (DRY) {
          log(`   [DRY] orden ${concept} ${amount/100} ${currency} @ ${codeRaw}`);
          continue;
        }
        try {
          // Deduplicar por caseId + concept + amount + dueAt
          const existing = await prisma.paymentOrder.findFirst({
            where: {
              caseId,
              concept: concept as any,
              totalCents: amount,
              ...(due ? { dueAt: due } : {}),
            },
          });
          if (existing) {
            await prisma.paymentOrder.update({
              where: { id: existing.id },
              data: {
                description: descr,
                currency,
                status: status as any,
                paidAt: paid,
              },
            });
          } else {
            seq++;
            const orderNumber = `OP-${year}-${String(seq).padStart(6, "0")}`;
            await prisma.paymentOrder.create({
              data: {
                caseId,
                orderNumber,
                concept: concept as any,
                description: descr,
                amountCents: amount,
                igvCents: 0,
                totalCents: amount,
                currency,
                status: status as any,
                dueAt: due || new Date(Date.now() + 5 * 24 * 3600e3),
                paidAt: paid,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! orden @ ${codeRaw}: ${e.message}`);
          skipped++;
        }
      }
      log(`   órdenes: ${created} creadas/actualizadas, ${skipped} omitidas`);
    });
  }

  // -------------------- 10) PAGOS --------------------
  if (want("payments")) {
    await run("09_Pagos", async () => {
      const rows = readSheet(wb, "09_Pagos");
      let created = 0,
        skipped = 0;
      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const provider = (normStr(r.proveedor) || "MANUAL_VOUCHER").toUpperCase();
        const status = (normStr(r.estado) || "PENDING").toUpperCase();
        const currency = normStr(r.moneda) || "PEN";
        const amount = normInt(r.monto_centimos);
        const concept = normStr(r.concepto) || "OTROS";
        const descr = normStr(r.descripcion);
        const due = excelDate(r.fecha_vencimiento);
        const paid = excelDate(r.fecha_pago);
        if (!codeRaw || amount === null) {
          skipped++;
          continue;
        }
        const caseId = caseByCode.get(normCodeKey(codeRaw));
        if (!caseId) {
          skipped++;
          continue;
        }
        if (DRY) {
          log(`   [DRY] pago ${concept} ${amount/100} ${currency} @ ${codeRaw}`);
          continue;
        }
        try {
          const existing = await prisma.payment.findFirst({
            where: { caseId, concept, amountCents: amount },
          });
          if (existing) {
            await prisma.payment.update({
              where: { id: existing.id },
              data: {
                provider: provider as any,
                status: status as any,
                currency,
                description: descr,
                dueAt: due || existing.dueAt,
                paidAt: paid || existing.paidAt,
              },
            });
          } else {
            await prisma.payment.create({
              data: {
                caseId,
                provider: provider as any,
                status: status as any,
                currency,
                amountCents: amount,
                concept,
                description: descr,
                dueAt: due || new Date(Date.now() + 5 * 24 * 3600e3),
                paidAt: paid,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! pago @ ${codeRaw}: ${e.message}`);
          skipped++;
        }
      }
      log(`   pagos: ${created} creados/actualizados, ${skipped} omitidos`);
    });
  }

  // -------------------- 11) FERIADOS --------------------
  if (want("holidays")) {
    await run("11_Feriados", async () => {
      // header row for this sheet is also 1 but the desc col is a space " "
      const rows = readSheet(wb, "11_Feriados");
      let created = 0,
        skipped = 0;
      for (const r of rows) {
        const date = excelDate(r.fecha);
        const name = normStr(r.nombre);
        const descr = normStr(r.descripcion);
        const isNational = normBool(r.es_nacional, true);
        const recurring = normBool(r.es_recurrente, false);
        if (!date || !name) {
          skipped++;
          continue;
        }
        if (DRY) {
          log(`   [DRY] feriado ${date.toISOString().slice(0,10)} ${name}`);
          continue;
        }
        try {
          const existing = await prisma.holiday.findFirst({
            where: { centerId: center.id, date, name },
          });
          if (!existing) {
            await prisma.holiday.create({
              data: {
                centerId: center.id,
                date,
                name,
                description: descr,
                isNational,
                isRecurring: recurring,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! feriado ${name}: ${e.message}`);
          skipped++;
        }
      }
      log(`   feriados: ${created} creados, ${skipped} omitidos`);
    });
  }

  // -------------------- 12) EMERGENCIAS --------------------
  if (want("emergencies")) {
    await run("17_Emergencias", async () => {
      const rows = readSheet(wb, "17_Emergencias");
      let created = 0, skipped = 0;
      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const num = normStr(r.numero_solicitud);
        const nombreSol = normStr(r.nombre_solicitante);
        const emailSol = normEmail(r.email_solicitante);
        const title = normStr(r.titulo);
        const descr = normStr(r.descripcion);
        const just = normStr(r.justificacion_urgencia);
        const medidas = normStr(r.medidas_solicitadas);
        const estado = (normStr(r.estado) || "REQUESTED").toUpperCase();
        const fSol = excelDate(r.fecha_solicitud) || new Date();
        const arbEmail = normEmail(r.arbitro_emergencia_email);
        const fDes = excelDate(r.fecha_designacion);
        const resol = normStr(r.resolucion);
        const fResol = excelDate(r.fecha_resolucion);
        if (!codeRaw || !num) { skipped++; continue; }
        const caseId = caseByCode.get(normCodeKey(codeRaw));
        if (!caseId) { skipped++; continue; }
        if (DRY) { log(`   [DRY] emergencia ${num}`); continue; }
        try {
          const arbId = arbEmail ? userByEmail.get(arbEmail) || null : null;
          // requesterId es requerido - si hay email del solicitante, buscar user
          const reqUserId = emailSol ? userByEmail.get(emailSol) : null;
          if (!reqUserId) { skipped++; continue; } // no podemos crear sin requesterId
          const existing = await prisma.emergencyRequest.findFirst({
            where: { requestNumber: num },
          });
          if (existing) {
            await prisma.emergencyRequest.update({
              where: { id: existing.id },
              data: {
                status: estado as any,
                emergencyArbitratorId: arbId,
                arbitratorDesignatedAt: fDes,
                resolution: resol,
                resolvedAt: fResol,
              },
            });
          } else {
            // verificationDueAt es requerido: default 2 días desde requestedAt
            const verifDue = new Date(fSol.getTime() + 2 * 24 * 3600e3);
            await prisma.emergencyRequest.create({
              data: {
                caseId,
                centerId: center.id,
                requestNumber: num,
                requesterId: reqUserId,
                requesterName: nombreSol || "Desconocido",
                requesterEmail: emailSol || "desconocido@caardpe.com",
                title: title || num,
                description: descr || "",
                urgencyJustification: just || "",
                requestedMeasures: medidas || "",
                status: estado as any,
                requestedAt: fSol,
                verificationDueAt: verifDue,
                emergencyArbitratorId: arbId,
                arbitratorDesignatedAt: fDes,
                resolution: resol,
                resolvedAt: fResol,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! emergencia ${num}: ${e.message}`);
          skipped++;
        }
      }
      log(`   emergencias: ${created} ok, ${skipped} omitidas`);
    });
  }

  // -------------------- 13) RECUSACIONES --------------------
  if (want("recusations")) {
    await run("18_Recusaciones", async () => {
      const rows = readSheet(wb, "18_Recusaciones");
      let created = 0, skipped = 0;
      for (const r of rows) {
        const codeRaw = normCaseCode(r.codigo_caso);
        const emailArb = normEmail(r.email_arbitro_recusado);
        const emailSol = normEmail(r.email_solicitante);
        const rolSol = normStr(r.rol_solicitante) || "DEMANDANTE";
        const motivo = normStr(r.motivo);
        const docs = normStr(r.documentos_soporte);
        const estado = (normStr(r.estado) || "FILED").toUpperCase();
        const fPres = excelDate(r.fecha_presentacion) || new Date();
        const resp = normStr(r.respuesta_arbitro);
        const dec = normStr(r.decision_consejo);
        const fRes = excelDate(r.fecha_resolucion);
        if (!codeRaw || !emailArb || !motivo) { skipped++; continue; }
        const caseId = caseByCode.get(normCodeKey(codeRaw));
        if (!caseId) { skipped++; continue; }
        const arbUserId = userByEmail.get(emailArb);
        if (!arbUserId) { skipped++; continue; }
        const reg = await prisma.arbitratorRegistry.findFirst({
          where: { userId: arbUserId },
        });
        if (!reg) { skipped++; continue; }
        if (DRY) { log(`   [DRY] recusación ${emailArb} @ ${codeRaw}`); continue; }
        try {
          // requesterId requerido: resolver por email del solicitante
          const reqUserId = emailSol ? userByEmail.get(emailSol) : null;
          if (!reqUserId) { skipped++; continue; }
          const existing = await prisma.recusation.findFirst({
            where: { caseId, arbitratorId: reg.id, reason: motivo },
          });
          if (!existing) {
            await prisma.recusation.create({
              data: {
                caseId,
                arbitratorId: reg.id,
                requesterId: reqUserId,
                requesterRole: rolSol as any,
                reason: motivo,
                supportingDocuments: docs ? [docs] : [],
                status: estado as any,
                filedAt: fPres,
                arbitratorResponse: resp,
                councilDecision: dec,
                resolvedAt: fRes,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! recusación: ${e.message}`);
          skipped++;
        }
      }
      log(`   recusaciones: ${created} creadas, ${skipped} omitidas`);
    });
  }

  // -------------------- 14) SANCIONES --------------------
  if (want("sanctions")) {
    await run("19_SancionesArbitros", async () => {
      const rows = readSheet(wb, "19_SancionesArbitros");
      let created = 0, skipped = 0;
      for (const r of rows) {
        const email = normEmail(r.email_arbitro);
        const tipo = (normStr(r.tipo) || "WARNING").toUpperCase();
        const motivo = normStr(r.motivo);
        const nro = normStr(r.nro_resolucion);
        const fIni = excelDate(r.fecha_inicio) || new Date();
        const fFin = excelDate(r.fecha_fin);
        const bloquea = normBool(r.bloquea_nuevos_casos, false);
        const remueve = normBool(r.remueve_de_activos, false);
        if (!email || !motivo) { skipped++; continue; }
        const userId = userByEmail.get(email);
        if (!userId) { skipped++; continue; }
        const reg = await prisma.arbitratorRegistry.findFirst({ where: { userId } });
        if (!reg) { skipped++; continue; }
        if (DRY) { log(`   [DRY] sanción ${tipo} ${email}`); continue; }
        try {
          const existing = await prisma.arbitratorSanction.findFirst({
            where: { arbitratorId: reg.id, reason: motivo, type: tipo as any },
          });
          if (!existing) {
            await prisma.arbitratorSanction.create({
              data: {
                arbitratorId: reg.id,
                type: tipo as any,
                reason: motivo,
                resolutionNumber: nro,
                startDate: fIni,
                endDate: fFin,
                blocksNewAssignments: bloquea,
                removesFromActiveCases: remueve,
              },
            });
            created++;
          }
        } catch (e: any) {
          log(`   ! sanción ${email}: ${e.message}`);
          skipped++;
        }
      }
      log(`   sanciones: ${created} creadas, ${skipped} omitidas`);
    });
  }

  log("\n✅ Import completo.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await prisma.$disconnect();
  process.exit(1);
});
