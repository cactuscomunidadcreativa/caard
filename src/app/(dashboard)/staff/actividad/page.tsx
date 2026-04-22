/**
 * /staff/actividad — Actividad reciente del centro (audit log)
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Activity } from "lucide-react";
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

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Creación", color: "bg-green-100 text-green-800" },
  UPDATE: { label: "Actualización", color: "bg-blue-100 text-blue-800" },
  DELETE: { label: "Eliminación", color: "bg-red-100 text-red-800" },
  LOGIN: { label: "Acceso", color: "bg-gray-100 text-gray-800" },
  UPDATE_USER: { label: "Usuario", color: "bg-purple-100 text-purple-800" },
};

export default async function ActividadStaffPage() {
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

  const logs = await prisma.auditLog.findMany({
    where: centerFilter,
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
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
          <Activity className="h-6 w-6 text-[#D66829]" />
          Actividad Reciente
        </h1>
        <p className="text-sm text-muted-foreground">
          Últimas 100 acciones registradas en el centro.
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sin actividad registrada.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map((log) => {
                const action = ACTION_LABELS[log.action] || {
                  label: log.action,
                  color: "bg-gray-100 text-gray-800",
                };
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 px-4 py-3 text-sm"
                  >
                    <Badge className={action.color}>{action.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {log.entity}
                        {log.action && ` — ${log.action}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.user?.name || log.user?.email || "Sistema"}
                        {log.caseId && ` · Caso ${log.caseId.slice(0, 8)}`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("es-PE", {
                        timeZone: "America/Lima",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
