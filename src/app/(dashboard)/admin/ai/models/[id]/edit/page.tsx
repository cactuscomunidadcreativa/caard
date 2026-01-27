/**
 * CAARD - Edición de Modelo de IA
 */

import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ModelEditClient } from "./model-edit-client";

export const metadata: Metadata = {
  title: "Editar Modelo | CAARD",
  description: "Edita un modelo de IA",
};

async function getModel(id: string) {
  return prisma.aIModel.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          roleAssignments: true,
          usageLogs: true,
        },
      },
    },
  });
}

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin/ai/models");
  }

  const { id } = await params;
  const model = await getModel(id);

  if (!model) {
    notFound();
  }

  return <ModelEditClient model={model} />;
}
