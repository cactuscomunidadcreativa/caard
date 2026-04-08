/**
 * Proxy público para servir archivos de CmsMedia.
 * Si url empieza con /uploads/ redirige al static.
 * Si es un ID de Drive (o URL de Drive) descarga vía OAuth y sirve inline.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const media = await prisma.cmsMedia.findUnique({ where: { id } });
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Si es local /uploads/ redirigimos
    if (media.url.startsWith("/uploads/")) {
      return NextResponse.redirect(new URL(media.url, _req.url));
    }

    // Extraer Drive file ID
    const m = media.url.match(/[-\w]{25,}/);
    if (!m) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    const fileId = m[0];

    const center = await prisma.center.findFirst({ select: { notificationSettings: true } });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) return NextResponse.json({ error: "Drive no conectado" }, { status: 500 });

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    const buf = Buffer.from(res.data as ArrayBuffer);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    console.error("media proxy error:", e?.message);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
