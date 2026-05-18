/**
 * POST /api/cases/[id]/escritos/ai-draft
 *
 * Genera el borrador de un escrito procesal (Orden Procesal, alegato,
 * solicitud, etc.) usando el proveedor de IA configurado. NO crea el
 * documento en BD — devuelve solo el texto para que la UI lo muestre
 * en un editor; cuando el usuario confirma, presenta el escrito vía
 * POST /api/cases/[id]/escritos con un archivo .txt generado del texto.
 *
 * Body: { documentType: string, prompt: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAIResponse } from "@/lib/ai/provider";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const body = await req.json();
    const documentType: string = (body.documentType || "Escrito").toString().slice(0, 80);
    const prompt: string = (body.prompt || "").toString().trim().slice(0, 4000);
    if (!prompt) {
      return NextResponse.json({ error: "Falta el prompt" }, { status: 400 });
    }

    // Verificar acceso al caso (staff, árbitro o miembro)
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        code: true,
        title: true,
        claimantName: true,
        respondentName: true,
        status: true,
        members: {
          where: { userId: session.user.id },
          select: { id: true, role: true },
        },
      },
    });
    if (!caseData) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }
    const isStaff = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "FINANZAS"].includes(
      session.user.role
    );
    if (!isStaff && caseData.members.length === 0) {
      return NextResponse.json(
        { error: "No tiene acceso a este caso" },
        { status: 403 }
      );
    }

    const systemPrompt = `Eres un asistente legal especializado en arbitraje peruano para el Centro de Arbitraje y Resolución de Disputas (CAARD). Tu tarea es redactar el borrador de un documento procesal en español, en estilo formal jurídico peruano, listo para que un abogado o árbitro lo revise antes de firmar.

REGLAS:
- Usa estructura profesional con encabezado, considerandos numerados y parte resolutiva cuando corresponda.
- Cita el Decreto Legislativo 1071 (Ley General de Arbitraje del Perú) si es relevante.
- NO inventes hechos. Si te faltan datos, deja marcadores claros entre corchetes como [FECHA], [MONTO], [NOMBRE DE LA PARTE].
- NO uses comillas tipográficas raras. Usa comillas normales.
- Devuelve SOLO el texto del documento, sin explicaciones previas, sin markdown.`;

    const userMessage = `Expediente: ${caseData.code}
Caratula: ${caseData.title || "(sin título)"}
Demandante: ${caseData.claimantName || "(no especificado)"}
Demandado: ${caseData.respondentName || "(no especificado)"}
Estado: ${caseData.status}

Tipo de documento a redactar: ${documentType}

Indicaciones del usuario:
${prompt}

Redacta el documento completo.`;

    const result = await generateAIResponse(systemPrompt, userMessage, [], {
      maxTokens: 2000,
      provider: "auto",
    });

    return NextResponse.json({
      text: result.content,
      model: result.model,
      provider: result.provider,
      tokens: result.totalTokens,
    });
  } catch (e: any) {
    console.error("ai-draft error:", e);
    return NextResponse.json(
      { error: e?.message || "Error generando borrador" },
      { status: 500 }
    );
  }
}
