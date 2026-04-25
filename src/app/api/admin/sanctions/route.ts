/**
 * /api/admin/sanctions — CRUD de sanciones a árbitros.
 * GET: lista todas las sanciones del centro
 * POST: crea una nueva sanción
 * DELETE ?id=X: quita una sanción
 *
 * Usa el sistema de permisos: requiere sanctions.view / sanctions.create /
 * sanctions.delete según operación.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission(PERMISSIONS.SANCTIONS_VIEW);

    const centerId = session.user.centerId;
    const sanctions = await prisma.arbitratorSanction.findMany({
      where: centerId
        ? { arbitrator: { centerId } }
        : {},
      include: {
        arbitrator: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: { select: { displayName: true, slug: true } },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const items = sanctions.map((s) => ({
      id: s.id,
      arbitratorId: s.arbitratorId,
      arbitratorName:
        s.arbitrator.profile?.displayName ||
        s.arbitrator.user.name ||
        s.arbitrator.user.email,
      type: s.type,
      reason: s.reason,
      resolutionNumber: s.resolutionNumber,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate?.toISOString() || null,
      blocksNewAssignments: s.blocksNewAssignments,
      removesFromActiveCases: s.removesFromActiveCases,
      status: getStatus(s.startDate, s.endDate),
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("GET sanctions error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

function getStatus(start: Date, end: Date | null): "ACTIVE" | "COMPLETED" | "SCHEDULED" {
  const now = new Date();
  if (start > now) return "SCHEDULED";
  if (!end) return "ACTIVE";
  if (end < now) return "COMPLETED";
  return "ACTIVE";
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission(PERMISSIONS.SANCTIONS_CREATE);
    const body = await request.json();

    const {
      arbitratorUserId, // userId del árbitro (no registryId)
      type,
      reason,
      resolutionNumber,
      startDate,
      endDate,
      blocksNewAssignments,
      removesFromActiveCases,
    } = body;

    if (!arbitratorUserId || !type || !reason || !startDate) {
      return NextResponse.json(
        { error: "arbitratorUserId, type, reason y startDate son obligatorios" },
        { status: 400 }
      );
    }

    const validTypes = ["WARNING", "SUSPENSION", "REMOVAL"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type inválido. Debe ser uno de: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Buscar el registry a partir del userId
    const registry = await prisma.arbitratorRegistry.findUnique({
      where: { userId: arbitratorUserId },
    });
    if (!registry) {
      return NextResponse.json(
        { error: "El árbitro no tiene registro en el centro" },
        { status: 404 }
      );
    }

    const sanction = await prisma.arbitratorSanction.create({
      data: {
        arbitratorId: registry.id,
        type: type as any,
        reason,
        resolutionNumber: resolutionNumber || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        blocksNewAssignments: blocksNewAssignments ?? type !== "WARNING",
        removesFromActiveCases: removesFromActiveCases ?? type === "REMOVAL",
        issuedById: session.user.id,
      },
    });

    // Si la sanción remueve de casos activos o es una SUSPENSION/REMOVAL,
    // actualizar el status del registry.
    if (type === "REMOVAL") {
      await prisma.arbitratorRegistry.update({
        where: { id: registry.id },
        data: { status: "SANCTIONED" },
      });
    } else if (type === "SUSPENSION") {
      await prisma.arbitratorRegistry.update({
        where: { id: registry.id },
        data: { status: "SUSPENDED", suspensionDate: sanction.startDate, suspensionEndDate: sanction.endDate },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "ArbitratorSanction",
        entityId: sanction.id,
        userId: session.user.id,
        meta: {
          operation: "CREATE_SANCTION",
          arbitratorId: registry.id,
          type,
          resolutionNumber,
        },
      },
    });

    return NextResponse.json({ success: true, sanction }, { status: 201 });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("POST sanction error:", e);
    return NextResponse.json({ error: "Error al registrar sanción" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission(PERMISSIONS.SANCTIONS_DELETE);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const deleted = await prisma.arbitratorSanction.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "ArbitratorSanction",
        entityId: id,
        userId: session.user.id,
        meta: { operation: "DELETE_SANCTION", arbitratorId: deleted.arbitratorId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("DELETE sanction error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
