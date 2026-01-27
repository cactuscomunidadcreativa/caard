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

// Configuración
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
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

    // Crear directorio de uploads si no existe
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const uploadPath = path.join(UPLOAD_DIR, String(year), month);

    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // Generar nombre único
    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const uniqueId = uuidv4().split("-")[0];
    const safeFilename = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
    const filename = `${uniqueId}-${safeFilename}`;
    const filepath = path.join(uploadPath, filename);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL pública
    const url = `/uploads/${year}/${month}/${filename}`;

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
        folder: `${year}/${month}`,
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
