/**
 * Script para agregar "Registro de Árbitros" al menú principal
 * Lo posiciona después de "El Centro" (sortOrder 2)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Agregando 'Registro de Árbitros' al menú principal...\n");

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.log("❌ Centro CAARD no encontrado");
    return;
  }

  console.log(`✅ Centro encontrado: ${center.name}\n`);

  // Verificar si ya existe
  const existing = await prisma.cmsMenuItem.findFirst({
    where: {
      centerId: center.id,
      label: "Registro de Árbitros",
      parentId: null,
    }
  });

  if (existing) {
    console.log("⚠️ 'Registro de Árbitros' ya existe en el menú principal");
    console.log(`   ID: ${existing.id}`);
    console.log(`   URL: ${existing.url}`);
    console.log(`   Orden: ${existing.sortOrder}`);
    return;
  }

  // Obtener "El Centro" para saber su sortOrder
  const elCentro = await prisma.cmsMenuItem.findFirst({
    where: {
      centerId: center.id,
      label: "El Centro",
      parentId: null,
    }
  });

  const sortOrderAfterElCentro = elCentro ? elCentro.sortOrder + 1 : 2;

  // Incrementar el sortOrder de todos los items que vienen después
  await prisma.cmsMenuItem.updateMany({
    where: {
      centerId: center.id,
      parentId: null,
      sortOrder: { gte: sortOrderAfterElCentro }
    },
    data: {
      sortOrder: { increment: 1 }
    }
  });

  console.log(`📝 Actualizando orden de items existentes...\n`);

  // Crear el nuevo item
  const registroArbitros = await prisma.cmsMenuItem.create({
    data: {
      centerId: center.id,
      label: "Registro de Árbitros",
      url: "/registro-arbitros",
      sortOrder: sortOrderAfterElCentro,
      isVisible: true,
    }
  });

  console.log("✅ Creado: Registro de Árbitros");
  console.log(`   ID: ${registroArbitros.id}`);
  console.log(`   URL: ${registroArbitros.url}`);
  console.log(`   Orden: ${registroArbitros.sortOrder}`);

  // Mostrar el menú actualizado
  console.log("\n=== MENÚ ACTUALIZADO ===\n");

  const menuItems = await prisma.cmsMenuItem.findMany({
    where: { centerId: center.id, parentId: null, isVisible: true },
    orderBy: { sortOrder: "asc" },
  });

  for (const item of menuItems) {
    const href = item.url || (item.pageSlug ? `/${item.pageSlug}` : "#");
    console.log(`${item.sortOrder}. ${item.label} -> ${href}`);
  }

  console.log("\n✅ Menú actualizado correctamente");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
