/**
 * CAARD - Script para añadir sección de testimonios
 * Ejecutar con: npx tsx scripts/add-testimonials.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📝 Añadiendo sección de testimonios...\n");

  // Obtener centro CAARD
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.error("❌ Centro CAARD no encontrado.");
    return;
  }

  // Obtener página de inicio
  const homePage = await prisma.cmsPage.findUnique({
    where: { centerId_slug: { centerId: center.id, slug: "inicio" } },
    include: { sections: { orderBy: { sortOrder: "desc" }, take: 1 } },
  });

  if (!homePage) {
    console.error("❌ Página de inicio no encontrada.");
    return;
  }

  const lastOrder = homePage.sections[0]?.sortOrder || 0;

  // Verificar si ya existe una sección de testimonios
  const existingTestimonials = await prisma.cmsSection.findFirst({
    where: { pageId: homePage.id, type: "TESTIMONIALS" },
  });

  if (existingTestimonials) {
    console.log("⚠️  Ya existe una sección de testimonios en la página de inicio.");
    console.log("   Actualizando contenido...");

    await prisma.cmsSection.update({
      where: { id: existingTestimonials.id },
      data: {
        title: "Lo que dicen nuestros clientes",
        subtitle: "Testimonios de quienes han confiado en nosotros",
        content: {
          columns: 3,
          showRating: true,
          layout: "grid",
          testimonials: [
            {
              id: "1",
              quote: "El proceso arbitral fue eficiente y profesional. La resolución de nuestra controversia se logró en tiempo récord gracias al equipo de CAARD.",
              authorName: "Carlos Mendoza",
              authorRole: "Gerente General",
              authorCompany: "Constructora Lima S.A.C.",
              authorImage: "/images/testimonials/carlos-mendoza.jpg",
              rating: 5,
            },
            {
              id: "2",
              quote: "Excelente servicio de arbitraje. Los árbitros demostraron gran conocimiento técnico y legal en nuestra disputa comercial.",
              authorName: "María Elena Ramos",
              authorRole: "Directora Legal",
              authorCompany: "Importadora del Pacífico",
              authorImage: "/images/testimonials/maria-ramos.jpg",
              rating: 5,
            },
            {
              id: "3",
              quote: "La confidencialidad y profesionalismo de CAARD nos permitió resolver nuestro conflicto sin afectar nuestras relaciones comerciales.",
              authorName: "Roberto Gutiérrez",
              authorRole: "CEO",
              authorCompany: "Tecnología Andina",
              authorImage: "/images/testimonials/roberto-gutierrez.jpg",
              rating: 5,
            },
          ],
        },
        bgColor: "#f8fafc",
        isVisible: true,
      },
    });

    console.log("   ✓ Sección de testimonios actualizada\n");
  } else {
    // Crear nueva sección de testimonios
    await prisma.cmsSection.create({
      data: {
        pageId: homePage.id,
        type: "TESTIMONIALS",
        title: "Lo que dicen nuestros clientes",
        subtitle: "Testimonios de quienes han confiado en nosotros",
        content: {
          columns: 3,
          showRating: true,
          layout: "grid",
          testimonials: [
            {
              id: "1",
              quote: "El proceso arbitral fue eficiente y profesional. La resolución de nuestra controversia se logró en tiempo récord gracias al equipo de CAARD.",
              authorName: "Carlos Mendoza",
              authorRole: "Gerente General",
              authorCompany: "Constructora Lima S.A.C.",
              authorImage: "/images/testimonials/carlos-mendoza.jpg",
              rating: 5,
            },
            {
              id: "2",
              quote: "Excelente servicio de arbitraje. Los árbitros demostraron gran conocimiento técnico y legal en nuestra disputa comercial.",
              authorName: "María Elena Ramos",
              authorRole: "Directora Legal",
              authorCompany: "Importadora del Pacífico",
              authorImage: "/images/testimonials/maria-ramos.jpg",
              rating: 5,
            },
            {
              id: "3",
              quote: "La confidencialidad y profesionalismo de CAARD nos permitió resolver nuestro conflicto sin afectar nuestras relaciones comerciales.",
              authorName: "Roberto Gutiérrez",
              authorRole: "CEO",
              authorCompany: "Tecnología Andina",
              authorImage: "/images/testimonials/roberto-gutierrez.jpg",
              rating: 5,
            },
          ],
        },
        bgColor: "#f8fafc",
        sortOrder: lastOrder + 1,
        isVisible: true,
      },
    });

    console.log("   ✓ Sección de testimonios creada\n");
  }

  // También actualizar la página de secretaría general para que tenga el contenido correcto
  console.log("📝 Actualizando página de Secretaría General...\n");

  const secretariaPage = await prisma.cmsPage.findUnique({
    where: { centerId_slug: { centerId: center.id, slug: "el-centro/secretaria-general" } },
  });

  if (secretariaPage) {
    // Buscar la sección TEAM existente
    const teamSection = await prisma.cmsSection.findFirst({
      where: { pageId: secretariaPage.id, type: "TEAM" },
    });

    if (teamSection) {
      await prisma.cmsSection.update({
        where: { id: teamSection.id },
        data: {
          content: {
            layout: "detailed",
            showBio: true,
            showContact: true,
            members: [
              {
                id: "anais-boluarte",
                name: "Anaís Boluarte Oneto",
                role: "Secretaria General",
                image: "/images/team/anais-boluarte.jpg",
                email: "aboluarte@caardpe.com",
                phone: "(511) 977 236 143",
                linkedin: "https://www.linkedin.com/in/anais-boluarte/",
                bio: "Abogada especializada en contrataciones con el Estado, con amplia experiencia en la administración de procesos arbitrales. Lidera la Secretaría General de CAARD, garantizando la correcta tramitación de los procedimientos arbitrales y brindando soporte tanto a las partes como a los tribunales arbitrales.",
              },
            ],
          },
        },
      });
      console.log("   ✓ Sección de equipo actualizada en Secretaría General\n");
    }
  }

  console.log("✅ Script completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
