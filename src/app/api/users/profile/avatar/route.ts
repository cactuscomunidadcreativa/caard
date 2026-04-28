/**
 * POST /api/users/profile/avatar — sube foto de perfil del usuario autenticado.
 * El archivo se guarda en /public/avatars/{userId}.{ext} y se actualiza
 * User.image con la URL pública.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const fd = await request.formData();
    const file = fd.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Falta archivo" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede 2 MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG, WEBP o GIF." },
        { status: 400 }
      );
    }

    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${session.user.id}-${Date.now()}.${ext}`;

    const dir = join(process.cwd(), "public", "avatars");
    await mkdir(dir, { recursive: true });
    const filepath = join(dir, filename);

    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buf);

    const publicUrl = `/avatars/${filename}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: publicUrl },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "User",
        entityId: session.user.id,
        meta: { operation: "AVATAR_UPLOADED", url: publicUrl },
      },
    });

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e: any) {
    console.error("avatar upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al subir foto" },
      { status: 500 }
    );
  }
}
