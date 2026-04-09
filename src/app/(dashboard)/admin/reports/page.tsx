"use client";

/**
 * CAARD - Dashboard Analítico con datos reales
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  Scale,
  FolderOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  summary: {
    totalCases: number;
    inProcess: number;
    closed: number;
    archived: number;
    suspended: number;
    totalDocs: number;
    totalMembers: number;
    totalUsers: number;
    totalArbitrators: number;
    totalPayments: number;
    totalDeadlines: number;
    activeDeadlines: number;
    overdueDeadlines: number;
  };
  casesByYear: { year: number; count: number }[];
  casesByType: { type: string; count: number }[];
  casesByScope: { scope: string; count: number }[];
  casesByTribunal: { mode: string; count: number }[];
  recentCases: { id: string; code: string; title: string; status: string; createdAt: string }[];
  upcomingDeadlines: { id: string; title: string; caseCode: string; dueAt: string; daysRemaining: number }[];
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats?.summary) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">Error cargando estadísticas.</p>
      </div>
    );
  }

  const s = stats.summary;

  const kpis = [
    { title: "Casos totales", value: s.totalCases, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { title: "En proceso", value: s.inProcess, icon: Scale, color: "text-[#D66829] bg-orange-50" },
    { title: "Cerrados / Laudados", value: s.closed, icon: BarChart3, color: "text-green-600 bg-green-50" },
    { title: "Archivados", value: s.archived, icon: FolderOpen, color: "text-gray-600 bg-gray-50" },
    { title: "Documentos", value: s.totalDocs.toLocaleString(), icon: FileText, color: "text-purple-600 bg-purple-50" },
    { title: "Usuarios", value: s.totalUsers, icon: Users, color: "text-indigo-600 bg-indigo-50" },
    { title: "Árbitros activos", value: s.totalArbitrators, icon: Scale, color: "text-teal-600 bg-teal-50" },
    { title: "Pagos registrados", value: s.totalPayments, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
  ];

  const quickReports = [
    { name: "Reporte de Casos", href: "/admin/reports/cases", icon: FileText },
    { name: "Reporte de Pagos", href: "/admin/reports/payments", icon: DollarSign },
    { name: "Auditoría", href: "/admin/reports/audit", icon: Clock },
    { name: "Site Health", href: "/admin/reports/site-health", icon: TrendingUp },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Analítico</h1>
        <p className="text-muted-foreground">
          Métricas en tiempo real del centro de arbitraje
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plazos + Deadline alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#D66829]" />
              Plazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-2xl font-bold text-blue-700">{s.totalDeadlines}</p>
                <p className="text-xs text-blue-600">Total</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-2xl font-bold text-amber-700">{s.activeDeadlines}</p>
                <p className="text-xs text-amber-600">Activos</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-2xl font-bold text-red-700">{s.overdueDeadlines}</p>
                <p className="text-xs text-red-600">Vencidos</p>
              </div>
            </div>
            {stats.upcomingDeadlines.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Próximos a vencer:</p>
                {stats.upcomingDeadlines.slice(0, 5).map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between text-sm p-2 rounded ${
                      d.daysRemaining <= 0
                        ? "bg-red-50 text-red-800"
                        : d.daysRemaining <= 3
                        ? "bg-amber-50 text-amber-800"
                        : "bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs">{d.caseCode}</span>
                      <span className="mx-2">·</span>
                      <span className="truncate">{d.title}</span>
                    </div>
                    <Badge
                      variant={d.daysRemaining <= 0 ? "destructive" : "secondary"}
                      className="text-xs ml-2"
                    >
                      {d.daysRemaining <= 0
                        ? `${Math.abs(d.daysRemaining)}d vencido`
                        : `${d.daysRemaining}d`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Casos por año */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#0B2A5B]" />
              Casos por Año
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.casesByYear.map((y) => {
                const pct = Math.round((y.count / s.totalCases) * 100);
                return (
                  <div key={y.year} className="flex items-center gap-3">
                    <span className="text-sm font-mono w-12">{y.year}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-[#0B2A5B] h-full rounded-full flex items-center pl-2"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{y.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribución */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Por tipo de procedimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.casesByType.map((t) => (
                <div key={t.type} className="flex justify-between items-center">
                  <span className="text-sm">{t.type === "REGULAR" ? "Regular" : t.type === "EMERGENCY" ? "Emergencia" : t.type}</span>
                  <Badge variant="secondary">{t.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Por ámbito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.casesByScope.map((s) => (
                <div key={s.scope} className="flex justify-between items-center">
                  <span className="text-sm">{s.scope === "NACIONAL" ? "Nacional" : "Internacional"}</span>
                  <Badge variant="secondary">{s.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Por composición</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.casesByTribunal.map((t) => (
                <div key={t.mode} className="flex justify-between items-center">
                  <span className="text-sm">{t.mode === "TRIBUNAL_3" ? "Tribunal (3)" : t.mode === "SOLE_ARBITRATOR" ? "Árbitro único" : t.mode || "N/A"}</span>
                  <Badge variant="secondary">{t.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes detallados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickReports.map((r) => (
              <Link key={r.name} href={r.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-[#0B2A5B]/10 rounded-lg mb-3">
                      <r.icon className="h-6 w-6 text-[#0B2A5B]" />
                    </div>
                    <p className="font-medium text-sm">{r.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Últimos casos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos expedientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {stats.recentCases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <span className="font-mono text-sm font-medium text-[#0B2A5B]">{c.code}</span>
                  <span className="text-sm text-muted-foreground ml-3 truncate">{c.title?.slice(0, 50)}</span>
                </div>
                <Badge
                  variant={
                    c.status === "IN_PROCESS" ? "default" : c.status === "CLOSED" ? "secondary" : "outline"
                  }
                >
                  {c.status === "IN_PROCESS" ? "En proceso" : c.status === "CLOSED" ? "Cerrado" : c.status}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
