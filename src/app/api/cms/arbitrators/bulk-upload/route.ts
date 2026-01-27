/**
 * CAARD - API para carga masiva de árbitros desde Excel
 * POST: Procesa un archivo Excel y crea árbitros
 *
 * Columnas esperadas en el Excel:
 * - nombre (requerido)
 * - email (requerido)
 * - telefono
 * - colegio_abogados
 * - numero_colegiatura
 * - especialidades (separadas por coma)
 * - acepta_emergencia (si/no)
 * - estado (activo/inactivo)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

interface ArbitratorRow {
  nombre?: string;
  name?: string;
  email?: string;
  correo?: string;
  telefono?: string;
  phone?: string;
  colegio_abogados?: string;
  bar_association?: string;
  numero_colegiatura?: string;
  bar_number?: string;
  especialidades?: string;
  specializations?: string;
  acepta_emergencia?: string;
  accepts_emergency?: string;
  estado?: string;
  status?: string;
  imagen?: string;
  image?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Obtener el centro
    const center = await prisma.center.findFirst();
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Verificar tipo de archivo
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Use Excel (.xlsx, .xls) o CSV" },
        { status: 400 }
      );
    }

    // Leer el archivo
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const rows: ArbitratorRow[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "El archivo está vacío o no tiene el formato correcto" },
        { status: 400 }
      );
    }

    const results = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Procesar cada fila
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 porque la fila 1 es el header

      try {
        // Obtener nombre y email (soportar español e inglés)
        const name = (row.nombre || row.name || "").toString().trim();
        const email = (row.email || row.correo || "").toString().trim().toLowerCase();

        if (!name || !email) {
          results.errors.push(`Fila ${rowNumber}: Nombre y email son requeridos`);
          results.skipped++;
          continue;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.errors.push(`Fila ${rowNumber}: Email inválido "${email}"`);
          results.skipped++;
          continue;
        }

        // Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          const existingRegistry = await prisma.arbitratorRegistry.findFirst({
            where: {
              userId: existingUser.id,
              centerId: center.id,
            },
          });

          if (existingRegistry) {
            results.errors.push(`Fila ${rowNumber}: "${email}" ya está registrado`);
            results.skipped++;
            continue;
          }
        }

        // Parsear datos opcionales
        const barAssociation = (row.colegio_abogados || row.bar_association || "").toString().trim();
        const barNumber = (row.numero_colegiatura || row.bar_number || "").toString().trim();
        const phone = (row.telefono || row.phone || "").toString().trim();
        const image = (row.imagen || row.image || "").toString().trim();

        // Parsear especialidades (separadas por coma)
        const specialtiesStr = (row.especialidades || row.specializations || "").toString().trim();
        const specializations = specialtiesStr
          ? specialtiesStr.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

        // Parsear acepta emergencia
        const emergencyStr = (row.acepta_emergencia || row.accepts_emergency || "").toString().toLowerCase();
        const acceptsEmergency = ["si", "sí", "yes", "true", "1", "x"].includes(emergencyStr);

        // Parsear estado
        const statusStr = (row.estado || row.status || "activo").toString().toLowerCase();
        const status = ["inactivo", "inactive", "no", "0", "pendiente", "pending"].includes(statusStr)
          ? "PENDING_APPROVAL"
          : "ACTIVE";

        // Crear o obtener usuario
        let user = existingUser;
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
              role: "ARBITRO",
              image: image || null,
            },
          });
        } else {
          // Actualizar nombre e imagen si es necesario
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name,
              ...(image && { image }),
            },
          });
        }

        // Crear registro de árbitro
        await prisma.arbitratorRegistry.create({
          data: {
            userId: user.id,
            centerId: center.id,
            barAssociation: barAssociation || null,
            barNumber: barNumber || null,
            specializations,
            acceptsEmergency,
            status,
            approvalDate: status === "ACTIVE" ? new Date() : null,
          },
        });

        results.created++;
      } catch (error) {
        console.error(`Error en fila ${rowNumber}:`, error);
        results.errors.push(`Fila ${rowNumber}: Error al procesar`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Se crearon ${results.created} árbitros de ${results.total} filas procesadas`,
    });
  } catch (error) {
    console.error("Error processing Excel:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
