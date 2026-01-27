/**
 * CAARD - API para probar conexiones de notificacion
 * POST: Probar conexion de un canal especifico
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"];

// POST - Probar conexion
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { channel, settings } = await request.json();

    switch (channel) {
      case "email":
        return await testEmailConnection(settings);
      case "sms":
        return await testSmsConnection(settings);
      case "whatsapp":
        return await testWhatsappConnection(settings);
      default:
        return NextResponse.json(
          { error: "Canal no soportado" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    return NextResponse.json(
      { error: "Error al probar conexion" },
      { status: 500 }
    );
  }
}

async function testEmailConnection(settings: any) {
  try {
    // Verificar que los campos requeridos estan presentes
    if (!settings.smtpHost || !settings.smtpPort) {
      return NextResponse.json({
        success: false,
        error: "Faltan datos de configuracion SMTP",
      });
    }

    // Probar la conexion real con nodemailer
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Verificar conexion
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: "Conexion SMTP exitosa",
    });
  } catch (error: any) {
    console.error("Email connection test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error de conexion SMTP",
    });
  }
}

async function testSmsConnection(settings: any) {
  try {
    // Verificar que los campos requeridos estan presentes
    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
      return NextResponse.json({
        success: false,
        error: "Faltan credenciales de Twilio",
      });
    }

    // Validar el formato del Account SID
    if (!settings.twilioAccountSid.startsWith("AC")) {
      return NextResponse.json({
        success: false,
        error: "Account SID invalido (debe comenzar con AC)",
      });
    }

    // Validar formato basico de credenciales
    if (settings.twilioAuthToken.length < 32) {
      return NextResponse.json({
        success: false,
        error: "Auth Token parece invalido (muy corto)",
      });
    }

    // Por ahora solo validamos el formato de las credenciales
    // La prueba completa con Twilio requiere instalar el SDK
    return NextResponse.json({
      success: true,
      message: "Credenciales de Twilio validadas correctamente",
    });
  } catch (error: any) {
    console.error("SMS connection test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error de conexion Twilio",
    });
  }
}

async function testWhatsappConnection(settings: any) {
  try {
    // Verificar que los campos requeridos estan presentes
    if (!settings.whatsappApiKey || !settings.whatsappPhoneNumberId) {
      return NextResponse.json({
        success: false,
        error: "Faltan credenciales de WhatsApp Business",
      });
    }

    if (settings.whatsappProvider === "twilio") {
      // Verificar credenciales de Twilio primero
      if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
        return NextResponse.json({
          success: false,
          error: "Faltan credenciales de Twilio para WhatsApp",
        });
      }

      // Validar formato
      if (!settings.twilioAccountSid.startsWith("AC")) {
        return NextResponse.json({
          success: false,
          error: "Account SID invalido (debe comenzar con AC)",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Credenciales de Twilio WhatsApp validadas correctamente",
      });
    } else {
      // Usar Meta Business API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${settings.whatsappPhoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${settings.whatsappApiKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({
          success: false,
          error: error.error?.message || "Error de autenticacion con Meta",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Conexion WhatsApp Business exitosa",
    });
  } catch (error: any) {
    console.error("WhatsApp connection test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error de conexion WhatsApp",
    });
  }
}
