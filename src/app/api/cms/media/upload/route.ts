/**
 * CAARD CMS - API de Subida de Archivos
 * =====================================
 * Maneja la subida de imágenes al servidor
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { google } from "googleapis";

async function uploadToDrive(buffer: Buffer, filename: string, mimeType: string): Promise<{ id: string; url: string } | null> {
  try {
    const center = await prisma.center.findFirst({ select: { id: true, notificationSettings: true } });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) return null;
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });
    // Find or create CMS_MEDIA folder
    const q = `name='CAARD_CMS_MEDIA' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`;
    const fr = await drive.files.list({ q, fields: "files(id)" });
    let folderId = fr.data.files?.[0]?.id;
    if (!folderId) {
      const cf = await drive.files.create({
        requestBody: { name: "CAARD_CMS_MEDIA", mimeType: "application/vnd.google-apps.folder" },
        fields: "id",
      });
      folderId = cf.data.id!;
    }
    const { Readable } = await import("stream");
    const up = await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType, body: Readable.from(buffer) },
      fields: "id",
    });
    // Make public
    await drive.permissions.create({
      fileId: up.data.id!,
      requestBody: { role: "reader", type: "anyone" },
    });
    return {
      id: up.data.id!,
      url: `https://drive.google.com/uc?export=view&id=${up.data.id}`,
    };
  } catch (e: any) {
    console.error("upload to drive failed:", e.message);
    return null;
  }
}

// Configuración
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // SVG excluido por riesgo de XSS - los SVGs pueden contener scripts maliciosos
];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar rol (solo admin y staff pueden subir)
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Obtener el archivo del formData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo excede el límite de ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo: JPG, PNG, GIF, WebP, SVG" },
        { status: 400 }
      );
    }

    // Generar nombre único
    const uniqueId = uuidv4().split("-")[0];
    const safeFilename = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
    const filename = `${uniqueId}-${safeFilename}`;

    // Leer archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // En producción (Vercel) el FS es read-only → subir a Google Drive
    // En dev intenta guardar localmente como antes y si falla, usa Drive
    let url: string;
    const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    if (!isProd) {
      try {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, "0");
        const uploadPath = path.join(UPLOAD_DIR, String(year), month);
        if (!existsSync(uploadPath)) await mkdir(uploadPath, { recursive: true });
        const filepath = path.join(uploadPath, filename);
        await writeFile(filepath, buffer);
        url = `/uploads/${year}/${month}/${filename}`;
      } catch {
        const drv = await uploadToDrive(buffer, filename, file.type);
        if (!drv) {
          return NextResponse.json({ error: "No se pudo guardar el archivo" }, { status: 500 });
        }
        url = drv.url;
      }
    } else {
      const drv = await uploadToDrive(buffer, filename, file.type);
      if (!drv) {
        return NextResponse.json({ error: "No se pudo subir a Drive (verifica conexión Google)" }, { status: 500 });
      }
      url = drv.url;
    }

    // Obtener dimensiones si es imagen
    let width: number | undefined;
    let height: number | undefined;

    // Para imágenes, intentar obtener dimensiones con sharp si está disponible
    try {
      const sharp = (await import("sharp")).default;
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch {
      // Sharp no disponible o error al procesar
    }

    // Obtener centro del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { centerId: true },
    });

    let centerId = user?.centerId;

    if (!centerId) {
      // Obtener centro por defecto
      const defaultCenter = await prisma.center.findFirst({
        where: { code: "CAARD" },
      });
      if (!defaultCenter) {
        return NextResponse.json(
          { error: "Centro no configurado" },
          { status: 500 }
        );
      }
      centerId = defaultCenter.id;
    }

    // Guardar en base de datos
    const media = await prisma.cmsMedia.create({
      data: {
        centerId,
        filename: filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        width,
        height,
        folder: `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json({
      id: media.id,
      url: media.url,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      width: media.width,
      height: media.height,
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir el archivo" },
      { status: 500 }
    );
  }
}
