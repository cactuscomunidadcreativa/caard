/**
 * Script para crear las páginas CMS que faltan
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📄 Creando páginas CMS faltantes...\n");

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });

  if (!center) {
    console.log("❌ No se encontró el centro CAARD");
    return;
  }

  const pages = [
    { slug: "inicio", title: "Inicio", metaTitle: "CAARD | Centro de Arbitraje" },
    { slug: "presentacion", title: "Presentación", metaTitle: "Presentación | CAARD" },
    { slug: "secretaria-general", title: "Secretaría General", metaTitle: "Secretaría General | CAARD" },
    { slug: "consejo-superior", title: "Consejo Superior de Arbitraje", metaTitle: "Consejo Superior | CAARD" },
    { slug: "sedes", title: "Sedes", metaTitle: "Sedes | CAARD" },
    { slug: "arbitraje", title: "Servicios de Arbitraje", metaTitle: "Servicios de Arbitraje | CAARD" },
    { slug: "arbitraje-emergencia", title: "Arbitraje de Emergencia", metaTitle: "Arbitraje de Emergencia | CAARD" },
    { slug: "servicios-ad-hoc", title: "Servicios Ad Hoc", metaTitle: "Servicios Ad Hoc | CAARD" },
    { slug: "registro-arbitros", title: "Registro de Árbitros", metaTitle: "Registro de Árbitros | CAARD" },
    { slug: "reglamentos", title: "Reglamentos", metaTitle: "Reglamentos | CAARD" },
    { slug: "clausula-arbitral", title: "Cláusula Arbitral", metaTitle: "Cláusula Arbitral | CAARD" },
    { slug: "calculadora", title: "Calculadora de Gastos", metaTitle: "Calculadora de Gastos | CAARD" },
    { slug: "contacto", title: "Contacto", metaTitle: "Contacto | CAARD" },
    { slug: "solicitud-arbitral", title: "Solicitud Arbitral", metaTitle: "Solicitud Arbitral | CAARD" },
  ];

  for (const page of pages) {
    try {
      const existing = await prisma.cmsPage.findUnique({
        where: { centerId_slug: { centerId: center.id, slug: page.slug } }
      });

      if (existing) {
        console.log(`⏭️  ${page.slug} ya existe`);
      } else {
        await prisma.cmsPage.create({
          data: {
            centerId: center.id,
            slug: page.slug,
            title: page.title,
            metaTitle: page.metaTitle,
            isPublished: true,
            publishedAt: new Date(),
          }
        });
        console.log(`✅ ${page.slug} creada`);
      }
    } catch (error: any) {
      console.log(`❌ Error en ${page.slug}: ${error.message}`);
    }
  }

  console.log("\n✅ Proceso completado");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
