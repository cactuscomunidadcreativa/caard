/**
 * Script para limpiar duplicados del menú
 * Elimina "Registro de Árbitros" del submenú de "El Centro"
 * ya que ahora es un item principal
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando duplicados del menú...\n");

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.log("❌ Centro CAARD no encontrado");
    return;
  }

  // Buscar "El Centro" para obtener su ID
  const elCentro = await prisma.cmsMenuItem.findFirst({
    where: {
      centerId: center.id,
      label: "El Centro",
      parentId: null,
    }
  });

  if (!elCentro) {
    console.log("❌ No se encontró 'El Centro'");
    return;
  }

  // Buscar "Registro de Árbitros" dentro de "El Centro"
  const duplicado = await prisma.cmsMenuItem.findFirst({
    where: {
      centerId: center.id,
      label: "Registro de Árbitros",
      parentId: elCentro.id,
    }
  });

  if (duplicado) {
    await prisma.cmsMenuItem.delete({
      where: { id: duplicado.id }
    });
    console.log("✅ Eliminado 'Registro de Árbitros' del submenú de 'El Centro'");
  } else {
    console.log("ℹ️ No hay duplicado en 'El Centro'");
  }

  // Mostrar menú actualizado
  console.log("\n=== MENÚ ACTUALIZADO ===\n");

  const menuItems = await prisma.cmsMenuItem.findMany({
    where: { centerId: center.id },
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const topLevel = menuItems.filter(item => !item.parentId);

  for (const item of topLevel) {
    const href = item.url || (item.pageSlug ? `/${item.pageSlug}` : "#");
    console.log(`${item.sortOrder}. ${item.label} -> ${href}`);

    const children = menuItems.filter(child => child.parentId === item.id);
    for (const child of children) {
      const childHref = child.url || (child.pageSlug ? `/${child.pageSlug}` : "#");
      console.log(`   └─ ${child.label} -> ${childHref}`);
    }
  }

  console.log("\n✅ Menú limpiado correctamente");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
