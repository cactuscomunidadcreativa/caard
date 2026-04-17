/**
 * GET /api/recusations/[id] - Detalle de una recusación
 * PATCH /api/recusations/[id] - Acciones sobre la recusación:
 *    action=respond → árbitro responde
 *    action=decide  → consejo decide (ACCEPTED|REJECTED)
 *       Si ACCEPTED, se crea orden de pago automática al árbitro (devolución/honorarios)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;

    const rec = await prisma.recusation.findUnique({
      where: { id },
      include: {
        case: { select: { id: true, code: true, title: true, centerId: true } },
        arbitrator: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: { select: { displayName: true, slug: true } },
          },
        },
      },
    });
    if (!rec) {
      return NextResponse.json({ error: "Recusación no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ recusation: rec });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const action: string = body.action;

    const rec = await prisma.recusation.findUnique({
      where: { id },
      include: {
        case: { select: { id: true, code: true, centerId: true } },
        arbitrator: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!rec) {
      return NextResponse.json({ error: "Recusación no encontrada" }, { status: 404 });
    }

    if (action === "respond") {
      // Solo el árbitro recusado puede responder
      if (rec.arbitrator.user?.id !== session.user.id) {
        return NextResponse.json(
          { error: "Solo el árbitro recusado puede responder" },
          { status: 403 }
        );
      }
      const response: string = body.response || "";
      if (!response.trim()) {
        return NextResponse.json({ error: "Respuesta requerida" }, { status: 400 });
      }

      await prisma.recusation.update({
        where: { id },
        data: {
          arbitratorResponse: response,
          arbitratorResponseAt: new Date(),
          status: "PENDING_COUNCIL_DECISION",
        },
      });

      // Notificar al staff
      const staff = await prisma.user.findMany({
        where: {
          centerId: rec.case.centerId,
          role: { in: ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"] },
          isActive: true,
        },
        select: { id: true },
      });
      if (staff.length) {
        await prisma.notification.createMany({
          data: staff.map((s) => ({
            userId: s.id,
            type: "SYSTEM" as const,
            title: `Árbitro respondió recusación — ${rec.case.code}`,
            message: "Pendiente de decisión del consejo.",
            metadata: { recusationId: id, caseId: rec.caseId },
            isRead: false,
          })),
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "decide") {
      // Solo staff puede marcar decisión del consejo
      if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
        return NextResponse.json(
          { error: "Solo staff puede registrar la decisión" },
          { status: 403 }
        );
      }

      const decision: "ACCEPTED" | "REJECTED" = body.decision;
      const resolution: string = body.resolution || "";
      if (!["ACCEPTED", "REJECTED"].includes(decision)) {
        return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
      }
      if (!resolution.trim()) {
        return NextResponse.json({ error: "Resolución requerida" }, { status: 400 });
      }

      const updated = await prisma.recusation.update({
        where: { id },
        data: {
          status: decision,
          councilDecision: decision,
          councilResolution: resolution,
          resolvedById: session.user.id,
          resolvedAt: new Date(),
        },
      });

      let createdPaymentOrderId: string | null = null;

      // Si ACCEPTED, crear orden de pago al árbitro (devolución de honorarios)
      if (decision === "ACCEPTED") {
        // Obtener siguiente número correlativo
        const year = new Date().getFullYear();
        const lastOrder = await prisma.paymentOrder.findFirst({
          where: { orderNumber: { startsWith: `OP-${year}-` } },
          orderBy: { orderNumber: "desc" },
        });
        let seq = 1;
        if (lastOrder?.orderNumber) {
          const parts = lastOrder.orderNumber.split("-");
          seq = parseInt(parts[2] || "0") + 1;
        }
        const orderNumber = `OP-${year}-${seq.toString().padStart(6, "0")}`;

        const amountCents = body.amountCents || 0; // monto a devolver/pagar (staff ingresa)
        const description =
          body.paymentDescription ||
          `Pago por recusación aceptada — expediente ${rec.case.code}. Árbitro: ${rec.arbitrator.user?.name || ""}`;

        if (amountCents > 0) {
          const po = await prisma.paymentOrder.create({
            data: {
              caseId: rec.caseId,
              orderNumber,
              concept: "HONORARIOS_ARBITRO_UNICO", // o similar (ajustable)
              description,
              amountCents,
              igvCents: 0,
              totalCents: amountCents,
              currency: "PEN",
              status: "PENDING",
              dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdById: session.user.id,
              payeeType: "ARBITRO",
              payeeName: rec.arbitrator.user?.name || null,
              payeeEmail: rec.arbitrator.user?.email || null,
            },
          });
          createdPaymentOrderId = po.id;
        }

        // Notificar al árbitro que se aceptó la recusación
        if (rec.arbitrator.user?.id) {
          await prisma.notification.create({
            data: {
              userId: rec.arbitrator.user.id,
              type: "SYSTEM",
              title: `Recusación aceptada — ${rec.case.code}`,
              message:
                "El consejo ha aceptado la recusación. " +
                (createdPaymentOrderId
                  ? "Se ha generado la orden de pago correspondiente."
                  : ""),
              metadata: {
                recusationId: id,
                paymentOrderId: createdPaymentOrderId,
              },
              isRead: false,
            },
          });
        }
      } else {
        // REJECTED: notificar al árbitro
        if (rec.arbitrator.user?.id) {
          await prisma.notification.create({
            data: {
              userId: rec.arbitrator.user.id,
              type: "SYSTEM",
              title: `Recusación rechazada — ${rec.case.code}`,
              message: "El consejo ha desestimado la recusación.",
              metadata: { recusationId: id },
              isRead: false,
            },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Recusation",
          entityId: id,
          userId: session.user.id,
          caseId: rec.caseId,
          meta: {
            operation: "COUNCIL_DECIDE",
            decision,
            resolution,
            paymentOrderId: createdPaymentOrderId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        recusation: updated,
        paymentOrderId: createdPaymentOrderId,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (e: any) {
    console.error("PATCH /recusations/[id] error:", e);
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
