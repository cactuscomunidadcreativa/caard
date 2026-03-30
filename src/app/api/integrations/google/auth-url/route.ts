/**
 * CAARD - API para obtener URL de autorizacion de Google
 * Solicita todos los scopes necesarios: Gmail, Calendar, Drive, UserInfo
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleWorkspaceService } from "@/lib/google-workspace";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const workspace = getGoogleWorkspaceService();
    const authUrl = workspace.getAuthUrl();

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error getting auth URL:", error);
    return NextResponse.json(
      { error: "Error al obtener URL de autorizacion" },
      { status: 500 }
    );
  }
}
