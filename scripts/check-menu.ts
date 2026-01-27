/**
 * Script para verificar y mostrar el menú actual del CMS
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando menú del CMS...\n");

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });

  if (!center) {
    console.log("❌ No se encontró el centro CAARD");
    return;
  }

  console.log(`✅ Centro encontrado: ${center.name} (${center.id})\n`);

  // Obtener items del menú
  const menuItems = await prisma.cmsMenuItem.findMany({
    where: { centerId: center.id },
    include: {
      children: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`📋 Total de items en el menú: ${menuItems.length}\n`);

  // Mostrar estructura
  const topLevel = menuItems.filter(item => !item.parentId);

  console.log("=== MENÚ ACTUAL ===\n");

  for (const item of topLevel) {
    const href = item.url || (item.pageSlug ? `/${item.pageSlug}` : "#");
    console.log(`📁 ${item.label} -> ${href}`);

    const children = menuItems.filter(child => child.parentId === item.id);
    for (const child of children) {
      const childHref = child.url || (child.pageSlug ? `/${child.pageSlug}` : "#");
      console.log(`   └─ ${child.label} -> ${childHref}`);
    }
    console.log("");
  }

  // Verificar que los slugs apunten a páginas existentes
  console.log("\n=== VERIFICANDO PÁGINAS ===\n");

  const allSlugs = menuItems
    .filter(item => item.pageSlug)
    .map(item => item.pageSlug!);

  const pages = await prisma.cmsPage.findMany({
    where: {
      centerId: center.id,
      slug: { in: allSlugs }
    },
    select: { slug: true, title: true, isPublished: true }
  });

  const existingSlugs = pages.map(p => p.slug);

  for (const slug of allSlugs) {
    if (existingSlugs.includes(slug)) {
      const page = pages.find(p => p.slug === slug);
      console.log(`✅ ${slug} -> ${page?.title} (${page?.isPublished ? 'publicada' : 'borrador'})`);
    } else {
      console.log(`❌ ${slug} -> NO EXISTE EN CMS`);
    }
  }

  console.log("\n=== CONFIGURACIÓN DEL SITIO ===\n");

  const config = await prisma.cmsSiteConfig.findUnique({
    where: { centerId: center.id }
  });

  if (config) {
    console.log(`Nombre: ${config.siteName}`);
    console.log(`Teléfono: ${config.contactPhone}`);
    console.log(`Email: ${config.contactEmail}`);
    console.log(`WhatsApp: ${config.whatsappNumber}`);
  } else {
    console.log("⚠️ No hay configuración del sitio");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
