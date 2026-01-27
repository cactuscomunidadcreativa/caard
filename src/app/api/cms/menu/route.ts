/**
 * CAARD CMS - API de Menús
 * ========================
 * CRUD de items del menú de navegación
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener menús
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener centro del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { centerId: true },
    });

    let centerId = user?.centerId;

    if (!centerId) {
      const defaultCenter = await prisma.center.findFirst({
        where: { code: "CAARD" },
      });
      centerId = defaultCenter?.id;
    }

    if (!centerId) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    // Obtener todos los items del menú
    const menuItems = await prisma.cmsMenuItem.findMany({
      where: { centerId },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    });

    // Construir árbol de menú
    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    const menuTree = buildTree(menuItems);

    return NextResponse.json(menuTree);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Error al obtener menú" },
      { status: 500 }
    );
  }
}

// POST - Crear/Actualizar menú completo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar rol
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Obtener centro del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { centerId: true },
    });

    let centerId = user?.centerId;

    if (!centerId) {
      const defaultCenter = await prisma.center.findFirst({
        where: { code: "CAARD" },
      });
      centerId = defaultCenter?.id;
    }

    if (!centerId) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items inválidos" },
        { status: 400 }
      );
    }

    // Eliminar todos los items existentes y recrear
    await prisma.cmsMenuItem.deleteMany({
      where: { centerId },
    });

    // Función recursiva para crear items
    const createItems = async (
      itemsToCreate: any[],
      parentId: string | null = null
    ) => {
      for (let i = 0; i < itemsToCreate.length; i++) {
        const item = itemsToCreate[i];

        const created = await prisma.cmsMenuItem.create({
          data: {
            centerId: centerId!,
            parentId,
            label: item.label,
            url: item.url || null,
            pageSlug: item.pageSlug || null,
            target: item.target || "_self",
            icon: item.icon || null,
            sortOrder: i,
            isVisible: item.isVisible !== false,
          },
        });

        // Crear hijos recursivamente
        if (item.children && item.children.length > 0) {
          await createItems(item.children, created.id);
        }
      }
    };

    await createItems(items);

    // Retornar menú actualizado
    const menuItems = await prisma.cmsMenuItem.findMany({
      where: { centerId },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    });

    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    return NextResponse.json(buildTree(menuItems));
  } catch (error) {
    console.error("Error saving menu:", error);
    return NextResponse.json(
      { error: "Error al guardar menú" },
      { status: 500 }
    );
  }
}
