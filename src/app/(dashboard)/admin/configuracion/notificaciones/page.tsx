/**
 * CAARD - Configuración de Notificaciones (SMS, WhatsApp, Email)
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationsConfigClient } from "./notifications-config-client";

export const metadata: Metadata = {
  title: "Configuración de Notificaciones | Admin | CAARD",
  description: "Configurar SMS, WhatsApp y Email para notificaciones",
};

export default async function NotificationsConfigPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <NotificationsConfigClient />;
}
