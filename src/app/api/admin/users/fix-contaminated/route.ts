/**
 * POST /api/admin/users/fix-contaminated
 * Reparación manual de registros User cuyos datos fueron sobrescritos
 * por el bug de Google OAuth (commit 5690367, revertido en 186b9f1).
 *
 * Body: { id?: string, email?: string, newName?: string, newEmail?: string, newImage?: string | null }
 *
 * Uso típico:
 *   { "email": "administracion@caardpe.com", "newName": "Administración CAARD" }
 *   { "email": "fabricio-old@caardpe.com", "newEmail": "administracion@caardpe.com" }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN" }, { status: 403 });
    }

    const body = await req.json();
    const { id, email, newName, newEmail, newImage } = body as {
      id?: string;
      email?: string;
      newName?: string;
      newEmail?: string;
      newImage?: string | null;
    };

    if (!id && !email) {
      return NextResponse.json(
        { error: "Se requiere id o email para identificar al usuario" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = id
      ? await prisma.user.findUnique({ where: { id } })
      : await prisma.user.findFirst({
          where: { email: { equals: email!.toLowerCase().trim(), mode: "insensitive" } },
        });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const updates: any = {};
    if (newName !== undefined) updates.name = newName;
    if (newEmail !== undefined) updates.email = newEmail.toLowerCase().trim();
    if (newImage !== undefined) updates.image = newImage;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No se proporcionó ningún campo a actualizar (newName/newEmail/newImage)" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        updatedAt: true,
      },
    });

    // Invalidar sesiones / cuentas OAuth ligadas (opcional, ayuda a forzar re-login limpio)
    // await prisma.session.deleteMany({ where: { userId: user.id } }); // solo si usas adapter sessions

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "User",
        entityId: user.id,
        userId: session.user.id,
        meta: {
          operation: "FIX_CONTAMINATED",
          before: { name: user.name, email: user.email, image: user.image },
          after: updates,
        },
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (e: any) {
    console.error("fix-contaminated error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al reparar usuario" },
      { status: 500 }
    );
  }
}
