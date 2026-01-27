/**
 * CAARD - Panel de Gestión de Usuarios
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";

import { UsersTable } from "./users-table";
import { CreateUserButton } from "./create-user-button";

export const metadata: Metadata = {
  title: "Gestión de Usuarios | CAARD",
  description: "Administra usuarios, roles y permisos del sistema",
};

async function getInitialData(userRole: string, centerId: string | null) {
  const where: any = {};

  // Si es SECRETARIA, solo ver usuarios de su centro
  if (userRole === "SECRETARIA" && centerId) {
    where.centerId = centerId;
  }

  const [users, total, centers] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phoneE164: true,
        role: true,
        isActive: true,
        createdAt: true,
        center: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.user.count({ where }),
    prisma.center.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serializar las fechas para que sean compatibles con el cliente
  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return { users: serializedUsers, total, centers };
}

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role || "DEMANDANTE";
  const allowedRoles = ["SUPER_ADMIN", "SECRETARIA"];

  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { centerId: true },
  });

  const { users, total, centers } = await getInitialData(userRole, currentUser?.centerId || null);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#D66829]">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              {total} usuario{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {userRole === "SUPER_ADMIN" && <CreateUserButton centers={centers} />}
      </div>

      <UsersTable
        initialUsers={users}
        initialTotal={total}
        centers={centers}
        isSuperAdmin={userRole === "SUPER_ADMIN"}
      />
    </div>
  );
}
