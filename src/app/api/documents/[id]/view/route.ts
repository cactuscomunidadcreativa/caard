/**
 * CAARD - Proxy para servir documentos de Google Drive
 * GET /api/documents/[id]/view - Sirve el PDF al usuario autenticado
 *
 * Valida:
 * - Usuario autenticado
 * - Tiene acceso al caso del documento
 * - Descarga el archivo de Drive usando OAuth del centro
 * - Lo sirve como streaming al cliente
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { canAccessCase } from "@/lib/case-authorization";
import type { Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Get document
    const doc = await prisma.caseDocument.findUnique({
      where: { id },
      include: {
        case: { select: { id: true, centerId: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Verify user has access to the case
    const userRole = (session.user.role || "DEMANDANTE") as Role;
    const userId = session.user.id;
    const userCenterId = session.user.centerId;

    const access = await canAccessCase(userId, userRole, doc.case.id, userCenterId);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.reason || "Sin acceso a este documento" },
        { status: 403 }
      );
    }

    // Get Google OAuth credentials from center
    const center = await prisma.center.findUnique({
      where: { id: doc.case.centerId },
      select: { notificationSettings: true },
    });

    const settings = center?.notificationSettings as any;
    const refreshToken = settings?.googleRefreshToken;

    if (!refreshToken || !doc.driveFileId) {
      return NextResponse.json(
        { error: "Documento no disponible en Drive" },
        { status: 404 }
      );
    }

    // Create Drive client with center's OAuth
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Download file from Drive
    const response = await drive.files.get(
      { fileId: doc.driveFileId, alt: "media" },
      { responseType: "stream" }
    );

    // Stream to client
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      response.data
        .on("data", (chunk: Buffer) => chunks.push(chunk))
        .on("end", () => resolve())
        .on("error", reject);
    });

    const buffer = Buffer.concat(chunks);

    // Log access
    await prisma.auditLog.create({
      data: {
        centerId: doc.case.centerId,
        userId: session.user.id,
        caseId: doc.case.id,
        action: "VIEW",
        entity: "CaseDocument",
        entityId: doc.id,
        meta: { fileName: doc.originalFileName },
      },
    });

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": doc.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalFileName)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error: any) {
    console.error("Error serving document:", error);
    return NextResponse.json(
      { error: "Error al servir documento", details: error.message },
      { status: 500 }
    );
  }
}
