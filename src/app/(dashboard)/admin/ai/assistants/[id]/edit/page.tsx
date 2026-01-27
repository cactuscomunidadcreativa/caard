/**
 * CAARD - Edición de Asistente de IA
 */

import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssistantEditClient } from "./assistant-edit-client";

export const metadata: Metadata = {
  title: "Editar Asistente | CAARD",
  description: "Edita un asistente de IA",
};

async function getAssistant(id: string) {
  return prisma.aIAssistant.findUnique({
    where: { id },
    include: {
      roleAssignments: {
        include: {
          model: {
            select: {
              id: true,
              name: true,
              provider: true,
              modelId: true,
            },
          },
        },
      },
    },
  });
}

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

export default async function EditAssistantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin/ai/assistants");
  }

  const { id } = await params;
  const [assistant, models] = await Promise.all([
    getAssistant(id),
    getModels(),
  ]);

  if (!assistant) {
    notFound();
  }

  return (
    <AssistantEditClient
      assistant={assistant}
      models={models}
    />
  );
}
