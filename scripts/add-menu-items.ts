/**
 * Script para agregar Eventos y Noticias al menú
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Agregando items al menú...\n");

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.log("Centro no encontrado");
    return;
  }

  // Obtener el orden más alto actual
  const maxOrder = await prisma.cmsMenuItem.findFirst({
    where: { centerId: center.id, parentId: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  const nextOrder = (maxOrder?.sortOrder || 0) + 1;

  // Verificar si ya existen
  const existing = await prisma.cmsMenuItem.findMany({
    where: {
      centerId: center.id,
      label: { in: ["Eventos", "Noticias"] }
    }
  });

  if (existing.length > 0) {
    console.log("Ya existen items:", existing.map(e => e.label).join(", "));
    return;
  }

  // Crear Eventos
  const eventos = await prisma.cmsMenuItem.create({
    data: {
      centerId: center.id,
      label: "Eventos",
      url: "/eventos",
      sortOrder: nextOrder,
      isVisible: true,
    }
  });
  console.log("✅ Creado:", eventos.label);

  // Crear Noticias
  const noticias = await prisma.cmsMenuItem.create({
    data: {
      centerId: center.id,
      label: "Noticias",
      url: "/noticias",
      sortOrder: nextOrder + 1,
      isVisible: true,
    }
  });
  console.log("✅ Creado:", noticias.label);

  console.log("\n✅ Menú actualizado correctamente");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
