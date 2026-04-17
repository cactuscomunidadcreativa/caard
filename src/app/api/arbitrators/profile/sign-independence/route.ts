/**
 * POST /api/arbitrators/profile/sign-independence
 * Firma electrónica de la declaración de independencia e imparcialidad.
 * Body: { declaration: string, signatureDataUrl: string }  (signature como dataURL base64)
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

    const body = await req.json();
    const declaration: string = body?.declaration || "";
    const signatureDataUrl: string = body?.signatureDataUrl || "";

    if (!declaration || declaration.trim().length < 10) {
      return NextResponse.json(
        { error: "Texto de declaración muy corto" },
        { status: 400 }
      );
    }
    if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Firma inválida" },
        { status: 400 }
      );
    }

    const registry = await prisma.arbitratorRegistry.findUnique({
      where: { userId: session.user.id },
      include: { profile: true },
    });
    if (!registry?.profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado. Crea tu perfil primero." },
        { status: 404 }
      );
    }

    const updated = await prisma.arbitratorProfile.update({
      where: { id: registry.profile.id },
      data: {
        independenceDeclaration: declaration,
        independenceSignedAt: new Date(),
        independenceSignatureUrl: signatureDataUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "ArbitratorProfile",
        entityId: registry.profile.id,
        userId: session.user.id,
        meta: {
          operation: "SIGN_INDEPENDENCE",
          declarationLength: declaration.length,
          signedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      signedAt: updated.independenceSignedAt,
    });
  } catch (e: any) {
    console.error("sign independence error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al firmar" },
      { status: 500 }
    );
  }
}
