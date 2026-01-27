/**
 * CAARD - Gestión de Nómina de Árbitros
 * Permite administrar los árbitros que aparecen en el registro público
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ArbitratorsManagementClient } from "./arbitrators-management-client";

export const metadata: Metadata = {
  title: "Nómina de Árbitros | CMS - CAARD",
  description: "Gestión del registro público de árbitros",
};

export default async function ArbitratorsManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(userRole)) {
    redirect("/dashboard");
  }

  return <ArbitratorsManagementClient />;
}
