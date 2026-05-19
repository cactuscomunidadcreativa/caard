/**
 * /admin/plazos-config
 *
 * UI para editar overrides de plazos reglamentarios. Los defaults
 * viven en src/lib/rules/constants.ts; los overrides se guardan en
 * Center.notificationSettings.plazosOverrides y los usa el motor de
 * reglas en runtime.
 *
 * Solo SUPER_ADMIN y ADMIN.
 */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PlazosConfigClient } from "./client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plazos reglamentarios | Admin | CAARD",
};

export default async function PlazosConfigPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    redirect("/dashboard");
  }
  return <PlazosConfigClient />;
}
