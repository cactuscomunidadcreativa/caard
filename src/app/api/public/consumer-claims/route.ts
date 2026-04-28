/**
 * /api/public/consumer-claims — Libro de Reclamaciones (D.S. 011-2011-PCM).
 * POST: registra un nuevo reclamo o queja desde el formulario público.
 * El consumidor recibe email de confirmación con número de hoja correlativo
 * y el centro recibe notificación a info@.
 *
 * Sin auth: cualquier visitante puede usar el formulario.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const claimSchema = z.object({
  // Tipo
  claimType: z.enum(["RECLAMO", "QUEJA"]),

  // Consumidor
  consumerName: z.string().min(2).max(200),
  consumerDocType: z.enum(["DNI", "CE", "PASSPORT", "RUC"]),
  consumerDocNumber: z.string().min(1).max(50),
  consumerAddress: z.string().max(500).optional().nullable(),
  consumerPhone: z.string().max(50).optional().nullable(),
  consumerEmail: z.string().email(),
  consumerIsMinor: z.boolean().default(false),
  guardianName: z.string().max(200).optional().nullable(),
  guardianDocType: z.string().max(20).optional().nullable(),
  guardianDocNumber: z.string().max(50).optional().nullable(),

  // Servicio
  serviceType: z.enum(["PRODUCTO", "SERVICIO"]),
  serviceDescription: z.string().min(3).max(2000),
  amountCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).default("PEN"),
  serviceDate: z.string().optional().nullable(),

  // Detalle
  claimDetail: z.string().min(10).max(5000),
  consumerRequest: z.string().min(5).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: máximo 5 reclamos por IP por hora (anti-spam)
    const ip = getClientIp(request) || "unknown";
    const rate = await checkRateLimit(`claim:${ip}`, RATE_LIMITS.publicSubmission);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intente más tarde." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Validación: si es menor, los datos del tutor son obligatorios
    if (data.consumerIsMinor) {
      if (!data.guardianName || !data.guardianDocNumber) {
        return NextResponse.json(
          { error: "Si el consumidor es menor, debe completar los datos del padre/madre/tutor." },
          { status: 400 }
        );
      }
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    // Generar número correlativo: HR-YYYY-NNNNN
    const year = new Date().getFullYear();
    const lastClaim = await prisma.consumerClaim.findFirst({
      where: { claimNumber: { startsWith: `HR-${year}-` } },
      orderBy: { claimNumber: "desc" },
    });
    let seq = 1;
    if (lastClaim?.claimNumber) {
      const parts = lastClaim.claimNumber.split("-");
      seq = parseInt(parts[2] || "0", 10) + 1;
    }
    const claimNumber = `HR-${year}-${String(seq).padStart(5, "0")}`;

    // Plazo legal: 30 días calendario para responder
    const responseDueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const claim = await prisma.consumerClaim.create({
      data: {
        claimNumber,
        claimType: data.claimType,
        consumerName: data.consumerName.trim(),
        consumerDocType: data.consumerDocType,
        consumerDocNumber: data.consumerDocNumber.trim(),
        consumerAddress: data.consumerAddress || null,
        consumerPhone: data.consumerPhone || null,
        consumerEmail: data.consumerEmail.toLowerCase().trim(),
        consumerIsMinor: data.consumerIsMinor,
        guardianName: data.guardianName || null,
        guardianDocType: data.guardianDocType || null,
        guardianDocNumber: data.guardianDocNumber || null,
        serviceType: data.serviceType,
        serviceDescription: data.serviceDescription.trim(),
        amountCents: data.amountCents || null,
        currency: data.currency,
        serviceDate: data.serviceDate ? new Date(data.serviceDate) : null,
        claimDetail: data.claimDetail.trim(),
        consumerRequest: data.consumerRequest.trim(),
        responseDueAt,
        centerId: center.id,
        submitterIp: ip,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        centerId: center.id,
        action: "CREATE",
        entity: "ConsumerClaim",
        entityId: claim.id,
        meta: {
          claimNumber: claim.claimNumber,
          claimType: data.claimType,
          consumerEmail: data.consumerEmail,
          source: "PUBLIC_FORM",
        },
      },
    });

    // Enviar emails (consumidor + centro)
    try {
      const { sendEmail } = await import("@/lib/email/service");
      const claimTypeLabel =
        data.claimType === "RECLAMO" ? "Reclamo" : "Queja";

      // 1) Cargo de recibido al consumidor
      await sendEmail({
        to: data.consumerEmail,
        subject: `Cargo de recibido — ${claimNumber} | Libro de Reclamaciones CAARD`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background: #0B2A5B; color: white; padding: 24px; border-bottom: 4px solid #D66829;">
              <h1 style="margin: 0; font-size: 22px;">CAARD</h1>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: .9;">Libro de Reclamaciones</p>
            </div>
            <div style="padding: 24px; background: #fff;">
              <h2 style="color: #0B2A5B; margin-top: 0;">Cargo de Recibido</h2>
              <p>Estimado(a) ${data.consumerName}:</p>
              <p>Hemos recibido su <strong>${claimTypeLabel}</strong> y ha sido registrado oficialmente
              en nuestro Libro de Reclamaciones con el siguiente número:</p>
              <p style="background: #fff5e6; border-left: 4px solid #D66829; padding: 12px 16px; font-size: 18px; font-family: monospace; color: #0B2A5B;">
                <strong>${claimNumber}</strong>
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #555;">Tipo</td>
                  <td style="padding: 6px 0; font-weight: 600;">${claimTypeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #555;">Fecha de recepción</td>
                  <td style="padding: 6px 0; font-weight: 600;">${claim.receivedAt.toLocaleString("es-PE", { timeZone: "America/Lima" })}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #555;">Plazo de respuesta</td>
                  <td style="padding: 6px 0; font-weight: 600;">Hasta el ${responseDueAt.toLocaleDateString("es-PE")} (30 días calendario)</td>
                </tr>
              </table>
              <p>Atenderemos su ${claimTypeLabel.toLowerCase()} dentro del plazo legal y le responderemos
              al correo registrado.</p>
              <p style="font-size: 12px; color: #888; margin-top: 24px;">
                Centro de Administración de Arbitrajes y Resolución de Disputas (CAARD)<br>
                Jr. Aldebarán No. 596, Oficina 1409, Edificio IQ Surco, Santiago de Surco, Lima — Perú<br>
                info@caardpe.com · (51) 913 755 003
              </p>
            </div>
          </div>
        `,
        text: `Estimado(a) ${data.consumerName}, su ${claimTypeLabel} ha sido registrado con el número ${claimNumber}. Plazo de respuesta: ${responseDueAt.toLocaleDateString("es-PE")} (30 días calendario). CAARD.`,
      });

      // 2) Notificación al centro
      await sendEmail({
        to: "info@caardpe.com",
        subject: `[Libro de Reclamaciones] Nuevo ${claimTypeLabel} ${claimNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 700px;">
            <h2 style="color: #0B2A5B;">Nuevo ${claimTypeLabel} en el Libro de Reclamaciones</h2>
            <p><strong>Número:</strong> ${claimNumber}</p>
            <p><strong>Plazo legal de respuesta:</strong> ${responseDueAt.toLocaleDateString("es-PE")} (30 días)</p>
            <hr>
            <h3>Datos del consumidor</h3>
            <p>
              <strong>Nombre:</strong> ${data.consumerName}<br>
              <strong>Documento:</strong> ${data.consumerDocType} ${data.consumerDocNumber}<br>
              <strong>Email:</strong> ${data.consumerEmail}<br>
              <strong>Teléfono:</strong> ${data.consumerPhone || "—"}<br>
              <strong>Dirección:</strong> ${data.consumerAddress || "—"}
            </p>
            <h3>Servicio</h3>
            <p>
              <strong>Tipo:</strong> ${data.serviceType}<br>
              <strong>Descripción:</strong> ${data.serviceDescription}<br>
              ${data.amountCents ? `<strong>Monto:</strong> ${data.currency} ${(data.amountCents / 100).toFixed(2)}<br>` : ""}
              ${data.serviceDate ? `<strong>Fecha del servicio:</strong> ${data.serviceDate}<br>` : ""}
            </p>
            <h3>Detalle del ${claimTypeLabel.toLowerCase()}</h3>
            <p style="background: #fff5e6; padding: 12px; border-left: 4px solid #D66829;">${data.claimDetail.replace(/\n/g, "<br>")}</p>
            <h3>Pedido del consumidor</h3>
            <p>${data.consumerRequest.replace(/\n/g, "<br>")}</p>
            <hr>
            <p style="font-size: 12px; color: #888;">
              Gestionar desde <a href="https://caardpe.com/admin/libro-reclamaciones">/admin/libro-reclamaciones</a>
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Error enviando emails de reclamación:", emailErr);
      // No bloqueamos: el reclamo ya quedó en DB
    }

    return NextResponse.json(
      {
        success: true,
        claimNumber,
        receivedAt: claim.receivedAt.toISOString(),
        responseDueAt: claim.responseDueAt.toISOString(),
        message:
          "Su reclamación ha sido registrada. Recibirá un correo con el número de hoja correlativo.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en libro de reclamaciones:", error);
    return NextResponse.json(
      { error: error?.message || "Error al registrar la reclamación" },
      { status: 500 }
    );
  }
}
