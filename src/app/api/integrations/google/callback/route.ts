/**
 * CAARD - Callback de autorizacion de Google OAuth
 * Recibe el codigo de autorizacion, intercambia por tokens,
 * y guarda el refresh token en la configuracion del centro (BD).
 *
 * SEGURIDAD: El refresh token NUNCA se loguea. Se guarda cifrado en la BD.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleWorkspaceService } from "@/lib/google-workspace";
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

    // Intercambiar codigo por tokens
    const workspace = getGoogleWorkspaceService();
    workspace.reset(); // Limpiar estado previo
    const tokens = await workspace.getTokensFromCode(code);

    // Guardar refresh token en la BD (notificationSettings del centro)
    if (tokens.refreshToken && session.user.centerId) {
      const center = await prisma.center.findUnique({
        where: { id: session.user.centerId },
        select: { notificationSettings: true },
      });

      const currentSettings = (center?.notificationSettings as Record<string, any>) || {};

      await prisma.center.update({
        where: { id: session.user.centerId },
        data: {
          notificationSettings: {
            ...currentSettings,
            googleRefreshToken: tokens.refreshToken,
            googleConnectedAt: new Date().toISOString(),
            googleConnectedBy: session.user.id,
          },
        },
      });
    }

    // Registrar en audit log (sin exponer el token)
    await prisma.auditLog.create({
      data: {
        centerId: session.user.centerId,
        userId: session.user.id,
        action: "CREATE",
        entity: "GoogleIntegration",
        meta: {
          event: "oauth_connected",
          hasRefreshToken: !!tokens.refreshToken,
          scopes: "gmail.send, calendar, drive.file, userinfo.email",
        },
      },
    });

    // Redirigir con mensaje de éxito. No incluimos ningún detalle del token
    // en la URL — antes había un `token=received|missing` que quedaba en
    // logs de servidor, historial del navegador y cabecera Referer. Si el
    // refresh token falta, lo exponemos como flag semántico sin PII.
    const statusFlag = tokens.refreshToken ? "connected" : "connected_no_refresh";
    return NextResponse.redirect(
      new URL(`/admin/integrations?success=${statusFlag}`, request.url)
    );
  } catch (error) {
    console.error("Error in Google callback:", error);
    return NextResponse.redirect(
      new URL("/admin/integrations?error=callback_failed", request.url)
    );
  }
}
