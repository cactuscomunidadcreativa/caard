/**
 * /arbitro/notificaciones — Panel de notificaciones del árbitro
 *
 * El árbitro no emite notificaciones directas a las partes (lo hace el Centro
 * tras proveer). Esta página muestra:
 * 1) Notificaciones recibidas relacionadas a sus casos.
 * 2) Escritos ya proveídos por él pendientes de notificación por el Centro.
 * 3) Escritos de sus casos pendientes de proveer (accesos rápidos).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Clock,
  FileText,
  Gavel,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
  id: string;
  subject: string | null;
  body: string;
  channel: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  case: { id: string; code: string; title: string | null } | null;
}

interface CaseItem {
  id: string;
  code: string;
  title: string | null;
}

interface Escrito {
  id: string;
  originalFileName: string;
  documentType: string;
  escritoStatus: string;
  createdAt: string;
  proveidoAt: string | null;
}

export default function NotificacionesArbitroPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [pendientesProveer, setPendientesProveer] = useState<
    { caseCode: string; caseId: string; escrito: Escrito }[]
  >([]);
  const [proveidosPendientesNotif, setProveidosPendientesNotif] = useState<
    { caseCode: string; caseId: string; escrito: Escrito }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [nr, cr] = await Promise.all([
          fetch("/api/notifications?limit=30"),
          fetch("/api/cases?pageSize=100"),
        ]);
        if (nr.ok) {
          const nd = await nr.json();
          setNotifs(nd.notifications || []);
        }
        if (cr.ok) {
          const cd = await cr.json();
          const myCases: CaseItem[] = cd.items || [];
          setCases(myCases);

          // Para cada caso, traer escritos y clasificarlos
          const escritosPorCaso = await Promise.all(
            myCases.slice(0, 20).map(async (c) => {
              const er = await fetch(`/api/cases/${c.id}/escritos`);
              if (!er.ok) return { c, escritos: [] as Escrito[] };
              const ed = await er.json();
              return { c, escritos: (ed.escritos || []) as Escrito[] };
            })
          );
          const pend: typeof pendientesProveer = [];
          const proveidos: typeof proveidosPendientesNotif = [];
          for (const { c, escritos } of escritosPorCaso) {
            for (const e of escritos) {
              if (e.escritoStatus === "SUBMITTED") {
                pend.push({ caseCode: c.code, caseId: c.id, escrito: e });
              } else if (e.escritoStatus === "PROVEIDO") {
                proveidos.push({ caseCode: c.code, caseId: c.id, escrito: e });
              }
            }
          }
          setPendientesProveer(pend);
          setProveidosPendientesNotif(proveidos);
        }
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/arbitro">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <p className="text-sm text-muted-foreground">
          Las notificaciones formales a las partes se emiten desde el Centro
          una vez que tú pruebes los escritos.
        </p>
      </div>

      {err && (
        <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
          {err}
        </div>
      )}

      {/* Escritos pendientes de proveer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Escritos pendientes de proveer
          </CardTitle>
          <CardDescription>
            Escritos de las partes que requieren tu resolución.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendientesProveer.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tienes escritos pendientes de proveer.
            </p>
          ) : (
            <div className="space-y-2">
              {pendientesProveer.map(({ caseCode, caseId, escrito }) => (
                <div
                  key={escrito.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {escrito.originalFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {caseCode} · {escrito.documentType}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <Link
                      href={`/arbitro/resoluciones/nueva?caseId=${caseId}&docId=${escrito.id}`}
                    >
                      <Gavel className="h-3 w-3 mr-1" />
                      Proveer
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proveídos pendientes de notificación */}
      {proveidosPendientesNotif.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Proveídos pendientes de notificación por el Centro
            </CardTitle>
            <CardDescription>
              Ya emitiste resolución. El Centro procederá con la notificación
              formal a las partes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {proveidosPendientesNotif.map(({ caseCode, escrito }) => (
                <div
                  key={escrito.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {escrito.originalFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {caseCode} · Proveído{" "}
                        {escrito.proveidoAt
                          ? new Date(escrito.proveidoAt).toLocaleDateString(
                              "es-PE"
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pendiente notificar</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notificaciones recibidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#0B2A5B]" />
            Notificaciones recibidas
          </CardTitle>
          <CardDescription>
            Comunicaciones sobre tus casos (emergencias, asignaciones, plazos).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notificaciones.</p>
          ) : (
            <div className="space-y-3">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border p-3 flex items-start gap-3"
                >
                  <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {n.subject || "Notificación"}
                      </p>
                      {n.case && (
                        <Badge variant="outline" className="text-xs">
                          {n.case.code}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {n.channel}
                      </Badge>
                      <Badge
                        variant={n.status === "SENT" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {n.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {n.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.sentAt || n.createdAt).toLocaleString(
                        "es-PE",
                        { timeZone: "America/Lima" }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
