/**
 * CAARD - Configuración de Seguridad del Usuario
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SecuritySettingsClient } from "./security-settings-client";

export const metadata: Metadata = {
  title: "Seguridad | Mi Perfil | CAARD",
  description: "Configuración de seguridad y autenticación de dos factores",
};

export default async function SecuritySettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return <SecuritySettingsClient />;
}
