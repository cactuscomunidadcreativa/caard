/**
 * CAARD - Página de Configuración
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Configuración | CAARD",
  description: "Gestiona la configuración de tu cuenta",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role || "DEMANDANTE";
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "SECRETARIA";

  return <SettingsClient userRole={userRole} isAdmin={isAdmin} />;
}
