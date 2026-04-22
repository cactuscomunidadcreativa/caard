/**
 * CAARD - API de Expediente Individual
 * GET /api/cases/[id] - Obtener expediente
 * PATCH /api/cases/[id] - Actualizar expediente
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase, hasFullAccess, requireCenterAccess } from "@/lib/case-authorization";
import { Role } from "@prisma/client";
import { ensureCaseDriveFolders } from "@/lib/drive-case-folders";

/**
 * GET /api/cases/[id] - Obtener expediente con verificación de acceso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id;
    const userCenterId = session.user.centerId;

    // Verificar acceso al caso (incluye verificación de centro)
    const accessResult = await canAccessCase(userId, userRole, id, userCenterId);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: accessResult.reason || "Sin acceso a este expediente" },
        { status: 403 }
      );
    }

    // Obtener el caso con todas las relaciones relevantes
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        center: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        arbitrationType: {
          select: {
            id: true,
            code: true,
            name: true,
            kind: true,
            tribunalMode: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        lawyers: {
          where: { isActive: true },
          include: {
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            representedMember: {
              select: {
                id: true,
                displayName: true,
                role: true,
              },
            },
          },
        },
        folders: {
          orderBy: { key: "asc" },
          include: {
            documents: {
              orderBy: { createdAt: "desc" },
              include: {
                uploadedBy: { select: { id: true, name: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        paymentOrders: {
          orderBy: { issuedAt: "desc" },
        },
        deadlines: {
          orderBy: { dueAt: "asc" },
        },
        processDeadlines: {
          orderBy: { dueAt: "asc" },
        },
        hearings: {
          orderBy: { hearingAt: "asc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            documents: true,
            payments: true,
            paymentOrders: true,
            deadlines: true,
            hearings: true,
            notes: true,
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    // Helper: serializar cualquier objeto eliminando BigInt y Date
    function safeSerialize(obj: any): any {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return obj.toString();
      if (obj instanceof Date) return obj.toISOString();
      if (Array.isArray(obj)) return obj.map(safeSerialize);
      if (typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = safeSerialize(value);
        }
        return result;
      }
      return obj;
    }

    // Filtrar carpetas + documentos por rol
    const { filterFoldersByRole, filterDocumentsByRole } = await import(
      "@/lib/document-visibility"
    );
    const visibleFolders = filterFoldersByRole(
      (caseData as any).folders || [],
      userRole
    );
    // Flatten documents with folder reference for UI
    const allDocs: any[] = [];
    for (const f of visibleFolders as any[]) {
      for (const d of f.documents || []) {
        allDocs.push({
          ...d,
          folder: { id: f.id, key: f.key, name: f.name, visibility: f.visibility },
        });
      }
    }
    const visibleDocs = filterDocumentsByRole(allDocs, userRole);

    // Serialize BigInt fields
    const serialized: any = {
      ...caseData,
      disputeAmountCents: (caseData as any).disputeAmountCents?.toString() ?? null,
      centerFeeCents: (caseData as any).centerFeeCents?.toString() ?? null,
      taxCents: (caseData as any).taxCents?.toString() ?? null,
      totalAdminFeeCents: (caseData as any).totalAdminFeeCents?.toString() ?? null,
      folders: visibleFolders.map((f: any) => ({
        id: f.id,
        key: f.key,
        name: f.name,
        visibility: f.visibility,
        driveFolderId: f.driveFolderId,
      })),
      documents: visibleDocs.map((d: any) => ({
        ...d,
        sizeBytes: d.sizeBytes != null ? d.sizeBytes.toString() : null,
        documentDate: d.documentDate ? d.documentDate.toISOString() : null,
      })),
      // Serialize payments
      payments: ((caseData as any).payments || []).map((p: any) => ({
        ...p,
        dueAt: p.dueAt?.toISOString() ?? null,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt?.toISOString() ?? null,
      })),
      // Serialize paymentOrders
      paymentOrders: ((caseData as any).paymentOrders || []).map((po: any) => ({
        ...po,
        issuedAt: po.issuedAt?.toISOString() ?? null,
        dueAt: po.dueAt?.toISOString() ?? null,
        paidAt: po.paidAt?.toISOString() ?? null,
        createdAt: po.createdAt?.toISOString() ?? null,
      })),
      // Serialize hearings
      hearings: ((caseData as any).hearings || []).map((h: any) => ({
        ...h,
        hearingAt: h.hearingAt?.toISOString() ?? null,
        createdAt: h.createdAt?.toISOString() ?? null,
      })),
      // Serialize notes
      notes: ((caseData as any).notes || []).map((n: any) => ({
        ...n,
        createdAt: n.createdAt?.toISOString() ?? null,
      })),
      // Merge CaseDeadline + ProcessDeadline into unified deadlines array
      deadlines: [
        ...((caseData as any).deadlines || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          dueAt: d.dueAt?.toISOString() ?? null,
          isCompleted: d.isCompleted,
          completedAt: d.completedAt?.toISOString() ?? null,
          type: "simple",
          createdAt: d.createdAt?.toISOString() ?? null,
        })),
        ...((caseData as any).processDeadlines || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          dueAt: d.dueAt?.toISOString() ?? null,
          isCompleted: d.status === "COMPLETED",
          completedAt: d.completedAt?.toISOString() ?? null,
          type: d.type,
          status: d.status,
          businessDays: d.businessDays,
          startsAt: d.startsAt?.toISOString() ?? null,
          onOverdueAction: d.onOverdueAction,
          createdAt: d.createdAt?.toISOString() ?? null,
        })),
      ],
    };

    // Aplicar safeSerialize para eliminar cualquier BigInt/Date residual
    const safe = safeSerialize(serialized);

    if (accessResult.accessLevel === "own") {
      return NextResponse.json({ case: { ...safe, _count: caseData._count } });
    }

    return NextResponse.json({ case: safe });
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Error al obtener expediente" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id] - Actualizar expediente
 * Solo SUPER_ADMIN, ADMIN, SECRETARIA pueden actualizar
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const userCenterId = session.user.centerId;

    // Solo roles administrativos pueden actualizar casos
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole)) {
      return NextResponse.json(
        { error: "Sin permisos para actualizar expedientes" },
        { status: 403 }
      );
    }

    // Verificar que el caso pertenece al centro del usuario
    const existingCase = await prisma.case.findUnique({
      where: { id },
      select: { centerId: true, status: true, currentStage: true, procedureType: true },
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    const centerAccess = await requireCenterAccess(userRole, userCenterId, existingCase.centerId);
    if (!centerAccess.allowed) {
      return NextResponse.json(
        { error: centerAccess.error || "Sin acceso a este centro" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const allowedFields = [
      "title",
      "status",
      "claimantName",
      "respondentName",
      "currentStage",
      "tribunalMode",
      "scope",
      "procedureType",
      "currency",
      "isBlocked",
      "blockReason",
      "driveFolderId",
    ];
    // Date fields (string → Date)
    const dateFields = ["submittedAt", "admittedAt", "closedAt"];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Date fields
    for (const df of dateFields) {
      if (body[df] !== undefined) {
        updateData[df] = body[df] ? new Date(body[df]) : null;
      }
    }

    // Si llega una URL de Drive en driveFolderId, extraer el ID
    if (typeof updateData.driveFolderId === "string") {
      const m = updateData.driveFolderId.match(/[-\w]{25,}/);
      if (m) updateData.driveFolderId = m[0];
    }

    // disputeAmount comes as decimal number; store as cents BigInt
    if (body.disputeAmount !== undefined) {
      const n = Number(body.disputeAmount);
      if (!isNaN(n)) {
        updateData.disputeAmountCents = BigInt(Math.round(n * 100));
      } else if (body.disputeAmount === null || body.disputeAmount === "") {
        updateData.disputeAmountCents = null;
      }
    }

    if (body.isBlocked === true) {
      updateData.blockedAt = new Date();
      updateData.blockedBy = session.user.id;
    } else if (body.isBlocked === false) {
      updateData.blockedAt = null;
      updateData.blockedBy = null;
      updateData.blockReason = null;
    }

    // Actualizar fechas según el status
    if (body.status) {
      if (body.status === "ADMITTED" && !body.admittedAt) {
        updateData.admittedAt = new Date();
      }
      if (body.status === "CLOSED" && !body.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
    });

    // Si el caso entra a ADMITTED por primera vez, asegurar estructura en Drive
    // (idempotente: si ya existe la carpeta del caso no la duplica).
    if (
      body.status === "ADMITTED" &&
      (existingCase as any).status !== "ADMITTED"
    ) {
      await ensureCaseDriveFolders(id);
    }

    // Ejecutar triggers automáticos por cambio de etapa/status
    try {
      const { executeStageTriggers } = await import("@/lib/case-stage-triggers");
      await executeStageTriggers({
        caseId: id,
        previousStage: existingCase.currentStage as string | null,
        newStage: updateData.currentStage || (existingCase.currentStage as string | null),
        previousStatus: existingCase.status as string | null,
        newStatus: updateData.status || (existingCase.status as string | null),
        procedureType: (existingCase as any).procedureType || "REGULAR",
        userId: session.user.id,
      });
    } catch (triggerErr: any) {
      console.warn("stage trigger error:", triggerErr.message);
    }

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: updatedCase.centerId,
        caseId: id,
        userId: session.user.id,
        action: "UPDATE",
        entity: "Case",
        entityId: id,
        meta: {
          changes: updateData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      case: {
        ...updatedCase,
        disputeAmountCents: updatedCase.disputeAmountCents?.toString() ?? null,
        centerFeeCents: (updatedCase as any).centerFeeCents?.toString() ?? null,
        taxCents: (updatedCase as any).taxCents?.toString() ?? null,
        totalAdminFeeCents: (updatedCase as any).totalAdminFeeCents?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Error al actualizar expediente" },
      { status: 500 }
    );
  }
}
