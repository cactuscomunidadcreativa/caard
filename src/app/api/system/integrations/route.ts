/**
 * CAARD - API de Integraciones del Sistema
 * ========================================
 * Gestión de configuraciones de integraciones externas
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

// Clave de encriptación - Se recomienda configurar en producción
function getEncryptionKey(): string {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!key && process.env.NODE_ENV === "production") {
    console.warn("⚠️ INTEGRATION_ENCRYPTION_KEY no configurada. Usando clave derivada de NEXTAUTH_SECRET.");
  }
  return key || "caard-dev-only-key-" + (process.env.NEXTAUTH_SECRET || "dev").slice(0, 16);
}
const EFFECTIVE_ENCRYPTION_KEY = getEncryptionKey();

// Funciones de encriptación
function encrypt(text: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(EFFECTIVE_ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(EFFECTIVE_ENCRYPTION_KEY, "salt", 32);
    const [ivHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

// Schema de validación
const integrationSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  isActive: z.boolean(),
  isConfigured: z.boolean().optional(),
  credentials: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// Campos sensibles que deben ser encriptados
const SENSITIVE_FIELDS = ["password", "apiKey", "authToken", "clientSecret", "refreshToken"];

// Encriptar credenciales sensibles
function encryptCredentials(credentials: Record<string, any>): Record<string, any> {
  const encrypted: Record<string, any> = {};
  for (const [key, value] of Object.entries(credentials)) {
    if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase())) && typeof value === "string" && value) {
      encrypted[key] = encrypt(value);
    } else {
      encrypted[key] = value;
    }
  }
  return encrypted;
}

// Desencriptar credenciales para mostrar (parcialmente)
function decryptCredentials(credentials: Record<string, any>, mask = true): Record<string, any> {
  const decrypted: Record<string, any> = {};
  for (const [key, value] of Object.entries(credentials || {})) {
    if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase())) && typeof value === "string" && value.includes(":")) {
      const decryptedValue = decrypt(value);
      if (mask && decryptedValue) {
        // Mostrar solo los últimos 4 caracteres
        decrypted[key] = "••••••••" + decryptedValue.slice(-4);
      } else {
        decrypted[key] = decryptedValue;
      }
    } else {
      decrypted[key] = value;
    }
  }
  return decrypted;
}

// GET - Listar todas las integraciones
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const integrations = await prisma.systemIntegration.findMany({
      orderBy: { type: "asc" },
    });

    // Desencriptar credenciales (con máscara)
    const result = integrations.map((int) => ({
      id: int.id,
      code: int.code,
      name: int.name,
      type: int.type,
      isActive: int.isActive,
      isConfigured: int.isConfigured,
      credentials: decryptCredentials(int.credentials as Record<string, any> || {}, true),
      settings: int.settings || {},
      lastTestedAt: int.lastTestedAt?.toISOString(),
      lastTestStatus: int.lastTestStatus,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json({ error: "Error al obtener integraciones" }, { status: 500 });
  }
}

// POST - Crear nueva integración
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = integrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar si ya existe
    const existing = await prisma.systemIntegration.findFirst({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una integracion con este codigo" },
        { status: 409 }
      );
    }

    // Encriptar credenciales sensibles
    const encryptedCredentials = encryptCredentials(data.credentials);

    // Verificar si está configurado (tiene al menos algunas credenciales)
    const isConfigured = Object.keys(data.credentials).some(
      (k) => data.credentials[k] && data.credentials[k] !== ""
    );

    const integration = await prisma.systemIntegration.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type as any,
        isActive: data.isActive,
        isConfigured,
        credentials: encryptedCredentials as any,
        settings: (data.settings || {}) as any,
        createdById: session.user.id,
      },
    });

    // Registrar en audit log
    await prisma.systemAuditLog.create({
      data: {
        action: "CREATE",
        entityType: "SystemIntegration",
        entityId: integration.id,
        description: `Creada integracion: ${data.name}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id: integration.id,
      code: integration.code,
      name: integration.name,
      type: integration.type,
      isActive: integration.isActive,
      isConfigured: integration.isConfigured,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating integration:", error);
    return NextResponse.json({ error: "Error al crear integracion" }, { status: 500 });
  }
}

// PUT - Actualizar integración existente
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = integrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Buscar integración existente
    const existing = await prisma.systemIntegration.findFirst({
      where: data.id ? { id: data.id } : { code: data.code },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Integracion no encontrada" },
        { status: 404 }
      );
    }

    // Mantener credenciales existentes si no se proporcionan nuevas
    const existingCredentials = existing.credentials as Record<string, any> || {};
    const newCredentials: Record<string, any> = {};

    for (const [key, value] of Object.entries(data.credentials)) {
      if (value && typeof value === "string" && !value.startsWith("••••")) {
        // Si es un valor nuevo (no enmascarado), encriptarlo si es sensible
        if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
          newCredentials[key] = encrypt(value);
        } else {
          newCredentials[key] = value;
        }
      } else if (value && typeof value === "string" && value.startsWith("••••")) {
        // Si está enmascarado, mantener el valor existente
        newCredentials[key] = existingCredentials[key];
      } else {
        newCredentials[key] = value;
      }
    }

    // Verificar si está configurado
    const isConfigured = Object.keys(newCredentials).some(
      (k) => newCredentials[k] && newCredentials[k] !== ""
    );

    const integration = await prisma.systemIntegration.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        isActive: data.isActive,
        isConfigured,
        credentials: newCredentials as any,
        settings: (data.settings || {}) as any,
        lastModifiedById: session.user.id,
      },
    });

    // Registrar en audit log
    await prisma.systemAuditLog.create({
      data: {
        action: "UPDATE",
        entityType: "SystemIntegration",
        entityId: integration.id,
        description: `Actualizada integracion: ${data.name}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id: integration.id,
      code: integration.code,
      name: integration.name,
      type: integration.type,
      isActive: integration.isActive,
      isConfigured: integration.isConfigured,
    });
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json({ error: "Error al actualizar integracion" }, { status: 500 });
  }
}
