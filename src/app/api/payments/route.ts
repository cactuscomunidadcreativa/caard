/**
 * CAARD - API de Pagos
 * GET /api/payments - Listar pagos según rol
 * POST /api/payments - Crear nuevo pago (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

// Roles con acceso total
const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

// Schema para crear pago
const createPaymentSchema = z.object({
  caseId: z.string().min(1),
  concept: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  amountCents: z.number().int().positive(),
  currency: z.string().default("PEN"),
  provider: z.enum(["CULQI", "MANUAL_VOUCHER"]).default("MANUAL_VOUCHER"),
  dueAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role as Role;
    const centerId = session.user.centerId;
    const isFullAccess = FULL_ACCESS_ROLES.includes(userRole);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const caseId = searchParams.get("caseId");

    // Base filter
    let caseFilter: any = {};
    if (centerId) {
      caseFilter.centerId = centerId;
    }

    // Si no tiene acceso total, filtrar por casos donde participa
    if (!isFullAccess) {
      const userCases = await prisma.caseMember.findMany({
        where: { userId },
        select: { caseId: true },
      });

      const lawyerCases = await prisma.caseLawyer.findMany({
        where: { lawyerId: userId, isActive: true },
        select: { caseId: true },
      });

      const caseIds = [
        ...new Set([
          ...userCases.map((c) => c.caseId),
          ...lawyerCases.map((c) => c.caseId),
        ]),
      ];

      if (caseIds.length === 0) {
        return NextResponse.json({ payments: [], total: 0 });
      }

      caseFilter.id = { in: caseIds };
    }

    // Construir where clause
    const whereClause: any = {
      case: caseFilter,
    };

    if (status) {
      whereClause.status = status;
    }

    if (caseId) {
      whereClause.caseId = caseId;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          case: {
            select: {
              id: true,
              code: true,
              title: true,
              claimantName: true,
              respondentName: true,
            },
          },
          voucherDocument: {
            select: {
              id: true,
              originalFileName: true,
              driveWebViewLink: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    // Estadísticas
    const stats = await prisma.payment.groupBy({
      by: ["status"],
      where: { case: caseFilter },
      _count: true,
      _sum: { amountCents: true },
    });

    return NextResponse.json({
      payments,
      total,
      stats: stats.reduce(
        (acc, s) => ({
          ...acc,
          [s.status]: {
            count: s._count,
            amount: s._sum.amountCents || 0,
          },
        }),
        {}
      ),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;

    // Solo admins pueden crear pagos
    if (!FULL_ACCESS_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para crear pagos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Verificar que el caso existe
    const caseRecord = await prisma.case.findUnique({
      where: { id: validatedData.caseId },
      select: { id: true, centerId: true },
    });

    if (!caseRecord) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    // Crear el pago
    const payment = await prisma.payment.create({
      data: {
        caseId: validatedData.caseId,
        concept: validatedData.concept,
        description: validatedData.description,
        amountCents: validatedData.amountCents,
        currency: validatedData.currency,
        provider: validatedData.provider,
        status: "REQUIRED",
        dueAt: validatedData.dueAt ? new Date(validatedData.dueAt) : null,
      },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: caseRecord.centerId,
        caseId: validatedData.caseId,
        userId: session.user.id,
        action: "CREATE",
        entity: "Payment",
        entityId: payment.id,
        meta: {
          concept: payment.concept,
          amount: payment.amountCents,
          currency: payment.currency,
        },
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Error al crear pago" },
      { status: 500 }
    );
  }
}
