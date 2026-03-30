/**
 * Página: Migración de Datos
 * ===========================
 * Herramientas para importar/exportar datos del sistema
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// No migration history API exists yet - show empty state
const migrations: { id: string; type: string; name: string; status: string; records: number; createdAt: string; completedAt: string; user: string }[] = [];

export default async function MigrationPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Migración de Datos</h1>
        <p className="text-muted-foreground">
          Importación y exportación de datos del sistema
        </p>
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Importar Casos</h3>
                <p className="text-sm text-muted-foreground">
                  Desde Excel o CSV
                </p>
              </div>
              <Button className="w-full">Iniciar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Importar Usuarios</h3>
                <p className="text-sm text-muted-foreground">
                  Árbitros y partes
                </p>
              </div>
              <Button className="w-full">Iniciar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Download className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Exportar Datos</h3>
                <p className="text-sm text-muted-foreground">
                  Backup completo
                </p>
              </div>
              <Button className="w-full">Iniciar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Sincronizar</h3>
                <p className="text-sm text-muted-foreground">
                  Con sistema externo
                </p>
              </div>
              <Button className="w-full" variant="outline">Configurar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advertencia */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Precaución</h3>
              <p className="text-sm text-amber-700">
                Las operaciones de migración pueden afectar los datos del sistema.
                Se recomienda realizar un backup antes de cualquier importación masiva.
                Las importaciones se realizan de forma asíncrona y recibirá una notificación al completarse.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de migraciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Migraciones
          </CardTitle>
          <CardDescription>
            Últimas operaciones de importación y exportación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {migrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p>No hay migraciones registradas</p>
            </div>
          ) : (
          <div className="space-y-4">
            {migrations.map((migration) => (
              <div
                key={migration.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    migration.type === "IMPORT" ? "bg-blue-100" : "bg-amber-100"
                  }`}>
                    {migration.type === "IMPORT" ? (
                      <Upload className={`h-5 w-5 ${
                        migration.type === "IMPORT" ? "text-blue-600" : "text-amber-600"
                      }`} />
                    ) : (
                      <Download className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{migration.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{migration.records} registros</span>
                      <span>•</span>
                      <span>{migration.createdAt}</span>
                      <span>•</span>
                      <span>{migration.user}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    Completado
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Plantillas */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas de Importación</CardTitle>
          <CardDescription>
            Descargue las plantillas para preparar sus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Plantilla de Casos
            </Button>
            <Button variant="outline" className="justify-start">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Plantilla de Usuarios
            </Button>
            <Button variant="outline" className="justify-start">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Plantilla de Árbitros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
