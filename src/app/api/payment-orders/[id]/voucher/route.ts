/**
 * POST /api/payment-orders/[id]/voucher
 * Sube voucher de pago o voucher de detracción a Drive bajo la carpeta
 * "09. Pagos" del expediente (mismo árbol que el resto de documentos).
 * DELETE: borra el archivo y limpia la URL en BD.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { ensureCaseDriveFolders, archiveDriveFile } from "@/lib/drive-case-folders";

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

    const order = await prisma.paymentOrder.findUnique({
      where: { id },
      include: {
        case: {
          select: { id: true, code: true, centerId: true, driveFolderId: true },
        },
      },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Asegurar que el caso tenga su árbol de carpetas en Drive (idempotente)
    await ensureCaseDriveFolders(order.case.id);

    // Releer caseFolder "09_Pagos" después de ensure
    const pagosFolder = await prisma.caseFolder.findFirst({
      where: { caseId: order.case.id, key: "09_Pagos" },
      select: { driveFolderId: true, id: true },
    });

    const center = await prisma.center.findUnique({
      where: { id: order.case.centerId },
      select: { notificationSettings: true },
    });
    const rt = (center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) return NextResponse.json({ error: "Google no conectado" }, { status: 500 });

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    // Si por algún motivo ensureCaseDriveFolders no pudo crear la subcarpeta
    // (Drive lento, error transitorio), caemos al folder del caso como fallback.
    const targetFolderId = pagosFolder?.driveFolderId || order.case.driveFolderId;
    if (!targetFolderId) {
      return NextResponse.json(
        { error: "No se pudo localizar la carpeta del expediente en Drive" },
        { status: 500 }
      );
    }

    const { Readable } = await import("stream");
    const buf = Buffer.from(await file.arrayBuffer());
    const safeOriginal = file.name.replace(/[\/\\:*?"<>|]/g, "-");
    const filename = `${kind === "detraction" ? "DETRACCION" : "VOUCHER"}-${order.orderNumber}-${Date.now()}-${safeOriginal}`;
    const up = await drive.files.create({
      requestBody: { name: filename, parents: [targetFolderId] },
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

    // Audit log
    await prisma.auditLog
      .create({
        data: {
          centerId: order.case.centerId,
          caseId: order.case.id,
          userId: session.user.id,
          action: "CREATE",
          entity: "PaymentOrder.voucher",
          entityId: order.id,
          meta: { kind, orderNumber: order.orderNumber, filename, url: viewUrl },
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true, url: viewUrl });
  } catch (e: any) {
    console.error("upload voucher error:", e?.message);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/payment-orders/[id]/voucher?kind=voucher|detraction[&reason=...]
 *
 * NO borra el archivo en Drive — lo mueve a la subcarpeta "_eliminados"
 * del expediente (con prefijo [ELIMINADO timestamp]) y limpia la URL
 * en BD. La trazabilidad queda intacta: el AuditLog guarda la URL
 * original + la URL archivada, y el archivo sigue accesible para
 * el centro / mega admin.
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
    const reason = searchParams.get("reason") || undefined;

    const order = await prisma.paymentOrder.findUnique({
      where: { id },
      include: {
        case: { select: { id: true, centerId: true } },
      },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const currentUrl = kind === "detraction" ? order.detractionVoucherUrl : order.voucherUrl;
    if (!currentUrl) {
      return NextResponse.json({ error: "No hay voucher para eliminar" }, { status: 400 });
    }

    // Archivar en Drive (mover a _eliminados, NO borrar) para preservar
    // trazabilidad. Best effort: si Drive falla, igual limpiamos BD.
    let archivedUrl: string | null = null;
    const m = currentUrl.match(/\/d\/([^/]+)\//);
    if (m) {
      archivedUrl = await archiveDriveFile(
        order.case.centerId,
        order.case.id,
        m[1],
        reason || `voucher${kind === "detraction" ? " detracción" : ""} OP ${order.orderNumber}`
      );
    }

    await prisma.paymentOrder.update({
      where: { id },
      data: kind === "detraction" ? { detractionVoucherUrl: null } : { voucherUrl: null },
    });

    // Audit log — preserva URL original Y la nueva ubicación archivada
    await prisma.auditLog
      .create({
        data: {
          centerId: order.case.centerId,
          caseId: order.case.id,
          userId: session.user.id,
          action: "DELETE",
          entity: "PaymentOrder.voucher",
          entityId: order.id,
          meta: {
            kind,
            orderNumber: order.orderNumber,
            removedUrl: currentUrl,
            archivedUrl,
            archived: !!archivedUrl,
            reason: reason || null,
          },
        },
      })
      .catch(() => null);

    return NextResponse.json({
      success: true,
      archived: !!archivedUrl,
      archivedUrl,
    });
  } catch (e: any) {
    console.error("delete voucher error:", e?.message);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
