/**
 * CAARD - Site Health Report
 * ==========================
 * Shows system health, storage usage, errors, and incidents
 */

import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SiteHealthClient } from "./site-health-client";

export const metadata: Metadata = {
  title: "Site Health | CAARD Admin",
  description: "System health, storage and incident monitoring",
};

export default async function SiteHealthPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!allowedRoles.includes((session.user as any).role || "")) {
    redirect("/dashboard");
  }

  return <SiteHealthClient />;
}
