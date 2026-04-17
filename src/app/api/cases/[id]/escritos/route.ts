/**
 * POST /api/cases/[id]/escritos
 * Una parte (o su abogado) presenta un escrito al tribunal.
 * - Sube el archivo a Drive bajo /Escritos/
 * - Crea CaseDocument con isEscrito=true, escritoStatus=SUBMITTED, visibilidad STAFF_AND_ARBITRATORS
 * - Envía cargo de recibido automático al presentante (email)
 * - Notifica al tribunal y al centro de que hay un escrito nuevo pendiente de proveer
 *
 * GET /api/cases/[id]/escritos
 * Lista los escritos del caso visibles para el usuario.
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
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: caseId } = await params;

    // Verificar que el usuario es miembro del caso o staff
    const isStaff = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(
      session.user.role
    );
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        center: { select: { id: true, notificationSettings: true } },
        members: {
          where: { userId: session.user.id },
          select: { id: true, displayName: true, email: true, role: true },
        },
      },
    });
    if (!caseExists) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }
    const member = caseExists.members[0];
    if (!isStaff && !member) {
      return NextResponse.json(
        { error: "No es miembro del caso" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const description = (formData.get("description") as string) || "";
    const documentType = (formData.get("documentType") as string) || "Escrito";
    if (!file) {
      return NextResponse.json({ error: "Falta archivo" }, { status: 400 });
    }

    // Subir a Google Drive bajo /{case.code}/Escritos/
    const rt = (caseExists.center?.notificationSettings as any)?.googleRefreshToken;
    if (!rt) {
      return NextResponse.json(
        { error: "Google Drive no está conectado en este centro" },
        { status: 500 }
      );
    }
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
    );
    oauth.setCredentials({ refresh_token: rt });
    const drive = google.drive({ version: "v3", auth: oauth });

    async function findOrCreateFolder(
      name: string,
      parent?: string
    ): Promise<string> {
      const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false${
        parent ? ` and '${parent}' in parents` : " and 'root' in parents"
      }`;
      const r = await drive.files.list({ q, fields: "files(id)" });
      if (r.data.files?.[0]?.id) return r.data.files[0].id;
      const c = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          ...(parent ? { parents: [parent] } : {}),
        },
        fields: "id",
      });
      return c.data.id!;
    }

    // Usar la carpeta del caso si ya existe, sino crear bajo CAARD_ESCRITOS
    let caseFolderId = caseExists.driveFolderId;
    if (!caseFolderId) {
      const root = await findOrCreateFolder("CAARD_ESCRITOS");
      caseFolderId = await findOrCreateFolder(
        caseExists.code.replace(/[\/\\:*?"<>|]/g, "-"),
        root
      );
      await prisma.case.update({
        where: { id: caseId },
        data: { driveFolderId: caseFolderId },
      });
    }
    const escritosFolderId = await findOrCreateFolder("Escritos", caseFolderId);

    const { Readable } = await import("stream");
    const buf = Buffer.from(await file.arrayBuffer());
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const submitterName = member?.displayName || session.user.name || "usuario";
    const filename = `${timestamp}_${submitterName}_${file.name}`;
    const uploaded = await drive.files.create({
      requestBody: { name: filename, parents: [escritosFolderId] },
      media: { mimeType: file.type || "application/pdf", body: Readable.from(buf) },
      fields: "id,webViewLink",
    });

    // Crear o upsert CaseFolder "Escritos"
    const folder = await prisma.caseFolder.upsert({
      where: { caseId_key: { caseId, key: "escritos" } },
      update: { driveFolderId: escritosFolderId, visibility: "STAFF_AND_ARBITRATORS" },
      create: {
        caseId,
        key: "escritos",
        name: "Escritos",
        driveFolderId: escritosFolderId,
        visibility: "STAFF_AND_ARBITRATORS",
      },
    });

    // Crear el CaseDocument marcado como escrito
    const document = await prisma.caseDocument.create({
      data: {
        caseId,
        folderId: folder.id,
        uploadedById: session.user.id,
        documentType,
        description,
        originalFileName: file.name,
        mimeType: file.type || "application/pdf",
        sizeBytes: BigInt(buf.length),
        driveFileId: uploaded.data.id!,
        driveWebViewLink: uploaded.data.webViewLink || null,
        accessLevel: "STAFF_AND_ARBITRATORS",
        isEscrito: true,
        escritoStatus: "SUBMITTED",
      },
    });

    // Generar cargo de recibido (simple: JSON con timestamp; se puede mejorar a PDF sellado)
    const cargoText = `CARGO DE RECIBIDO
Centro: CAARD — ${caseExists.center?.id || ""}
Expediente: ${caseExists.code}
Presentante: ${submitterName} (${session.user.email || ""})
Documento: ${file.name}
Tipo: ${documentType}
Fecha de presentación: ${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })}
Estado: RECIBIDO — pendiente de proveer por el tribunal
---
Este cargo es generado automáticamente por el sistema CAARD.`;

    // Enviar email al presentante con el cargo
    if (session.user.email) {
      try {
        const { sendEmail } = await import("@/lib/email/service");
        await sendEmail({
          to: session.user.email,
          subject: `Cargo de recibido — Escrito presentado en expediente ${caseExists.code}`,
          html: `
            <h2 style="color:#0B2A5B">Cargo de Recibido</h2>
            <p>Estimado(a) ${submitterName}:</p>
            <p>Confirmamos la recepción de su escrito en el expediente <strong>${caseExists.code}</strong>.</p>
            <table style="border-collapse:collapse;width:100%;margin:20px 0">
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Expediente</strong></td><td style="padding:8px;border:1px solid #ddd">${caseExists.code}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Documento</strong></td><td style="padding:8px;border:1px solid #ddd">${file.name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Tipo</strong></td><td style="padding:8px;border:1px solid #ddd">${documentType}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Fecha/hora</strong></td><td style="padding:8px;border:1px solid #ddd">${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Estado</strong></td><td style="padding:8px;border:1px solid #ddd">RECIBIDO — pendiente de proveer por el tribunal</td></tr>
            </table>
            <p style="color:#666;font-size:12px">Su escrito está actualmente en vista del tribunal arbitral y del centro. Una vez el tribunal lo provea y el centro notifique a las partes, correrán los plazos correspondientes.</p>
            <p style="color:#666;font-size:12px;margin-top:30px">CAARD - Centro de Administración de Arbitrajes y Resolución de Disputas</p>
          `,
          text: cargoText,
        });
      } catch (emailErr) {
        console.error("Error enviando cargo:", emailErr);
      }
    }

    // Notificar a staff (centro) y árbitros del caso
    const caseMembersToNotify = await prisma.caseMember.findMany({
      where: {
        caseId,
        role: "ARBITRO",
        userId: { not: null },
      },
      select: { userId: true, email: true, displayName: true },
    });
    const staff = await prisma.user.findMany({
      where: {
        centerId: caseExists.centerId,
        role: { in: ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"] },
        isActive: true,
      },
      select: { id: true, email: true },
    });
    const notifyUserIds = [
      ...staff.map((s) => s.id),
      ...caseMembersToNotify.map((m) => m.userId).filter(Boolean),
    ] as string[];
    if (notifyUserIds.length) {
      await prisma.notification.createMany({
        data: notifyUserIds.map((uid) => ({
          userId: uid,
          type: "DOCUMENT" as const,
          title: `Nuevo escrito en ${caseExists.code}`,
          message: `${submitterName} presentó un escrito. Requiere proveer por el tribunal.`,
          metadata: {
            caseId,
            caseCode: caseExists.code,
            documentId: document.id,
          },
          isRead: false,
        })),
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "CaseDocument",
        entityId: document.id,
        userId: session.user.id,
        caseId,
        meta: {
          operation: "ESCRITO_SUBMITTED",
          documentType,
          originalFileName: file.name,
          submitterRole: member?.role || session.user.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        originalFileName: document.originalFileName,
        documentType: document.documentType,
        escritoStatus: document.escritoStatus,
        createdAt: document.createdAt,
        driveWebViewLink: document.driveWebViewLink,
      },
    });
  } catch (e: any) {
    console.error("escrito upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al presentar escrito" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id: caseId } = await params;

    const isStaff = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(
      session.user.role
    );
    const member = await prisma.caseMember.findFirst({
      where: { caseId, userId: session.user.id },
      select: { id: true, role: true },
    });
    const isTribunal = member?.role === "ARBITRO";
    const isParty = member && ["DEMANDANTE", "DEMANDADO", "ABOGADO"].includes(member.role);

    // Construir filtro según rol:
    // - Staff y árbitros: ven todos los escritos (cualquier estado)
    // - Partes/abogados: solo ven escritos en estado NOTIFIED + sus propios escritos
    let where: any = { caseId, isEscrito: true };
    if (!isStaff && !isTribunal) {
      if (!isParty) {
        return NextResponse.json({ escritos: [] });
      }
      where = {
        caseId,
        isEscrito: true,
        OR: [
          { escritoStatus: "NOTIFIED" },
          { uploadedById: session.user.id }, // propios (incluye cargo)
        ],
      };
    }

    const escritos = await prisma.caseDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      escritos: escritos.map((e) => ({
        id: e.id,
        originalFileName: e.originalFileName,
        documentType: e.documentType,
        description: e.description,
        escritoStatus: e.escritoStatus,
        createdAt: e.createdAt,
        proveidoAt: e.proveidoAt,
        proveidoText: e.proveidoText,
        notifiedAt: e.notifiedAt,
        notificationText: e.notificationText,
        deadlineStartsAt: e.deadlineStartsAt,
        driveWebViewLink: e.driveWebViewLink,
        uploadedBy: e.uploadedBy,
      })),
    });
  } catch (e: any) {
    console.error("escrito list error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al listar escritos" },
      { status: 500 }
    );
  }
}
