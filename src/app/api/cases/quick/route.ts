/**
 * CAARD - API de Creación Rápida de Expedientes
 * POST /api/cases/quick - Crear expediente con datos mínimos (admin/secretaría)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quickCreateCaseSchema } from "@/lib/validations/case";
import { generateCaseCode, isEmergencyArbitrationType } from "@/lib/case-code";
import { CASE_FOLDER_STRUCTURE } from "@/config/constants";
import { ensureCaseDriveFolders } from "@/lib/drive-case-folders";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo admin, secretaría y staff pueden crear rápido
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Sin permisos para crear expedientes" }, { status: 403 });
    }

    const body = await request.json();
    const validation = quickCreateCaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Obtener centro
    let centerId = session.user.centerId;
    if (!centerId) {
      const center = await prisma.center.findFirst();
      if (!center) {
        return NextResponse.json({ error: "No hay centro configurado" }, { status: 400 });
      }
      centerId = center.id;
    }

    // Verificar tipo de arbitraje
    let arbitrationType = await prisma.arbitrationType.findFirst({
      where: { id: data.arbitrationTypeId, centerId, isActive: true },
    });

    if (!arbitrationType) {
      arbitrationType = await prisma.arbitrationType.findFirst({
        where: { id: data.arbitrationTypeId, isActive: true },
      });
      if (arbitrationType) {
        centerId = arbitrationType.centerId;
      } else {
        return NextResponse.json({ error: "Tipo de arbitraje no válido" }, { status: 400 });
      }
    }

    const isEmergency = isEmergencyArbitrationType(arbitrationType.code);

    // Crear en transacción
    const newCase = await prisma.$transaction(async (tx) => {
      const { code, year, sequence } = await generateCaseCode(centerId!, isEmergency, tx);

      const createdCase = await tx.case.create({
        data: {
          centerId: centerId!,
          arbitrationTypeId: data.arbitrationTypeId,
          year,
          sequence,
          code,
          title: data.title,
          status: "SUBMITTED",
          claimantName: data.claimantName,
          respondentName: data.respondentName,
          disputeAmountCents: data.disputeAmount
            ? BigInt(Math.round(data.disputeAmount * 100))
            : null,
          currency: data.currency || "PEN",
          tribunalMode: data.tribunalMode || "TRIBUNAL_3",
          submittedAt: new Date(),
        },
      });

      // Crear miembros
      await tx.caseMember.create({
        data: {
          caseId: createdCase.id,
          role: "DEMANDANTE",
          displayName: data.claimantName,
          email: data.claimantEmail || null,
          isPrimary: true,
        },
      });

      await tx.caseMember.create({
        data: {
          caseId: createdCase.id,
          role: "DEMANDADO",
          displayName: data.respondentName,
          email: data.respondentEmail || null,
          isPrimary: true,
        },
      });

      // Crear carpetas
      const folders = CASE_FOLDER_STRUCTURE.map((folder) => ({
        caseId: createdCase.id,
        key: folder.key,
        name: folder.name,
      }));
      await tx.caseFolder.createMany({ data: folders });

      // Audit log
      await tx.auditLog.create({
        data: {
          centerId: centerId!,
          caseId: createdCase.id,
          userId: session.user.id,
          action: "CREATE",
          entity: "Case",
          entityId: createdCase.id,
          meta: { code: createdCase.code, method: "quick_create" },
        },
      });

      return createdCase;
    });

    // Crear estructura de carpetas en Google Drive (fuera de la transacción, tolerante a fallos)
    await ensureCaseDriveFolders(newCase.id);

    // Serializar BigInt antes de responder para que JSON.stringify no falle
    const safeCase = {
      ...newCase,
      disputeAmountCents: (newCase as any).disputeAmountCents?.toString() ?? null,
      centerFeeCents: (newCase as any).centerFeeCents?.toString() ?? null,
      taxCents: (newCase as any).taxCents?.toString() ?? null,
      totalAdminFeeCents: (newCase as any).totalAdminFeeCents?.toString() ?? null,
    };

    return NextResponse.json(
      { success: true, data: safeCase, message: `Expediente ${newCase.code} creado exitosamente` },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error quick-creating case:", error?.message);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un expediente con ese código. Intente nuevamente." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear expediente", details: error?.message },
      { status: 500 }
    );
  }
}
