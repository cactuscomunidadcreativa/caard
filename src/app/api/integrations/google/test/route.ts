/**
 * CAARD - API para probar conexión con Google Drive
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

    const driveService = getGoogleDriveService();

    // Verificar conexión
    const isConfigured = await driveService.isConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: "Google Drive no está configurado correctamente",
      });
    }

    // Obtener información del usuario
    const userInfo = await driveService.getUserInfo();

    return NextResponse.json({
      success: true,
      email: userInfo?.email,
      name: userInfo?.name,
    });
  } catch (error) {
    console.error("Error testing Google connection:", error);
    return NextResponse.json({
      success: false,
      error: "Error al conectar con Google Drive",
    });
  }
}
