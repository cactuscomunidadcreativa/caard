/**
 * /admin/auditoria
 *
 * Vista para el centro: trazabilidad completa del sistema. Lista todos
 * los eventos del AuditLog (creaciones, ediciones, eliminaciones de
 * vouchers, órdenes, escritos, etc.) con filtros y detalle expandible.
 */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuditoriaClient } from "./client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auditoría | Admin | CAARD",
};

const ALLOWED = ["SUPER_ADMIN", "ADMIN"];

export default async function AuditoriaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED.includes((session.user as any).role)) redirect("/dashboard");

  return <AuditoriaClient userRole={(session.user as any).role} />;
}
