/**
 * Perfil editable del árbitro.
 * Sección personal + documentos + procesos + independencia e imparcialidad con firma.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PerfilArbitroClient } from "./client";

export const metadata = {
  title: "Mi Perfil de Árbitro | CAARD",
};

export default async function PerfilArbitroPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (
    !["ARBITRO", "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(
      session.user.role
    )
  ) {
    redirect("/dashboard");
  }

  return <PerfilArbitroClient userEmail={session.user.email || ""} />;
}
