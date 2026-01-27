/**
 * Página: Centro de Reportes
 * ===========================
 * Panel principal de reportes y estadísticas
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  Clock,
  FileBarChart,
} from "lucide-react";
import Link from "next/link";

const reportCategories = [
  {
    title: "Reportes de Expedientes",
    description: "Estadísticas de casos, estados y duraciones",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
    reports: [
      { name: "Casos por Estado", href: "/reportes/casos-estado" },
      { name: "Casos por Etapa Procesal", href: "/reportes/casos-etapa" },
      { name: "Duración Promedio por Tipo", href: "/reportes/duracion" },
      { name: "Casos por Árbitro", href: "/reportes/casos-arbitro" },
    ],
  },
  {
    title: "Reportes Financieros",
    description: "Ingresos, pagos y cobranzas",
    icon: DollarSign,
    color: "bg-green-100 text-green-600",
    reports: [
      { name: "Ingresos por Período", href: "/reportes/ingresos" },
      { name: "Pagos Pendientes", href: "/reportes/pagos-pendientes" },
      { name: "Honorarios por Árbitro", href: "/reportes/honorarios" },
      { name: "Recaudación vs Proyección", href: "/reportes/proyeccion" },
    ],
  },
  {
    title: "Reportes de Plazos",
    description: "Control de vencimientos y cumplimiento",
    icon: Clock,
    color: "bg-amber-100 text-amber-600",
    reports: [
      { name: "Plazos Vencidos", href: "/reportes/plazos-vencidos" },
      { name: "Cumplimiento de Plazos", href: "/reportes/cumplimiento" },
      { name: "Prórrogas Otorgadas", href: "/reportes/prorrogas" },
    ],
  },
  {
    title: "Reportes de Usuarios",
    description: "Actividad y métricas de usuarios",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
    reports: [
      { name: "Usuarios Activos", href: "/reportes/usuarios-activos" },
      { name: "Actividad por Rol", href: "/reportes/actividad-rol" },
      { name: "Registro de Auditoría", href: "/reportes/auditoria" },
    ],
  },
];

const quickStats = [
  { label: "Casos Activos", value: "156", change: "+12%", icon: FileText },
  { label: "Recaudación Mes", value: "S/ 245,000", change: "+8%", icon: DollarSign },
  { label: "Plazos Vencidos", value: "23", change: "-5%", isNegative: true, icon: Clock },
  { label: "Árbitros Activos", value: "32", change: "0%", icon: Users },
];

export default async function ReportesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Verificar que sea admin o staff
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];
  if (!allowedRoles.includes(session.user.role || "")) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centro de Reportes</h1>
          <p className="text-muted-foreground">
            Estadísticas y análisis del centro de arbitraje
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="text-right">
                  <div className={`p-2 rounded-lg ${stat.isNegative ? "bg-red-100" : "bg-green-100"}`}>
                    <stat.icon className={`h-5 w-5 ${stat.isNegative ? "text-red-600" : "text-green-600"}`} />
                  </div>
                  <p className={`text-sm mt-1 ${
                    stat.change.startsWith("+") ? "text-green-600" :
                    stat.change.startsWith("-") ? "text-red-600" :
                    "text-muted-foreground"
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categorías de Reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  <category.icon className="h-5 w-5" />
                </div>
                {category.title}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.reports.map((report) => (
                  <Link
                    key={report.name}
                    href={report.href}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium">{report.name}</span>
                    <FileBarChart className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos de Resumen */}
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
              <p className="text-muted-foreground">
                Gráfico de barras: Casos nuevos vs cerrados
              </p>
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
              <p className="text-muted-foreground">
                Gráfico circular: Estados de expedientes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias del Año
          </CardTitle>
          <CardDescription>
            Evolución de los principales indicadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Gráfico de líneas: Tendencias de casos, ingresos y duración
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
