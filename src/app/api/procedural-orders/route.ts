/**
 * GET /api/procedural-orders
 *
 * Lista todas las Órdenes Procesales del centro (cross-caso) para que la
 * secretaría y staff las administren desde un único panel. Una OP es un
 * CaseDocument con isEscrito=true cuyo documentType es "Orden Procesal"
 * o "Resolución".
 *
 * Solo SUPER_ADMIN, ADMIN, SECRETARIA y CENTER_STAFF acceden.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OP_TYPES = ["Orden Procesal", "Resolución", "Resolucion"];

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const allowed = ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const docs = await prisma.caseDocument.findMany({
      where: {
        isEscrito: true,
        documentType: { in: OP_TYPES },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        caseId: true,
        documentType: true,
        description: true,
        originalFileName: true,
        escritoStatus: true,
        createdAt: true,
        proveidoAt: true,
        notifiedAt: true,
        driveWebViewLink: true,
        uploadedById: true,
        case: {
          select: { id: true, code: true, title: true },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      ordenes: docs.map((d) => ({
        id: d.id,
        caseId: d.caseId,
        caseCode: d.case?.code || "—",
        caseTitle: d.case?.title || null,
        documentType: d.documentType,
        description: d.description,
        originalFileName: d.originalFileName,
        status: d.escritoStatus,
        createdAt: d.createdAt.toISOString(),
        proveidoAt: d.proveidoAt?.toISOString() || null,
        notifiedAt: d.notifiedAt?.toISOString() || null,
        driveWebViewLink: d.driveWebViewLink,
        uploadedBy: d.uploadedBy
          ? { name: d.uploadedBy.name, email: d.uploadedBy.email }
          : null,
      })),
    });
  } catch (e: any) {
    console.error("procedural-orders GET error:", e);
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
