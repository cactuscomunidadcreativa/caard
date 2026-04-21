/**
 * /arbitro/emergencias/[id]/rechazar
 * Redirige al detalle (la UI de aceptar/rechazar está ahí).
 */
import { redirect } from "next/navigation";

export default async function RechazarEmergenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/arbitro/emergencias/${id}?action=reject`);
}
