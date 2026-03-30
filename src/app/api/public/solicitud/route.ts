/**
 * CAARD - API Pública de Solicitud Arbitral
 * POST /api/public/solicitud - Crear nueva solicitud (sin autenticación)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicRequestSchema } from "@/lib/validations/public-request";
import { createCharge, isCulqiConfigured } from "@/lib/culqi/client";
import { CASE_FOLDER_STRUCTURE } from "@/config/constants";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { generateCaseCode } from "@/lib/case-code";

/**
 * POST /api/public/solicitud
 * Crea una nueva solicitud arbitral desde el formulario público
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting para solicitudes públicas
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`solicitud:${ip}`, RATE_LIMITS.publicSubmission);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intente más tarde." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Extraer token de pago si viene
    const { culqiToken, ...formData } = body;

    // Validar datos del formulario
    const validationResult = publicRequestSchema.safeParse(formData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Obtener centro por defecto (CAARD)
    const center = await prisma.center.findFirst({
      where: { code: "CAARD" },
    });

    if (!center) {
      return NextResponse.json(
        { error: "Centro de arbitraje no configurado" },
        { status: 500 }
      );
    }

    // Verificar tipo de arbitraje
    const arbitrationType = await prisma.arbitrationType.findFirst({
      where: {
        id: data.tipoArbitraje,
        centerId: center.id,
        isActive: true,
      },
    });

    if (!arbitrationType) {
      return NextResponse.json(
        { error: "Tipo de arbitraje no válido" },
        { status: 400 }
      );
    }

    // Construir nombres
    const claimantName = data.demandante.tipo === "PERSONA_NATURAL"
      ? `${data.demandante.nombres} ${data.demandante.apellidoPaterno} ${data.demandante.apellidoMaterno || ""}`.trim()
      : data.demandante.razonSocial || "";

    const respondentName = data.demandado.tipo === "PERSONA_NATURAL"
      ? `${data.demandado.nombres} ${data.demandado.apellidoPaterno} ${data.demandado.apellidoMaterno || ""}`.trim()
      : data.demandado.razonSocial || "";

    // Generar código
    const { code, year, sequence } = await generateCaseCode(center.id, false);

    // Calcular monto de tasa
    const feeAmount = arbitrationType.baseFeeCents || 50000; // Default S/ 500.00

    // Procesar pago con Culqi si hay token
    let paymentStatus: "PENDING" | "CONFIRMED" = "PENDING";
    let culqiChargeId: string | null = null;

    if (culqiToken && isCulqiConfigured()) {
      const chargeResult = await createCharge({
        amount: feeAmount,
        currency: arbitrationType.currency as "PEN" | "USD",
        email: data.demandante.email,
        sourceId: culqiToken,
        description: `Tasa de arbitraje - ${code}`,
        metadata: {
          case_code: code,
          arbitration_type: arbitrationType.code,
        },
      });

      if (chargeResult.success && chargeResult.charge) {
        paymentStatus = "CONFIRMED";
        culqiChargeId = chargeResult.charge.id;
      } else {
        // Si el pago falla, no creamos el caso
        return NextResponse.json(
          {
            error: "Error al procesar el pago",
            paymentError: chargeResult.error?.user_message || "Intente nuevamente",
          },
          { status: 402 }
        );
      }
    }

    // Crear el caso en una transacción
    const newCase = await prisma.$transaction(async (tx) => {
      // 1. Crear el caso
      const createdCase = await tx.case.create({
        data: {
          centerId: center.id,
          arbitrationTypeId: arbitrationType.id,
          year,
          sequence,
          code,
          title: `Solicitud arbitral - ${data.materia}`,
          status: "SUBMITTED", // Pendiente de revisión por Secretaría
          claimantName,
          respondentName,
          submittedAt: new Date(),
          // Guardar datos adicionales en JSON (si tienes campo meta)
        },
      });

      // 2. Crear o buscar usuario demandante
      let claimantUser = await tx.user.findUnique({
        where: { email: data.demandante.email },
      });

      if (!claimantUser) {
        claimantUser = await tx.user.create({
          data: {
            email: data.demandante.email,
            name: claimantName,
            role: "DEMANDANTE",
            centerId: center.id,
            phoneE164: data.demandante.celular || data.demandante.telefono || null,
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
          email: data.demandante.email,
          phoneE164: data.demandante.celular || data.demandante.telefono || null,
          isPrimary: true,
        },
      });

      // 4. Crear miembro demandado (sin usuario por ahora)
      await tx.caseMember.create({
        data: {
          caseId: createdCase.id,
          role: "DEMANDADO",
          displayName: respondentName,
          email: data.demandado.email,
          phoneE164: data.demandado.celular || data.demandado.telefono || null,
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

      // 6. Crear registro de pago
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);

      await tx.payment.create({
        data: {
          caseId: createdCase.id,
          provider: "CULQI",
          status: paymentStatus,
          currency: arbitrationType.currency,
          amountCents: feeAmount,
          concept: "Tasa de arbitraje",
          description: `Tasa administrativa - ${arbitrationType.name}`,
          dueAt: dueDate,
          culqiChargeId: culqiChargeId,
          paidAt: paymentStatus === "CONFIRMED" ? new Date() : null,
        },
      });

      // 7. Crear nota con los detalles de la solicitud
      await tx.caseNote.create({
        data: {
          caseId: createdCase.id,
          authorId: claimantUser.id,
          content: `
## Solicitud Arbitral

### Materia
${data.materia}

### Descripción de la Controversia
${data.descripcionControversia}

### Pretensiones
${data.pretensiones}

### Cuantía
${data.cuantiaDefinida ? `${data.moneda} ${data.montoCuantia?.toLocaleString()}` : "Cuantía indeterminada"}

### Contrato
${data.existeContrato ? `Sí - ${data.descripcionContrato || "Sin descripción"}` : "No especificado"}
${data.fechaContrato ? `Fecha: ${data.fechaContrato}` : ""}

### Cláusula Arbitral
${data.existeClausulaArbitral ? `Sí - ${data.textoClausulaArbitral || "Sin texto"}` : "No especificado"}

### Medios Probatorios
${data.mediosProbatorios || "No especificados"}

---
*Solicitud recibida el ${new Date().toLocaleString("es-PE")}*
          `.trim(),
          isPrivate: false,
        },
      });

      // 8. Registrar en audit log
      await tx.auditLog.create({
        data: {
          centerId: center.id,
          caseId: createdCase.id,
          userId: claimantUser.id,
          action: "CREATE",
          entity: "Case",
          entityId: createdCase.id,
          meta: {
            code: createdCase.code,
            source: "PUBLIC_FORM",
            paymentStatus,
          },
        },
      });

      return createdCase;
    });

    // Respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        data: {
          code: newCase.code,
          id: newCase.id,
          paymentStatus,
        },
        message: paymentStatus === "CONFIRMED"
          ? `Solicitud ${newCase.code} registrada exitosamente. Pago procesado correctamente.`
          : `Solicitud ${newCase.code} registrada. Pago pendiente.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating public request:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/public/solicitud
 * Obtiene los tipos de arbitraje disponibles (para el formulario)
 */
export async function GET() {
  try {
    const center = await prisma.center.findFirst({
      where: { code: "CAARD" },
    });

    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const arbitrationTypes = await prisma.arbitrationType.findMany({
      where: {
        centerId: center.id,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        baseFeeCents: true,
        currency: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      arbitrationTypes,
      center: {
        name: center.name,
        code: center.code,
      },
    });
  } catch (error) {
    console.error("Error fetching public data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
