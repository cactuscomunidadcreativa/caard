/**
 * Página: Dashboard Analítico
 * ============================
 * Panel de reportes y análisis para administradores
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Clock,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo
const kpis = [
  {
    title: "Casos Activos",
    value: "156",
    change: "+12%",
    trend: "up",
    description: "vs mes anterior",
  },
  {
    title: "Recaudación Mensual",
    value: "S/ 245,000",
    change: "+8%",
    trend: "up",
    description: "vs mes anterior",
  },
  {
    title: "Tiempo Promedio",
    value: "95 días",
    change: "-5%",
    trend: "down",
    description: "tiempo de resolución",
  },
  {
    title: "Satisfacción",
    value: "4.6/5",
    change: "+0.2",
    trend: "up",
    description: "rating promedio",
  },
];

const quickReports = [
  { name: "Reporte de Casos", href: "/admin/reports/cases", icon: FileText },
  { name: "Reporte de Pagos", href: "/admin/reports/payments", icon: DollarSign },
  { name: "Reporte de Usuarios", href: "/admin/reports/users", icon: Users },
  { name: "Auditoría", href: "/admin/reports/audit", icon: Clock },
  { name: "Site Health", href: "/admin/reports/site-health", icon: TrendingUp },
];

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!allowedRoles.includes(session.user.role || "")) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Analítico</h1>
          <p className="text-muted-foreground">
            Métricas y análisis del centro de arbitraje
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Enero 2025
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className={`flex items-center text-sm ${
                    kpi.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    {kpi.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reportes Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Disponibles</CardTitle>
          <CardDescription>
            Acceda a los reportes detallados del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickReports.map((report) => (
              <Link key={report.name} href={report.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-primary/10 rounded-lg mb-3">
                      <report.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium">{report.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Casos por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Gráfico de barras: Casos nuevos vs cerrados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Gráfico circular: Estados de expedientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias Anuales
          </CardTitle>
          <CardDescription>
            Evolución de los principales indicadores durante el año
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cases">
            <TabsList>
              <TabsTrigger value="cases">Casos</TabsTrigger>
              <TabsTrigger value="revenue">Ingresos</TabsTrigger>
              <TabsTrigger value="duration">Duración</TabsTrigger>
            </TabsList>
            <TabsContent value="cases">
              <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg mt-4">
                <p className="text-muted-foreground">
                  Gráfico de líneas: Tendencia de casos
                </p>
              </div>
            </TabsContent>
            <TabsContent value="revenue">
              <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg mt-4">
                <p className="text-muted-foreground">
                  Gráfico de líneas: Tendencia de ingresos
                </p>
              </div>
            </TabsContent>
            <TabsContent value="duration">
              <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg mt-4">
                <p className="text-muted-foreground">
                  Gráfico de líneas: Tendencia de duración
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
