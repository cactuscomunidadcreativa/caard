/**
 * CAARD - API de Prueba de Notificaciones
 * POST: Enviar mensaje de prueba por SMS o WhatsApp
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendSms } from "@/lib/sms/service";
import { sendWhatsApp } from "@/lib/whatsapp/service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { channel, phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Número de teléfono requerido" },
        { status: 400 }
      );
    }

    const testMessage = `CAARD - Mensaje de prueba\n\nEste es un mensaje de prueba enviado desde el panel de configuración.\n\nFecha: ${new Date().toLocaleString("es-PE")}`;

    let result;

    if (channel === "sms") {
      result = await sendSms({
        to: phone,
        message: "CAARD - Prueba SMS. Si recibe este mensaje, la configuración es correcta.",
      });
    } else if (channel === "whatsapp") {
      result = await sendWhatsApp({
        to: phone,
        message: testMessage,
      });
    } else {
      return NextResponse.json(
        { error: "Canal no válido" },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Error al enviar mensaje",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Error al enviar mensaje de prueba" },
      { status: 500 }
    );
  }
}
