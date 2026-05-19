/**
 * /api/admin/role-permissions
 *
 * GET → matriz efectiva por rol (incluye overrides aplicados sobre los
 *       defaults de src/lib/permissions.ts).
 * PATCH → cambia un permiso para un rol. Body: { role, permission, granted }.
 *         Calcula si el cambio coincide con el default: si sí, borra el
 *         override; si difiere, lo upsertea. Esto mantiene la tabla mínima.
 *
 * Solo SUPER_ADMIN y ADMIN. Cada cambio queda en AuditLog.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Role as PrismaRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  getEffectiveRolePermissions,
} from "@/lib/permissions";

const ALLOWED = ["SUPER_ADMIN", "ADMIN"];
const ROLES: PrismaRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "CENTER_STAFF",
  "SECRETARIA",
  "FINANZAS",
  "ARBITRO",
  "ABOGADO",
  "DEMANDANTE",
  "DEMANDADO",
  "ESTUDIANTE",
];

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!ALLOWED.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const entries = await Promise.all(
      ROLES.map(async (r) => {
        const effective = await getEffectiveRolePermissions(r);
        return [r, effective] as const;
      })
    );

    const overrides = await prisma.rolePermissionOverride
      .findMany({
        select: {
          role: true,
          permission: true,
          granted: true,
          updatedAt: true,
          createdById: true,
        },
      })
      .catch(() => [] as any[]);

    return NextResponse.json({
      effective: Object.fromEntries(entries),
      overrides,
      permissions: Object.values(PERMISSIONS),
    });
  } catch (e: any) {
    console.error("role-permissions GET error:", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!ALLOWED.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const { role, permission, granted } = body || {};

    if (!role || !ROLES.includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    if (!permission || typeof permission !== "string") {
      return NextResponse.json({ error: "Permiso inválido" }, { status: 400 });
    }
    if (typeof granted !== "boolean") {
      return NextResponse.json({ error: "Granted debe ser booleano" }, { status: 400 });
    }
    if (!Object.values(PERMISSIONS).includes(permission as any)) {
      return NextResponse.json({ error: "Permiso desconocido" }, { status: 400 });
    }

    // SUPER_ADMIN tiene "*" — no se le puede cambiar (es por seguridad)
    if (role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "SUPER_ADMIN tiene acceso total y no se puede modificar" },
        { status: 400 }
      );
    }

    const defaults = ROLE_DEFAULT_PERMISSIONS[role as PrismaRole] || [];
    const defaultHas = (defaults as readonly string[]).includes(permission);

    // Si el nuevo valor coincide con el default, borrar el override
    // (mantenemos la tabla mínima).
    if (granted === defaultHas) {
      await prisma.rolePermissionOverride
        .deleteMany({ where: { role: role as PrismaRole, permission } })
        .catch(() => null);
    } else {
      // Upsert
      await prisma.rolePermissionOverride.upsert({
        where: { role_permission: { role: role as PrismaRole, permission } },
        create: {
          role: role as PrismaRole,
          permission,
          granted,
          createdById: session.user.id,
        },
        update: {
          granted,
        },
      });
    }

    // Audit log
    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: granted ? "UPDATE" : "UPDATE",
          entity: "RolePermissionOverride",
          entityId: `${role}|${permission}`,
          meta: {
            role,
            permission,
            granted,
            defaultHas,
            matchesDefault: granted === defaultHas,
          },
        },
      })
      .catch(() => null);

    // Devolver el estado efectivo nuevo del rol
    const effective = await getEffectiveRolePermissions(role as PrismaRole);
    return NextResponse.json({ success: true, role, effective });
  } catch (e: any) {
    console.error("role-permissions PATCH error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al actualizar permiso" },
      { status: 500 }
    );
  }
}
