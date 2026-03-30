/**
 * CAARD - Script para limpiar datos demo y preparar para producción
 *
 * USO: npx tsx scripts/clean-demo-data.ts
 *
 * Este script ELIMINA:
 * - Casos de prueba (expedientes demo)
 * - Usuarios demo (excepto el SUPER_ADMIN principal)
 * - Artículos y eventos demo del CMS
 * - Anuncios de prueba
 * - Conversaciones de IA demo
 * - Logs de auditoría de prueba
 *
 * Este script PRESERVA:
 * - Configuración de roles
 * - Tipos de arbitraje
 * - Configuración de tarifas/aranceles
 * - Calendarios de feriados
 * - Estructura de menú CMS
 * - Páginas CMS (estructura, sin contenido demo)
 * - Configuración del centro CAARD
 * - Configuración del sitio CMS
 * - Modelos y asistentes de IA
 * - Reglas de notificación
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Emails de usuarios demo que se deben eliminar
const DEMO_EMAILS = [
  "admin@caard.pe",
  "staff@caard.pe",
  "secretaria@caard.pe",
  "arbitro@caard.pe",
  "arbitro2@caard.pe",
  "abogado@caard.pe",
  "abogado2@caard.pe",
  "demandante@ejemplo.com",
  "demandado@ejemplo.com",
];

// Email del super admin que se PRESERVA
const PRESERVE_ADMIN_EMAIL = "superadmin@caard.pe";

async function cleanDemoData() {
  console.log("🧹 Iniciando limpieza de datos demo...\n");

  try {
    // 1. Eliminar datos relacionados a casos demo
    console.log("📋 Limpiando casos demo...");

    const demoCases = await prisma.case.findMany({
      select: { id: true, code: true },
    });

    if (demoCases.length > 0) {
      console.log(`  Encontrados ${demoCases.length} casos para eliminar`);

      for (const c of demoCases) {
        // Eliminar en orden de dependencias
        await prisma.caseNote.deleteMany({ where: { caseId: c.id } });
        await prisma.caseStageHistory.deleteMany({ where: { caseId: c.id } });
        await prisma.caseHearing.deleteMany({ where: { caseId: c.id } });
        await prisma.caseDeadline.deleteMany({ where: { caseId: c.id } });
        await prisma.caseDocument.deleteMany({ where: { caseId: c.id } });
        await prisma.caseFolder.deleteMany({ where: { caseId: c.id } });
        await prisma.caseLawyer.deleteMany({ where: { caseId: c.id } });
        await prisma.caseMember.deleteMany({ where: { caseId: c.id } });
        await prisma.payment.deleteMany({ where: { caseId: c.id } });
        await prisma.paymentOrder.deleteMany({ where: { caseId: c.id } });

        console.log(`  ✓ Limpiado caso: ${c.code}`);
      }

      await prisma.case.deleteMany();
      console.log(`  ✓ ${demoCases.length} casos eliminados\n`);
    } else {
      console.log("  No hay casos para eliminar\n");
    }

    // 2. Eliminar solicitudes de emergencia demo
    console.log("🚨 Limpiando solicitudes de emergencia...");
    const emergencyCount = await prisma.emergencyRequest.deleteMany();
    console.log(`  ✓ ${emergencyCount.count} solicitudes eliminadas\n`);

    // 3. Eliminar usuarios demo
    console.log("👤 Limpiando usuarios demo...");
    for (const email of DEMO_EMAILS) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        // Limpiar dependencias del usuario
        await prisma.notification.deleteMany({ where: { userId: user.id } });
        await prisma.notificationPreference.deleteMany({ where: { userId: user.id } });
        await prisma.otpToken.deleteMany({ where: { userId: user.id } });
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.account.deleteMany({ where: { userId: user.id } });
        await prisma.aIConversation.deleteMany({ where: { userId: user.id } });
        await prisma.aIUsageLog.deleteMany({ where: { userId: user.id } });

        await prisma.user.delete({ where: { id: user.id } });
        console.log(`  ✓ Usuario eliminado: ${email}`);
      }
    }
    console.log("");

    // 4. Limpiar artículos y eventos demo del CMS
    console.log("📰 Limpiando contenido CMS demo...");
    const articlesDeleted = await prisma.cmsArticle.deleteMany();
    console.log(`  ✓ ${articlesDeleted.count} artículos eliminados`);

    const eventsDeleted = await prisma.cmsEvent.deleteMany();
    console.log(`  ✓ ${eventsDeleted.count} eventos eliminados`);

    const announcementsDeleted = await prisma.cmsAnnouncement.deleteMany();
    console.log(`  ✓ ${announcementsDeleted.count} anuncios eliminados\n`);

    // 5. Limpiar logs de auditoría demo
    console.log("📝 Limpiando logs de auditoría...");
    const auditDeleted = await prisma.auditLog.deleteMany();
    console.log(`  ✓ ${auditDeleted.count} logs eliminados`);
    const sysAuditDeleted = await prisma.systemAuditLog.deleteMany();
    console.log(`  ✓ ${sysAuditDeleted.count} system logs eliminados\n`);

    // 6. Limpiar colas de notificación
    console.log("🔔 Limpiando colas de notificación...");
    const queueDeleted = await prisma.notificationQueue.deleteMany();
    console.log(`  ✓ ${queueDeleted.count} notificaciones en cola eliminadas\n`);

    // 7. Limpiar recusaciones demo
    console.log("⚖️ Limpiando recusaciones demo...");
    const recusationsDeleted = await prisma.recusation.deleteMany();
    console.log(`  ✓ ${recusationsDeleted.count} recusaciones eliminadas\n`);

    // 8. Limpiar liquidaciones demo
    console.log("💰 Limpiando liquidaciones demo...");
    try {
      const liquidationsDeleted = await prisma.caseLiquidation.deleteMany();
      console.log(`  ✓ ${liquidationsDeleted.count} liquidaciones eliminadas\n`);
    } catch {
      console.log("  (tabla no encontrada, omitiendo)\n");
    }

    // Resumen
    console.log("═══════════════════════════════════════");
    console.log("✅ Limpieza completada exitosamente!");
    console.log("═══════════════════════════════════════\n");

    console.log("📌 Lo que SE PRESERVÓ:");
    console.log("  • Centro CAARD y su configuración");
    console.log("  • Configuración de roles y permisos");
    console.log("  • Tipos de arbitraje");
    console.log("  • Tarifas y aranceles");
    console.log("  • Calendario de feriados");
    console.log("  • Estructura de páginas CMS (sin artículos demo)");
    console.log("  • Menú de navegación");
    console.log("  • Configuración del sitio");
    console.log("  • Modelos y asistentes de IA");
    console.log(`  • Usuario: ${PRESERVE_ADMIN_EMAIL}`);

    console.log("\n⚠️  Próximos pasos:");
    console.log("  1. Crea usuarios reales desde /admin/users");
    console.log("  2. Configura Google Drive desde /admin/integrations");
    console.log("  3. Sube imágenes reales a cabeceras desde /admin/cms/pages");
    console.log("  4. Crea contenido real (artículos, eventos, anuncios)");
    console.log("  5. Verifica las páginas públicas del sitio web");

  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
cleanDemoData().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
