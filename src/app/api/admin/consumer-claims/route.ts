/**
 * /api/admin/consumer-claims — gestión interna del Libro de Reclamaciones.
 * GET  : lista (filtra por estado, busca por número o consumidor)
 * PATCH ?id= : actualizar estado/respuesta
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

export async function GET(request: NextRequest) {
  try {
    // Reutilizamos audit.view (es una bitácora oficial del centro)
    const session = await requireAuthWithPermission("audit.view");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("q") || "";
    const where: any = session.user.centerId
      ? { centerId: session.user.centerId }
      : {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: "insensitive" } },
        { consumerName: { contains: search, mode: "insensitive" } },
        { consumerEmail: { contains: search, mode: "insensitive" } },
        { consumerDocNumber: { contains: search } },
      ];
    }

    const [items, counts] = await Promise.all([
      prisma.consumerClaim.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        take: 200,
      }),
      prisma.consumerClaim.groupBy({
        by: ["status"],
        where: session.user.centerId
          ? { centerId: session.user.centerId }
          : {},
        _count: true,
      }),
    ]);

    return NextResponse.json({
      items: items.map((c) => ({
        ...c,
        receivedAt: c.receivedAt.toISOString(),
        responseDueAt: c.responseDueAt.toISOString(),
        respondedAt: c.respondedAt?.toISOString() || null,
        acknowledgedAt: c.acknowledgedAt?.toISOString() || null,
        serviceDate: c.serviceDate?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      counts: counts.reduce(
        (acc, c) => ({ ...acc, [c.status]: c._count }),
        {} as Record<string, number>
      ),
    });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("GET consumer-claims error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission("audit.view");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const body = await request.json();
    const { status, responseText } = body;
    const validStatuses = ["RECEIVED", "IN_REVIEW", "RESPONDED", "RESOLVED", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (responseText !== undefined) {
      updateData.responseText = responseText;
      updateData.respondedAt = new Date();
      updateData.respondedById = session.user.id;
      // Si se marca respondida y no se forzó status, ponemos RESPONDED
      if (!status) updateData.status = "RESPONDED";
    }

    const claim = await prisma.consumerClaim.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "ConsumerClaim",
        entityId: id,
        userId: session.user.id,
        meta: {
          operation: "UPDATE_CLAIM",
          status: updateData.status,
          hasResponse: !!responseText,
        },
      },
    });

    // Si se está respondiendo, enviar email al consumidor con la respuesta
    if (responseText && claim.consumerEmail) {
      try {
        const { sendEmail } = await import("@/lib/email/service");
        await sendEmail({
          to: claim.consumerEmail,
          subject: `Respuesta a su reclamación ${claim.claimNumber} | CAARD`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <div style="background: #0B2A5B; color: white; padding: 24px; border-bottom: 4px solid #D66829;">
                <h1 style="margin: 0; font-size: 22px;">CAARD</h1>
                <p style="margin: 4px 0 0; font-size: 13px; opacity: .9;">Libro de Reclamaciones</p>
              </div>
              <div style="padding: 24px; background: #fff;">
                <p>Estimado(a) ${claim.consumerName}:</p>
                <p>En atención a su ${claim.claimType.toLowerCase()} registrado con el número
                <strong>${claim.claimNumber}</strong>, le comunicamos la siguiente respuesta:</p>
                <div style="background: #fff5e6; border-left: 4px solid #D66829; padding: 12px 16px; margin: 16px 0; white-space: pre-wrap;">${responseText}</div>
                <p style="font-size: 12px; color: #888;">
                  Centro de Administración de Arbitrajes y Resolución de Disputas (CAARD)<br>
                  info@caardpe.com · (51) 913 755 003
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Error enviando respuesta:", emailErr);
      }
    }

    return NextResponse.json({ success: true, claim });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("PATCH consumer-claim error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
