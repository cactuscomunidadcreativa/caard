/**
 * /staff/arbitraje/aprobar — Expedientes pendientes de aprobación/admisión
 *
 * Lista casos en estado SUBMITTED o UNDER_REVIEW para que la Secretaría los
 * revise, observe o admita.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle, ArrowRight } from "lucide-react";
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

export default async function AprobarArbitrajePage() {
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
    ? { centerId: session.user.centerId }
    : {};

  const cases = await prisma.case.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      ...centerFilter,
    },
    orderBy: { createdAt: "asc" },
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
          <CheckCircle className="h-6 w-6 text-green-600" />
          Solicitudes por Admitir
        </h1>
        <p className="text-sm text-muted-foreground">
          Expedientes nuevos pendientes de revisión y admisión. Al admitir, se
          crea automáticamente la estructura en Drive y empiezan a correr los
          plazos.
        </p>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay expedientes pendientes de admisión.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {cases.map((c) => {
            const daysWaiting = Math.floor(
              (Date.now() - new Date(c.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">{c.code}</CardTitle>
                      <CardDescription>
                        {c.title || "Sin título"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          c.status === "SUBMITTED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {c.status === "SUBMITTED" ? "ENVIADA" : "EN REVISIÓN"}
                      </Badge>
                      {daysWaiting > 5 && (
                        <Badge variant="destructive">
                          {daysWaiting} días
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Recibida:{" "}
                      {new Date(c.createdAt).toLocaleDateString("es-PE")}
                    </p>
                    <Button size="sm" asChild>
                      <Link href={`/cases/${c.id}`}>
                        Revisar
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
