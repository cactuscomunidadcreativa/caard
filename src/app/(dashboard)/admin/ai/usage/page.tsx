/**
 * CAARD - Panel de Uso y Estadísticas de IA
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BarChart3, Zap, DollarSign, Clock, Activity, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Uso de IA | CAARD",
  description: "Estadísticas de uso de IA del sistema",
};

async function getUsageData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalStats,
    todayStats,
    byModel,
    topUsers,
    recentLogs,
  ] = await Promise.all([
    // Estadísticas del mes
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
      _count: true,
      _avg: { latencyMs: true },
    }),

    // Estadísticas de hoy
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalTokens: true, cost: true },
      _count: true,
    }),

    // Por modelo
    prisma.aIUsageLog.groupBy({
      by: ["modelId"],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, cost: true },
      _count: true,
    }),

    // Top usuarios
    prisma.aIUsageLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfMonth }, userId: { not: null } },
      _sum: { totalTokens: true, cost: true },
      _count: true,
      orderBy: { _sum: { totalTokens: "desc" } },
      take: 10,
    }),

    // Logs recientes
    prisma.aIUsageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
        model: { select: { id: true, name: true, provider: true } },
      },
    }),
  ]);

  // Obtener detalles de modelos
  const modelIds = byModel.map((m) => m.modelId).filter(Boolean) as string[];
  const models = await prisma.aIModel.findMany({
    where: { id: { in: modelIds } },
    select: { id: true, name: true, provider: true },
  });
  const modelMap = new Map(models.map((m) => [m.id, m]));

  // Obtener detalles de usuarios
  const userIds = topUsers.map((u) => u.userId).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    totalStats,
    todayStats,
    byModel: byModel.map((m) => ({
      model: modelMap.get(m.modelId || ""),
      tokens: m._sum.totalTokens || 0,
      cost: m._sum.cost || 0,
      requests: m._count,
    })),
    topUsers: topUsers.map((u) => ({
      user: userMap.get(u.userId || ""),
      tokens: u._sum.totalTokens || 0,
      cost: u._sum.cost || 0,
      requests: u._count,
    })),
    recentLogs,
  };
}

export default async function AIUsagePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { totalStats, todayStats, byModel, topUsers, recentLogs } = await getUsageData();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#D66829]">Uso y Estadísticas</h1>
          <p className="text-muted-foreground">
            Monitorea el consumo de IA en el sistema
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Requests Mes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStats._count.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              Hoy: {todayStats._count.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Tokens Mes</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((totalStats._sum.totalTokens || 0) / 1000).toFixed(1)}K
            </p>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-600">↑{((totalStats._sum.promptTokens || 0) / 1000).toFixed(0)}K</span>
              {" / "}
              <span className="text-blue-600">↓{((totalStats._sum.completionTokens || 0) / 1000).toFixed(0)}K</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Costo Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${((totalStats._sum.cost || 0) / 100).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Hoy: ${((todayStats._sum.cost || 0) / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Latencia Prom.</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(totalStats._avg.latencyMs || 0)}ms
            </p>
            <p className="text-xs text-muted-foreground">Tiempo de respuesta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Modelos Usados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{byModel.length}</p>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Por modelo */}
        <Card>
          <CardHeader>
            <CardTitle>Uso por Modelo</CardTitle>
            <CardDescription>Consumo del mes actual</CardDescription>
          </CardHeader>
          <CardContent>
            {byModel.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin datos</p>
            ) : (
              <div className="space-y-4">
                {byModel.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.model?.name || "Desconocido"}</p>
                      <p className="text-xs text-muted-foreground">{item.requests} requests</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{(item.tokens / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-muted-foreground">${(item.cost / 100).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Top Usuarios</CardTitle>
            <CardDescription>Mayor consumo este mes</CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin datos</p>
            ) : (
              <div className="space-y-4">
                {topUsers.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.user?.name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">{item.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{(item.tokens / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-muted-foreground">{item.requests} req</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimas 20 solicitudes de IA</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin actividad reciente</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Latencia</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(log.createdAt, "dd/MM HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.user?.name || "Sistema"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.model?.name || "-"}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {log.totalTokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ${(log.cost / 100).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {log.latencyMs ? `${log.latencyMs}ms` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={log.success ? "default" : "destructive"} className="text-xs">
                          {log.success ? "OK" : "Error"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
