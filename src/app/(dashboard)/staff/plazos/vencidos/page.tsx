/**
 * /staff/plazos/vencidos — Plazos procesales vencidos
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, AlertTriangle, Clock, ArrowRight } from "lucide-react";
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

export const dynamic = "force-dynamic";

export default async function PlazosVencidosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    !["SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(
      session.user.role
    )
  ) {
    redirect("/dashboard");
  }

  const centerFilter = session.user.centerId
    ? { case: { centerId: session.user.centerId } }
    : {};

  const deadlines = await prisma.processDeadline.findMany({
    where: {
      status: "ACTIVE",
      dueAt: { lt: new Date() },
      ...centerFilter,
    },
    include: {
      case: { select: { id: true, code: true, title: true } },
    },
    orderBy: { dueAt: "asc" },
    take: 100,
  });

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/staff">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Plazos Vencidos
        </h1>
        <p className="text-sm text-muted-foreground">
          Plazos procesales con fecha de vencimiento pasada que siguen en
          estado ACTIVO.
        </p>
      </div>

      {deadlines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 text-green-500" />
            No hay plazos vencidos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {deadlines.map((d) => {
            const daysOverdue = Math.floor(
              (Date.now() - new Date(d.dueAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return (
              <Card key={d.id} className="border-red-200 bg-red-50/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">{d.title}</CardTitle>
                      <CardDescription>
                        {d.case.code}
                        {d.case.title ? ` · ${d.case.title}` : ""}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">
                      Vencido {daysOverdue} día{daysOverdue !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Tipo: {d.type} · Venció{" "}
                      {new Date(d.dueAt).toLocaleDateString("es-PE")}
                    </p>
                    <Button size="sm" asChild>
                      <Link href={`/cases/${d.case.id}`}>
                        Ver caso
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
