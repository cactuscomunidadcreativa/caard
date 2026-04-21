/**
 * /arbitro/casos/[id]
 * Redirige al expediente unificado /cases/[id] (vista compartida staff/árbitros).
 */
import { redirect } from "next/navigation";

export default async function ArbitroCasoRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/cases/${id}`);
}
