/**
 * CAARD - Configuración de Impuestos (Admin)
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaxConfigurationClient } from "./tax-configuration-client";

export const metadata: Metadata = {
  title: "Configuración de Impuestos | Admin | CAARD",
  description: "Configuración de impuestos peruanos (IGV, Detracción, Retención 4ta)",
};

async function getTaxConfigurations(centerId: string) {
  const configs = await prisma.taxConfiguration.findMany({
    where: { centerId },
    orderBy: [
      { taxType: "asc" },
      { isActive: "desc" },
      { createdAt: "desc" },
    ],
  });

  return configs;
}

export default async function TaxConfigurationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const configs = await getTaxConfigurations(session.user.centerId || "");

  return <TaxConfigurationClient configurations={configs} />;
}
