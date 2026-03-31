/**
 * CAARD - Seed para Contenido de Páginas CMS
 * ==========================================
 * Este seed crea el contenido editable de las páginas públicas
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌐 Creando contenido de páginas CMS...\n");

  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) {
    console.error("❌ No se encontró el centro CAARD. Ejecuta el seed principal primero.");
    return;
  }

  // ==========================================================================
  // PÁGINA DE INICIO
  // ==========================================================================
  console.log("📄 Configurando página de Inicio...");

  const homePage = await prisma.cmsPage.upsert({
    where: { centerId_slug: { centerId: center.id, slug: "inicio" } },
    update: {},
    create: {
      centerId: center.id,
      slug: "inicio",
      title: "Inicio",
      metaTitle: "CAARD | Centro de Arbitraje - Soluciones Eficientes para Conflictos",
      metaDescription: "Centro de Administración de Arbitrajes y Resolución de Disputas. Soluciones rápidas, confidenciales y económicas para resolver controversias comerciales.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // Eliminar secciones existentes de la página de inicio
  await prisma.cmsSection.deleteMany({ where: { pageId: homePage.id } });

  // Sección Hero
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: "HERO",
      title: "Resolvemos sus Controversias con Eficiencia",
      subtitle: "CAARD es el centro de arbitraje que combina experiencia, tecnología y un equipo altamente calificado para resolver sus disputas comerciales de manera rápida y confidencial.",
      content: {
        backgroundImage: "",
        buttons: [
          { text: "Iniciar Arbitraje", url: "/solicitud-arbitral", variant: "primary" },
          { text: "Conocer más", url: "/el-centro/presentacion", variant: "secondary" },
        ],
      },
      bgColor: "#D66829",
      padding: "xl",
      sortOrder: 1,
      isVisible: true,
    },
  });

  // Sección Servicios (Cards)
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: "CARDS",
      title: "Nuestros Servicios",
      subtitle: "Soluciones adaptadas a cada tipo de controversia",
      content: {
        columns: 4,
        cards: [
          {
            icon: "briefcase",
            title: "Arbitraje Comercial",
            description: "Resolución de controversias derivadas de relaciones comerciales y mercantiles con árbitros especializados.",
            url: "/arbitraje/comercial",
            linkText: "Conocer más",
          },
          {
            icon: "building",
            title: "Arbitraje de Construcción",
            description: "Expertos en controversias de contratos de construcción, obras civiles y proyectos de infraestructura.",
            url: "/arbitraje/construccion",
            linkText: "Conocer más",
          },
          {
            icon: "alert",
            title: "Arbitraje de Emergencia",
            description: "Procedimiento acelerado para medidas urgentes y cautelares que requieren resolución inmediata.",
            url: "/arbitraje/arbitraje-emergencia",
            linkText: "Conocer más",
          },
          {
            icon: "handshake",
            title: "Mediación",
            description: "Procesos de mediación y conciliación para resolver conflictos de manera colaborativa.",
            url: "/mediacion",
            linkText: "Conocer más",
          },
        ],
      },
      bgColor: "#ffffff",
      padding: "lg",
      sortOrder: 2,
      isVisible: true,
    },
  });

  // Sección Estadísticas
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: "STATS",
      title: "CAARD en Números",
      content: {
        stats: [
          { value: "500+", label: "Casos Resueltos" },
          { value: "95%", label: "Tasa de Éxito" },
          { value: "45", label: "Árbitros Especializados" },
          { value: "90", label: "Días Promedio de Resolución" },
        ],
      },
      bgColor: "#D66829",
      padding: "lg",
      sortOrder: 3,
      isVisible: true,
    },
  });

  // Sección Por qué elegirnos (Cards)
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: "CARDS",
      title: "¿Por qué elegir CAARD?",
      subtitle: "Ventajas de nuestro centro de arbitraje",
      content: {
        columns: 3,
        cards: [
          {
            icon: "clock",
            title: "Rapidez",
            description: "Procesos arbitrales ágiles con plazos definidos. Resolvemos en promedio en 90 días.",
          },
          {
            icon: "shield",
            title: "Confidencialidad",
            description: "Total reserva en el manejo de información. Sus disputas se resuelven de manera privada.",
          },
          {
            icon: "scale",
            title: "Imparcialidad",
            description: "Árbitros independientes y neutrales garantizan decisiones justas y equitativas.",
          },
          {
            icon: "creditCard",
            title: "Economía",
            description: "Costos transparentes y competitivos. Ahorre tiempo y dinero comparado con el Poder Judicial.",
          },
          {
            icon: "users",
            title: "Experiencia",
            description: "Equipo de profesionales con amplia trayectoria en derecho comercial y arbitraje.",
          },
          {
            icon: "clipboard",
            title: "Tecnología",
            description: "Plataforma digital moderna para gestión de expedientes y audiencias virtuales.",
          },
        ],
      },
      bgColor: "#f8fafc",
      padding: "lg",
      sortOrder: 4,
      isVisible: true,
    },
  });

  // Sección CTA
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: "CTA",
      title: "¿Tiene una controversia comercial?",
      subtitle: "Inicie su proceso arbitral hoy y resuelva su disputa de manera rápida, confidencial y económica.",
      content: {
        buttonText: "Solicitar Arbitraje",
        buttonUrl: "/solicitud-arbitral",
        secondaryButtonText: "Contáctenos",
        secondaryButtonUrl: "/contacto",
      },
      bgColor: "#0B2A5B",
      padding: "lg",
      sortOrder: 5,
      isVisible: true,
    },
  });

  // Sección Proceso (Timeline)
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: "TIMELINE",
      title: "¿Cómo funciona el Arbitraje?",
      content: {
        items: [
          {
            title: "1. Solicitud de Arbitraje",
            description: "Complete el formulario de solicitud arbitral y adjunte la documentación requerida.",
          },
          {
            title: "2. Evaluación y Admisión",
            description: "Revisamos su solicitud y verificamos el cumplimiento de requisitos formales.",
          },
          {
            title: "3. Designación del Tribunal",
            description: "Se conforma el tribunal arbitral con árbitros especializados en la materia.",
          },
          {
            title: "4. Etapa Probatoria",
            description: "Las partes presentan sus pruebas y alegatos. Se realizan audiencias si es necesario.",
          },
          {
            title: "5. Laudo Arbitral",
            description: "El tribunal emite su decisión final, que es vinculante para ambas partes.",
          },
        ],
      },
      bgColor: "#ffffff",
      padding: "lg",
      sortOrder: 6,
      isVisible: true,
    },
  });

  // Sección Testimonios
  await prisma.cmsSection.create({
    data: {
      pageId: homePage.id,
      type: "TESTIMONIALS",
      title: "Lo que dicen nuestros clientes",
      content: {
        testimonials: [
          {
            quote: "CAARD resolvió nuestra disputa comercial en tiempo récord. El proceso fue transparente y profesional de principio a fin.",
            name: "Carlos Mendoza",
            company: "Gerente General, Tech Solutions SAC",
          },
          {
            quote: "La confidencialidad y eficiencia del proceso arbitral superó nuestras expectativas. Altamente recomendado.",
            name: "María Fernández",
            company: "Directora Legal, Constructora Andina",
          },
          {
            quote: "Excelente experiencia. Los árbitros demostraron gran conocimiento técnico y las decisiones fueron justas.",
            name: "Roberto Vargas",
            company: "CEO, Importaciones del Norte",
          },
        ],
      },
      bgColor: "#f8fafc",
      padding: "lg",
      sortOrder: 7,
      isVisible: true,
    },
  });

  console.log("   ✓ Página de Inicio configurada\n");

  // ==========================================================================
  // PÁGINA PRESENTACIÓN
  // ==========================================================================
  console.log("📄 Configurando página de Presentación...");

  const presentacionPage = await prisma.cmsPage.upsert({
    where: { centerId_slug: { centerId: center.id, slug: "el-centro/presentacion" } },
    update: {},
    create: {
      centerId: center.id,
      slug: "el-centro/presentacion",
      title: "Presentación",
      metaTitle: "Presentación | CAARD - Centro de Arbitraje",
      metaDescription: "Conozca el Centro de Administración de Arbitrajes y Resolución de Disputas. Nuestra misión, visión y compromiso con la resolución eficiente de controversias.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.cmsSection.deleteMany({ where: { pageId: presentacionPage.id } });

  // Hero
  await prisma.cmsSection.create({
    data: {
      pageId: presentacionPage.id,
      type: "HERO",
      title: "Sobre Nosotros",
      subtitle: "Impulsamos el arbitraje como medio eficaz para la solución de controversias en el Perú",
      content: { buttons: [] },
      bgColor: "#D66829",
      padding: "lg",
      sortOrder: 1,
      isVisible: true,
    },
  });

  // Contenido principal
  await prisma.cmsSection.create({
    data: {
      pageId: presentacionPage.id,
      type: "TEXT",
      title: "Nuestra Historia",
      content: {
        html: `
          <p class="mb-4">El Centro de Administración de Arbitrajes y Resolución de Disputas (CAARD) nació con la visión de transformar la manera en que se resuelven las controversias comerciales en el Perú.</p>
          <p class="mb-4">Fundado por un grupo de destacados profesionales del derecho, CAARD se ha consolidado como una institución líder en la administración de procesos arbitrales, ofreciendo servicios de excelencia que combinan experiencia, tecnología y un profundo compromiso con la justicia.</p>
          <p>Nuestra misión es proporcionar un foro neutral, eficiente y confiable para la resolución de disputas, contribuyendo al desarrollo del arbitraje institucional en nuestro país.</p>
        `,
      },
      bgColor: "#ffffff",
      padding: "lg",
      sortOrder: 2,
      isVisible: true,
    },
  });

  // Misión y Visión
  await prisma.cmsSection.create({
    data: {
      pageId: presentacionPage.id,
      type: "CARDS",
      title: "",
      content: {
        columns: 2,
        cards: [
          {
            icon: "scale",
            title: "Nuestra Misión",
            description: "Administrar procesos arbitrales con excelencia, ofreciendo un servicio transparente, eficiente y accesible que garantice la resolución justa de controversias comerciales.",
          },
          {
            icon: "building",
            title: "Nuestra Visión",
            description: "Ser reconocidos como el centro de arbitraje de referencia en el Perú, destacando por nuestra innovación, integridad y compromiso con la resolución efectiva de disputas.",
          },
        ],
      },
      bgColor: "#f8fafc",
      padding: "lg",
      sortOrder: 3,
      isVisible: true,
    },
  });

  // Valores
  await prisma.cmsSection.create({
    data: {
      pageId: presentacionPage.id,
      type: "CARDS",
      title: "Nuestros Valores",
      content: {
        columns: 4,
        cards: [
          { icon: "shield", title: "Integridad", description: "Actuamos con honestidad, transparencia y ética en todas nuestras acciones." },
          { icon: "users", title: "Profesionalismo", description: "Brindamos servicios de alta calidad con un equipo altamente calificado." },
          { icon: "clock", title: "Eficiencia", description: "Optimizamos recursos y tiempos para resolver controversias ágilmente." },
          { icon: "handshake", title: "Imparcialidad", description: "Garantizamos neutralidad y equidad en todos los procesos." },
        ],
      },
      bgColor: "#ffffff",
      padding: "lg",
      sortOrder: 4,
      isVisible: true,
    },
  });

  console.log("   ✓ Página de Presentación configurada\n");

  // ==========================================================================
  // PÁGINA SECRETARÍA GENERAL
  // ==========================================================================
  console.log("📄 Configurando página de Secretaría General...");

  const secretariaPage = await prisma.cmsPage.upsert({
    where: { centerId_slug: { centerId: center.id, slug: "el-centro/secretaria-general" } },
    update: {},
    create: {
      centerId: center.id,
      slug: "el-centro/secretaria-general",
      title: "Secretaría General",
      metaTitle: "Secretaría General | CAARD",
      metaDescription: "Conozca el equipo de la Secretaría General de CAARD, responsable de la administración eficiente de los procesos arbitrales.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.cmsSection.deleteMany({ where: { pageId: secretariaPage.id } });

  await prisma.cmsSection.create({
    data: {
      pageId: secretariaPage.id,
      type: "HERO",
      title: "Secretaría General",
      subtitle: "El corazón administrativo de CAARD",
      content: { buttons: [] },
      bgColor: "#D66829",
      padding: "lg",
      sortOrder: 1,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: secretariaPage.id,
      type: "TEXT",
      title: "",
      content: {
        html: `
          <p class="mb-4">La Secretaría General de CAARD es el órgano encargado de la administración y gestión de todos los procesos arbitrales. Su función principal es garantizar que los procedimientos se desarrollen de manera eficiente, transparente y conforme a nuestro reglamento.</p>
          <p>Nuestro equipo de profesionales está comprometido con brindar un servicio de excelencia, asegurando que tanto árbitros como partes cuenten con el soporte necesario durante todo el proceso.</p>
        `,
      },
      bgColor: "#ffffff",
      padding: "lg",
      sortOrder: 2,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: secretariaPage.id,
      type: "TEAM",
      title: "Nuestro Equipo",
      content: {
        layout: "detailed",
        members: [
          {
            name: "Dr. Manuel Rodríguez Torres",
            role: "Secretario General",
            email: "secretariageneral@caardpe.com",
            bio: "Abogado con más de 20 años de experiencia en arbitraje comercial y procesal civil. Ex árbitro del Centro de Arbitraje de la Cámara de Comercio de Lima.",
            image: "",
          },
          {
            name: "Dra. Patricia Sánchez Medina",
            role: "Secretaria Adjunta",
            email: "secretariaadjunta@caardpe.com",
            bio: "Especialista en derecho comercial y arbitraje internacional. Máster en Arbitraje por la Universidad Carlos III de Madrid.",
            image: "",
          },
        ],
      },
      bgColor: "#f8fafc",
      padding: "lg",
      sortOrder: 3,
      isVisible: true,
    },
  });

  console.log("   ✓ Página de Secretaría General configurada\n");

  // ==========================================================================
  // PÁGINA CONSEJO SUPERIOR
  // ==========================================================================
  console.log("📄 Configurando página de Consejo Superior...");

  const consejoPage = await prisma.cmsPage.upsert({
    where: { centerId_slug: { centerId: center.id, slug: "el-centro/consejo-superior" } },
    update: {},
    create: {
      centerId: center.id,
      slug: "el-centro/consejo-superior",
      title: "Consejo Superior de Arbitraje",
      metaTitle: "Consejo Superior | CAARD",
      metaDescription: "El Consejo Superior de Arbitraje de CAARD está conformado por distinguidos profesionales del derecho.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.cmsSection.deleteMany({ where: { pageId: consejoPage.id } });

  await prisma.cmsSection.create({
    data: {
      pageId: consejoPage.id,
      type: "HERO",
      title: "Consejo Superior de Arbitraje",
      subtitle: "Liderazgo y excelencia en la administración de justicia arbitral",
      content: { buttons: [] },
      bgColor: "#D66829",
      padding: "lg",
      sortOrder: 1,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: consejoPage.id,
      type: "TEXT",
      title: "",
      content: {
        html: `
          <p class="mb-4">El Consejo Superior de Arbitraje es el órgano máximo de CAARD, responsable de establecer las políticas institucionales, supervisar el correcto funcionamiento del centro y garantizar la calidad de los servicios arbitrales.</p>
          <p>Está conformado por distinguidos profesionales del derecho con amplia trayectoria en el campo del arbitraje nacional e internacional.</p>
        `,
      },
      bgColor: "#ffffff",
      padding: "md",
      sortOrder: 2,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: consejoPage.id,
      type: "TEAM",
      title: "Miembros del Consejo",
      content: {
        layout: "grid",
        members: [
          { name: "Dr. Ricardo Fernández Luna", role: "Presidente", email: "presidente@caardpe.com", bio: "Ex magistrado de la Corte Suprema. 35 años de experiencia en derecho civil y comercial.", image: "" },
          { name: "Dra. Carmen Vega Díaz", role: "Vicepresidenta", email: "vicepresidencia@caardpe.com", bio: "Árbitro internacional. Doctora en Derecho por la Universidad Complutense de Madrid.", image: "" },
          { name: "Dr. Jorge Medina Quispe", role: "Vocal", email: "", bio: "Especialista en arbitraje de construcción y contrataciones del Estado.", image: "" },
        ],
      },
      bgColor: "#f8fafc",
      padding: "lg",
      sortOrder: 3,
      isVisible: true,
    },
  });

  console.log("   ✓ Página de Consejo Superior configurada\n");

  // ==========================================================================
  // PÁGINA REGLAMENTOS
  // ==========================================================================
  console.log("📄 Configurando página de Reglamentos...");

  const reglamentosPage = await prisma.cmsPage.upsert({
    where: { centerId_slug: { centerId: center.id, slug: "arbitraje/reglamentos" } },
    update: {},
    create: {
      centerId: center.id,
      slug: "arbitraje/reglamentos",
      title: "Reglamentos",
      metaTitle: "Reglamentos | CAARD",
      metaDescription: "Consulte los reglamentos de arbitraje de CAARD. Marco normativo para los procesos arbitrales.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.cmsSection.deleteMany({ where: { pageId: reglamentosPage.id } });

  await prisma.cmsSection.create({
    data: {
      pageId: reglamentosPage.id,
      type: "HERO",
      title: "Reglamentos de Arbitraje",
      subtitle: "Marco normativo que rige nuestros procedimientos arbitrales",
      content: { buttons: [] },
      bgColor: "#D66829",
      padding: "lg",
      sortOrder: 1,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: reglamentosPage.id,
      type: "CARDS",
      title: "Documentos Normativos",
      subtitle: "Descargue nuestros reglamentos y documentos de referencia",
      content: {
        columns: 2,
        cards: [
          {
            icon: "fileText",
            title: "Reglamento de Arbitraje",
            description: "Documento principal que establece las reglas y procedimientos para la administración de arbitrajes en CAARD.",
            url: "#",
            linkText: "Descargar PDF",
          },
          {
            icon: "fileText",
            title: "Reglamento de Árbitro de Emergencia",
            description: "Normativa específica para procedimientos de emergencia y medidas cautelares urgentes.",
            url: "#",
            linkText: "Descargar PDF",
          },
          {
            icon: "fileText",
            title: "Tabla de Gastos Arbitrales",
            description: "Detalle de honorarios de árbitros y gastos administrativos según cuantía de la controversia.",
            url: "/arbitraje/calculadora-gastos",
            linkText: "Ver calculadora",
          },
          {
            icon: "fileText",
            title: "Código de Ética",
            description: "Principios y estándares éticos que rigen la conducta de árbitros y funcionarios del centro.",
            url: "#",
            linkText: "Descargar PDF",
          },
        ],
      },
      bgColor: "#ffffff",
      padding: "lg",
      sortOrder: 2,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: reglamentosPage.id,
      type: "ACCORDION",
      title: "Preguntas Frecuentes sobre el Reglamento",
      content: {
        items: [
          {
            question: "¿Qué versión del reglamento se aplica a mi caso?",
            answer: "Se aplica el reglamento vigente al momento de presentación de la solicitud arbitral, salvo acuerdo distinto de las partes.",
          },
          {
            question: "¿Puedo acordar reglas diferentes a las del reglamento?",
            answer: "Las partes pueden modificar aspectos procedimentales no esenciales mediante acuerdo escrito, siempre que no contravengan normas imperativas.",
          },
          {
            question: "¿Dónde se llevan a cabo las audiencias?",
            answer: "Las audiencias pueden realizarse en la sede de CAARD, en lugar acordado por las partes, o de manera virtual según lo determine el tribunal.",
          },
          {
            question: "¿Cuál es el idioma del arbitraje?",
            answer: "El idioma por defecto es el español. Las partes pueden acordar otro idioma, lo cual puede implicar costos adicionales de traducción.",
          },
        ],
      },
      bgColor: "#f8fafc",
      padding: "lg",
      sortOrder: 3,
      isVisible: true,
    },
  });

  console.log("   ✓ Página de Reglamentos configurada\n");

  // ==========================================================================
  // PÁGINA ARBITRAJE DE EMERGENCIA
  // ==========================================================================
  console.log("📄 Configurando página de Arbitraje de Emergencia...");

  const emergenciaPage = await prisma.cmsPage.upsert({
    where: { centerId_slug: { centerId: center.id, slug: "arbitraje/arbitraje-emergencia" } },
    update: {},
    create: {
      centerId: center.id,
      slug: "arbitraje/arbitraje-emergencia",
      title: "Arbitraje de Emergencia",
      metaTitle: "Arbitraje de Emergencia | CAARD",
      metaDescription: "Procedimiento acelerado para medidas urgentes. Obtenga protección cautelar en 72 horas.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.cmsSection.deleteMany({ where: { pageId: emergenciaPage.id } });

  await prisma.cmsSection.create({
    data: {
      pageId: emergenciaPage.id,
      type: "HERO",
      title: "Árbitro de Emergencia",
      subtitle: "Medidas cautelares urgentes en 72 horas",
      content: {
        buttons: [
          { text: "Solicitar Emergencia", url: "/solicitud-arbitral?tipo=emergencia", variant: "primary" },
        ],
      },
      bgColor: "#D66829",
      padding: "lg",
      sortOrder: 1,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: emergenciaPage.id,
      type: "TEXT",
      title: "¿Qué es el Arbitraje de Emergencia?",
      content: {
        html: `
          <p class="mb-4">El procedimiento de Árbitro de Emergencia permite a las partes obtener medidas cautelares o provisionales urgentes antes de la constitución del tribunal arbitral ordinario.</p>
          <p class="mb-4">Este mecanismo está diseñado para situaciones donde la demora en la adopción de medidas podría causar un perjuicio irreparable a la parte solicitante.</p>
          <p>El Árbitro de Emergencia es designado dentro de las 24 horas siguientes a la admisión de la solicitud y debe pronunciarse en un plazo máximo de 15 días.</p>
        `,
      },
      bgColor: "#ffffff",
      padding: "md",
      sortOrder: 2,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: emergenciaPage.id,
      type: "TIMELINE",
      title: "Proceso del Árbitro de Emergencia",
      content: {
        items: [
          { title: "Solicitud (Día 0)", description: "Presentación de la solicitud con documentación de urgencia y pago de tasa." },
          { title: "Admisión (24 horas)", description: "Evaluación de procedencia y designación del Árbitro de Emergencia." },
          { title: "Traslado (48 horas)", description: "Notificación a la contraparte para presentar alegatos." },
          { title: "Audiencia (Opcional)", description: "El árbitro puede convocar audiencia virtual si lo considera necesario." },
          { title: "Decisión (15 días máx)", description: "Emisión de la orden provisional con carácter vinculante." },
        ],
      },
      bgColor: "#f8fafc",
      padding: "lg",
      sortOrder: 3,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: emergenciaPage.id,
      type: "CTA",
      title: "¿Necesita una medida urgente?",
      subtitle: "Nuestro equipo está disponible 24/7 para atender solicitudes de emergencia.",
      content: {
        buttonText: "Solicitar Emergencia",
        buttonUrl: "/solicitud-arbitral?tipo=emergencia",
        secondaryButtonText: "Llamar ahora",
        secondaryButtonUrl: "tel:+51913755003",
      },
      bgColor: "#0B2A5B",
      padding: "lg",
      sortOrder: 4,
      isVisible: true,
    },
  });

  console.log("   ✓ Página de Arbitraje de Emergencia configurada\n");

  // ==========================================================================
  // PÁGINA CONTACTO
  // ==========================================================================
  console.log("📄 Configurando página de Contacto...");

  const contactoPage = await prisma.cmsPage.upsert({
    where: { centerId_slug: { centerId: center.id, slug: "contacto" } },
    update: {},
    create: {
      centerId: center.id,
      slug: "contacto",
      title: "Contacto",
      metaTitle: "Contacto | CAARD",
      metaDescription: "Contáctenos para resolver sus dudas sobre nuestros servicios de arbitraje. Estamos para ayudarle.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.cmsSection.deleteMany({ where: { pageId: contactoPage.id } });

  await prisma.cmsSection.create({
    data: {
      pageId: contactoPage.id,
      type: "HERO",
      title: "Contáctenos",
      subtitle: "Estamos aquí para ayudarle con sus consultas sobre arbitraje",
      content: { buttons: [] },
      bgColor: "#D66829",
      padding: "md",
      sortOrder: 1,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: contactoPage.id,
      type: "CONTACT_FORM",
      title: "Envíenos un mensaje",
      content: {
        submitText: "Enviar Consulta",
      },
      bgColor: "#ffffff",
      padding: "lg",
      sortOrder: 2,
      isVisible: true,
    },
  });

  await prisma.cmsSection.create({
    data: {
      pageId: contactoPage.id,
      type: "EMBED",
      title: "Nuestra Ubicación",
      content: {
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.066548440893!2d-77.00291908519744!3d-12.123456789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDA3JzI0LjQiUyA3N8KwMDAnMTAuNSJX!5e0!3m2!1ses-419!2spe!4v1234567890",
      },
      bgColor: "#f8fafc",
      padding: "md",
      sortOrder: 3,
      isVisible: true,
    },
  });

  console.log("   ✓ Página de Contacto configurada\n");

  // ==========================================================================
  // AVISOS (ANNOUNCEMENTS)
  // ==========================================================================
  console.log("📢 Creando avisos de ejemplo...");

  await prisma.cmsAnnouncement.deleteMany({ where: { centerId: center.id } });

  await prisma.cmsAnnouncement.create({
    data: {
      centerId: center.id,
      title: "Nueva versión del Reglamento de Arbitraje vigente desde enero 2026",
      content: "Consulte los cambios más importantes",
      type: "INFO",
      linkUrl: "/arbitraje/reglamentos",
      linkText: "Ver reglamento",
      isActive: true,
      showOnHomepage: true,
      startDate: new Date(),
      sortOrder: 1,
    },
  });

  console.log("   ✓ Avisos creados\n");

  console.log("═".repeat(50));
  console.log("✅ Contenido CMS creado exitosamente!");
  console.log("═".repeat(50));
  console.log("\nPáginas configuradas:");
  console.log("   • /             - Página de inicio con 7 secciones");
  console.log("   • /el-centro/presentacion");
  console.log("   • /el-centro/secretaria-general");
  console.log("   • /el-centro/consejo-superior");
  console.log("   • /arbitraje/reglamentos");
  console.log("   • /arbitraje/arbitraje-emergencia");
  console.log("   • /contacto");
  console.log("\n🎨 Todas las secciones son editables desde el panel de administración.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
