/**
 * /staff/solicitudes/observadas — Solicitudes con observaciones a subsanar
 *
 * Lista todos los expedientes en estado OBSERVED que requieren subsanación
 * por parte del demandante antes de ser admitidos.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, AlertTriangle, ArrowRight } from "lucide-react";
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

export default async function SolicitudesObservadasPage() {
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
    where: { status: "OBSERVED", ...centerFilter },
    orderBy: { updatedAt: "desc" },
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
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          Solicitudes Observadas
        </h1>
        <p className="text-sm text-muted-foreground">
          Expedientes con observaciones pendientes de subsanar por el
          demandante.
        </p>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay solicitudes observadas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {cases.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{c.code}</CardTitle>
                    <CardDescription>{c.title || "Sin título"}</CardDescription>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    OBSERVADA
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Última actualización:{" "}
                    {new Date(c.updatedAt).toLocaleDateString("es-PE")}
                  </p>
                  <Button size="sm" asChild>
                    <Link href={`/cases/${c.id}`}>
                      Revisar expediente
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
