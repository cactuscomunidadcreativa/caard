/**
 * CAARD - Página de Perfil de Usuario
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Mi Perfil | CAARD",
  description: "Gestiona tu información personal",
};

async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
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
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getUserProfile(session.user.id);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#D66829]">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu información personal y preferencias de cuenta
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
