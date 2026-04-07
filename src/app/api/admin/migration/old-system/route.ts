/**
 * CAARD - Migración del sistema viejo /v2
 * POST /api/admin/migration/old-system - Sube SQL y migra expedientes/documentos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const PDF_BASE_URL = "https://old.caardpe.com/v2/files/";

interface OldExpediente {
  id: number;
  nro_exp: string;
  nombre_usuario: string;
  code_usuario: string;
  status: number;
}

interface OldDetalle {
  id: number;
  idExp: number;
  idTipo: number;
  titulo: string;
  file: string;
  status: number;
}

function parseSqlInserts(sql: string, tableName: string): any[][] {
  const escapedTable = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `INSERT INTO \`${escapedTable}\`[^;]*?VALUES\\s*([\\s\\S]*?);`,
    "g"
  );
  const matches = sql.matchAll(pattern);
  const rows: any[][] = [];

  for (const match of matches) {
    const valuesText = match[1];
    const tuplePattern = /\(((?:[^()']|'(?:[^'\\]|\\.)*')*)\)/g;
    const tupleMatches = valuesText.matchAll(tuplePattern);

    for (const tupleMatch of tupleMatches) {
      rows.push(parseValues(tupleMatch[1]));
    }
  }
  return rows;
}

function parseValues(text: string): any[] {
  const values: any[] = [];
  let current = "";
  let inString = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\" && i + 1 < text.length) {
        current += text[i + 1];
        i += 2;
        continue;
      }
      if (ch === "'") {
        inString = false;
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    }
    if (ch === "'") {
      inString = true;
      i++;
      continue;
    }
    if (ch === ",") {
      values.push(parseValue(current.trim()));
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  if (current.trim()) values.push(parseValue(current.trim()));
  return values;
}

function parseValue(v: string): any {
  if (v === "NULL") return null;
  if (/^-?\d+$/.test(v)) return parseInt(v);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

function normalizeCode(raw: string): string {
  return raw
    .replace(/EXPEDIENTE\s*N[°º]?\s*/i, "")
    .replace(/-CAARD$/i, "/CAARD")
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("sqlFile") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo SQL" }, { status: 400 });
    }

    const sql = await file.text();

    // Parse expedientes
    const expRows = parseSqlInserts(sql, "expedientes");
    const expedientes: OldExpediente[] = expRows.map((r) => ({
      id: r[0],
      nro_exp: r[1] || "",
      nombre_usuario: r[2] || "",
      code_usuario: r[3] || "",
      status: r[4],
    }));

    // Parse detalles
    const detRows = parseSqlInserts(sql, "expedientes_detalle");
    const detalles: OldDetalle[] = detRows.map((r) => ({
      id: r[0],
      idExp: r[1],
      idTipo: r[2],
      titulo: r[3] || "",
      file: r[4] || "",
      status: r[5],
    }));

    if (expedientes.length === 0 && detalles.length === 0) {
      return NextResponse.json({
        error: "El SQL no contiene tablas 'expedientes' ni 'expedientes_detalle'",
      }, { status: 400 });
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) return NextResponse.json({ error: "Centro no encontrado" }, { status: 500 });

    const author = await prisma.user.findFirst({
      where: { email: session.user.email || "" },
    });
    if (!author) return NextResponse.json({ error: "Autor no encontrado" }, { status: 500 });

    // Get all current cases for matching
    const allCases = await prisma.case.findMany({
      select: { id: true, code: true },
    });

    const caseByCode = new Map<string, string>();
    for (const c of allCases) {
      const normalized = normalizeCode(c.code);
      caseByCode.set(normalized, c.id);
      const noExp = normalized.replace(/^EXP\.?/, "").trim();
      caseByCode.set(noExp, c.id);
    }

    const expIdToCaseId = new Map<number, string>();
    let matched = 0;
    let createdCases = 0;
    let usersCreated = 0;

    const arbType = await prisma.arbitrationType.findFirst({
      where: { centerId: center.id, code: "SOLICITUD_ARBITRAJE" },
    });

    // Process expedientes
    for (const exp of expedientes) {
      const normalized = normalizeCode(exp.nro_exp);
      let caseId = caseByCode.get(normalized);

      if (!caseId) {
        const noCaard = normalized.replace(/\/CAARD$/, "");
        caseId = caseByCode.get(noCaard) || caseByCode.get(noCaard + "/CAARD");
      }

      if (caseId) {
        expIdToCaseId.set(exp.id, caseId);
        matched++;
      } else if (arbType) {
        // Create new case for orphan
        try {
          const yearMatch = exp.nro_exp.match(/(\d{4})/);
          const seqMatch = exp.nro_exp.match(/(\d{1,3})-/);
          const year = yearMatch ? parseInt(yearMatch[1]) : 2022;
          const sequence = seqMatch ? parseInt(seqMatch[1]) : 0;

          const newCase = await prisma.case.create({
            data: {
              centerId: center.id,
              arbitrationTypeId: arbType.id,
              year,
              sequence,
              code: `Exp. ${normalized}`,
              title: `Expediente ${exp.nro_exp}`,
              status: "ARCHIVED",
              scope: "NACIONAL",
              procedureType: "REGULAR",
              tribunalMode: "TRIBUNAL_3",
              claimantName: exp.nombre_usuario || "Por completar",
              respondentName: "Por completar",
              currency: "PEN",
              isBlocked: true,
              blockReason: "Migrado del sistema viejo - faltan datos",
            },
          });
          expIdToCaseId.set(exp.id, newCase.id);
          createdCases++;
        } catch {
          continue;
        }
      }

      // Create access for client (using their original code as password)
      const finalCaseId = expIdToCaseId.get(exp.id);
      if (finalCaseId && exp.nombre_usuario && exp.code_usuario) {
        const cleanUsername = exp.nombre_usuario.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        if (cleanUsername.length > 3) {
          const userEmail = `${cleanUsername}@cliente.caard.pe`;
          try {
            const clientPasswordHash = await bcrypt.hash(exp.code_usuario, 12);
            const user = await prisma.user.upsert({
              where: { email: userEmail },
              update: { passwordHash: clientPasswordHash },
              create: {
                email: userEmail,
                name: exp.nombre_usuario,
                role: "DEMANDANTE",
                centerId: center.id,
                passwordHash: clientPasswordHash,
                isActive: true,
              },
            });

            const existingMember = await prisma.caseMember.findFirst({
              where: { caseId: finalCaseId, userId: user.id },
            });
            if (!existingMember) {
              await prisma.caseMember.create({
                data: {
                  caseId: finalCaseId,
                  userId: user.id,
                  role: "DEMANDANTE",
                  displayName: exp.nombre_usuario,
                  email: userEmail,
                  isPrimary: false,
                },
              });
              usersCreated++;
            }
          } catch {}
        }
      }
    }

    // Process documents
    let docsCreated = 0;
    let docsSkipped = 0;
    const folderCache = new Map<string, string>();

    for (const det of detalles) {
      if (!det.file) {
        docsSkipped++;
        continue;
      }

      const caseId = expIdToCaseId.get(det.idExp);
      if (!caseId) {
        docsSkipped++;
        continue;
      }

      const folderKey = det.idTipo === 1 ? "escritos" : "resoluciones";
      const cacheKey = `${caseId}-${folderKey}`;
      let folderId = folderCache.get(cacheKey);

      if (!folderId) {
        let folder = await prisma.caseFolder.findFirst({
          where: { caseId, key: folderKey },
        });
        if (!folder) {
          folder = await prisma.caseFolder.create({
            data: {
              caseId,
              key: folderKey,
              name: det.idTipo === 1 ? "Escritos" : "Resoluciones",
            },
          });
        }
        folderId = folder.id;
        folderCache.set(cacheKey, folderId);
      }

      const fileUrl = PDF_BASE_URL + det.file;
      const docTitle = det.titulo || (det.idTipo === 1 ? "Escrito" : "Resolución");

      try {
        await prisma.caseDocument.create({
          data: {
            caseId,
            folderId,
            uploadedById: author.id,
            documentType: det.idTipo === 1 ? "Escrito" : "Resolución",
            description: docTitle,
            originalFileName: docTitle ? `${docTitle}.pdf` : det.file,
            storedFileName: det.file,
            mimeType: "application/pdf",
            sizeBytes: BigInt(0),
            checksumSha256: `migrated-${det.id}`,
            driveFileId: `migrated-${det.id}`,
            driveWebViewLink: fileUrl,
            driveDownloadLink: fileUrl,
            status: det.status === 1 ? "ACTIVE" : "REPLACED",
          },
        });
        docsCreated++;
      } catch {
        docsSkipped++;
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        centerId: center.id,
        userId: author.id,
        action: "CREATE",
        entity: "Migration",
        meta: {
          source: "old_system_v2",
          expedientes: expedientes.length,
          documentos: detalles.length,
          matched,
          createdCases,
          docsCreated,
          usersCreated,
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalExpedientes: expedientes.length,
        totalDocumentos: detalles.length,
        casosVinculados: matched,
        casosNuevos: createdCases,
        documentosCreados: docsCreated,
        documentosOmitidos: docsSkipped,
        usuariosCreados: usersCreated,
      },
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message || "Error en migración" },
      { status: 500 }
    );
  }
}
