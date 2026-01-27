/**
 * CAARD - Script de limpieza del CMS
 * Elimina páginas duplicadas y verifica la integridad de los datos
 * Ejecutar con: npx tsx scripts/cleanup-cms.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Iniciando limpieza del CMS...\n");

  // Obtener centro CAARD
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.error("❌ Centro CAARD no encontrado.");
    return;
  }

  console.log(`📍 Centro encontrado: ${center.name}\n`);

  // 1. Buscar páginas duplicadas por slug
  console.log("🔍 Buscando páginas duplicadas...");

  const allPages = await prisma.cmsPage.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { sections: true } } },
  });

  const slugCounts = new Map<string, typeof allPages>();

  for (const page of allPages) {
    const existing = slugCounts.get(page.slug) || [];
    existing.push(page);
    slugCounts.set(page.slug, existing);
  }

  let duplicatesRemoved = 0;
  for (const [slug, pages] of slugCounts) {
    if (pages.length > 1) {
      console.log(`\n⚠️  Duplicado encontrado: ${slug} (${pages.length} páginas)`);

      // Mantener la página con más secciones o la más reciente
      const sorted = pages.sort((a, b) => {
        // Primero ordenar por número de secciones (más es mejor)
        if (a._count.sections !== b._count.sections) {
          return b._count.sections - a._count.sections;
        }
        // Si tienen el mismo número de secciones, ordenar por fecha de creación (más reciente)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const keep = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`   ✓ Manteniendo: ${keep.id} (${keep._count.sections} secciones)`);

      for (const page of toDelete) {
        console.log(`   🗑 Eliminando: ${page.id} (${page._count.sections} secciones)`);
        // Primero eliminar secciones
        await prisma.cmsSection.deleteMany({ where: { pageId: page.id } });
        // Luego eliminar la página
        await prisma.cmsPage.delete({ where: { id: page.id } });
        duplicatesRemoved++;
      }
    }
  }

  if (duplicatesRemoved === 0) {
    console.log("   ✓ No se encontraron páginas duplicadas");
  } else {
    console.log(`\n   🗑 ${duplicatesRemoved} página(s) duplicada(s) eliminada(s)`);
  }

  // 2. Verificar secciones huérfanas (pageId que no existe en CmsPage)
  console.log("\n🔍 Buscando secciones huérfanas...");

  const allSections = await prisma.cmsSection.findMany({
    select: { id: true, pageId: true },
  });

  const pageIds = new Set(allPages.map((p) => p.id));
  const orphanSections = allSections.filter((s) => !pageIds.has(s.pageId));

  if (orphanSections.length > 0) {
    console.log(`   ⚠️  Encontradas ${orphanSections.length} secciones huérfanas`);
    await prisma.cmsSection.deleteMany({
      where: {
        id: { in: orphanSections.map((s) => s.id) },
      },
    });
    console.log(`   🗑 Secciones huérfanas eliminadas`);
  } else {
    console.log("   ✓ No se encontraron secciones huérfanas");
  }

  // 3. Listar todas las páginas actuales
  console.log("\n📄 Páginas actuales:");

  const finalPages = await prisma.cmsPage.findMany({
    where: { centerId: center.id },
    orderBy: { slug: "asc" },
    include: { _count: { select: { sections: true } } },
  });

  for (const page of finalPages) {
    const status = page.isPublished ? "✓" : "○";
    console.log(`   ${status} /${page.slug} - ${page.title} (${page._count.sections} secciones)`);
  }

  console.log("\n═".repeat(60));
  console.log("✅ Limpieza completada!");
  console.log(`   Total de páginas: ${finalPages.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
