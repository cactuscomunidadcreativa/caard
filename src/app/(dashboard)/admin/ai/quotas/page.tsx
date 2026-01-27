/**
 * CAARD - Panel de Cuotas y Límites de IA
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BarChart3, AlertTriangle, Users, Zap, DollarSign } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Cuotas y Límites de IA | CAARD",
  description: "Gestiona las cuotas y límites de uso de IA",
};

async function getData() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [systemQuota, userQuotas, todayUsage, monthUsage] = await Promise.all([
    prisma.aISystemQuota.findFirst({ where: { isActive: true } }),
    prisma.aIUserQuota.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalTokens: true, cost: true },
      _count: true,
    }),
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, cost: true },
    }),
  ]);

  return { systemQuota, userQuotas, todayUsage, monthUsage };
}

export default async function AIQuotasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { systemQuota, userQuotas, todayUsage, monthUsage } = await getData();

  // Calcular porcentajes
  const todayTokensPercent = systemQuota?.maxTotalTokensPerDay
    ? ((todayUsage._sum.totalTokens || 0) / systemQuota.maxTotalTokensPerDay) * 100
    : 0;

  const monthTokensPercent = systemQuota?.maxTotalTokensPerMonth
    ? ((monthUsage._sum.totalTokens || 0) / systemQuota.maxTotalTokensPerMonth) * 100
    : 0;

  const todayCostPercent = systemQuota?.maxTotalCostPerDay
    ? ((todayUsage._sum.cost || 0) / systemQuota.maxTotalCostPerDay) * 100
    : 0;

  const monthCostPercent = systemQuota?.maxTotalCostPerMonth
    ? ((monthUsage._sum.cost || 0) / systemQuota.maxTotalCostPerMonth) * 100
    : 0;

  const blockedUsers = userQuotas.filter((q) => q.isBlocked).length;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#D66829]">Cuotas y Límites</h1>
          <p className="text-muted-foreground">
            Gestiona las cuotas de uso del sistema y por usuario
          </p>
        </div>
      </div>

      {/* Cuotas del Sistema */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Tokens Hoy</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((todayUsage._sum.totalTokens || 0) / 1000).toFixed(1)}K
            </p>
            {systemQuota?.maxTotalTokensPerDay && (
              <>
                <Progress value={todayTokensPercent} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  de {(systemQuota.maxTotalTokensPerDay / 1000).toFixed(0)}K límite
                </p>
              </>
            )}
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
              {((monthUsage._sum.totalTokens || 0) / 1000).toFixed(1)}K
            </p>
            {systemQuota?.maxTotalTokensPerMonth && (
              <>
                <Progress value={monthTokensPercent} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  de {(systemQuota.maxTotalTokensPerMonth / 1000).toFixed(0)}K límite
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Costo Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${((todayUsage._sum.cost || 0) / 100).toFixed(2)}
            </p>
            {systemQuota?.maxTotalCostPerDay && (
              <>
                <Progress value={todayCostPercent} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  de ${(systemQuota.maxTotalCostPerDay / 100).toFixed(2)} límite
                </p>
              </>
            )}
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
              ${((monthUsage._sum.cost || 0) / 100).toFixed(2)}
            </p>
            {systemQuota?.maxTotalCostPerMonth && (
              <>
                <Progress value={monthCostPercent} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  de ${(systemQuota.maxTotalCostPerMonth / 100).toFixed(2)} límite
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(todayTokensPercent >= (systemQuota?.alertAtPercentage || 80) ||
        monthTokensPercent >= (systemQuota?.alertAtPercentage || 80)) && (
        <Card className="mb-8 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Alerta de uso</p>
                <p className="text-sm text-yellow-700">
                  El uso de IA ha superado el {systemQuota?.alertAtPercentage || 80}% del límite configurado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cuotas por Usuario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cuotas por Usuario
              </CardTitle>
              <CardDescription>
                Usuarios con cuotas personalizadas ({userQuotas.length})
                {blockedUsers > 0 && (
                  <Badge variant="destructive" className="ml-2">{blockedUsers} bloqueados</Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userQuotas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay cuotas personalizadas configuradas</p>
              <p className="text-sm">Los usuarios usan las cuotas de su rol</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-center">Req/Día</TableHead>
                    <TableHead className="text-center">Tokens/Día</TableHead>
                    <TableHead className="text-center">Tokens/Mes</TableHead>
                    <TableHead className="text-center">Bonus</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userQuotas.map((quota) => (
                    <TableRow key={quota.id} className={quota.isBlocked ? "bg-red-50" : ""}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quota.user.name || "Sin nombre"}</div>
                          <div className="text-xs text-muted-foreground">{quota.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{quota.user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {quota.maxRequestsPerDay?.toLocaleString() || "∞"}
                      </TableCell>
                      <TableCell className="text-center">
                        {quota.maxTokensPerDay ? `${(quota.maxTokensPerDay / 1000).toFixed(0)}K` : "∞"}
                      </TableCell>
                      <TableCell className="text-center">
                        {quota.maxTokensPerMonth ? `${(quota.maxTokensPerMonth / 1000).toFixed(0)}K` : "∞"}
                      </TableCell>
                      <TableCell className="text-center">
                        {quota.bonusTokens > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            +{(quota.bonusTokens / 1000).toFixed(0)}K
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {quota.isBlocked ? (
                          <Badge variant="destructive">Bloqueado</Badge>
                        ) : (
                          <Badge variant="default">Activo</Badge>
                        )}
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
