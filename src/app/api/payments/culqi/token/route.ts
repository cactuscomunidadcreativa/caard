/**
 * CAARD - API para crear tokens de Culqi
 * Endpoint: POST /api/payments/culqi/token
 */

import { NextRequest, NextResponse } from "next/server";
import { CULQI_CONFIG } from "@/lib/culqi/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { card_number, cvv, expiration_month, expiration_year, email } = body;

    // Validaciones básicas
    if (!card_number || !cvv || !expiration_month || !expiration_year || !email) {
      return NextResponse.json(
        {
          error: "Datos incompletos",
          user_message: "Por favor complete todos los campos de la tarjeta",
        },
        { status: 400 }
      );
    }

    // Verificar configuración de Culqi
    if (!CULQI_CONFIG.publicKey) {
      console.error("Culqi public key not configured");
      return NextResponse.json(
        {
          error: "Configuración de pagos incompleta",
          user_message: "El sistema de pagos no está configurado correctamente",
        },
        { status: 500 }
      );
    }

    // Crear token con API de Culqi
    const response = await fetch("https://secure.culqi.com/v2/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CULQI_CONFIG.publicKey}`,
      },
      body: JSON.stringify({
        card_number: card_number.replace(/\s/g, ""),
        cvv,
        expiration_month,
        expiration_year,
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Culqi token error:", data);
      return NextResponse.json(
        {
          error: data.merchant_message || "Error al crear token",
          user_message: data.user_message || "No se pudo procesar la tarjeta. Verifique los datos.",
          type: data.type,
        },
        { status: response.status }
      );
    }

    // Retornar token (sin datos sensibles)
    return NextResponse.json({
      id: data.id,
      type: data.type,
      email: data.email,
      card_number: data.card_number,
      last_four: data.last_four,
      active: data.active,
      iin: data.iin,
    });
  } catch (error) {
    console.error("Error creating Culqi token:", error);
    return NextResponse.json(
      {
        error: "Error interno",
        user_message: "Ocurrió un error al procesar la tarjeta. Intente nuevamente.",
      },
      { status: 500 }
    );
  }
}
