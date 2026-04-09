/**
 * GET /api/documents/[id] - Info básica de un documento (cualquier rol con acceso al caso)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCase } from "@/lib/case-authorization";
import { canSeeDocument } from "@/lib/document-visibility";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.caseDocument.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      folder: { select: { id: true, name: true, visibility: true } },
      case: { select: { id: true, code: true, centerId: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = await canAccessCase(
    session.user.id,
    session.user.role as any,
    doc.case.id,
    session.user.centerId
  );
  if (!access.hasAccess) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  if (!canSeeDocument((doc as any).accessLevel, doc.folder?.visibility, session.user.role as any)) {
    return NextResponse.json({ error: "Sin acceso a este documento" }, { status: 403 });
  }

  return NextResponse.json({
    id: doc.id,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes.toString(),
    documentType: doc.documentType,
    description: doc.description,
    documentDate: doc.documentDate?.toISOString() || null,
    accessLevel: (doc as any).accessLevel,
    driveFileId: doc.driveFileId,
    driveWebViewLink: doc.driveWebViewLink,
    version: doc.version,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    uploadedBy: doc.uploadedBy,
    folder: doc.folder,
    case: { id: doc.case.id, code: doc.case.code },
  });
}
