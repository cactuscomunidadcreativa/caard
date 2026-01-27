/**
 * CAARD - Página de Configuración de Notificaciones
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationsForm } from "./notifications-form";

export const metadata: Metadata = {
  title: "Notificaciones | CAARD",
  description: "Configura tus preferencias de notificación",
};

async function getUserPreferences(userId: string) {
  // Buscar preferencias existentes o retornar valores por defecto
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (preferences) {
    return preferences;
  }

  // Valores por defecto
  return {
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    caseUpdates: true,
    documentNotifications: true,
    deadlineReminders: true,
    paymentAlerts: true,
    hearingReminders: true,
    marketingEmails: false,
  };
}

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const preferences = await getUserPreferences(session.user.id);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Configuración
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <Bell className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#D66829]">Notificaciones</h1>
            <p className="text-muted-foreground">
              Configura cómo y cuándo recibes notificaciones
            </p>
          </div>
        </div>
      </div>

      <NotificationsForm initialPreferences={preferences} />
    </div>
  );
}
