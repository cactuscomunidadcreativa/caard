/**
 * /secretaria/audiencias
 * Lista de audiencias del centro:
 *  - Sugeridas por árbitros (pendientes de programar)
 *  - Programadas
 *  - Completadas / Canceladas
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, ArrowLeft, Clock, MapPin, Video } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; bg?: string }
> = {
  SUGGESTED: { label: "Sugerida — pendiente", variant: "default", bg: "bg-blue-600" },
  SCHEDULED: { label: "Programada", variant: "outline" },
  COMPLETED: { label: "Realizada", variant: "secondary" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

export default async function SecretariaAudienciasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"].includes(role)) {
    redirect("/dashboard");
  }

  let suggested: any[] = [];
  let upcoming: any[] = [];
  let past: any[] = [];

  try {
    suggested = await prisma.caseHearing.findMany({
      where: { status: "SUGGESTED" as any },
      include: { case: { select: { id: true, code: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const now = new Date();
    upcoming = await prisma.caseHearing.findMany({
      where: { status: "SCHEDULED" as any, hearingAt: { gte: now } },
      include: { case: { select: { id: true, code: true, title: true } } },
      orderBy: { hearingAt: "asc" },
      take: 50,
    });

    past = await prisma.caseHearing.findMany({
      where: {
        OR: [
          { status: "COMPLETED" as any },
          { status: "CANCELLED" as any },
          { status: "SCHEDULED" as any, hearingAt: { lt: now } },
        ],
      },
      include: { case: { select: { id: true, code: true, title: true } } },
      orderBy: { hearingAt: "desc" },
      take: 30,
    });
  } catch (e) {
    console.error("audiencias list error:", e);
  }

  const Row = ({ h, action }: { h: any; action?: React.ReactNode }) => {
    const opciones = Array.isArray(h.suggestedDates) ? h.suggestedDates.length : 0;
    const status = STATUS_LABEL[h.status] || { label: h.status, variant: "secondary" as const };
    return (
      <div className="flex items-center justify-between border-b pb-3 last:border-0 gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">
              {h.case?.code} — {h.title}
            </p>
            <Badge variant={status.variant} className={status.bg}>
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <Clock className="h-3 w-3" />
            {new Date(h.hearingAt).toLocaleString("es-PE", {
              timeZone: "America/Lima",
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {h.isOnline ? (
              <>
                <Video className="h-3 w-3 ml-2" /> Virtual
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 ml-2" /> Presencial
              </>
            )}
            {h.status === "SUGGESTED" && opciones > 1 && (
              <span className="ml-2">· {opciones} opciones propuestas</span>
            )}
          </p>
        </div>
        {action}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/secretaria">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Audiencias</h1>
          <p className="text-muted-foreground">
            Programa audiencias o confirma las sugeridas por los árbitros
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/audiencias/programar">
            <Plus className="h-4 w-4 mr-2" />
            Programar nueva
          </Link>
        </Button>
      </div>

      {/* Sugeridas */}
      <Card id="audiencias-sugeridas">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Sugeridas por árbitros — pendientes de programar
            {suggested.length > 0 && (
              <Badge variant="default" className="bg-blue-600 ml-2">
                {suggested.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Confirma fecha y hora definitiva. Las partes y árbitros recibirán notificación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggested.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay audiencias sugeridas pendientes
            </p>
          ) : (
            <div className="space-y-3">
              {suggested.map((h) => (
                <Row
                  key={h.id}
                  h={h}
                  action={
                    <Button asChild size="sm">
                      <Link href={`/secretaria/audiencias/${h.id}/programar`}>
                        Programar
                      </Link>
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Próximas audiencias programadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay audiencias próximas programadas
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((h) => (
                <Row
                  key={h.id}
                  h={h}
                  action={
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/cases/${h.caseId}`}>Ver expediente</Link>
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Audiencias pasadas, completadas o canceladas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {past.map((h) => (
                <Row
                  key={h.id}
                  h={h}
                  action={
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/cases/${h.caseId}`}>Ver</Link>
                    </Button>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
