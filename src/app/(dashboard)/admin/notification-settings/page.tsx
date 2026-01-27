/**
 * CAARD - Configuración de Notificaciones del Centro
 * Permite al staff del centro configurar los canales de notificación
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationSettingsClient } from "./notification-settings-client";

export const metadata: Metadata = {
  title: "Configuración de Notificaciones | CAARD",
  description: "Configuración de canales de notificación para el centro",
};

export default async function NotificationSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  return <NotificationSettingsClient />;
}
