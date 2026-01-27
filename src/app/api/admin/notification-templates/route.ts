/**
 * CAARD - API de Plantillas de Notificación
 * GET: Listar plantillas
 * POST: Crear nueva plantilla
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"];

// GET - Listar plantillas
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    // Filtros
    const where: any = {
      OR: [
        { centerId: session.user.centerId },
        { centerId: null, isDefault: true }, // Incluir plantillas por defecto del sistema
      ],
    };

    if (type && type !== "all") {
      where.type = type;
    }

    if (isActive !== null && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.AND = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { emailSubject: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    return NextResponse.json(
      { error: "Error al obtener plantillas" },
      { status: 500 }
    );
  }
}

// POST - Crear plantilla
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      code,
      type,
      emailSubject,
      emailBody,
      emailHtmlBody,
      smsBody,
      whatsappBody,
      availableVariables,
      description,
      category,
      isActive = true,
    } = body;

    // Validaciones
    if (!name || !code || !type) {
      return NextResponse.json(
        { error: "Nombre, código y tipo son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el código no exista para este centro
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        code,
        centerId: session.user.centerId,
      },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Ya existe una plantilla con este código" },
        { status: 400 }
      );
    }

    // Crear plantilla
    const template = await prisma.notificationTemplate.create({
      data: {
        centerId: session.user.centerId,
        name,
        code: code.toUpperCase().replace(/\s+/g, "_"),
        type,
        emailSubject,
        emailBody,
        emailHtmlBody,
        smsBody: smsBody?.substring(0, 320), // Limitar SMS
        whatsappBody,
        availableVariables: availableVariables || getDefaultVariables(type),
        description,
        category,
        isActive,
        isDefault: false,
      },
    });

    return NextResponse.json({
      success: true,
      template,
      message: "Plantilla creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating notification template:", error);
    return NextResponse.json(
      { error: "Error al crear plantilla" },
      { status: 500 }
    );
  }
}

// Variables por defecto según el tipo de plantilla
function getDefaultVariables(type: string): string[] {
  const commonVars = [
    "{{caseNumber}}",
    "{{caseName}}",
    "{{partyName}}",
    "{{centerName}}",
    "{{secretaryName}}",
    "{{today}}",
  ];

  const typeSpecificVars: Record<string, string[]> = {
    TRASLADO: [...commonVars, "{{claimantName}}", "{{respondentName}}", "{{documentName}}"],
    NOTIFICACION_ADMISION: [...commonVars, "{{claimantName}}", "{{respondentName}}"],
    NOTIFICACION_RECHAZO: [...commonVars, "{{rejectionReason}}"],
    NOTIFICACION_AUDIENCIA: [...commonVars, "{{hearingDate}}", "{{hearingTime}}", "{{hearingLocation}}"],
    NOTIFICACION_LAUDO: [...commonVars, "{{laudoDate}}"],
    RECORDATORIO_PLAZO: [...commonVars, "{{deadlineDate}}", "{{daysRemaining}}", "{{documentName}}"],
    REQUERIMIENTO_PAGO: [...commonVars, "{{amount}}", "{{deadlineDate}}", "{{paymentConcept}}"],
    DESIGNACION_ARBITRO: [...commonVars, "{{arbitratorName}}"],
    GENERAL: commonVars,
  };

  return typeSpecificVars[type] || commonVars;
}
