/**
 * CAARD - API de Revisión de Solicitudes
 * POST /api/cases/[id]/review - Admitir o rechazar una solicitud
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["ADMIT", "REJECT"]),
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo SECRETARIA y SUPER_ADMIN pueden revisar
    if (!["SECRETARIA", "SUPER_ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validar datos
    const validationResult = reviewSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { action, comment } = validationResult.data;

    // Obtener el caso
    const existingCase = await prisma.case.findUnique({
      where: { id },
      include: {
        members: {
          where: { role: "DEMANDANTE", isPrimary: true },
          include: { user: true },
        },
      },
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }

    // Solo se pueden revisar casos en estado SUBMITTED
    if (existingCase.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Este expediente ya fue procesado" },
        { status: 400 }
      );
    }

    // Determinar nuevo estado
    const newStatus = action === "ADMIT" ? "ADMITTED" : "REJECTED";
    const eventType = action === "ADMIT" ? "CASE_ADMITTED" : "CASE_REJECTED";

    // Actualizar en transacción
    const updatedCase = await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado del caso
      const updated = await tx.case.update({
        where: { id },
        data: {
          status: newStatus,
          admittedAt: action === "ADMIT" ? new Date() : null,
        },
      });

      // 2. Crear nota con la resolución
      await tx.caseNote.create({
        data: {
          caseId: id,
          authorId: session.user.id,
          content: `## ${action === "ADMIT" ? "Solicitud Admitida" : "Solicitud Rechazada"}

**Fecha:** ${new Date().toLocaleString("es-PE")}
**Revisado por:** ${session.user.name || session.user.email}

${comment ? `**Observaciones:**\n${comment}` : "Sin observaciones adicionales."}
          `.trim(),
          isPrivate: false,
        },
      });

      // 3. Registrar en audit log
      await tx.auditLog.create({
        data: {
          centerId: existingCase.centerId,
          caseId: id,
          userId: session.user.id,
          action: "UPDATE",
          entity: "Case",
          entityId: id,
          meta: {
            reviewAction: action,
            previousStatus: existingCase.status,
            newStatus,
            comment: comment || null,
          },
        },
      });

      // 4. Crear notificación en cola
      const claimantMember = existingCase.members[0];
      if (claimantMember?.email) {
        await tx.notificationQueue.create({
          data: {
            caseId: id,
            channel: "EMAIL",
            eventType,
            toEmail: claimantMember.email,
            toPhoneE164: claimantMember.phoneE164,
            subject: action === "ADMIT"
              ? `Solicitud ${existingCase.code} admitida`
              : `Solicitud ${existingCase.code} rechazada`,
            body: `Su solicitud arbitral ${existingCase.code} ha sido ${action === "ADMIT" ? "admitida" : "rechazada"}. ${comment || ""}`,
            status: "QUEUED",
            scheduledAt: new Date(),
          },
        });
      }

      // 5. Si se admite, crear plazo para contestación del demandado
      if (action === "ADMIT") {
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 15); // 15 días para contestar

        await tx.caseDeadline.create({
          data: {
            caseId: id,
            title: "Plazo para contestación de demanda",
            description: "El demandado debe presentar su contestación dentro de este plazo",
            dueAt: deadlineDate,
            timezone: "America/Lima",
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: updatedCase,
      message: action === "ADMIT"
        ? `Solicitud ${existingCase.code} admitida exitosamente`
        : `Solicitud ${existingCase.code} rechazada`,
    });
  } catch (error) {
    console.error("Error reviewing case:", error);
    return NextResponse.json(
      { error: "Error al procesar la revisión" },
      { status: 500 }
    );
  }
}
