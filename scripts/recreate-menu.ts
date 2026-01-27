import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface MenuItem {
  label: string;
  pageSlug?: string;
  url?: string;
  sortOrder: number;
  children?: { label: string; pageSlug: string; sortOrder: number }[];
}

async function recreateMenu() {
  const center = await prisma.center.findFirst({ where: { code: 'CAARD' } });
  if (!center) {
    console.error('Centro no encontrado');
    return;
  }
  console.log('Centro encontrado:', center.id);

  // Eliminar menú existente
  await prisma.cmsMenuItem.deleteMany({ where: { centerId: center.id } });
  console.log('Menú anterior eliminado');

  // Crear nuevo menú con los slugs correctos
  const menuItems: MenuItem[] = [
    { label: 'El Centro', sortOrder: 1, children: [
      { label: 'Presentación', pageSlug: 'presentacion', sortOrder: 1 },
      { label: 'Secretaría General', pageSlug: 'secretaria-general', sortOrder: 2 },
      { label: 'Consejo Superior', pageSlug: 'consejo-superior', sortOrder: 3 },
      { label: 'Sedes', pageSlug: 'sedes', sortOrder: 4 },
    ]},
    { label: 'Servicios', sortOrder: 2, children: [
      { label: 'Arbitraje', pageSlug: 'arbitraje', sortOrder: 1 },
      { label: 'Arbitraje de Emergencia', pageSlug: 'arbitraje-emergencia', sortOrder: 2 },
      { label: 'Servicios Ad Hoc', pageSlug: 'servicios-ad-hoc', sortOrder: 3 },
      { label: 'Registro de Árbitros', pageSlug: 'registro-arbitros', sortOrder: 4 },
    ]},
    { label: 'Normativa', sortOrder: 3, children: [
      { label: 'Reglamentos', pageSlug: 'reglamentos', sortOrder: 1 },
      { label: 'Cláusula Arbitral', pageSlug: 'clausula-arbitral', sortOrder: 2 },
      { label: 'Calculadora de Gastos', pageSlug: 'calculadora', sortOrder: 3 },
    ]},
    { label: 'Consulta de Expedientes', url: '/login', sortOrder: 4 },
    { label: 'Contacto', pageSlug: 'contacto', sortOrder: 5 },
  ];

  for (const item of menuItems) {
    const parent = await prisma.cmsMenuItem.create({
      data: {
        centerId: center.id,
        label: item.label,
        pageSlug: item.pageSlug || null,
        url: item.url || null,
        sortOrder: item.sortOrder,
        isVisible: true,
      },
    });
    console.log('Creado:', item.label);

    if (item.children) {
      for (const child of item.children) {
        await prisma.cmsMenuItem.create({
          data: {
            centerId: center.id,
            parentId: parent.id,
            label: child.label,
            pageSlug: child.pageSlug,
            sortOrder: child.sortOrder,
            isVisible: true,
          },
        });
        console.log('  - Hijo:', child.label);
      }
    }
  }

  console.log('\n✅ Menú recreado exitosamente');
}

recreateMenu()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
