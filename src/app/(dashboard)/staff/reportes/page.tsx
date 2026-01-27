/**
 * CAARD - Reportes (Staff)
 * Generación de reportes para el personal del centro
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  CreditCard,
  Users,
  FolderOpen,
  TrendingUp,
  PieChart
} from "lucide-react";

export default async function StaffReportesPage() {
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

  // Obtener estadísticas generales
  const [totalCases, activeCases, totalPayments, totalUsers] = await Promise.all([
    prisma.case.count({ where: { centerId: center.id } }),
    prisma.case.count({
      where: {
        centerId: center.id,
        status: { notIn: ["CLOSED", "ARCHIVED", "DRAFT"] },
      },
    }),
    prisma.payment.aggregate({
      where: {
        case: { centerId: center.id },
        status: "CONFIRMED",
      },
      _sum: { amountCents: true },
    }),
    prisma.user.count({ where: { centerId: center.id } }),
  ]);

  const reportTypes = [
    {
      id: "casos-estado",
      title: "Casos por Estado",
      description: "Distribución de casos según su estado procesal",
      icon: PieChart,
      color: "blue",
    },
    {
      id: "casos-mensual",
      title: "Casos Mensuales",
      description: "Nuevos casos registrados por mes",
      icon: BarChart3,
      color: "green",
    },
    {
      id: "ingresos",
      title: "Reporte de Ingresos",
      description: "Pagos recibidos por período",
      icon: CreditCard,
      color: "purple",
    },
    {
      id: "arbitros",
      title: "Actividad de Árbitros",
      description: "Casos asignados y resueltos por árbitro",
      icon: Users,
      color: "orange",
    },
    {
      id: "plazos",
      title: "Cumplimiento de Plazos",
      description: "Análisis de plazos procesales",
      icon: Calendar,
      color: "red",
    },
    {
      id: "audiencias",
      title: "Reporte de Audiencias",
      description: "Audiencias programadas y realizadas",
      icon: FolderOpen,
      color: "teal",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Genere reportes y estadísticas del centro
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
            <div className="text-2xl font-bold">{totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {activeCases} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency((totalPayments._sum.amountCents || 0) / 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Resolución</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCases > 0
                ? Math.round(((totalCases - activeCases) / totalCases) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Casos cerrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Reporte</CardTitle>
          <CardDescription>
            Seleccione el tipo de reporte que desea generar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg bg-${report.color}-100`}
                    style={{
                      backgroundColor:
                        report.color === "blue"
                          ? "#dbeafe"
                          : report.color === "green"
                          ? "#dcfce7"
                          : report.color === "purple"
                          ? "#f3e8ff"
                          : report.color === "orange"
                          ? "#ffedd5"
                          : report.color === "red"
                          ? "#fee2e2"
                          : "#ccfbf1",
                    }}
                  >
                    <report.icon
                      className="h-5 w-5"
                      style={{
                        color:
                          report.color === "blue"
                            ? "#2563eb"
                            : report.color === "green"
                            ? "#16a34a"
                            : report.color === "purple"
                            ? "#9333ea"
                            : report.color === "orange"
                            ? "#ea580c"
                            : report.color === "red"
                            ? "#dc2626"
                            : "#0d9488",
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reportes programados */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Programados</CardTitle>
          <CardDescription>
            Configure reportes automáticos periódicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay reportes programados</p>
            <p className="text-sm mt-1">
              Configure reportes automáticos que se enviarán por correo
            </p>
            <Button variant="outline" className="mt-4">
              Programar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
