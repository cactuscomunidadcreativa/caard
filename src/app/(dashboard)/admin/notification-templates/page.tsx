/**
 * CAARD - Plantillas de Notificación
 * Permite al staff del centro gestionar plantillas de notificación
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationTemplatesClient } from "./notification-templates-client";

export const metadata: Metadata = {
  title: "Plantillas de Notificación | CAARD",
  description: "Gestión de plantillas de notificación para casos arbitrales",
};

export default async function NotificationTemplatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  return <NotificationTemplatesClient />;
}
