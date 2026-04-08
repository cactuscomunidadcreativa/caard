/**
 * Lista carpetas de Google Drive accesibles para el centro.
 * GET /api/integrations/google/drive/folders?search=xxx&parent=yyy
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const center = await prisma.center.findUnique({
      where: { id: session.user.centerId! },
      select: { notificationSettings: true, driveRootFolderId: true },
    });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) return NextResponse.json({ error: "Google no conectado" }, { status: 400 });

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    const search = req.nextUrl.searchParams.get("search") || "";
    const parent = req.nextUrl.searchParams.get("parent");

    let q = "mimeType='application/vnd.google-apps.folder' and trashed=false";
    if (search) q += ` and name contains '${search.replace(/'/g, "\\'")}'`;
    if (parent) q += ` and '${parent}' in parents`;

    const r = await drive.files.list({
      q,
      fields: "files(id,name,parents,owners(emailAddress,displayName))",
      pageSize: 50,
      orderBy: "modifiedTime desc",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    // Get current root info
    let currentRoot: any = null;
    if (center?.driveRootFolderId) {
      try {
        const info = await drive.files.get({
          fileId: center.driveRootFolderId,
          fields: "id,name,parents,webViewLink",
          supportsAllDrives: true,
        });
        currentRoot = info.data;
      } catch {
        currentRoot = null;
      }
    }

    return NextResponse.json({
      folders: r.data.files || [],
      current: currentRoot,
    });
  } catch (e: any) {
    console.error("drive folders list error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
