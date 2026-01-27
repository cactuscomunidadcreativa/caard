/**
 * CAARD - Dashboard principal
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { ROLE_LABELS } from "@/types";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role as keyof typeof ROLE_LABELS;
  const userName = session.user.name || "Usuario";

  return <DashboardClient userName={userName} userRole={userRole} />;
}
