/**
 * CAARD - API para obtener URL de autorización de Google
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleDriveService } from "@/lib/google-drive";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const driveService = getGoogleDriveService();
    const authUrl = driveService.getAuthUrl();

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error getting auth URL:", error);
    return NextResponse.json(
      { error: "Error al obtener URL de autorización" },
      { status: 500 }
    );
  }
}
