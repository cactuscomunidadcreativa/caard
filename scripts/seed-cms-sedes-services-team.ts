/**
 * Seed inicial para páginas que hoy están hardcoded:
 *  - /sedes             → CARDS con 1 sede principal
 *  - /servicios-ad-hoc  → CARDS con servicios
 *  - /consejo-superior  → CARDS con miembros del Consejo
 *
 * Ejecuta sólo si las secciones no existen ya (idempotente).
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) throw new Error("No se encontró el centro CAARD");

  // ------------- SEDES -------------
  let sedesPage = await prisma.cmsPage.findUnique({
    where: { centerId_slug: { centerId: center.id, slug: "sedes" } },
  });
  if (!sedesPage) {
    sedesPage = await prisma.cmsPage.create({
      data: {
        centerId: center.id,
        slug: "sedes",
        title: "Sedes",
        metaTitle: "Sedes - CAARD",
        metaDescription: "Ubicaciones de CAARD",
        isPublished: true,
      },
    });
  }
  const sedesCards = await prisma.cmsSection.findFirst({
    where: { pageId: sedesPage.id, type: "CARDS" },
  });
  if (!sedesCards) {
    await prisma.cmsSection.create({
      data: {
        pageId: sedesPage.id,
        type: "CARDS",
        title: "Nuestras sedes",
        subtitle: "Oficinas de atención",
        sortOrder: 0,
        isVisible: true,
        content: {
          cards: [
            {
              id: "lima-principal",
              name: "Sede Principal - Lima",
              address: "Jr. Paramonga 311, Oficina 702",
              district: "Santiago de Surco",
              city: "Lima",
              country: "Perú",
              phone: "+51 913 755 003",
              email: "administracion@caardpe.com",
              hours: "Lun - Vie: 9:00 AM - 6:00 PM",
              isPrincipal: true,
              services: [
                "Recepción de solicitudes de arbitraje",
                "Audiencias presenciales y virtuales",
                "Atención a partes y abogados",
                "Consulta de expedientes",
                "Pagos y facturación",
              ],
            },
          ],
        },
      },
    });
    console.log("✓ sedes: CARDS section creada con sede principal");
  } else {
    console.log("· sedes: ya tenía CARDS section");
  }

  // ------------- SERVICIOS AD-HOC -------------
  let servAdHocPage = await prisma.cmsPage.findUnique({
    where: { centerId_slug: { centerId: center.id, slug: "servicios-ad-hoc" } },
  });
  if (!servAdHocPage) {
    servAdHocPage = await prisma.cmsPage.create({
      data: {
        centerId: center.id,
        slug: "servicios-ad-hoc",
        title: "Servicios Ad-hoc",
        metaTitle: "Servicios Ad-hoc - CAARD",
        isPublished: true,
      },
    });
  }
  const servAdHocCards = await prisma.cmsSection.findFirst({
    where: { pageId: servAdHocPage.id, type: "CARDS" },
  });
  if (!servAdHocCards) {
    await prisma.cmsSection.create({
      data: {
        pageId: servAdHocPage.id,
        type: "CARDS",
        title: "Nuestros servicios",
        subtitle: "Soluciones especializadas",
        sortOrder: 0,
        isVisible: true,
        content: {
          cards: [
            {
              title: "Arbitraje Ad-hoc",
              description:
                "Administración de arbitrajes no institucionales donde las partes han pactado su propio procedimiento.",
              icon: "Gavel",
            },
            {
              title: "Designación de Árbitros",
              description:
                "Servicio de designación de árbitros por parte de CAARD como entidad nominadora.",
              icon: "Users",
            },
            {
              title: "Administración de Honorarios",
              description:
                "Gestión transparente de honorarios y gastos del tribunal arbitral.",
              icon: "Wallet",
            },
            {
              title: "Secretaría Arbitral",
              description:
                "Apoyo administrativo completo: notificaciones, custodia del expediente, gestión de audiencias.",
              icon: "FileText",
            },
          ],
        },
      },
    });
    console.log("✓ servicios-ad-hoc: CARDS section creada con 4 servicios");
  } else {
    console.log("· servicios-ad-hoc: ya tenía CARDS section");
  }

  // ------------- CONSEJO SUPERIOR -------------
  let consejoPage = await prisma.cmsPage.findUnique({
    where: { centerId_slug: { centerId: center.id, slug: "consejo-superior" } },
  });
  if (!consejoPage) {
    consejoPage = await prisma.cmsPage.create({
      data: {
        centerId: center.id,
        slug: "consejo-superior",
        title: "Consejo Superior",
        metaTitle: "Consejo Superior - CAARD",
        isPublished: true,
      },
    });
  }
  const consejoCards = await prisma.cmsSection.findFirst({
    where: { pageId: consejoPage.id, type: "TEAM" },
  });
  if (!consejoCards) {
    await prisma.cmsSection.create({
      data: {
        pageId: consejoPage.id,
        type: "TEAM",
        title: "Miembros del Consejo Superior",
        subtitle:
          "Profesionales destacados del arbitraje que supervisan el buen funcionamiento del centro.",
        sortOrder: 0,
        isVisible: true,
        content: {
          members: [
            {
              name: "Por definir",
              role: "Presidente del Consejo",
              bio: "Miembro fundador con amplia trayectoria en arbitraje comercial.",
              photoUrl: null,
            },
            {
              name: "Por definir",
              role: "Secretario General",
              bio: "Responsable de la coordinación del Consejo.",
              photoUrl: null,
            },
          ],
        },
      },
    });
    console.log("✓ consejo-superior: TEAM section creada (placeholder)");
  } else {
    console.log("· consejo-superior: ya tenía TEAM section");
  }

  await prisma.$disconnect();
  console.log("\n✅ Seed completo.");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
