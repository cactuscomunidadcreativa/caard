/**
 * CAARD - Expedientes (Staff)
 * Lista de todos los casos/expedientes del centro
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Users,
  Scale
} from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  SUBMITTED: { label: "Presentada", variant: "outline" },
  UNDER_REVIEW: { label: "En revisión", variant: "outline" },
  PENDING_PAYMENT: { label: "Pendiente pago", variant: "destructive" },
  ADMITTED: { label: "Admitida", variant: "default" },
  ARBITRATOR_SELECTION: { label: "Selección árbitro", variant: "default" },
  TRIBUNAL_CONSTITUTED: { label: "Tribunal constituido", variant: "default" },
  IN_PROCESS: { label: "En proceso", variant: "default" },
  HEARING_SCHEDULED: { label: "Audiencia programada", variant: "default" },
  AWARD_PENDING: { label: "Laudo pendiente", variant: "default" },
  CLOSED: { label: "Cerrado", variant: "secondary" },
  ARCHIVED: { label: "Archivado", variant: "secondary" },
};

export default async function StaffExpedientesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "CENTER_STAFF") {
    redirect("/login");
  }

  const center = await prisma.center.findFirst({
    where: { code: "CAARD" },
  });

  if (!center) {
    redirect("/");
  }

  // Obtener todos los casos con miembros
  const cases = await prisma.case.findMany({
    where: { centerId: center.id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Estadísticas por estado
  const statusCounts = cases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = cases.filter(
    (c) => !["CLOSED", "ARCHIVED", "DRAFT"].includes(c.status)
  ).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Expedientes</h1>
          <p className="text-muted-foreground">
            Gestión de casos arbitrales del centro
          </p>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Scale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts["IN_PROCESS"] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
            <FolderOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {(statusCounts["CLOSED"] || 0) + (statusCounts["ARCHIVED"] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de expedientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Expedientes</CardTitle>
              <CardDescription>
                {cases.length} expediente(s) en el sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar expediente..." className="pl-9 w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay expedientes registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => {
                const status = statusLabels[caseItem.status] || {
                  label: caseItem.status,
                  variant: "outline" as const,
                };
                // Obtener demandante y demandado de los miembros
                const claimant = caseItem.members.find(m => m.role === "DEMANDANTE");
                const respondent = caseItem.members.find(m => m.role === "DEMANDADO");
                const claimantName = claimant?.user?.name || claimant?.displayName || caseItem.claimantName || "Sin demandante";
                const respondentName = respondent?.user?.name || respondent?.displayName || caseItem.respondentName || "Sin demandado";

                return (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <FolderOpen className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-medium">
                            {caseItem.code}
                          </span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm font-medium">{caseItem.title}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {claimantName} vs {respondentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(caseItem.createdAt).toLocaleDateString("es-PE")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/staff/expedientes/${caseItem.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver detalle
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
