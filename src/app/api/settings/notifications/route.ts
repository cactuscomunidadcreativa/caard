/**
 * CAARD - API de Configuración de Notificaciones
 * GET: Obtener configuración de SMS, WhatsApp, Email
 * PUT: Actualizar configuración
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateSmsCache } from "@/lib/sms/service";
import { invalidateWhatsAppCache } from "@/lib/whatsapp/service";

// GET - Obtener configuración
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Get all notification settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: "sms.",
        },
      },
    });

    const whatsappSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: "whatsapp.",
        },
      },
    });

    // Check email configuration from notificationSettings JSON
    const center = await prisma.center.findFirst({
      select: {
        notificationSettings: true,
      },
    });

    const notifSettings = (center?.notificationSettings as any) || {};

    const smsMap = settings.reduce((acc, s) => {
      const key = s.key.replace("sms.", "");
      acc[key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const waMap = whatsappSettings.reduce((acc, s) => {
      const key = s.key.replace("whatsapp.", "");
      acc[key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      // SMS
      smsEnabled: smsMap.enabled === "true",
      smsProvider: smsMap.provider || "twilio",
      smsAccountSid: smsMap.accountSid ? "***configured***" : "",
      smsAuthToken: smsMap.authToken ? "***configured***" : "",
      smsFromNumber: smsMap.fromNumber || "",
      // WhatsApp
      whatsappEnabled: waMap.enabled === "true",
      whatsappProvider: waMap.provider || "twilio",
      whatsappAccountSid: waMap.accountSid ? "***configured***" : "",
      whatsappAuthToken: waMap.authToken ? "***configured***" : "",
      whatsappPhoneNumberId: waMap.phoneNumberId || "",
      whatsappAccessToken: waMap.accessToken ? "***configured***" : "",
      whatsappFromNumber: waMap.fromNumber || "",
      // Email
      emailConfigured: !!(notifSettings?.smtpHost && notifSettings?.smtpUser),
    });
  } catch (error) {
    console.error("Error fetching notification config:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
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
    const { section, config } = body;

    if (section === "sms") {
      const smsSettings = [
        { key: "sms.enabled", value: config.smsEnabled?.toString() || "false" },
        { key: "sms.provider", value: config.smsProvider || "twilio" },
        { key: "sms.fromNumber", value: config.smsFromNumber || "" },
      ];

      // Only update credentials if they're not masked
      if (config.smsAccountSid && !config.smsAccountSid.includes("***")) {
        smsSettings.push({ key: "sms.accountSid", value: config.smsAccountSid });
      }
      if (config.smsAuthToken && !config.smsAuthToken.includes("***")) {
        smsSettings.push({ key: "sms.authToken", value: config.smsAuthToken });
      }

      for (const setting of smsSettings) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            description: `SMS ${setting.key.replace("sms.", "")} configuration`,
          },
        });
      }

      // Invalidate cache
      invalidateSmsCache();
    }

    if (section === "whatsapp") {
      const waSettings = [
        { key: "whatsapp.enabled", value: config.whatsappEnabled?.toString() || "false" },
        { key: "whatsapp.provider", value: config.whatsappProvider || "twilio" },
        { key: "whatsapp.fromNumber", value: config.whatsappFromNumber || "" },
        { key: "whatsapp.phoneNumberId", value: config.whatsappPhoneNumberId || "" },
      ];

      // Only update credentials if they're not masked
      if (config.whatsappAccountSid && !config.whatsappAccountSid.includes("***")) {
        waSettings.push({ key: "whatsapp.accountSid", value: config.whatsappAccountSid });
      }
      if (config.whatsappAuthToken && !config.whatsappAuthToken.includes("***")) {
        waSettings.push({ key: "whatsapp.authToken", value: config.whatsappAuthToken });
      }
      if (config.whatsappAccessToken && !config.whatsappAccessToken.includes("***")) {
        waSettings.push({ key: "whatsapp.accessToken", value: config.whatsappAccessToken });
      }

      for (const setting of waSettings) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            description: `WhatsApp ${setting.key.replace("whatsapp.", "")} configuration`,
          },
        });
      }

      // Invalidate cache
      invalidateWhatsAppCache();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification config:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
