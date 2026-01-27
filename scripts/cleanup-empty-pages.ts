/**
 * CAARD - Script para eliminar páginas vacías duplicadas
 * Elimina páginas sin secciones que tienen una versión con contenido
 * Ejecutar con: npx tsx scripts/cleanup-empty-pages.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Eliminando páginas vacías duplicadas...\n");

  // Obtener centro CAARD
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.error("❌ Centro CAARD no encontrado.");
    return;
  }

  // Páginas vacías que tienen una versión con contenido en otra ruta
  const pagesToDelete = [
    // Estas tienen versiones con contenido en /el-centro/... o /arbitraje/...
    "secretaria-general",      // tiene /el-centro/secretaria-general con 3 secciones
    "presentacion",            // tiene /el-centro/presentacion con 4 secciones
    "consejo-superior",        // tiene /el-centro/consejo-superior con 3 secciones
    "sedes",                   // tiene /el-centro/sedes con 3 secciones
    "reglamentos",             // tiene /arbitraje/reglamentos con 3 secciones
    "clausula-arbitral",       // tiene /arbitraje/clausula-arbitral con 3 secciones
    "arbitraje-emergencia",    // tiene /arbitraje/arbitraje-emergencia con 4 secciones
    "calculadora",             // tiene /arbitraje/calculadora-gastos
    "registro-arbitros",       // vacía
    "servicios-ad-hoc",        // vacía
    "solicitud-arbitral",      // vacía - probablemente debería ser una aplicación
  ];

  let deleted = 0;

  for (const slug of pagesToDelete) {
    const page = await prisma.cmsPage.findUnique({
      where: { centerId_slug: { centerId: center.id, slug } },
      include: { _count: { select: { sections: true } } },
    });

    if (page && page._count.sections === 0) {
      console.log(`🗑 Eliminando: /${slug} (0 secciones)`);
      await prisma.cmsPage.delete({ where: { id: page.id } });
      deleted++;
    } else if (page) {
      console.log(`⚠️  Saltando: /${slug} (tiene ${page._count.sections} secciones)`);
    } else {
      console.log(`   /${slug} no existe`);
    }
  }

  console.log(`\n✅ ${deleted} páginas vacías eliminadas`);

  // Listar páginas restantes
  console.log("\n📄 Páginas restantes:");
  const finalPages = await prisma.cmsPage.findMany({
    where: { centerId: center.id },
    orderBy: { slug: "asc" },
    include: { _count: { select: { sections: true } } },
  });

  for (const page of finalPages) {
    const status = page.isPublished ? "✓" : "○";
    console.log(`   ${status} /${page.slug} - ${page.title} (${page._count.sections} secciones)`);
  }

  console.log(`\n   Total: ${finalPages.length} páginas`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
