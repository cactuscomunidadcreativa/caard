/**
 * CAARD - Seed de Configuración de Roles
 * Ejecutar: npx ts-node prisma/seed-roles.ts
 */

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const roleConfigs = [
  {
    role: Role.SUPER_ADMIN,
    displayName: "Super Administrador",
    description: "Acceso total al sistema, gestión de centros y configuración global",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "ShieldAlert",
    canAccessAdmin: true,
    canAccessCMS: true,
    canAccessAI: true,
    canManageUsers: true,
    canManageCases: true,
    canManageDocuments: true,
    canViewReports: true,
    isActive: true,
    isSystemRole: true,
    sortOrder: 1,
  },
  {
    role: Role.ADMIN,
    displayName: "Administrador General",
    description: "Administración del centro, usuarios y configuración",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "Shield",
    canAccessAdmin: true,
    canAccessCMS: true,
    canAccessAI: true,
    canManageUsers: true,
    canManageCases: true,
    canManageDocuments: true,
    canViewReports: true,
    isActive: true,
    isSystemRole: true,
    sortOrder: 2,
  },
  {
    role: Role.CENTER_STAFF,
    displayName: "Personal del Centro",
    description: "Staff administrativo con acceso a gestión de contenido",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "Building",
    canAccessAdmin: false,
    canAccessCMS: true,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    isActive: true,
    isSystemRole: true,
    sortOrder: 3,
  },
  {
    role: Role.SECRETARIA,
    displayName: "Secretaría Arbitral",
    description: "Gestión de expedientes, documentos y notificaciones",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "ClipboardList",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: true,
    canManageDocuments: true,
    canViewReports: true,
    isActive: true,
    isSystemRole: true,
    sortOrder: 4,
  },
  {
    role: Role.ARBITRO,
    displayName: "Árbitro",
    description: "Resolución de casos asignados, emisión de laudos",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: "Scale",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: true,
    maxCasesAssigned: 50,
    isActive: true,
    isSystemRole: true,
    sortOrder: 5,
  },
  {
    role: Role.ABOGADO,
    displayName: "Abogado",
    description: "Representante legal de partes en casos arbitrales. Puede representar demandantes o demandados.",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "Briefcase",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    isActive: true,
    isSystemRole: true,
    sortOrder: 6,
  },
  {
    role: Role.DEMANDANTE,
    displayName: "Demandante",
    description: "Parte que inicia el proceso arbitral",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "UserCheck",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    isActive: true,
    isSystemRole: true,
    sortOrder: 7,
  },
  {
    role: Role.DEMANDADO,
    displayName: "Demandado",
    description: "Parte contra la cual se dirige la demanda",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "User",
    canAccessAdmin: false,
    canAccessCMS: false,
    canAccessAI: true,
    canManageUsers: false,
    canManageCases: false,
    canManageDocuments: true,
    canViewReports: false,
    isActive: true,
    isSystemRole: true,
    sortOrder: 8,
  },
];

async function main() {
  console.log("🔧 Iniciando seed de configuración de roles...\n");

  for (const config of roleConfigs) {
    const existing = await prisma.roleConfig.findUnique({
      where: { role: config.role },
    });

    if (existing) {
      console.log(`⏭️  Rol ${config.role} ya existe, actualizando...`);
      await prisma.roleConfig.update({
        where: { role: config.role },
        data: config,
      });
    } else {
      console.log(`✅ Creando configuración para rol: ${config.role}`);
      await prisma.roleConfig.create({
        data: config,
      });
    }
  }

  console.log("\n✅ Seed de roles completado!");
  console.log(`📊 Total: ${roleConfigs.length} roles configurados`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
