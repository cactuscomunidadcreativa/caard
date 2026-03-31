/**
 * CAARD CMS - Seed de contenido inicial
 * Basado en el contenido real de caardpe.com
 * Ejecutar con: npx tsx prisma/seed-cms.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed del CMS...\n");

  // Obtener centro CAARD
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.error("❌ Centro CAARD no encontrado. Ejecuta primero el seed principal.");
    return;
  }

  console.log(`📍 Centro encontrado: ${center.name}\n`);

  // ==========================================================================
  // 1. Configuración del sitio (datos reales de caardpe.com)
  // ==========================================================================
  console.log("⚙️  Creando configuración del sitio...");

  await prisma.cmsSiteConfig.upsert({
    where: { centerId: center.id },
    update: {},
    create: {
      centerId: center.id,
      siteName: "CAARD",
      siteTagline: "Centro de Administración de Arbitrajes y Resolución de Disputas",
      primaryColor: "#0B2A5B",
      secondaryColor: "#1a3a6b",
      accentColor: "#D66829",
      instagramUrl: "https://www.instagram.com/caardpe",
      linkedinUrl: "https://www.linkedin.com/company/caardpe/",
      whatsappNumber: "+51913755003",
      contactEmail: "info@caardpe.com",
      contactPhone: "(51) 913 755 003",
      contactAddress: "Jr. Aldebarán No. 596, oficina 1409, Santiago de Surco. Edificio IQ Surco",
      defaultMetaTitle: "CAARD | Centro de Arbitraje",
      defaultMetaDescription: "Centro de Administración de Arbitrajes y Resolución de Disputas. Impulsamos el arbitraje como medio eficaz para la solución de controversias.",
      footerText: "El Centro de Administración de Arbitrajes y Resolución de Disputas es una institución arbitral que busca impulsar el arbitraje como medio eficaz para la solución de controversias, innovando en sus prácticas y brindando servicios transparentes y eficientes.",
      copyrightText: "© 2026 CAARD. Todos los derechos reservados.",
    },
  });
  console.log("   ✓ Configuración creada\n");

  // ==========================================================================
  // 2. Menú de navegación (estructura real de caardpe.com)
  // ==========================================================================
  console.log("📌 Creando menú de navegación...");

  const menuItems = [
    {
      label: "El Centro",
      pageSlug: "el-centro",
      sortOrder: 1,
      children: [
        { label: "Presentación", pageSlug: "el-centro/presentacion", sortOrder: 1 },
        { label: "Secretaría General", pageSlug: "el-centro/secretaria-general", sortOrder: 2 },
        { label: "Consejo Superior de Arbitraje", pageSlug: "el-centro/consejo-superior", sortOrder: 3 },
        { label: "Guías", pageSlug: "el-centro/guias", sortOrder: 4 },
        { label: "Sedes", pageSlug: "el-centro/sedes", sortOrder: 5 },
      ],
    },
    {
      label: "Arbitraje",
      pageSlug: "arbitraje",
      sortOrder: 2,
      children: [
        { label: "Reglamentos", pageSlug: "arbitraje/reglamentos", sortOrder: 1 },
        { label: "Solicitud Arbitral", url: "/solicitud-arbitral", sortOrder: 2 },
        { label: "Calculadora de Gastos", pageSlug: "arbitraje/calculadora-gastos", sortOrder: 3 },
        { label: "Arbitraje de Emergencia", pageSlug: "arbitraje/arbitraje-emergencia", sortOrder: 4 },
        { label: "Registro de Árbitros", pageSlug: "arbitraje/registro-arbitros", sortOrder: 5 },
        { label: "Secretaría Arbitral Ad Hoc", pageSlug: "arbitraje/secretaria-ad-hoc", sortOrder: 6 },
        { label: "Cláusula Arbitral", pageSlug: "arbitraje/clausula-arbitral", sortOrder: 7 },
      ],
    },
    {
      label: "Resolución de Disputas",
      pageSlug: "resolucion-disputas",
      sortOrder: 3,
      children: [
        { label: "Junta de Resolución de Disputas", pageSlug: "resolucion-disputas/junta", sortOrder: 1 },
      ],
    },
    {
      label: "Consulta de Expedientes",
      url: "/login",
      sortOrder: 4,
    },
    {
      label: "Peritos",
      pageSlug: "peritos",
      sortOrder: 5,
    },
    {
      label: "Eventos",
      pageSlug: "eventos",
      sortOrder: 6,
    },
    {
      label: "Artículos",
      pageSlug: "articulos",
      sortOrder: 7,
    },
    {
      label: "Contacto",
      pageSlug: "contacto",
      sortOrder: 8,
    },
  ];

  // Eliminar menú existente
  await prisma.cmsMenuItem.deleteMany({ where: { centerId: center.id } });

  for (const item of menuItems) {
    const parent = await prisma.cmsMenuItem.create({
      data: {
        centerId: center.id,
        label: item.label,
        pageSlug: item.pageSlug,
        url: item.url,
        sortOrder: item.sortOrder,
        isVisible: true,
      },
    });

    if (item.children) {
      for (const child of item.children) {
        await prisma.cmsMenuItem.create({
          data: {
            centerId: center.id,
            parentId: parent.id,
            label: child.label,
            pageSlug: child.pageSlug,
            url: child.url,
            sortOrder: child.sortOrder,
            isVisible: true,
          },
        });
      }
    }
  }
  console.log(`   ✓ ${menuItems.length} items de menú creados\n`);

  // ==========================================================================
  // 3. Páginas (contenido basado en caardpe.com)
  // ==========================================================================
  console.log("📄 Creando páginas...");

  const pages = [
    // ---------- INICIO ----------
    {
      slug: "inicio",
      title: "Inicio",
      metaTitle: "CAARD | Centro de Administración de Arbitrajes y Resolución de Disputas",
      metaDescription: "Impulsamos el arbitraje como medio eficaz para la solución de controversias. Servicios transparentes, eficientes y confidenciales.",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Impulsamos el arbitraje como medio eficaz para la solución de controversias",
          subtitle: "Centro de Administración de Arbitrajes y Resolución de Disputas",
          content: {
            backgroundImage: "/images/hero-bg.jpg",
            buttons: [
              { text: "Solicitud Arbitral", url: "/solicitud-arbitral", variant: "primary" },
              { text: "Consultar Expediente", url: "/login", variant: "secondary" },
            ],
          },
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEXT",
          title: "Bienvenidos a CAARD",
          content: {
            html: `<p class="text-lg">El Centro de Administración de Arbitrajes y Resolución de Disputas es una institución arbitral que busca <strong>impulsar el arbitraje como medio eficaz para la solución de controversias</strong>, innovando en sus prácticas y brindando servicios transparentes y eficientes, orientados a resolver los conflictos de manera rápida, idónea y confidencial, actuando conforme a sus reglamentos y principios éticos.</p>`,
          },
          bgColor: "#ffffff",
          sortOrder: 2,
        },
        {
          type: "CARDS",
          title: "Nuestros Servicios",
          subtitle: "Soluciones especializadas para la resolución de controversias",
          content: {
            columns: 4,
            cards: [
              {
                title: "Arbitraje Institucional",
                description: "Administración profesional de procesos arbitrales bajo nuestro reglamento",
                icon: "scale",
                url: "/arbitraje",
              },
              {
                title: "Arbitraje de Emergencia",
                description: "Medidas cautelares urgentes antes de constituir el tribunal arbitral",
                icon: "clock",
                url: "/arbitraje/arbitraje-emergencia",
              },
              {
                title: "Secretaría Arbitral Ad Hoc",
                description: "Servicios de secretaría para arbitrajes independientes",
                icon: "clipboard",
                url: "/arbitraje/secretaria-ad-hoc",
              },
              {
                title: "Junta de Resolución de Disputas",
                description: "Mecanismo preventivo para proyectos de construcción",
                icon: "users",
                url: "/resolucion-disputas/junta",
              },
            ],
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
        {
          type: "TEAM",
          title: "Equipo Directivo",
          subtitle: "Profesionales comprometidos con la excelencia arbitral",
          content: {
            members: [
              {
                name: "Anaís Boluarte Oneto",
                role: "Secretaría General",
                image: "/images/team/anais-boluarte.jpg",
                bio: "Abogada especializada en contrataciones con el Estado, con amplia experiencia en administración de procesos arbitrales.",
              },
              {
                name: "Oswaldo Hundskopf",
                role: "Presidente del Consejo Superior de Arbitraje",
                image: "/images/team/oswaldo-hundskopf.jpg",
                bio: "Abogado con formación avanzada en derecho administrativo, reconocido jurista y académico.",
              },
            ],
          },
          bgColor: "#0B2A5B",
          sortOrder: 4,
        },
        {
          type: "STATS",
          title: "CAARD en Números",
          content: {
            stats: [
              { value: "500+", label: "Casos administrados" },
              { value: "95%", label: "Satisfacción de usuarios" },
              { value: "50+", label: "Árbitros registrados" },
              { value: "6-12", label: "Meses promedio de resolución" },
            ],
          },
          bgColor: "#f8fafc",
          sortOrder: 5,
        },
        {
          type: "CTA",
          title: "¿Tiene una controversia que resolver?",
          subtitle: "Nuestro equipo está preparado para brindarle una solución eficiente y confidencial",
          content: {
            buttonText: "Iniciar Solicitud Arbitral",
            buttonUrl: "/solicitud-arbitral",
            secondaryButtonText: "Contáctenos",
            secondaryButtonUrl: "/contacto",
          },
          bgColor: "#D66829",
          sortOrder: 6,
        },
      ],
    },
    // ---------- EL CENTRO - PRESENTACIÓN ----------
    {
      slug: "el-centro/presentacion",
      title: "Presentación",
      metaTitle: "Presentación | CAARD",
      metaDescription: "Conozca CAARD, institución arbitral comprometida con impulsar el arbitraje como medio eficaz para la solución de controversias.",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Presentación",
          subtitle: "Conoce nuestra institución",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEXT",
          title: "Nuestra Misión",
          content: {
            html: `<p class="text-lg mb-6">El Centro de Administración de Arbitrajes y Resolución de Disputas es una institución arbitral que busca <strong>impulsar el arbitraje como medio eficaz para la solución de controversias</strong>, innovando en sus prácticas y brindando servicios transparentes y eficientes.</p>
            <p class="mb-6">Estamos orientados a resolver los conflictos de manera:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Rápida:</strong> Procesos ágiles con plazos definidos</li>
              <li><strong>Idónea:</strong> Árbitros especializados en cada materia</li>
              <li><strong>Confidencial:</strong> Protección de información sensible</li>
            </ul>
            <p class="mt-6">Actuamos conforme a nuestros reglamentos y principios éticos, garantizando imparcialidad e independencia en cada proceso.</p>`,
          },
          bgColor: "#ffffff",
          sortOrder: 2,
        },
        {
          type: "ACCORDION",
          title: "Preguntas Frecuentes",
          content: {
            items: [
              {
                title: "¿Qué es el arbitraje?",
                content: "El arbitraje es un mecanismo alternativo de solución de controversias donde las partes acuerdan someter su conflicto a la decisión de uno o más árbitros, cuya resolución (laudo) es vinculante y ejecutable como una sentencia judicial.",
              },
              {
                title: "¿Cuáles son las ventajas del arbitraje?",
                content: "Las principales ventajas incluyen: celeridad (los procesos son más rápidos que en la vía judicial), especialización (los árbitros son expertos en la materia), confidencialidad (los procesos son privados), flexibilidad (las partes pueden acordar reglas) y ejecutabilidad internacional (los laudos son reconocidos mundialmente).",
              },
              {
                title: "¿Cómo inicio un arbitraje en CAARD?",
                content: "Para iniciar un arbitraje debe presentar una solicitud arbitral ante la Secretaría General del Centro, cumpliendo con los requisitos establecidos en el artículo 20 del Reglamento de Arbitraje. Puede hacerlo a través de nuestra mesa de partes virtual.",
              },
            ],
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
      ],
    },
    // ---------- EL CENTRO - SECRETARÍA GENERAL ----------
    {
      slug: "el-centro/secretaria-general",
      title: "Secretaría General",
      metaTitle: "Secretaría General | CAARD",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Secretaría General",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEAM",
          title: "",
          content: {
            layout: "detailed",
            members: [
              {
                name: "Anaís Boluarte Oneto",
                role: "Secretaria General",
                email: "aboluarte@caardpe.com",
                image: "/images/team/anais-boluarte.jpg",
                bio: "Abogada especializada en contrataciones con el Estado, con amplia experiencia en la administración de procesos arbitrales. Lidera la Secretaría General de CAARD, garantizando la correcta tramitación de los procedimientos arbitrales.",
              },
            ],
          },
          sortOrder: 2,
        },
        {
          type: "TEXT",
          title: "Funciones de la Secretaría General",
          content: {
            html: `<ul class="space-y-4">
              <li><strong>Administración de procesos:</strong> Tramitación y seguimiento de todos los procedimientos arbitrales.</li>
              <li><strong>Atención a las partes:</strong> Comunicación con demandantes, demandados y árbitros.</li>
              <li><strong>Gestión documental:</strong> Recepción y custodia de escritos y documentos.</li>
              <li><strong>Coordinación institucional:</strong> Enlace entre el Consejo Superior y los órganos del Centro.</li>
            </ul>`,
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
      ],
    },
    // ---------- EL CENTRO - CONSEJO SUPERIOR ----------
    {
      slug: "el-centro/consejo-superior",
      title: "Consejo Superior de Arbitraje",
      metaTitle: "Consejo Superior de Arbitraje | CAARD",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Consejo Superior de Arbitraje",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEAM",
          title: "",
          content: {
            layout: "detailed",
            members: [
              {
                name: "Oswaldo Hundskopf",
                role: "Presidente del Consejo Superior de Arbitraje",
                image: "/images/team/oswaldo-hundskopf.jpg",
                bio: "Abogado con formación avanzada en derecho administrativo. Reconocido jurista y académico con amplia trayectoria en el ámbito del arbitraje nacional e internacional.",
              },
            ],
          },
          sortOrder: 2,
        },
        {
          type: "TEXT",
          title: "Funciones del Consejo Superior",
          content: {
            html: `<p class="mb-4">El Consejo Superior de Arbitraje es el máximo órgano de gobierno del Centro, encargado de:</p>
            <ul class="space-y-3 list-disc pl-6">
              <li>Aprobar y modificar los reglamentos del Centro</li>
              <li>Designar árbitros cuando corresponda</li>
              <li>Resolver recusaciones de árbitros</li>
              <li>Supervisar el funcionamiento institucional</li>
              <li>Aprobar el código de ética</li>
            </ul>`,
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
      ],
    },
    // ---------- EL CENTRO - SEDES ----------
    {
      slug: "el-centro/sedes",
      title: "Sedes",
      metaTitle: "Sedes | CAARD",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Nuestras Sedes",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "CARDS",
          title: "",
          content: {
            columns: 1,
            cards: [
              {
                title: "Sede Lima",
                description: "Jr Paramonga 311, oficina 702, Santiago de Surco, Lima, Perú",
                icon: "mapPin",
              },
            ],
          },
          sortOrder: 2,
        },
        {
          type: "EMBED",
          title: "Ubicación",
          content: {
            type: "map",
            embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.2889461289467!2d-77.0020891!3d-12.1066889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c7f0c2b8b8b5%3A0x5b6b2b5b5b5b5b5b!2sJr.%20Paramonga%20311%2C%20Santiago%20de%20Surco!5e0!3m2!1ses!2spe!4v1620000000000!5m2!1ses!2spe",
          },
          sortOrder: 3,
        },
      ],
    },
    // ---------- ARBITRAJE - REGLAMENTOS ----------
    {
      slug: "arbitraje/reglamentos",
      title: "Reglamentos",
      metaTitle: "Reglamentos | CAARD",
      metaDescription: "Descargue los reglamentos que rigen los procedimientos arbitrales en CAARD.",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Reglamentos",
          subtitle: "Marco normativo de nuestros procedimientos",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "CARDS",
          title: "Documentos Disponibles",
          content: {
            columns: 2,
            cards: [
              {
                title: "Reglamento de Arbitraje",
                description: "Normas que rigen el procedimiento arbitral institucional",
                icon: "fileText",
                url: "https://caardpe.com/wp-content/uploads/2024/05/Reglamento-CAARD-2022.pdf",
                linkText: "Descargar PDF",
              },
              {
                title: "Reglamento de Aranceles y Pagos",
                description: "Tarifas y condiciones de pago de los servicios arbitrales",
                icon: "creditCard",
                url: "/wp-content/uploads/2022/03/Reglamento-aranceles-y-pago.pdf",
                linkText: "Descargar PDF",
              },
              {
                title: "Reglamento Interno",
                description: "Normas de organización y funcionamiento del Centro",
                icon: "building",
                url: "/wp-content/uploads/2022/03/Reglamento-interno.pdf",
                linkText: "Descargar PDF",
              },
              {
                title: "Reglamento Árbitro de Emergencia",
                description: "Procedimiento para medidas cautelares urgentes",
                icon: "alertTriangle",
                url: "https://caardpe.com/wp-content/uploads/2024/03/Reglamento-arbitro-de-emergencia-CAARD.pdf",
                linkText: "Descargar PDF",
              },
              {
                title: "Código de Ética",
                description: "Principios y normas de conducta para árbitros y funcionarios",
                icon: "shield",
                url: "/wp-content/uploads/2022/03/Codigo-de-etica.pdf",
                linkText: "Descargar PDF",
              },
            ],
          },
          bgColor: "#f8fafc",
          sortOrder: 2,
        },
      ],
    },
    // ---------- ARBITRAJE - ARBITRAJE DE EMERGENCIA ----------
    {
      slug: "arbitraje/arbitraje-emergencia",
      title: "Arbitraje de Emergencia",
      metaTitle: "Arbitraje de Emergencia | CAARD",
      metaDescription: "Solicite el nombramiento de un árbitro de emergencia para medidas cautelares urgentes.",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Arbitraje de Emergencia",
          subtitle: "Medidas cautelares urgentes para proteger sus derechos",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEXT",
          title: "¿Qué es el Arbitraje de Emergencia?",
          content: {
            html: `<p class="text-lg mb-6">Cualquier parte que se encuentre en una situación de urgencia derivada de controversias arbitrales puede solicitar el nombramiento de un <strong>árbitro de emergencia</strong> para que dicte las medidas cautelares necesarias.</p>
            <p class="mb-6">El árbitro de emergencia tiene competencia hasta que se constituya el Tribunal Arbitral, enfocándose en resguardar derechos y mantener el status quo.</p>`,
          },
          sortOrder: 2,
        },
        {
          type: "TIMELINE",
          title: "¿Cuándo solicitar Arbitraje de Emergencia?",
          content: {
            items: [
              {
                title: "Antes de iniciar el arbitraje",
                description: "Cuando necesita proteger sus derechos antes de presentar la solicitud arbitral",
              },
              {
                title: "Después de iniciado el arbitraje",
                description: "Mientras se constituye el tribunal arbitral",
              },
              {
                title: "Simultáneamente con la solicitud arbitral",
                description: "Puede presentar ambas solicitudes al mismo tiempo",
              },
            ],
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
        {
          type: "CTA",
          title: "¿Necesita medidas de emergencia?",
          subtitle: "Presente su solicitud a través de nuestra mesa de partes virtual",
          content: {
            buttonText: "Mesa de Partes Virtual",
            buttonUrl: "mailto:mesadepartes@caardpe.com",
          },
          bgColor: "#D66829",
          sortOrder: 4,
        },
      ],
    },
    // ---------- ARBITRAJE - CLÁUSULA ARBITRAL ----------
    {
      slug: "arbitraje/clausula-arbitral",
      title: "Cláusula Arbitral",
      metaTitle: "Cláusula Arbitral | CAARD",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Cláusula Arbitral",
          subtitle: "Modelo de cláusula recomendado",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEXT",
          title: "Cláusula Modelo CAARD",
          content: {
            html: `<div class="bg-slate-100 p-6 rounded-lg border-l-4 border-[#0B2A5B]">
              <p class="italic">"Toda controversia o diferencia relativa a este contrato, su existencia, validez, interpretación, alcance o cumplimiento, será resuelta mediante arbitraje de Derecho, administrado por el Centro de Administración de Arbitrajes y Resolución de Disputas - CAARD, de conformidad con su Reglamento de Arbitraje vigente al momento de la solicitud de arbitraje.</p>
              <p class="italic mt-4">El Tribunal Arbitral estará integrado por [uno/tres] árbitro(s), designado(s) conforme al Reglamento de Arbitraje del CAARD. La sede del arbitraje será la ciudad de Lima y el idioma del arbitraje será el castellano."</p>
            </div>
            <p class="mt-6 text-sm text-muted-foreground">Esta cláusula puede adaptarse según las necesidades específicas de cada contrato.</p>`,
          },
          sortOrder: 2,
        },
        {
          type: "ACCORDION",
          title: "Elementos de la Cláusula",
          content: {
            items: [
              {
                title: "Centro de arbitraje",
                content: "Identificar claramente a CAARD como la institución que administrará el arbitraje.",
              },
              {
                title: "Reglamento aplicable",
                content: "Referencia al Reglamento de Arbitraje del Centro vigente al momento de la solicitud.",
              },
              {
                title: "Número de árbitros",
                content: "Especificar si será tribunal unipersonal o colegiado (1 o 3 árbitros).",
              },
              {
                title: "Sede del arbitraje",
                content: "Lugar donde se llevará a cabo el arbitraje (determina la ley procesal aplicable).",
              },
              {
                title: "Idioma",
                content: "Idioma en que se desarrollará el procedimiento.",
              },
            ],
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
      ],
    },
    // ---------- CONTACTO ----------
    {
      slug: "contacto",
      title: "Contacto",
      metaTitle: "Contacto | CAARD",
      metaDescription: "Comuníquese con CAARD. Estamos para atenderle.",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Contáctenos",
          subtitle: "Estamos aquí para ayudarle",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "CARDS",
          title: "Información de Contacto",
          content: {
            columns: 3,
            cards: [
              {
                title: "Secretaría General",
                description: "Anaís Boluarte Oneto\naboluarte@caardpe.com",
                icon: "user",
              },
              {
                title: "Administración",
                description: "administracion@caardpe.com\n(51) 913 755 003",
                icon: "phone",
              },
              {
                title: "Mesa de Partes Virtual",
                description: "mesadepartes@caardpe.com\nPara solicitudes y escritos en PDF",
                icon: "mail",
              },
            ],
          },
          sortOrder: 2,
        },
        {
          type: "CONTACT_FORM",
          title: "Envíenos un mensaje",
          content: {
            fields: ["name", "email", "phone", "subject", "message"],
            submitText: "Enviar Mensaje",
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
      ],
    },
    // ---------- EVENTOS ----------
    {
      slug: "eventos",
      title: "Eventos",
      metaTitle: "Eventos | CAARD",
      metaDescription: "Webinars, conferencias y talleres sobre arbitraje y resolución de disputas.",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Eventos",
          subtitle: "Webinars, conferencias y talleres",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEXT",
          title: "",
          content: {
            html: `<p class="text-center text-muted-foreground">Próximamente encontrará aquí nuestros eventos. Suscríbase a nuestras redes sociales para mantenerse informado.</p>`,
          },
          sortOrder: 2,
        },
      ],
    },
    // ---------- ARTÍCULOS ----------
    {
      slug: "articulos",
      title: "Artículos",
      metaTitle: "Artículos | CAARD",
      metaDescription: "Publicaciones y noticias sobre arbitraje y resolución de disputas.",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Artículos y Noticias",
          subtitle: "Manténgase informado sobre el mundo del arbitraje",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
      ],
    },
    // ---------- PERITOS ----------
    {
      slug: "peritos",
      title: "Peritos",
      metaTitle: "Peritos | CAARD",
      isPublished: true,
      sections: [
        {
          type: "HERO",
          title: "Servicios Periciales",
          subtitle: "Expertos en diversas materias para procesos arbitrales",
          content: {},
          bgColor: "#0B2A5B",
          sortOrder: 1,
        },
        {
          type: "TEXT",
          title: "¿Qué son los servicios periciales?",
          content: {
            html: `<p class="mb-4">CAARD ofrece servicios periciales especializados para procesos arbitrales que requieran opinión técnica experta en diversas materias.</p>
            <p>Nuestros peritos son profesionales calificados con experiencia comprobada en sus respectivas áreas de especialización.</p>`,
          },
          sortOrder: 2,
        },
        {
          type: "CTA",
          title: "¿Necesita un perito?",
          content: {
            buttonText: "Contáctenos",
            buttonUrl: "/contacto",
          },
          bgColor: "#f8fafc",
          sortOrder: 3,
        },
      ],
    },
  ];

  for (const pageData of pages) {
    const { sections, ...pageInfo } = pageData;

    // Crear o actualizar página
    const page = await prisma.cmsPage.upsert({
      where: { centerId_slug: { centerId: center.id, slug: pageInfo.slug } },
      update: { title: pageInfo.title, isPublished: pageInfo.isPublished },
      create: {
        centerId: center.id,
        ...pageInfo,
        publishedAt: pageInfo.isPublished ? new Date() : null,
      },
    });

    // Eliminar secciones existentes
    await prisma.cmsSection.deleteMany({ where: { pageId: page.id } });

    // Crear secciones
    if (sections) {
      for (const sectionData of sections) {
        await prisma.cmsSection.create({
          data: {
            pageId: page.id,
            type: sectionData.type as any,
            title: sectionData.title,
            subtitle: (sectionData as any).subtitle || null,
            content: sectionData.content || {},
            bgColor: (sectionData as any).bgColor || null,
            sortOrder: sectionData.sortOrder,
            isVisible: true,
          },
        });
      }
    }

    console.log(`   ✓ Página: ${pageInfo.title} (${sections?.length || 0} secciones)`);
  }
  console.log();

  // ==========================================================================
  // 4. Categorías
  // ==========================================================================
  console.log("📁 Creando categorías...");

  const categories = [
    { slug: "arbitraje", name: "Arbitraje", color: "#0B2A5B" },
    { slug: "mediacion", name: "Mediación", color: "#2563eb" },
    { slug: "legal", name: "Legal", color: "#059669" },
    { slug: "eventos", name: "Eventos", color: "#D66829" },
    { slug: "noticias", name: "Noticias", color: "#7c3aed" },
  ];

  for (const cat of categories) {
    await prisma.cmsCategory.upsert({
      where: { centerId_slug: { centerId: center.id, slug: cat.slug } },
      update: { name: cat.name, color: cat.color },
      create: { centerId: center.id, ...cat },
    });
  }
  console.log(`   ✓ ${categories.length} categorías creadas\n`);

  // ==========================================================================
  // 5. Artículos de ejemplo
  // ==========================================================================
  console.log("📝 Creando artículos de ejemplo...");

  const arbitrajeCategory = await prisma.cmsCategory.findFirst({
    where: { centerId: center.id, slug: "arbitraje" },
  });

  const articles = [
    {
      slug: "importancia-clausula-arbitral",
      title: "La Importancia de la Cláusula Arbitral en Contratos Comerciales",
      excerpt: "Descubra por qué incluir una cláusula arbitral bien redactada puede ahorrarle tiempo y dinero en futuras disputas.",
      content: `# La Importancia de la Cláusula Arbitral

La cláusula arbitral es uno de los elementos más importantes en cualquier contrato comercial. Una cláusula bien redactada puede significar la diferencia entre una resolución eficiente de controversias y un proceso largo y costoso.

## ¿Qué es una cláusula arbitral?

Es la disposición contractual mediante la cual las partes acuerdan someter sus controversias a arbitraje en lugar de acudir a la jurisdicción ordinaria.

## Elementos esenciales

1. **Identificación del centro de arbitraje** - Especificar claramente la institución que administrará el procedimiento
2. **Número de árbitros** - Definir si será tribunal unipersonal o colegiado
3. **Idioma del arbitraje** - El idioma en que se desarrollará el procedimiento
4. **Sede del arbitraje** - Determina la ley procesal aplicable

## Modelo de cláusula CAARD

"Toda controversia derivada del presente contrato será resuelta mediante arbitraje administrado por CAARD, de conformidad con su Reglamento de Arbitraje vigente."`,
      isPublished: true,
      isFeatured: true,
    },
    {
      slug: "ventajas-arbitraje-comercial",
      title: "5 Ventajas del Arbitraje Comercial frente al Proceso Judicial",
      excerpt: "El arbitraje ofrece múltiples beneficios que lo convierten en la opción preferida para resolver disputas empresariales.",
      content: `# 5 Ventajas del Arbitraje Comercial

## 1. Celeridad
Los procesos arbitrales suelen resolverse en 6-12 meses, mientras que un proceso judicial puede tomar años.

## 2. Confidencialidad
A diferencia de los procesos judiciales que son públicos, el arbitraje es confidencial, protegiendo información comercial sensible.

## 3. Especialización
Los árbitros son expertos en la materia del conflicto, lo que garantiza decisiones técnicamente informadas.

## 4. Flexibilidad
Las partes pueden acordar reglas procedimentales adaptadas a sus necesidades específicas.

## 5. Ejecutabilidad Internacional
Gracias a la Convención de Nueva York, los laudos arbitrales son reconocidos y ejecutables en más de 160 países.`,
      isPublished: true,
      isFeatured: false,
    },
  ];

  for (const article of articles) {
    await prisma.cmsArticle.upsert({
      where: { centerId_slug: { centerId: center.id, slug: article.slug } },
      update: article,
      create: {
        centerId: center.id,
        categoryId: arbitrajeCategory?.id,
        tags: ["arbitraje", "contratos", "legal"],
        publishedAt: new Date(),
        ...article,
      },
    });
    console.log(`   ✓ Artículo: ${article.title}`);
  }
  console.log();

  // ==========================================================================
  // 6. Eventos de ejemplo
  // ==========================================================================
  console.log("📅 Creando eventos de ejemplo...");

  const eventCategory = await prisma.cmsCategory.findFirst({
    where: { centerId: center.id, slug: "eventos" },
  });

  const events = [
    {
      slug: "webinar-arbitraje-construccion-2026",
      title: "Webinar: Arbitraje en Construcción 2026",
      description: "Actualización sobre las últimas tendencias en arbitraje de construcción en el Perú.",
      type: "WEBINAR" as const,
      startDate: new Date("2026-03-15T18:00:00"),
      endDate: new Date("2026-03-15T20:00:00"),
      isOnline: true,
      onlineUrl: "https://zoom.us/j/example",
      isPublished: true,
      isFeatured: true,
    },
    {
      slug: "taller-redaccion-clausulas-arbitrales",
      title: "Taller: Redacción de Cláusulas Arbitrales",
      description: "Aprenda a redactar cláusulas arbitrales efectivas para sus contratos comerciales.",
      type: "WORKSHOP" as const,
      startDate: new Date("2026-04-10T09:00:00"),
      endDate: new Date("2026-04-10T13:00:00"),
      isOnline: false,
      location: "Sede CAARD, Jr Paramonga 311, Santiago de Surco",
      price: 15000, // S/ 150.00
      maxAttendees: 30,
      isPublished: true,
    },
  ];

  for (const event of events) {
    await prisma.cmsEvent.upsert({
      where: { centerId_slug: { centerId: center.id, slug: event.slug } },
      update: event,
      create: {
        centerId: center.id,
        categoryId: eventCategory?.id,
        ...event,
      },
    });
    console.log(`   ✓ Evento: ${event.title}`);
  }
  console.log();

  // ==========================================================================
  // 7. Avisos (basado en comunicados reales de caardpe.com)
  // ==========================================================================
  console.log("🔔 Creando avisos...");

  // Eliminar avisos existentes
  await prisma.cmsAnnouncement.deleteMany({ where: { centerId: center.id } });

  await prisma.cmsAnnouncement.create({
    data: {
      centerId: center.id,
      type: "INFO",
      title: "Comunicado: Operatividad en días no hábiles",
      content: "Informamos que durante los días declarados no hábiles, la mesa de partes virtual permanecerá operativa para la recepción de documentos.",
      linkUrl: "/contacto",
      linkText: "Más información",
      showOnHomepage: true,
      showAsBanner: true,
      isActive: true,
    },
  });
  console.log("   ✓ Aviso creado\n");

  // ==========================================================================
  // Resumen
  // ==========================================================================
  console.log("═".repeat(60));
  console.log("✅ Seed del CMS completado exitosamente!\n");
  console.log("📋 Contenido creado:");
  console.log("   - Configuración del sitio (datos reales de caardpe.com)");
  console.log("   - Menú de navegación completo");
  console.log(`   - ${pages.length} páginas con secciones`);
  console.log(`   - ${categories.length} categorías`);
  console.log(`   - ${articles.length} artículos`);
  console.log(`   - ${events.length} eventos`);
  console.log("   - 1 aviso\n");
  console.log("🚀 Accede al CMS en: /admin/cms");
  console.log("🌐 Sitio público en: /\n");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
