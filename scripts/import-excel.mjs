/**
 * Importa los dos Excel de CAARD a la BD.
 * Uso: node scripts/import-excel.mjs [ruta-al-xlsx]
 *
 * - Idempotente: upsert por llaves únicas (email, code, etc.)
 * - Si se pasan dos archivos, se combinan (el segundo sobreescribe el primero)
 * - Fija administracion@caardpe.com con los datos correctos del Excel
 */
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FILES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (1).xlsx",
      "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (2).xlsx",
    ];

// --- Utilidades ---

function parseFile(file) {
  const wb = XLSX.read(fs.readFileSync(file), { type: "buffer", cellDates: true });
  const out = {};
  for (const sn of wb.SheetNames) {
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: null, raw: false });
    // raw[0] = descripción grande, raw[1] = null row, raw[2] = sub-headers, raw[3..] = data
    const subHeaders = raw[2] || [];
    const dataRows = raw.slice(3).filter((r) => r && r.some((c) => c !== null && c !== ""));
    // Convertir cada fila en objeto usando subHeaders
    const objRows = dataRows.map((r) => {
      const o = {};
      subHeaders.forEach((h, i) => {
        if (!h) return;
        const key = String(h).replace(/\*$/, "").trim();
        o[key] = r[i] !== null && r[i] !== "" ? r[i] : null;
      });
      return o;
    });
    out[sn] = objRows;
  }
  return out;
}

function toBool(v) {
  if (v === null || v === undefined) return false;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "sí" || s === "si" || s === "1" || s === "yes";
}

function parseMoneyToCents(v) {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(/S\/|USD|\$/gi, "").replace(/\s/g, "").replace(/,/g, "").trim();
  // Formato típico: "7508382.30" o "500" (ya en céntimos si es plano sin punto)
  // Si hay punto, asumir decimales → multiplicar por 100
  // Si NO hay punto y el valor viene de monto_centimos, es céntimos directos
  if (s.includes(".")) {
    return Math.round(parseFloat(s) * 100);
  }
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  // Formatos: YYYY-MM-DD, YYYY-MM-DDTHH:MM, MM/DD/YY, MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s)) {
    const [m, d, y] = s.split("/").map(Number);
    const year = y < 100 ? 2000 + y : y;
    const dt = new Date(year, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

function normalizeEmail(e) {
  if (!e) return null;
  return String(e).toLowerCase().trim();
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function normalizeCaseCode(c) {
  if (!c) return null;
  let s = String(c).trim();
  // Algunos vienen sin el prefijo "Exp. "
  if (!s.toUpperCase().startsWith("EXP.")) {
    s = `Exp. ${s}`;
  }
  return s;
}

function parseCaseYear(code) {
  const m = String(code || "").match(/(\d{3,4})-(\d{4})/);
  return m ? parseInt(m[2], 10) : null;
}

function parseCaseSeq(code) {
  const m = String(code || "").match(/(\d{1,4})-\d{4}/);
  return m ? parseInt(m[1], 10) : null;
}

// --- Merge: fichero 2 sobreescribe al 1 para rows que existen en ambos ---
function mergeFiles(parsed) {
  // Simple: concatenar todas las filas y dejar que upsert resuelva.
  const merged = {};
  for (const file of parsed) {
    for (const [sheet, rows] of Object.entries(file)) {
      if (!merged[sheet]) merged[sheet] = [];
      merged[sheet].push(...rows);
    }
  }
  return merged;
}

// --- Import ---

async function main() {
  console.log("📖 Leyendo archivos...");
  const parsed = FILES.map((f) => {
    console.log(`  - ${path.basename(f)}`);
    return parseFile(f);
  });
  const data = mergeFiles(parsed);

  // Obtener o crear el center CAARD
  let center = await prisma.center.findFirst({
    where: { OR: [{ code: "CAARD" }, { name: { contains: "CAARD", mode: "insensitive" } }] },
  });
  if (!center) {
    center = await prisma.center.create({
      data: {
        code: "CAARD",
        name: "Centro de Administración de Arbitrajes y Resolución de Disputas",
        isActive: true,
      },
    });
    console.log(`✅ Centro creado: ${center.id}`);
  } else {
    console.log(`✅ Centro existente: ${center.name} (${center.id})`);
  }

  // Obtener ArbitrationType default (REGULAR o primero)
  let arbType = await prisma.arbitrationType.findFirst({
    where: { centerId: center.id, code: "REGULAR" },
  });
  if (!arbType) {
    arbType = await prisma.arbitrationType.findFirst({ where: { centerId: center.id } });
  }
  if (!arbType) {
    arbType = await prisma.arbitrationType.create({
      data: {
        centerId: center.id,
        code: "REGULAR",
        name: "Arbitraje Regular",
        kind: "INSTITUTIONAL",
        tribunalMode: "SOLE_ARBITRATOR",
      },
    });
    console.log(`✅ ArbitrationType creado: ${arbType.id}`);
  }

  // ============ 10_Usuarios ============
  console.log("\n👥 Importando usuarios...");
  const users = (data["10_Usuarios"] || []).filter((u) => u.email && u.nombre);
  let uCreated = 0, uUpdated = 0, uSkipped = 0;
  const userByEmail = new Map();
  for (const u of users) {
    const email = normalizeEmail(u.email);
    if (!email) {
      uSkipped++;
      continue;
    }
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      const data = {
        name: u.nombre,
        phoneE164: u.telefono || null,
        role: u.rol || "DEMANDANTE",
        isActive: u.activo === null ? true : toBool(u.activo),
        centerId: center.id,
      };
      if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data });
        userByEmail.set(email, existing.id);
        uUpdated++;
      } else {
        const created = await prisma.user.create({
          data: { email, ...data },
        });
        userByEmail.set(email, created.id);
        uCreated++;
      }
    } catch (e) {
      console.error(`  ❌ usuario ${email}: ${e.message}`);
      uSkipped++;
    }
  }
  console.log(`  ✅ ${uCreated} creados · ${uUpdated} actualizados · ${uSkipped} saltados`);

  // ============ 04_Arbitros ============
  console.log("\n⚖️  Importando árbitros...");
  const arbitros = (data["04_Arbitros"] || []).filter((a) => a.email && a.nombre);
  let aCreated = 0, aUpdated = 0, aSkipped = 0;
  for (const a of arbitros) {
    const email = normalizeEmail(a.email);
    if (!email) {
      aSkipped++;
      continue;
    }
    try {
      // Upsert User primero
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: a.nombre,
            phoneE164: a.telefono || null,
            role: "ARBITRO",
            isActive: true,
            centerId: center.id,
          },
        });
      } else if (user.role !== "ARBITRO" && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
        // Solo promover a ARBITRO si el rol actual es más bajo
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ARBITRO" },
        });
      }
      // Upsert ArbitratorRegistry
      const especialidades = a.especialidades
        ? String(a.especialidades).split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const registryData = {
        centerId: center.id,
        userId: user.id,
        status: a.estado && a.estado !== "" ? a.estado : "ACTIVE",
        barNumber: a.nro_colegiatura || null,
        barAssociation: a.colegio_abogados || null,
        specializations: especialidades,
        maxConcurrentCases: a["max_casos_simultáneos"] ? parseInt(a["max_casos_simultáneos"]) : 10,
        acceptsEmergency: a.acepta_emergencia === null ? true : toBool(a.acepta_emergencia),
        notes: a.notas || null,
      };
      const existingReg = await prisma.arbitratorRegistry.findUnique({ where: { userId: user.id } });
      if (existingReg) {
        await prisma.arbitratorRegistry.update({
          where: { id: existingReg.id },
          data: registryData,
        });
        aUpdated++;
      } else {
        await prisma.arbitratorRegistry.create({ data: registryData });
        aCreated++;
      }
    } catch (e) {
      console.error(`  ❌ árbitro ${email}: ${e.message}`);
      aSkipped++;
    }
  }
  console.log(`  ✅ ${aCreated} creados · ${aUpdated} actualizados · ${aSkipped} saltados`);

  // ============ 01_Expedientes ============
  console.log("\n📁 Importando expedientes...");
  const cases = (data["01_Expedientes"] || []).filter((c) => c.codigo);
  let cCreated = 0, cUpdated = 0, cSkipped = 0;
  const caseByCode = new Map();
  for (const c of cases) {
    const code = normalizeCaseCode(c.codigo);
    if (!code) {
      cSkipped++;
      continue;
    }
    try {
      const caseData = {
        centerId: center.id,
        arbitrationTypeId: arbType.id,
        code,
        year: parseCaseYear(code) || (c["año"] ? parseInt(c["año"]) : new Date().getFullYear()),
        sequence: c.secuencia ? parseInt(c.secuencia) : parseCaseSeq(code) || 0,
        title: c.titulo || null,
        status: c.estado || "DRAFT",
        scope: c.ambito || "NACIONAL",
        procedureType: c.tipo_procedimiento || "REGULAR",
        tribunalMode: c.composicion_arbitral || "SOLE_ARBITRATOR",
        currentStage: c.etapa_actual || null,
        isBlocked: toBool(c.bloqueado),
        blockReason: c.motivo_bloqueo || null,
        disputeAmountCents: BigInt(parseMoneyToCents(c.cuantia_centimos)),
        currency: c.moneda || "PEN",
        claimantName: c.demandante || null,
        respondentName: c.demandado || null,
        submittedAt: parseDate(c.fecha_presentacion),
        admittedAt: parseDate(c.fecha_admision),
        closedAt: parseDate(c.fecha_cierre),
        durationDays: c.duracion_dias ? parseInt(c.duracion_dias) : null,
        durationText: c.duracion_texto || null,
        hasCouncil: c.consejo_superior ? toBool(c.consejo_superior) : null,
        centerFeeCents: c.gastos_centro_centimos ? BigInt(parseMoneyToCents(c.gastos_centro_centimos)) : null,
        taxCents: c.tasa_centimos ? BigInt(parseMoneyToCents(c.tasa_centimos)) : null,
        totalAdminFeeCents: c.total_admin_centimos ? BigInt(parseMoneyToCents(c.total_admin_centimos)) : null,
        relatedMainCaseCode: c.caso_principal_emergencia || null,
        driveFolderId: c.carpeta_drive_id || null,
      };
      const existing = await prisma.case.findUnique({ where: { code } });
      if (existing) {
        await prisma.case.update({ where: { id: existing.id }, data: caseData });
        caseByCode.set(code, existing.id);
        cUpdated++;
      } else {
        const created = await prisma.case.create({ data: caseData });
        caseByCode.set(code, created.id);
        cCreated++;
      }
    } catch (e) {
      console.error(`  ❌ caso ${code}: ${e.message}`);
      cSkipped++;
    }
  }
  console.log(`  ✅ ${cCreated} creados · ${cUpdated} actualizados · ${cSkipped} saltados`);

  // ============ 02_Miembros ============
  console.log("\n🧑 Importando miembros de casos...");
  const members = (data["02_Miembros"] || []).filter((m) => m.codigo_caso && m.nombre_completo);
  let mCreated = 0, mUpdated = 0, mSkipped = 0;
  for (const m of members) {
    const code = normalizeCaseCode(m.codigo_caso);
    const caseId = caseByCode.get(code) || (await prisma.case.findUnique({ where: { code }, select: { id: true } }))?.id;
    if (!caseId) {
      mSkipped++;
      continue;
    }
    const email = normalizeEmail(m.email);
    try {
      // Buscar usuario si hay email
      let userId = null;
      if (email) {
        const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        userId = u?.id || null;
      }
      const memberData = {
        caseId,
        role: m.rol,
        displayName: m.nombre_completo,
        email: email,
        phoneE164: m.telefono_e164 || null,
        isPrimary: toBool(m.es_principal),
        userId,
      };
      // Buscar existing member por (caseId, email) o (caseId, displayName, role)
      let existing = null;
      if (email) {
        existing = await prisma.caseMember.findFirst({
          where: { caseId, email },
        });
      }
      if (!existing) {
        existing = await prisma.caseMember.findFirst({
          where: { caseId, displayName: m.nombre_completo, role: m.rol },
        });
      }
      if (existing) {
        await prisma.caseMember.update({ where: { id: existing.id }, data: memberData });
        mUpdated++;
      } else {
        await prisma.caseMember.create({ data: memberData });
        mCreated++;
      }
    } catch (e) {
      console.error(`  ❌ miembro ${m.nombre_completo} en ${code}: ${e.message}`);
      mSkipped++;
    }
  }
  console.log(`  ✅ ${mCreated} creados · ${mUpdated} actualizados · ${mSkipped} saltados`);

  // ============ 05_Plazos ============
  console.log("\n⏰ Importando plazos...");
  const plazos = (data["05_Plazos"] || []).filter((p) => p.codigo_caso && p.titulo);
  let pCreated = 0, pSkipped = 0;
  for (const p of plazos) {
    const code = normalizeCaseCode(p.codigo_caso);
    const caseId = caseByCode.get(code) || (await prisma.case.findUnique({ where: { code }, select: { id: true } }))?.id;
    if (!caseId) {
      pSkipped++;
      continue;
    }
    try {
      const dueAt = parseDate(p.fecha_vencimiento);
      if (!dueAt) {
        pSkipped++;
        continue;
      }
      // Evitar duplicados: buscar por caseId+title+dueAt
      const existing = await prisma.caseDeadline.findFirst({
        where: { caseId, title: p.titulo, dueAt },
      });
      if (existing) continue;
      await prisma.caseDeadline.create({
        data: {
          caseId,
          title: p.titulo,
          description: p.descripcion || null,
          dueAt,
          timezone: p.zona_horaria || "America/Lima",
          isCompleted: toBool(p.completado),
          completedAt: parseDate(p.fecha_completado),
        },
      });
      pCreated++;
    } catch (e) {
      console.error(`  ❌ plazo en ${code}: ${e.message}`);
      pSkipped++;
    }
  }
  console.log(`  ✅ ${pCreated} creados · ${pSkipped} saltados`);

  // ============ 06_Audiencias ============
  console.log("\n🗣️  Importando audiencias...");
  const audiencias = (data["06_Audiencias"] || []).filter((h) => h.codigo_caso && h.titulo);
  let hCreated = 0, hSkipped = 0;
  for (const h of audiencias) {
    const code = normalizeCaseCode(h.codigo_caso);
    const caseId = caseByCode.get(code) || (await prisma.case.findUnique({ where: { code }, select: { id: true } }))?.id;
    if (!caseId) {
      hSkipped++;
      continue;
    }
    try {
      const hearingAt = parseDate(h.fecha_hora);
      if (!hearingAt) {
        hSkipped++;
        continue;
      }
      // Evitar duplicados
      const existing = await prisma.caseHearing.findFirst({
        where: { caseId, title: h.titulo, hearingAt },
      });
      if (existing) continue;
      await prisma.caseHearing.create({
        data: {
          caseId,
          title: h.titulo,
          hearingAt,
          timezone: h.zona_horaria || "America/Lima",
          location: h.ubicacion || null,
          meetingUrl: h.enlace_reunion || null,
          notes: h.notas || null,
        },
      });
      hCreated++;
    } catch (e) {
      console.error(`  ❌ audiencia en ${code}: ${e.message}`);
      hSkipped++;
    }
  }
  console.log(`  ✅ ${hCreated} creados · ${hSkipped} saltados`);

  // ============ 08_OrdenesPago ============
  console.log("\n💰 Importando órdenes de pago...");
  const ordenes = (data["08_OrdenesPago"] || []).filter(
    (o) => o.codigo_caso && o.concepto && o.monto_centimos
  );
  let opCreated = 0, opSkipped = 0;
  for (const o of ordenes) {
    const code = normalizeCaseCode(o.codigo_caso);
    const caseId = caseByCode.get(code) || (await prisma.case.findUnique({ where: { code }, select: { id: true } }))?.id;
    if (!caseId) {
      opSkipped++;
      continue;
    }
    try {
      const amount = parseMoneyToCents(o.monto_centimos);
      // Generar orderNumber único si no se provee
      const year = new Date().getFullYear();
      const last = await prisma.paymentOrder.findFirst({
        where: { orderNumber: { startsWith: `OP-${year}-` } },
        orderBy: { orderNumber: "desc" },
      });
      let seq = 1;
      if (last?.orderNumber) {
        const parts = last.orderNumber.split("-");
        seq = parseInt(parts[2] || "0") + 1;
      }
      const orderNumber = `OP-${year}-${seq.toString().padStart(6, "0")}`;

      // Evitar duplicar si ya existe una igual
      const existing = await prisma.paymentOrder.findFirst({
        where: { caseId, concept: o.concepto, totalCents: amount, description: o.descripcion || undefined },
      });
      if (existing) continue;

      await prisma.paymentOrder.create({
        data: {
          caseId,
          orderNumber,
          concept: o.concepto,
          description: o.descripcion || `${o.concepto}`,
          amountCents: amount,
          igvCents: 0,
          totalCents: amount,
          currency: o.moneda || "PEN",
          status: o.estado || "PENDING",
          dueAt: parseDate(o.fecha_vencimiento),
          paidAt: parseDate(o.fecha_pago),
        },
      });
      opCreated++;
    } catch (e) {
      console.error(`  ❌ orden en ${code}: ${e.message}`);
      opSkipped++;
    }
  }
  console.log(`  ✅ ${opCreated} creados · ${opSkipped} saltados`);

  // ============ 11_Feriados ============
  console.log("\n🎉 Importando feriados...");
  const feriados = (data["11_Feriados"] || []).filter((h) => h.fecha && h.nombre);
  let fCreated = 0, fSkipped = 0;
  for (const h of feriados) {
    try {
      const date = parseDate(h.fecha);
      if (!date) {
        fSkipped++;
        continue;
      }
      const centerIdForHoliday = toBool(h.es_nacional) ? null : center.id;
      const existing = await prisma.holiday.findFirst({
        where: { date, centerId: centerIdForHoliday },
      });
      if (existing) continue;
      await prisma.holiday.create({
        data: {
          date,
          centerId: centerIdForHoliday,
          name: h.nombre,
          description: h.descripcion || null,
          isNational: h.es_nacional === null ? true : toBool(h.es_nacional),
          isRecurring: h.es_recurrente === null ? false : toBool(h.es_recurrente),
        },
      });
      fCreated++;
    } catch (e) {
      console.error(`  ❌ feriado: ${e.message}`);
      fSkipped++;
    }
  }
  console.log(`  ✅ ${fCreated} creados · ${fSkipped} saltados`);

  // ============ Arreglar administracion@caardpe.com ============
  console.log("\n🔧 Corrigiendo administracion@caardpe.com...");
  try {
    const fromExcel = users.find((u) => normalizeEmail(u.email) === "administracion@caardpe.com");
    if (fromExcel) {
      const user = await prisma.user.findUnique({
        where: { email: "administracion@caardpe.com" },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: fromExcel.nombre,
            phoneE164: fromExcel.telefono || null,
            role: fromExcel.rol || "ADMIN",
            isActive: true,
          },
        });
        console.log(`  ✅ Actualizado: ${fromExcel.nombre} (${fromExcel.rol})`);
      } else {
        await prisma.user.create({
          data: {
            email: "administracion@caardpe.com",
            name: fromExcel.nombre,
            phoneE164: fromExcel.telefono || null,
            role: fromExcel.rol || "ADMIN",
            isActive: true,
            centerId: center.id,
          },
        });
        console.log(`  ✅ Creado: ${fromExcel.nombre} (${fromExcel.rol})`);
      }
    } else {
      console.log("  ⚠️  No encontrado en el Excel");
    }
  } catch (e) {
    console.error(`  ❌ error: ${e.message}`);
  }

  // ============ Conteos finales ============
  console.log("\n📊 Conteos finales:");
  console.log(`  Users:            ${await prisma.user.count()}`);
  console.log(`  Arbitrators:      ${await prisma.arbitratorRegistry.count()}`);
  console.log(`  Cases:            ${await prisma.case.count()}`);
  console.log(`  CaseMembers:      ${await prisma.caseMember.count()}`);
  console.log(`  Deadlines:        ${await prisma.caseDeadline.count()}`);
  console.log(`  Hearings:         ${await prisma.caseHearing.count()}`);
  console.log(`  PaymentOrders:    ${await prisma.paymentOrder.count()}`);
  console.log(`  Holidays:         ${await prisma.holiday.count()}`);

  await prisma.$disconnect();
  console.log("\n✅ Import completo");
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await prisma.$disconnect();
  process.exit(1);
});
