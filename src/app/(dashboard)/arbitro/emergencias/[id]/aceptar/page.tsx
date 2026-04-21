/**
 * /arbitro/emergencias/[id]/aceptar
 * El botón del dashboard manda aquí, pero la UI de aceptar/rechazar
 * vive en la página de detalle. Redirigimos al detalle.
 */
import { redirect } from "next/navigation";

export default async function AceptarEmergenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/arbitro/emergencias/${id}?action=accept`);
}
