/**
 * CAARD CMS - API de Subida de Documentos
 * ========================================
 * Maneja la subida de documentos (PDF, Excel, Word) al servidor
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { google } from "googleapis";

async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  category: string
): Promise<{ id: string; url: string } | null> {
  try {
    const center = await prisma.center.findFirst({
      select: { notificationSettings: true },
    });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) return null;
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    // CAARD_CMS_DOCS / {category}
    async function findOrCreate(name: string, parent?: string): Promise<string> {
      const parentQ = parent ? ` and '${parent}' in parents` : " and 'root' in parents";
      const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentQ}`;
      const fr = await drive.files.list({ q, fields: "files(id)" });
      if (fr.data.files?.[0]?.id) return fr.data.files[0].id;
      const cf = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          ...(parent ? { parents: [parent] } : {}),
        },
        fields: "id",
      });
      return cf.data.id!;
    }
    const rootId = await findOrCreate("CAARD_CMS_DOCS");
    const catId = await findOrCreate(category || "general", rootId);

    const { Readable } = await import("stream");
    const up = await drive.files.create({
      requestBody: { name: filename, parents: [catId] },
      media: { mimeType, body: Readable.from(buffer) },
      fields: "id",
    });
    await drive.permissions.create({
      fileId: up.data.id!,
      requestBody: { role: "reader", type: "anyone" },
    });
    return { id: up.data.id!, url: `drive:${up.data.id}` };
  } catch (e: any) {
    console.error("doc upload to drive failed:", e?.message);
    return null;
  }
}

// Configuración
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB para documentos
const ALLOWED_TYPES: Record<string, string[]> = {
  // PDFs
  "application/pdf": [".pdf"],
  // Excel
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  // Word
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  // PowerPoint
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  // Texto
  "text/plain": [".txt"],
  // CSV
  "text/csv": [".csv"],
  // Imágenes (para CVs con foto, etc.)
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "documents");

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar rol
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];
    if (!allowedRoles.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Obtener el archivo del formData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string || "general";

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
    if (!ALLOWED_TYPES[file.type]) {
      const allowedExtensions = Object.values(ALLOWED_TYPES).flat().join(", ");
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Formatos aceptados: ${allowedExtensions}` },
        { status: 400 }
      );
    }

    // Generar nombre único
    const ext = path.extname(file.name) || ALLOWED_TYPES[file.type][0];
    const uniqueId = uuidv4().split("-")[0];
    const safeFilename = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .replace(new RegExp(`${ext}$`, "i"), ""); // Remover extensión duplicada
    const filename = `${uniqueId}-${safeFilename}${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // En producción (Vercel) el FS es read-only → Drive; en dev intenta local primero.
    let url: string;
    const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    if (!isProd) {
      try {
        const uploadPath = path.join(UPLOAD_DIR, category, String(year), month);
        if (!existsSync(uploadPath)) await mkdir(uploadPath, { recursive: true });
        const filepath = path.join(uploadPath, filename);
        await writeFile(filepath, buffer);
        url = `/uploads/documents/${category}/${year}/${month}/${filename}`;
      } catch {
        const drv = await uploadToDrive(buffer, filename, file.type, category);
        if (!drv) {
          return NextResponse.json(
            { error: "No se pudo guardar el archivo" },
            { status: 500 }
          );
        }
        url = drv.url;
      }
    } else {
      const drv = await uploadToDrive(buffer, filename, file.type, category);
      if (!drv) {
        return NextResponse.json(
          { error: "No se pudo subir a Drive (verifica conexión Google)" },
          { status: 500 }
        );
      }
      url = drv.url;
    }

    // Obtener centro del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { centerId: true },
    });

    let centerId = user?.centerId;

    if (!centerId) {
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
        folder: `documents/${category}/${year}/${month}`,
        uploadedById: session.user.id,
      },
    });

    // Determinar el tipo de documento para mostrar en UI
    let fileType = "file";
    if (file.type === "application/pdf") fileType = "pdf";
    else if (file.type.includes("spreadsheet") || file.type.includes("excel") || file.type.includes("csv")) fileType = "excel";
    else if (file.type.includes("word") || file.type.includes("document")) fileType = "word";
    else if (file.type.includes("presentation") || file.type.includes("powerpoint")) fileType = "powerpoint";
    else if (file.type.includes("image")) fileType = "image";

    // Si es archivo en Drive servimos vía proxy
    const publicUrl = media.url.startsWith("/uploads/")
      ? media.url
      : `/api/cms/media/${media.id}/file`;

    return NextResponse.json({
      id: media.id,
      url: publicUrl,
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
      fileType,
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir el documento" },
      { status: 500 }
    );
  }
}
