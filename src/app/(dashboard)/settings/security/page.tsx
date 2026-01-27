/**
 * CAARD - Página de Seguridad
 * Cambio de contraseña y configuración de autenticación
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SecurityClient } from "./security-client";

export const metadata: Metadata = {
  title: "Seguridad | CAARD",
  description: "Cambia tu contraseña y configura la autenticación",
};

export default async function SecurityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <SecurityClient />;
}
