/**
 * API para configuración de variables de entorno del sistema
 * GET /api/admin/env-config - Lista estado de variables de entorno
 * PUT /api/admin/env-config - Actualiza una variable en .env.local
 * Solo accesible por SUPER_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
}

interface EnvCategory {
  id: string;
  name: string;
  description: string;
  variables: EnvVariable[];
}

const ENV_CATEGORIES: EnvCategory[] = [
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Integración con Google Drive para almacenamiento de documentos",
    variables: [
      { name: "GOOGLE_CLIENT_ID", required: true, description: "Client ID de Google Cloud Console" },
      { name: "GOOGLE_CLIENT_SECRET", required: true, description: "Client Secret de Google Cloud Console" },
      { name: "GOOGLE_REDIRECT_URI", required: true, description: "URI de callback OAuth" },
      { name: "GOOGLE_DRIVE_ROOT_FOLDER_ID", required: true, description: "ID carpeta raíz en Google Drive" },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    description: "Configuración de CDN y dominios con Cloudflare",
    variables: [
      { name: "CLOUDFLARE_API_TOKEN", required: false, description: "Token API de Cloudflare" },
      { name: "CLOUDFLARE_ZONE_ID", required: false, description: "Zone ID del dominio" },
      { name: "CLOUDFLARE_ACCOUNT_ID", required: false, description: "Account ID de Cloudflare" },
      { name: "NEXT_PUBLIC_SITE_URL", required: true, description: "URL pública del sitio" },
    ],
  },
  {
    id: "email",
    name: "Email (SMTP)",
    description: "Configuración del servidor de correo electrónico",
    variables: [
      { name: "SMTP_HOST", required: false, description: "Servidor SMTP" },
      { name: "SMTP_PORT", required: false, description: "Puerto SMTP" },
      { name: "SMTP_USER", required: false, description: "Usuario SMTP" },
      { name: "SMTP_PASS", required: false, description: "Contraseña SMTP" },
      { name: "EMAIL_FROM", required: false, description: "Dirección de envío" },
    ],
  },
  {
    id: "payments",
    name: "Pagos (Culqi)",
    description: "Pasarela de pagos Culqi para transacciones",
    variables: [
      { name: "CULQI_PUBLIC_KEY", required: false, description: "Llave pública Culqi" },
      { name: "CULQI_SECRET_KEY", required: false, description: "Llave privada Culqi" },
    ],
  },
  {
    id: "ai",
    name: "Inteligencia Artificial",
    description: "APIs de IA para asistentes y procesamiento",
    variables: [
      { name: "OPENAI_API_KEY", required: false, description: "API Key de OpenAI" },
      { name: "ANTHROPIC_API_KEY", required: false, description: "API Key de Anthropic" },
    ],
  },
  {
    id: "database",
    name: "Base de Datos",
    description: "Conexión a la base de datos PostgreSQL",
    variables: [
      { name: "DATABASE_URL", required: true, description: "URL de conexión PostgreSQL" },
    ],
  },
  {
    id: "auth",
    name: "Autenticación (NextAuth)",
    description: "Configuración de autenticación del sistema",
    variables: [
      { name: "NEXTAUTH_SECRET", required: true, description: "Secret para NextAuth.js" },
      { name: "NEXTAUTH_URL", required: true, description: "URL base para NextAuth" },
    ],
  },
];

// Variables that are safe to show their actual value
const PUBLIC_VARS = new Set(
  ENV_CATEGORIES.flatMap((cat) =>
    cat.variables
      .filter((v) => v.name.startsWith("NEXT_PUBLIC_"))
      .map((v) => v.name)
  )
);

// All allowed variable names for PUT validation
const ALLOWED_KEYS = new Set(
  ENV_CATEGORIES.flatMap((cat) => cat.variables.map((v) => v.name))
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN puede acceder a esta configuración" }, { status: 403 });
    }

    const categories = ENV_CATEGORIES.map((category) => ({
      ...category,
      variables: category.variables.map((variable) => {
        const value = process.env[variable.name];
        const isSet = !!value && value.length > 0;
        const isPublic = PUBLIC_VARS.has(variable.name);

        return {
          name: variable.name,
          isSet,
          category: category.id,
          description: variable.description,
          isRequired: variable.required,
          value: isPublic && isSet ? value : undefined,
        };
      }),
    }));

    // Compute stats
    const allVars = categories.flatMap((c) => c.variables);
    const total = allVars.length;
    const configured = allVars.filter((v) => v.isSet).length;
    const missing = total - configured;
    const requiredMissing = allVars.filter((v) => v.isRequired && !v.isSet).length;

    return NextResponse.json({
      categories,
      stats: { total, configured, missing, requiredMissing },
    });
  } catch (error) {
    console.error("Error en GET /api/admin/env-config:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN puede modificar la configuración" }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Se requiere la clave (key)" }, { status: 400 });
    }

    if (typeof value !== "string") {
      return NextResponse.json({ error: "Se requiere el valor (value) como string" }, { status: 400 });
    }

    if (!ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: `Variable '${key}' no está en la lista permitida` }, { status: 400 });
    }

    // Read existing .env.local or create empty
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";

    try {
      envContent = fs.readFileSync(envPath, "utf-8");
    } catch {
      // File doesn't exist yet, start with empty
    }

    // Parse existing env lines
    const lines = envContent.split("\n");
    let found = false;
    const updatedLines = lines.map((line) => {
      const trimmed = line.trim();
      // Match KEY=value or KEY="value" patterns, skip comments
      if (!trimmed.startsWith("#") && trimmed.startsWith(key + "=")) {
        found = true;
        return `${key}=${value}`;
      }
      return line;
    });

    if (!found) {
      // Add the new key at the end
      if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== "") {
        updatedLines.push("");
      }
      updatedLines.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, updatedLines.join("\n"), "utf-8");

    // Update process.env so the change is reflected immediately
    process.env[key] = value;

    return NextResponse.json({
      success: true,
      message: `Variable '${key}' actualizada correctamente. Puede requerir reinicio del servidor para tomar efecto completo.`,
    });
  } catch (error) {
    console.error("Error en PUT /api/admin/env-config:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
