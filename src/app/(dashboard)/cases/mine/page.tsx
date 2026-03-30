/**
 * Página: Mis Expedientes
 * ========================
 * Lista de expedientes donde el usuario tiene participación
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Filter
} from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  SUBMITTED: { label: "Presentado", variant: "secondary" },
  OBSERVED: { label: "Observado", variant: "destructive" },
  ADMITTED: { label: "Admitido", variant: "default" },
  IN_PROCESS: { label: "En Proceso", variant: "default" },
  AWARD_ISSUED: { label: "Laudo Emitido", variant: "secondary" },
  CLOSED: { label: "Cerrado", variant: "outline" },
};

export default async function MyCasesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Fetch cases where user is a member (demandante, demandado, arbitro, etc.)
  const memberships = await prisma.caseMember.findMany({
    where: {
      OR: [
        { userId },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    },
    include: {
      case: {
        include: { arbitrationType: { select: { name: true } } },
      },
    },
    orderBy: { case: { updatedAt: "desc" } },
  });

  const myCases = memberships.map((m) => ({
    id: m.case.id,
    code: m.case.code,
    title: m.case.title || "Sin título",
    status: m.case.status,
    stage: m.case.currentStage || "DEMANDA",
    role: m.role,
    lastUpdate: m.case.updatedAt.toISOString().split("T")[0],
    nextDeadline: null as string | null,
    amount: m.case.disputeAmountCents ? Number(m.case.disputeAmountCents) / 100 : 0,
  }));

  const activeCases = myCases.filter(c => !["CLOSED", "AWARD_ISSUED"].includes(c.status));
  const closedCases = myCases.filter(c => ["CLOSED", "AWARD_ISSUED"].includes(c.status));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Expedientes</h1>
          <p className="text-muted-foreground">
            Expedientes donde participas como parte o representante
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button asChild>
            <Link href="/cases/new">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myCases.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCases.length}</p>
                <p className="text-sm text-muted-foreground">En Curso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {myCases.filter(c => c.nextDeadline).length}
                </p>
                <p className="text-sm text-muted-foreground">Con Plazos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{closedCases.length}</p>
                <p className="text-sm text-muted-foreground">Finalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Expedientes */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            En Curso ({activeCases.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Finalizados ({closedCases.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({myCases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <CaseList cases={activeCases} />
        </TabsContent>

        <TabsContent value="closed">
          <CaseList cases={closedCases} />
        </TabsContent>

        <TabsContent value="all">
          <CaseList cases={myCases} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaseList({ cases }: { cases: { id: string; code: string; title: string; status: string; stage: string; role: string; lastUpdate: string; nextDeadline: string | null; amount: number }[] }) {
  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay expedientes en esta categoría</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map((caseItem) => (
        <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{caseItem.code}</span>
                  <Badge variant={statusLabels[caseItem.status]?.variant || "default"}>
                    {statusLabels[caseItem.status]?.label || caseItem.status}
                  </Badge>
                  <Badge variant="outline">{caseItem.role}</Badge>
                </div>
                <h3 className="font-medium">{caseItem.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Etapa: {caseItem.stage}</span>
                  <span>•</span>
                  <span>Cuantía: S/ {caseItem.amount.toLocaleString()}</span>
                  <span>•</span>
                  <span>Actualizado: {caseItem.lastUpdate}</span>
                </div>
                {caseItem.nextDeadline && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>Próximo plazo: {caseItem.nextDeadline}</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/cases/${caseItem.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalle
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
