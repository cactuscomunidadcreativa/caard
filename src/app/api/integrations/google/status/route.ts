/**
 * CAARD - Estado de la integracion de Google Workspace
 * Retorna si Google Workspace esta configurado y funcional
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

    const workspace = getGoogleWorkspaceService();
    const configured = workspace.isConfigured();

    return NextResponse.json({
      configured,
      services: {
        gmail: configured,
        calendar: configured,
        drive: configured,
      },
    });
  } catch (error) {
    console.error("Error checking Google status:", error);
    return NextResponse.json(
      { error: "Error al verificar estado de Google" },
      { status: 500 }
    );
  }
}
