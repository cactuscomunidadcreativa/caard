/**
 * CAARD - API para Órdenes de Pago
 * Endpoints: GET /api/payments/orders, POST /api/payments/orders
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (caseId) {
      where.caseId = caseId;
    }

    if (status) {
      where.status = status;
    }

    const paymentOrders = await prisma.paymentOrder.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ paymentOrders });
  } catch (error) {
    console.error("Error fetching payment orders:", error);
    return NextResponse.json(
      { error: "Error al obtener órdenes de pago" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const {
      caseId,
      concept,
      description,
      amountCents: reqAmountCents,
      igvCents: reqIgvCents,
      totalCents,
      currency = "PEN",
      dueDate,
      payeeType,
      payeeMemberId,
      payeeName: reqPayeeName,
      payeeEmail: reqPayeeEmail,
    } = body;

    // Validaciones
    if (!caseId) {
      return NextResponse.json(
        { error: "Se requiere un caso/expediente" },
        { status: 400 }
      );
    }

    if (!concept) {
      return NextResponse.json(
        { error: "Se requiere un concepto de pago" },
        { status: 400 }
      );
    }

    if (!totalCents || totalCents < 100) {
      return NextResponse.json(
        { error: "El monto mínimo es S/ 1.00" },
        { status: 400 }
      );
    }

    // Verificar que el caso existe
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, code: true, centerId: true },
    });

    if (!caseExists) {
      return NextResponse.json(
        { error: "Caso no encontrado" },
        { status: 404 }
      );
    }

    // Generar número de orden correlativo
    const year = new Date().getFullYear();
    const lastOrder = await prisma.paymentOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `OP-${year}-`,
        },
      },
      orderBy: { orderNumber: "desc" },
    });

    let sequence = 1;
    if (lastOrder?.orderNumber) {
      const parts = lastOrder.orderNumber.split("-");
      sequence = parseInt(parts[2] || "0") + 1;
    }
    const orderNumber = `OP-${year}-${sequence.toString().padStart(6, "0")}`;

    // Usar amountCents/igvCents del body si vienen, sino calcular
    const amountCents = reqAmountCents || totalCents;
    const igvCents = reqIgvCents || 0;

    // Resolver destinatario
    let payeeName = reqPayeeName || null;
    let payeeEmail = reqPayeeEmail || null;
    if (payeeMemberId) {
      const member = await prisma.caseMember.findUnique({
        where: { id: payeeMemberId },
        select: { displayName: true, email: true },
      });
      if (member) {
        payeeName = member.displayName || payeeName;
        payeeEmail = member.email || payeeEmail;
      }
    } else if (payeeType && payeeType !== "TERCERO" && !payeeName) {
      // Buscar primer miembro con ese rol
      const role = payeeType === "AMBAS_PARTES" ? "DEMANDANTE" : payeeType;
      const m = await prisma.caseMember.findFirst({
        where: { caseId, role: role as any },
        select: { displayName: true, email: true },
      });
      if (m) {
        payeeName = m.displayName;
        payeeEmail = m.email;
      }
    }

    // Fecha de vencimiento (5 días por defecto si no se especifica)
    const dueDateValue = dueDate ? new Date(dueDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // Crear orden de pago
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        caseId,
        orderNumber,
        concept,
        description: description || `Pago por ${concept}`,
        amountCents,
        igvCents,
        totalCents,
        currency,
        status: "PENDING",
        dueAt: dueDateValue,
        createdById: session.user.id,
        payeeType: payeeType || null,
        payeeMemberId: payeeMemberId || null,
        payeeName,
        payeeEmail,
      },
    });

    // Enviar notificación por email al destinatario (si tiene email)
    if (payeeEmail) {
      try {
        const { sendEmail } = await import("@/lib/email/service");
        const monto = new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(totalCents / 100);
        await sendEmail({
          to: payeeEmail,
          subject: `Orden de pago ${orderNumber} - Expediente ${caseExists.code}`,
          html: `
            <h2 style="color:#0B2A5B">Orden de Pago Emitida</h2>
            <p>Estimado(a) ${payeeName || ""}:</p>
            <p>Se ha emitido una orden de pago a su nombre en el expediente <strong>${caseExists.code}</strong>.</p>
            <table style="border-collapse:collapse;width:100%;margin:20px 0">
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>N° Orden</strong></td><td style="padding:8px;border:1px solid #ddd">${orderNumber}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Concepto</strong></td><td style="padding:8px;border:1px solid #ddd">${concept}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Monto</strong></td><td style="padding:8px;border:1px solid #ddd"><strong>${monto}</strong></td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Fecha límite</strong></td><td style="padding:8px;border:1px solid #ddd">${dueDateValue.toLocaleDateString("es-PE")}</td></tr>
            </table>
            <p><a href="${process.env.NEXTAUTH_URL || "https://caardpe.com"}/pago/${paymentOrder.id}" style="background:#D66829;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">Ver y pagar orden</a></p>
            <p style="color:#666;font-size:12px;margin-top:30px">CAARD - Centro de Administración de Arbitrajes y Resolución de Disputas</p>
          `,
        });
      } catch (emailErr) {
        console.error("Error enviando email:", emailErr);
      }
    }

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "PaymentOrder",
        entityId: paymentOrder.id,
        userId: session.user.id,
        caseId,
        meta: {
          paymentOrderId: paymentOrder.id,
          orderNumber,
          caseCode: caseExists.code,
          concept,
          totalCents,
          currency,
        },
      },
    });

    return NextResponse.json(paymentOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Error al crear orden de pago" },
      { status: 500 }
    );
  }
}
