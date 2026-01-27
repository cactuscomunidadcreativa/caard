/**
 * Página: Asistente IA
 * =====================
 * Asistente de inteligencia artificial adaptado al rol del usuario
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoleAssistant } from "@/components/ai/role-assistant";

export default async function AsistentePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Asistente IA</h1>
        <p className="text-muted-foreground">
          Tu asistente inteligente para consultas sobre el sistema de arbitraje
        </p>
      </div>

      <div className="h-[calc(100vh-220px)]">
        <RoleAssistant />
      </div>
    </div>
  );
}
