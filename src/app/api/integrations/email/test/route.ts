/**
 * CAARD - API de Prueba de Email
 * POST /api/integrations/email/test - Enviar email de prueba
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";
import { z } from "zod";

const testEmailSchema = z.object({
  smtpHost: z.string().min(1),
  smtpPort: z.string(),
  smtpUser: z.string().email(),
  smtpPassword: z.string().min(1),
  smtpFrom: z.string().email(),
  smtpFromName: z.string(),
  testEmail: z.string().email(),
});

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
    const config = testEmailSchema.parse(body);

    // Crear transporter de nodemailer
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: config.smtpPort === "465",
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    // Verificar conexión
    await transporter.verify();

    // Enviar email de prueba
    await transporter.sendMail({
      from: `"${config.smtpFromName}" <${config.smtpFrom}>`,
      to: config.testEmail,
      subject: "CAARD - Email de prueba",
      text: "Este es un email de prueba del sistema CAARD. Si lo recibes, la configuración SMTP está correcta.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0B2A5B;">CAARD - Email de prueba</h2>
          <p>Este es un email de prueba del sistema CAARD.</p>
          <p>Si lo recibes, la configuración SMTP está correcta.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            Este email fue enviado desde el panel de administración de CAARD.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Email de prueba enviado a ${config.testEmail}`,
    });
  } catch (error) {
    console.error("Error sending test email:", error);

    let errorMessage = "Error al enviar email de prueba";
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        errorMessage = "No se pudo conectar al servidor SMTP";
      } else if (error.message.includes("Invalid login")) {
        errorMessage = "Credenciales SMTP inválidas";
      } else if (error.message.includes("ETIMEDOUT")) {
        errorMessage = "Tiempo de espera agotado al conectar al servidor SMTP";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
