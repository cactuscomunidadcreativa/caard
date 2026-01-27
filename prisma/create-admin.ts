/**
 * CAARD - Crear Usuario Administrador
 * Ejecutar: npx tsx prisma/create-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "admin@caardpe.com";
  const password = "Admin123!"; // Contraseña temporal
  const name = "Administrador CAARD";

  console.log("🔐 Creando/actualizando usuario administrador...\n");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Usuario administrador creado/actualizado:\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  📧 Email:      ${email}`);
  console.log(`  🔑 Contraseña: ${password}`);
  console.log(`  👤 Nombre:     ${name}`);
  console.log(`  🛡️  Rol:        SUPER_ADMIN`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("⚠️  IMPORTANTE: Cambia la contraseña después de iniciar sesión\n");
  console.log(`  URL de login: http://localhost:3000/login\n`);
}

createAdmin()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
