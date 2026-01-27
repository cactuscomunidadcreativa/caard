/**
 * CAARD - API de Plantilla de Notificación Individual
 * GET: Obtener plantilla por ID
 * PUT: Actualizar plantilla
 * DELETE: Eliminar plantilla
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"];

// GET - Obtener plantilla
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id,
        OR: [
          { centerId: session.user.centerId },
          { centerId: null, isDefault: true },
        ],
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching notification template:", error);
    return NextResponse.json(
      { error: "Error al obtener plantilla" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar plantilla
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar que la plantilla existe y pertenece al centro
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        id,
        centerId: session.user.centerId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Plantilla no encontrada o no tienes permiso para editarla" },
        { status: 404 }
      );
    }

    // No permitir editar plantillas por defecto del sistema
    if (existingTemplate.isDefault && existingTemplate.centerId === null) {
      return NextResponse.json(
        { error: "No se pueden editar las plantillas por defecto del sistema" },
        { status: 403 }
      );
    }

    const {
      name,
      type,
      emailSubject,
      emailBody,
      emailHtmlBody,
      smsBody,
      whatsappBody,
      availableVariables,
      description,
      category,
      isActive,
    } = body;

    // Actualizar plantilla
    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(emailSubject !== undefined && { emailSubject }),
        ...(emailBody !== undefined && { emailBody }),
        ...(emailHtmlBody !== undefined && { emailHtmlBody }),
        ...(smsBody !== undefined && { smsBody: smsBody?.substring(0, 320) }),
        ...(whatsappBody !== undefined && { whatsappBody }),
        ...(availableVariables && { availableVariables }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      template,
      message: "Plantilla actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating notification template:", error);
    return NextResponse.json(
      { error: "Error al actualizar plantilla" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar plantilla
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que la plantilla existe y pertenece al centro
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        id,
        centerId: session.user.centerId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Plantilla no encontrada o no tienes permiso para eliminarla" },
        { status: 404 }
      );
    }

    // No permitir eliminar plantillas por defecto del sistema
    if (existingTemplate.isDefault) {
      return NextResponse.json(
        { error: "No se pueden eliminar las plantillas por defecto del sistema" },
        { status: 403 }
      );
    }

    await prisma.notificationTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Plantilla eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting notification template:", error);
    return NextResponse.json(
      { error: "Error al eliminar plantilla" },
      { status: 500 }
    );
  }
}
