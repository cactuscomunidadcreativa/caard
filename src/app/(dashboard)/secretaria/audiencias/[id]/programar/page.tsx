/**
 * /secretaria/audiencias/[id]/programar
 * Server page: carga la sugerencia (CaseHearing con status=SUGGESTED) y
 * pasa los datos al cliente para que la secretaría confirme la fecha.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConfirmSuggestionClient from "./confirm-client";

export const dynamic = "force-dynamic";

export default async function ProgramarSugerenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(role)) {
    redirect("/dashboard");
  }
  const { id } = await params;

  const hearing = await prisma.caseHearing.findUnique({
    where: { id },
    include: {
      case: { select: { id: true, code: true, title: true } },
    },
  });

  if (!hearing) notFound();

  // Buscar nombre del árbitro que sugirió (si aplica)
  let suggestedBy: { name: string | null; email: string | null } | null = null;
  if (hearing.suggestedById) {
    suggestedBy = await prisma.user.findUnique({
      where: { id: hearing.suggestedById },
      select: { name: true, email: true },
    });
  }

  return (
    <ConfirmSuggestionClient
      hearing={{
        id: hearing.id,
        caseId: hearing.caseId,
        type: hearing.type,
        title: hearing.title,
        hearingAt: hearing.hearingAt.toISOString(),
        durationMinutes: hearing.durationMinutes,
        isOnline: hearing.isOnline,
        location: hearing.location,
        meetingUrl: hearing.meetingUrl,
        notes: hearing.notes,
        status: hearing.status,
        suggestedDates: (hearing.suggestedDates as any) || [],
        case: hearing.case,
      }}
      suggestedBy={suggestedBy}
    />
  );
}
