/**
 * CAARD - API de Expedientes
 * POST /api/cases - Crear nuevo expediente
 * GET /api/cases - Listar expedientes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCaseSchema, caseFiltersSchema } from "@/lib/validations/case";
import { CASE_FOLDER_STRUCTURE } from "@/config/constants";
import { getCaseFilters, hasFullAccess } from "@/lib/case-authorization";
import { Role } from "@prisma/client";
import { generateCaseCode, isEmergencyArbitrationType } from "@/lib/case-code";

/**
 * Crea la estructura de carpetas para el expediente
 */
async function createFolderStructure(caseId: string): Promise<void> {
  const folders = CASE_FOLDER_STRUCTURE.map((folder) => ({
    caseId,
    key: folder.key,
    name: folder.name,
  }));

  await prisma.caseFolder.createMany({
    data: folders,
  });
}

/**
 * GET /api/cases - Listar expedientes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = caseFiltersSchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      arbitrationTypeId: searchParams.get("arbitrationTypeId") || undefined,
      year: searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20,
    });

    const { search, status, arbitrationTypeId, year } = filters;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Construir where según rol del usuario
    const userRole = (session.user.role || "DEMANDANTE") as Role;
    const userId = session.user.id;
    const userCenterId = session.user.centerId;

    // Obtener filtros de acceso según rol (incluye filtro de centro)
    let accessFilters = {};
    try {
      accessFilters = getCaseFilters(userId, userRole, userCenterId);
    } catch (filterError) {
      console.error("Error getting case filters:", filterError);
    }

    let whereClause: any = { ...accessFilters };

    // Filtros adicionales
    if (status) {
      whereClause.status = status;
    }

    if (arbitrationTypeId) {
      whereClause.arbitrationTypeId = arbitrationTypeId;
    }

    if (year) {
      whereClause.year = year;
    }

    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { claimantName: { contains: search, mode: "insensitive" } },
        { respondentName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener casos con paginación
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where: whereClause,
        include: {
          arbitrationType: {
            select: {
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              documents: true,
              payments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.case.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      items: cases,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: skip + cases.length < total,
    });
  } catch (error: any) {
    console.error("Error listing cases:", error?.message || error);
    console.error("Stack:", error?.stack);
    return NextResponse.json(
      { error: "Error al listar expedientes", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases - Crear nuevo expediente
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos
    const validationResult = createCaseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Obtener centro del usuario o usar el primero disponible
    let centerId = session.user.centerId;

    if (!centerId) {
      const defaultCenter = await prisma.center.findFirst();
      if (!defaultCenter) {
        return NextResponse.json(
          { error: "No hay centro de arbitraje configurado" },
          { status: 400 }
        );
      }
      centerId = defaultCenter.id;
    }

    // Verificar que el tipo de arbitraje existe y pertenece al centro
    const arbitrationType = await prisma.arbitrationType.findFirst({
      where: {
        id: data.arbitrationTypeId,
        centerId,
        isActive: true,
      },
    });

    if (!arbitrationType) {
      return NextResponse.json(
        { error: "Tipo de arbitraje no válido" },
        { status: 400 }
      );
    }

    // Determinar si es arbitraje de emergencia basado en el código del tipo
    const isEmergency = isEmergencyArbitrationType(arbitrationType.code);

    // Generar código correlativo
    const { code, year, sequence } = await generateCaseCode(centerId, isEmergency);

    // Construir nombre del demandante
    const claimantName = data.claimant.type === "PERSONA_NATURAL"
      ? `${data.claimant.nombres} ${data.claimant.apellidos}`
      : data.claimant.razonSocial || "";

    // Construir nombre del demandado
    const respondentName = data.respondent.type === "PERSONA_NATURAL"
      ? `${data.respondent.nombres} ${data.respondent.apellidos}`
      : data.respondent.razonSocial || "";

    // Crear el expediente en una transacción
    const newCase = await prisma.$transaction(async (tx) => {
      // 1. Crear el caso
      const createdCase = await tx.case.create({
        data: {
          centerId,
          arbitrationTypeId: data.arbitrationTypeId,
          year,
          sequence,
          code,
          title: data.title,
          status: "SUBMITTED",
          claimantName,
          respondentName,
          submittedAt: new Date(),
        },
      });

      // 2. Crear o buscar usuario demandante
      let claimantUser = await tx.user.findUnique({
        where: { email: data.claimant.email },
      });

      if (!claimantUser) {
        claimantUser = await tx.user.create({
          data: {
            email: data.claimant.email,
            name: claimantName,
            role: "DEMANDANTE",
            centerId,
            phoneE164: data.claimant.telefono || null,
          },
        });
      }

      // 3. Agregar demandante como miembro
      await tx.caseMember.create({
        data: {
          caseId: createdCase.id,
          userId: claimantUser.id,
          role: "DEMANDANTE",
          displayName: claimantName,
          email: data.claimant.email,
          phoneE164: data.claimant.telefono || null,
          isPrimary: true,
        },
      });

      // 4. Crear miembro demandado (sin usuario por ahora)
      await tx.caseMember.create({
        data: {
          caseId: createdCase.id,
          role: "DEMANDADO",
          displayName: respondentName,
          email: data.respondent.email,
          phoneE164: data.respondent.telefono || null,
          isPrimary: true,
        },
      });

      // 5. Crear estructura de carpetas
      const folders = CASE_FOLDER_STRUCTURE.map((folder) => ({
        caseId: createdCase.id,
        key: folder.key,
        name: folder.name,
      }));

      await tx.caseFolder.createMany({
        data: folders,
      });

      // 6. Crear pago inicial (tasa de arbitraje)
      if (arbitrationType.baseFeeCents) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 5); // 5 días para pagar

        await tx.payment.create({
          data: {
            caseId: createdCase.id,
            provider: "CULQI",
            status: "PENDING",
            currency: arbitrationType.currency,
            amountCents: arbitrationType.baseFeeCents,
            concept: "Tasa de arbitraje",
            description: `Tasa administrativa por inicio de proceso - ${arbitrationType.name}`,
            dueAt: dueDate,
          },
        });
      }

      // 7. Registrar en audit log
      await tx.auditLog.create({
        data: {
          centerId,
          caseId: createdCase.id,
          userId: session.user.id,
          action: "CREATE",
          entity: "Case",
          entityId: createdCase.id,
          meta: {
            code: createdCase.code,
            title: createdCase.title,
            arbitrationType: arbitrationType.name,
          },
        },
      });

      return createdCase;
    });

    return NextResponse.json(
      {
        success: true,
        data: newCase,
        message: `Expediente ${newCase.code} creado exitosamente`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { error: "Error al crear expediente" },
      { status: 500 }
    );
  }
}
