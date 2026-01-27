/**
 * CAARD - Crear Nuevo Modelo de IA
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewModelClient } from "./new-model-client";

export const metadata: Metadata = {
  title: "Nuevo Modelo | CAARD",
  description: "Agrega un nuevo modelo de IA",
};

export default async function NewModelPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin/ai/models");
  }

  return <NewModelClient />;
}
