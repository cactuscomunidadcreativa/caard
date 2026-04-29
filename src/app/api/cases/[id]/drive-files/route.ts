/**
 * GET /api/cases/[id]/drive-files
 *
 * Lista los archivos directamente desde Google Drive del expediente,
 * agrupados por las "subcarpetas" típicas (Escritos, Órdenes Procesales,
 * Razón de Secretaría, etc.) para que las pestañas en /cases/[id]
 * muestren accesos rápidos a lo que efectivamente está en Drive — no
 * solo a lo que se importó a la tabla CaseDocument.
 *
 * Respuesta:
 * {
 *   ok: true,
 *   driveFolderId: "...",
 *   folders: [
 *     {
 *       key: "ESCRITOS",        // normalizado mayúsculas/sin tildes/sin espacios
 *       name: "Escritos",       // tal cual está en Drive
 *       driveFolderId: "...",
 *       webViewLink: "https://drive.google.com/...",
 *       files: [
 *         { id, name, mimeType, modifiedTime, webViewLink, iconLink, size }
 *       ]
 *     },
 *     ...
 *   ]
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

// Normaliza un nombre de carpeta para usarlo como clave: mayúsculas,
// sin tildes ni espacios. "Órdenes Procesales" → "ORDENES_PROCESALES"
function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthWithPermission("documents.view");
    const { id } = await params;

    const caso = await prisma.case.findUnique({
      where: { id },
      select: { id: true, driveFolderId: true, centerId: true },
    });
    if (!caso) {
      return NextResponse.json(
        { error: "Expediente no encontrado" },
        { status: 404 }
      );
    }
    if (!caso.driveFolderId) {
      return NextResponse.json(
        {
          ok: true,
          driveFolderId: null,
          folders: [],
          warning: "El expediente no tiene carpeta de Drive vinculada",
        },
        { status: 200 }
      );
    }

    // Verificar acceso al case (member, staff, super_admin, admin)
    const isStaff = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(
      session.user.role
    );
    if (!isStaff) {
      const member = await prisma.caseMember.findFirst({
        where: { caseId: id, userId: session.user.id },
        select: { id: true },
      });
      if (!member) {
        return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
      }
    }

    // Obtener refresh token del centro
    const center = await prisma.center.findUnique({
      where: { id: caso.centerId! },
      select: { notificationSettings: true },
    });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) {
      return NextResponse.json(
        { error: "Google Drive no conectado", folders: [] },
        { status: 400 }
      );
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    // 1) Listar subcarpetas dentro del driveFolderId del caso
    const subfoldersRes = await drive.files.list({
      q: `'${caso.driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name,webViewLink)",
      pageSize: 50,
      orderBy: "name",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const subfolders = subfoldersRes.data.files || [];

    // 2) Para cada subcarpeta, listar archivos (no recursivo — un solo nivel)
    const folders = await Promise.all(
      subfolders.map(async (f) => {
        try {
          const filesRes = await drive.files.list({
            q: `'${f.id}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
            fields:
              "files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size)",
            pageSize: 100,
            orderBy: "modifiedTime desc",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });
          return {
            key: normalizeKey(f.name || ""),
            name: f.name || "",
            driveFolderId: f.id || "",
            webViewLink: f.webViewLink || null,
            files: (filesRes.data.files || []).map((fl) => ({
              id: fl.id,
              name: fl.name,
              mimeType: fl.mimeType,
              modifiedTime: fl.modifiedTime,
              webViewLink: fl.webViewLink,
              iconLink: fl.iconLink,
              size: fl.size,
            })),
          };
        } catch (err) {
          console.error("drive subfolder list error", f.id, err);
          return {
            key: normalizeKey(f.name || ""),
            name: f.name || "",
            driveFolderId: f.id || "",
            webViewLink: f.webViewLink || null,
            files: [],
          };
        }
      })
    );

    return NextResponse.json({
      ok: true,
      driveFolderId: caso.driveFolderId,
      folders,
    });
  } catch (e: any) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("GET /cases/[id]/drive-files:", e);
    return NextResponse.json(
      { error: e?.message || "Error al listar archivos de Drive" },
      { status: 500 }
    );
  }
}
