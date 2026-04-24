/**
 * GET /api/admin/permissions - Lista catálogo + matriz de defaults por rol.
 * GET /api/admin/permissions?userId=X - Overrides del usuario + permisos efectivos.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PERMISSION_CATALOG,
  ROLE_DEFAULT_PERMISSIONS,
  computeEffectivePermissions,
} from "@/lib/permissions";
import {
  requireAuthWithPermission,
  authErrorResponse,
} from "@/lib/require-permission";

export async function GET(request: NextRequest) {
  try {
    // Solo SUPER_ADMIN o con permiso explícito users.impersonate (que implica alto nivel)
    const session = await requireAuthWithPermission("users.update");
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      const overrides = await prisma.userPermissionOverride.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      const effective = await computeEffectivePermissions(userId, user.role);
      return NextResponse.json({
        user,
        overrides,
        effective,
      });
    }

    return NextResponse.json({
      catalog: PERMISSION_CATALOG,
      roleDefaults: Object.fromEntries(
        Object.entries(ROLE_DEFAULT_PERMISSIONS).map(([r, perms]) => [r, [...perms]])
      ),
    });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("permissions GET error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission("users.update");
    const body = await request.json();
    const { userId, permission, granted, reason, expiresAt } = body;

    if (!userId || !permission || typeof granted !== "boolean") {
      return NextResponse.json(
        { error: "userId, permission y granted (boolean) son requeridos" },
        { status: 400 }
      );
    }

    // Evitar modificar permisos del propio usuario para impedir escaladas
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "No puedes modificar tus propios permisos" },
        { status: 400 }
      );
    }

    const override = await prisma.userPermissionOverride.upsert({
      where: { userId_permission: { userId, permission } },
      update: {
        granted,
        reason: reason || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      create: {
        userId,
        permission,
        granted,
        reason: reason || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "UserPermissionOverride",
        entityId: override.id,
        userId: session.user.id,
        meta: {
          operation: "SET_PERMISSION_OVERRIDE",
          targetUserId: userId,
          permission,
          granted,
          reason,
          expiresAt,
        },
      },
    });

    return NextResponse.json({ success: true, override });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("permissions POST error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuthWithPermission("users.update");
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const deleted = await prisma.userPermissionOverride.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "UserPermissionOverride",
        entityId: id,
        userId: session.user.id,
        meta: { operation: "REMOVE_PERMISSION_OVERRIDE", targetUserId: deleted.userId },
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const r = authErrorResponse(e);
    if (r) return r;
    console.error("permissions DELETE error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
