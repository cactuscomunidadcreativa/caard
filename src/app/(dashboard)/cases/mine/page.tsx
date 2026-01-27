/**
 * Página: Mis Expedientes
 * ========================
 * Lista de expedientes donde el usuario tiene participación
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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

// Datos de ejemplo - en producción vendrían de la API
const mockCases = [
  {
    id: "1",
    code: "ARB-2025-0001",
    title: "Controversia contractual - Servicios de consultoría",
    status: "IN_PROCESS",
    stage: "AUDIENCIAS",
    role: "DEMANDANTE",
    lastUpdate: "2025-01-25",
    nextDeadline: "2025-02-01",
    amount: 150000,
  },
  {
    id: "2",
    code: "ARB-2025-0002",
    title: "Disputa comercial - Incumplimiento de contrato",
    status: "SUBMITTED",
    stage: "ADMISION",
    role: "DEMANDANTE",
    lastUpdate: "2025-01-24",
    nextDeadline: "2025-01-30",
    amount: 85000,
  },
  {
    id: "3",
    code: "ARB-2024-0089",
    title: "Resolución de controversia - Compraventa",
    status: "AWARD_ISSUED",
    stage: "LAUDO",
    role: "DEMANDADO",
    lastUpdate: "2025-01-20",
    nextDeadline: null,
    amount: 200000,
  },
];

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

  const activeCases = mockCases.filter(c => !["CLOSED", "AWARD_ISSUED"].includes(c.status));
  const closedCases = mockCases.filter(c => ["CLOSED", "AWARD_ISSUED"].includes(c.status));

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
                <p className="text-2xl font-bold">{mockCases.length}</p>
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
                  {mockCases.filter(c => c.nextDeadline).length}
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
            Todos ({mockCases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <CaseList cases={activeCases} />
        </TabsContent>

        <TabsContent value="closed">
          <CaseList cases={closedCases} />
        </TabsContent>

        <TabsContent value="all">
          <CaseList cases={mockCases} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaseList({ cases }: { cases: typeof mockCases }) {
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
