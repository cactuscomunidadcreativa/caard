/**
 * CAARD - API de Usuario Individual (Admin)
 * GET: Obtener usuario por ID
 * PATCH: Actualizar usuario
 * DELETE: Desactivar usuario (soft delete)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "SECRETARIA"];

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional(),
  role: z.nativeEnum(Role).optional(),
  phoneE164: z.string().max(20).optional().nullable(),
  centerId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/users/[id] - Obtener usuario
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !ADMIN_ROLES.includes(currentUser.role)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phoneE164: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            caseMemberships: true,
            documents: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Actualizar usuario
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN puede editar usuarios" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Si se cambia el email, verificar que no exista
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (emailExists) {
        return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.phoneE164 !== undefined) updateData.phoneE164 = validatedData.phoneE164;
    if (validatedData.centerId !== undefined) updateData.centerId = validatedData.centerId || null;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phoneE164: true,
        center: {
          select: { id: true, name: true },
        },
      },
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_USER",
        entity: "User",
        entityId: id,
        meta: { updatedFields: Object.keys(validatedData) },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al actualizar usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Desactivar usuario
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN puede eliminar usuarios" }, { status: 403 });
    }

    // No permitir eliminar el propio usuario
    if (id === session.user.id) {
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            caseMemberships: true,
            lawyerCases: true,
            documents: true,
          },
        },
        arbitratorRegistry: { select: { id: true } },
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Modo HARD delete: ?hard=true → borrado permanente
    const url = new URL(request.url);
    const hardDelete = url.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Verificar que no sea otro SUPER_ADMIN protegido
      if (
        existingUser.email === "eduardo@cactuscomunidadcreativa.com" ||
        existingUser.email === "sis@caardpe.com"
      ) {
        return NextResponse.json(
          { error: "No se pueden eliminar SUPER_ADMINs del sistema" },
          { status: 400 }
        );
      }

      // Si tiene relaciones críticas, exigir ?force=true
      const force = url.searchParams.get("force") === "true";
      const hasRelations =
        existingUser._count.caseMemberships > 0 ||
        existingUser._count.lawyerCases > 0 ||
        existingUser._count.documents > 0;

      if (hasRelations && !force) {
        return NextResponse.json(
          {
            error: "Usuario tiene datos asociados (casos, documentos). Usa force=true para eliminar igual.",
            relations: {
              ...existingUser._count,
              arbitratorRegistry: existingUser.arbitratorRegistry ? 1 : 0,
            },
            requiresForce: true,
          },
          { status: 409 }
        );
      }

      // Eliminar referencias en orden (Prisma cascade hace lo suyo en relaciones que tienen onDelete: Cascade,
      // pero hay que limpiar las que tienen SetNull o no tienen cascade)
      await prisma.$transaction(
        async (tx) => {
          // CaseMember: dejar la fila pero quitar userId (preserva el histórico del caso)
          await tx.caseMember.updateMany({ where: { userId: id }, data: { userId: null } });
          // CaseDocument: lo mismo (preserva el documento, quita el autor)
          await tx.caseDocument.updateMany({ where: { uploadedById: id }, data: { uploadedById: null as any } }).catch(() => {});
          // AuditLogs: nullable userId
          await tx.auditLog.updateMany({ where: { userId: id }, data: { userId: null } }).catch(() => {});
          // Borrar relaciones cascade
          await tx.account.deleteMany({ where: { userId: id } });
          await tx.session.deleteMany({ where: { userId: id } });
          await tx.otpToken.deleteMany({ where: { userId: id } });
          await tx.notification.deleteMany({ where: { userId: id } });
          await tx.userPermissionOverride.deleteMany({ where: { userId: id } });
          // ArbitratorRegistry tiene cascade, pero por seguridad:
          await tx.arbitratorRegistry.deleteMany({ where: { userId: id } });
          // CaseLawyer tiene cascade
          await tx.caseLawyer.deleteMany({ where: { lawyerId: id } });
          // Borrar el user
          await tx.user.delete({ where: { id } });

          // Audit (sin userId porque ya no existe; dejamos solo entityId + meta)
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "DELETE",
              entity: "User",
              entityId: id,
              meta: {
                operation: "HARD_DELETE",
                email: existingUser.email,
                name: existingUser.name,
                forced: force,
                relationsHadAtTime: {
                  ...existingUser._count,
                  arbitratorRegistry: existingUser.arbitratorRegistry ? 1 : 0,
                },
              },
            },
          });
        },
        { timeout: 30000, maxWait: 5000 }
      );

      return NextResponse.json({ success: true, mode: "hard", message: "Usuario eliminado permanentemente" });
    }

    // Soft delete (default): desactivar usuario
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DEACTIVATE_USER",
        entity: "User",
        entityId: id,
        meta: { email: existingUser.email },
      },
    });

    return NextResponse.json({ success: true, mode: "soft", message: "Usuario desactivado correctamente" });
  } catch (error: any) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
