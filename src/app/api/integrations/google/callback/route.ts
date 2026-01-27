/**
 * CAARD - Callback de autorización de Google OAuth
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/admin/integrations?error=oauth_denied", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/admin/integrations?error=no_code", request.url)
      );
    }

    // Intercambiar código por tokens
    const driveService = getGoogleDriveService();
    const tokens = await driveService.getTokensFromCode(code);

    // Guardar refresh token (en producción, guardar de forma segura en DB o vault)
    // Por ahora, mostramos instrucciones para agregarlo al .env
    console.log("=== GOOGLE REFRESH TOKEN ===");
    console.log("Agrega esta línea a tu archivo .env:");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refreshToken}`);
    console.log("=============================");

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        centerId: session.user.centerId,
        userId: session.user.id,
        action: "CREATE",
        entity: "GoogleIntegration",
        meta: {
          event: "oauth_connected",
          hasRefreshToken: !!tokens.refreshToken,
        },
      },
    });

    // Redirigir con mensaje de éxito
    return NextResponse.redirect(
      new URL(
        `/admin/integrations?success=connected&token=${tokens.refreshToken ? "received" : "missing"}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Error in Google callback:", error);
    return NextResponse.redirect(
      new URL("/admin/integrations?error=callback_failed", request.url)
    );
  }
}
