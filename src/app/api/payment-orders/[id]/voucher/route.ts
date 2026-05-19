/**
 * POST /api/payment-orders/[id]/voucher
 * Sube voucher de pago o voucher de detracción a Drive
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const kind = (formData.get("kind") as string) || "voucher"; // voucher | detraction
    if (!file) return NextResponse.json({ error: "Falta archivo" }, { status: 400 });

    const order = await prisma.paymentOrder.findUnique({ where: { id }, include: { case: { select: { code: true } } } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Subir a Google Drive
    const center = await prisma.center.findFirst({ select: { notificationSettings: true } });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) return NextResponse.json({ error: "Google no conectado" }, { status: 500 });

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    // Carpeta: CAARD_VOUCHERS / {caseCode}
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
    const rootId = await findOrCreate("CAARD_VOUCHERS");
    const caseFolderId = await findOrCreate(order.case.code.replace(/[\/\\:*?"<>|]/g, "-"), rootId);

    const { Readable } = await import("stream");
    const buf = Buffer.from(await file.arrayBuffer());
    const filename = `${kind === "detraction" ? "DETRACCION" : "VOUCHER"}-${order.orderNumber}-${Date.now()}-${file.name}`;
    const up = await drive.files.create({
      requestBody: { name: filename, parents: [caseFolderId] },
      media: { mimeType: file.type, body: Readable.from(buf) },
      fields: "id",
    });
    await drive.permissions.create({
      fileId: up.data.id!,
      requestBody: { role: "reader", type: "anyone" },
    });

    const viewUrl = `https://drive.google.com/file/d/${up.data.id}/view`;

    await prisma.paymentOrder.update({
      where: { id },
      data: kind === "detraction" ? { detractionVoucherUrl: viewUrl } : { voucherUrl: viewUrl },
    });

    return NextResponse.json({ success: true, url: viewUrl });
  } catch (e: any) {
    console.error("upload voucher error:", e?.message);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/payment-orders/[id]/voucher?kind=voucher|detraction
 * Borra la URL del voucher (no toca el archivo en Drive — opcional)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") || "voucher";

    const order = await prisma.paymentOrder.findUnique({
      where: { id },
      select: { id: true, voucherUrl: true, detractionVoucherUrl: true, caseId: true, orderNumber: true },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const currentUrl = kind === "detraction" ? order.detractionVoucherUrl : order.voucherUrl;
    if (!currentUrl) {
      return NextResponse.json({ error: "No hay voucher para eliminar" }, { status: 400 });
    }

    // Intentar borrar el archivo en Drive también (best effort: si falla, sigue
    // limpiando la BD igual). Extraer el file id de la URL drive.com/file/d/{id}/view.
    const m = currentUrl.match(/\/d\/([^/]+)\//);
    if (m) {
      try {
        const center = await prisma.center.findFirst({ select: { notificationSettings: true } });
        const rt = (center?.notificationSettings as any)?.googleRefreshToken;
        if (rt) {
          const oauth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
          );
          oauth.setCredentials({ refresh_token: rt });
          const drive = google.drive({ version: "v3", auth: oauth });
          await drive.files.delete({ fileId: m[1] }).catch(() => null);
        }
      } catch (e) {
        // best effort: ignorar
      }
    }

    await prisma.paymentOrder.update({
      where: { id },
      data: kind === "detraction" ? { detractionVoucherUrl: null } : { voucherUrl: null },
    });

    // Audit log
    await prisma.auditLog
      .create({
        data: {
          centerId: (await prisma.case.findUnique({ where: { id: order.caseId }, select: { centerId: true } }))?.centerId || "",
          userId: session.user.id,
          action: "DELETE",
          entity: "PaymentOrder.voucher",
          entityId: order.id,
          meta: { kind, orderNumber: order.orderNumber, removedUrl: currentUrl },
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("delete voucher error:", e?.message);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
