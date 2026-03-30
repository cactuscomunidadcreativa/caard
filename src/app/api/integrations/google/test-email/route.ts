/**
 * CAARD - Endpoint de prueba de email via Gmail API
 * Envia un correo de prueba para verificar que la integracion funciona
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleWorkspaceService } from "@/lib/google-workspace";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const to = body.to || session.user.email;

    if (!to) {
      return NextResponse.json(
        { error: "Se requiere un email destinatario" },
        { status: 400 }
      );
    }

    const workspace = getGoogleWorkspaceService();
    if (!workspace.isConfigured()) {
      return NextResponse.json(
        { error: "Google Workspace no configurado. Falta GOOGLE_REFRESH_TOKEN." },
        { status: 503 }
      );
    }

    const result = await workspace.sendEmail({
      to,
      subject: "CAARD - Correo de prueba (Gmail API)",
      htmlBody: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #0B2A5B 0%, #1a4a8f 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">CAARD</h1>
        <p style="color: #D66829; margin: 5px 0 0; font-size: 14px;">Centro de Arbitraje</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #0B2A5B;">Correo de Prueba</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Este correo fue enviado exitosamente mediante la <strong>Gmail API</strong> de Google Workspace.
        </p>
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724; font-size: 14px;">
            <strong>Estado:</strong> La integracion con Gmail API esta funcionando correctamente.
          </p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Enviado desde: info@caardpe.com<br>
          Metodo: Gmail API (OAuth2)<br>
          Fecha: ${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })}
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #0B2A5B; padding: 20px; text-align: center;">
        <p style="color: #ffffff80; font-size: 12px; margin: 0;">
          CAARD - Sistema de Arbitraje | Correo de prueba
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      from: "info@caardpe.com",
      fromName: "CAARD - Sistema de Arbitraje",
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: `Correo de prueba enviado a ${to}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Error al enviar correo de prueba" },
      { status: 500 }
    );
  }
}
