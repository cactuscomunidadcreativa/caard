/**
 * CAARD - Crear Nuevo Asistente de IA
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewAssistantClient } from "./new-assistant-client";

export const metadata: Metadata = {
  title: "Nuevo Asistente | CAARD",
  description: "Crea un nuevo asistente de IA",
};

async function getModels() {
  return prisma.aIModel.findMany({
    where: { isActive: true },
    orderBy: [{ provider: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      provider: true,
      modelId: true,
      maxTokens: true,
      supportsVision: true,
      supportsFunctions: true,
    },
  });
}

export default async function NewAssistantPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin/ai/assistants");
  }

  const models = await getModels();

  return <NewAssistantClient models={models} />;
}
