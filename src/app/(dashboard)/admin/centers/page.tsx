/**
 * Página: Gestión de Centros
 * ===========================
 * Administración de centros de arbitraje (multi-tenant)
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Settings,
  Users,
  FileText,
  Globe,
} from "lucide-react";

export default async function CentersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const dbCenters = await prisma.center.findMany({
    include: {
      _count: {
        select: { users: true, cases: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const centers = dbCenters.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    status: "ACTIVE",
    domain: `${c.code.toLowerCase()}.caard.pe`,
    usersCount: c._count.users,
    casesCount: c._count.cases,
    createdAt: c.createdAt.toISOString().split("T")[0],
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centros de Arbitraje</h1>
          <p className="text-muted-foreground">
            Gestione los centros de la red CAARD
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Centro
        </Button>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{centers.length}</p>
                <p className="text-sm text-muted-foreground">Centros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {centers.reduce((sum, c) => sum + c.usersCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Usuarios Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {centers.reduce((sum, c) => sum + c.casesCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Casos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {centers.filter(c => c.status === "ACTIVE").length}
                </p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Centros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centers.map((center) => (
          <Card key={center.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {center.name}
                  </CardTitle>
                  <CardDescription className="font-mono">
                    {center.code}
                  </CardDescription>
                </div>
                <Badge variant={center.status === "ACTIVE" ? "default" : "secondary"}>
                  {center.status === "ACTIVE" ? "Activo" : "Pendiente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{center.domain}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-2xl font-bold">{center.usersCount}</p>
                    <p className="text-xs text-muted-foreground">Usuarios</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{center.casesCount}</p>
                    <p className="text-xs text-muted-foreground">Casos</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
