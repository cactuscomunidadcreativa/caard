/**
 * POST /api/arbitrators/profile/document
 * Sube un documento del árbitro a Drive y retorna la URL pública.
 * Body (multipart): file, kind (cv | rna | contraloria | other), label?
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["ARBITRO", "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kind = (formData.get("kind") as string) || "other";
    const label = (formData.get("label") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "Falta archivo" }, { status: 400 });
    }

    // Drive auth usando el refresh token del centro del usuario
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { centerId: true, name: true },
    });
    if (!userRecord?.centerId) {
      return NextResponse.json({ error: "Sin centro asociado" }, { status: 400 });
    }
    const center = await prisma.center.findUnique({
      where: { id: userRecord.centerId },
      select: { notificationSettings: true },
    });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) {
      return NextResponse.json({ error: "Google no conectado" }, { status: 500 });
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    async function findOrCreate(name: string, parent?: string): Promise<string> {
      const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parent ? ` and '${parent}' in parents` : " and 'root' in parents"}`;
      const r = await drive.files.list({ q, fields: "files(id)" });
      if (r.data.files?.[0]?.id) return r.data.files[0].id;
      const c = await drive.files.create({
        requestBody: { name, mimeType: "application/vnd.google-apps.folder", ...(parent ? { parents: [parent] } : {}) },
        fields: "id",
      });
      return c.data.id!;
    }

    const rootId = await findOrCreate("CAARD_ARBITROS");
    const arbFolderId = await findOrCreate(
      (userRecord.name || session.user.email || session.user.id).replace(/[\/\\:*?"<>|]/g, "-"),
      rootId
    );

    const { Readable } = await import("stream");
    const buf = Buffer.from(await file.arrayBuffer());
    const filename = `${kind.toUpperCase()}-${Date.now()}-${file.name}`;
    const up = await drive.files.create({
      requestBody: { name: filename, parents: [arbFolderId] },
      media: { mimeType: file.type, body: Readable.from(buf) },
      fields: "id",
    });
    await drive.permissions.create({
      fileId: up.data.id!,
      requestBody: { role: "reader", type: "anyone" },
    });

    const viewUrl = `https://drive.google.com/file/d/${up.data.id}/view`;

    // Guardar en el perfil según el kind
    const registry = await prisma.arbitratorRegistry.findUnique({
      where: { userId: session.user.id },
      include: { profile: true },
    });
    if (registry?.profile) {
      const updateData: any = {};
      if (kind === "cv") updateData.cvDocumentUrl = viewUrl;
      else if (kind === "rna") updateData.rnaDocumentUrl = viewUrl;
      else if (kind === "contraloria") updateData.contraloriaDocumentUrl = viewUrl;
      else {
        // other: agregar al array otherDocuments
        const existing = (registry.profile.otherDocuments as any[]) || [];
        updateData.otherDocuments = [
          ...existing,
          { name: label || file.name, url: viewUrl, uploadedAt: new Date().toISOString() },
        ];
      }
      await prisma.arbitratorProfile.update({
        where: { id: registry.profile.id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, url: viewUrl, kind });
  } catch (e: any) {
    console.error("arbitrator document upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al subir documento" },
      { status: 500 }
    );
  }
}
