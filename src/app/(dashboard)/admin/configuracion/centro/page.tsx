/**
 * /admin/configuracion/centro — Datos del Centro (editable)
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CentroEditorClient } from "./client";

export const dynamic = "force-dynamic";

export default async function CentroConfiguracionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const center = session.user.centerId
    ? await prisma.center.findUnique({ where: { id: session.user.centerId } })
    : await prisma.center.findFirst({ where: { code: "CAARD" } });

  if (!center) {
    return (
      <div className="container mx-auto py-12 text-center text-muted-foreground">
        No se encontró el centro.
      </div>
    );
  }

  const notifSettings = (center.notificationSettings as any) || {};
  const googleConnected = !!notifSettings.googleRefreshToken;

  return (
    <CentroEditorClient
      initial={{
        code: center.code,
        name: center.name,
        legalName: center.legalName,
        taxId: center.taxId,
        primaryColorHex: center.primaryColorHex,
        accentColorHex: center.accentColorHex,
        neutralColorHex: center.neutralColorHex,
        createdAt: center.createdAt.toISOString(),
      }}
      googleConnected={googleConnected}
    />
  );
}
