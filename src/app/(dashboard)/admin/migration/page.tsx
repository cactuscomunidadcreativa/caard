"use client";

/**
 * CAARD - Migración de Datos
 * Herramienta para migrar el sistema viejo /v2 al CAARD nuevo
 */

import { useState } from "react";
import {
  Database,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface MigrationResult {
  totalExpedientes: number;
  totalDocumentos: number;
  casosVinculados: number;
  casosNuevos: number;
  documentosCreados: number;
  documentosOmitidos: number;
  usuariosCreados: number;
}

export default function MigrationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith(".sql")) {
        toast.error("El archivo debe ser .sql");
        return;
      }
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Selecciona un archivo SQL");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("sqlFile", file);

      const res = await fetch("/api/admin/migration/old-system", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.stats);
        toast.success("Migración completada exitosamente");
      } else {
        setError(data.error || "Error en migración");
        toast.error(data.error || "Error en migración");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
      toast.error("Error de conexión");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
          <Database className="h-6 w-6 text-[#D66829]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0B2A5B]">Migración de Datos</h1>
          <p className="text-sm text-muted-foreground">
            Importa expedientes y documentos del sistema viejo
          </p>
        </div>
      </div>

      {/* Sistema Viejo /v2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sistema Viejo (caardpe.com/v2)</CardTitle>
          <CardDescription>
            Sube el archivo SQL exportado desde phpMyAdmin de la base de datos del sistema de
            consulta de expedientes (con tablas <code>expedientes</code> y{" "}
            <code>expedientes_detalle</code>)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¿Qué hace esta migración?</AlertTitle>
            <AlertDescription className="text-sm space-y-1 mt-2">
              <div>• Lee los expedientes del SQL y los vincula con casos existentes en CAARD</div>
              <div>• Crea casos nuevos para expedientes que no existen aún</div>
              <div>• Importa todos los documentos PDF como CaseDocument</div>
              <div>• Crea usuarios cliente con sus credenciales originales (nombre + código)</div>
              <div>• Los PDFs siguen sirviéndose desde old.caardpe.com/v2/files/</div>
            </AlertDescription>
          </Alert>

          {/* File input */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#D66829] transition-colors">
            <input
              type="file"
              accept=".sql"
              onChange={handleFileChange}
              className="hidden"
              id="sql-file"
              disabled={isUploading}
            />
            <label htmlFor="sql-file" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium">
                {file ? file.name : "Click para seleccionar archivo .sql"}
              </p>
              {file && (
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || isUploading}
            className="w-full bg-[#D66829] hover:bg-[#c45a22]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando migración...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Iniciar Migración
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error en migración</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Migración Completada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white border">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Expedientes leídos</p>
                </div>
                <p className="text-2xl font-bold text-[#0B2A5B]">{result.totalExpedientes}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">Vinculados a casos</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{result.casosVinculados}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-muted-foreground">Casos nuevos creados</p>
                </div>
                <p className="text-2xl font-bold text-[#D66829]">{result.casosNuevos}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border">
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-muted-foreground">Documentos leídos</p>
                </div>
                <p className="text-2xl font-bold">{result.totalDocumentos}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">Documentos migrados</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{result.documentosCreados}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <p className="text-xs text-muted-foreground">Usuarios cliente</p>
                </div>
                <p className="text-2xl font-bold text-indigo-600">{result.usuariosCreados}</p>
              </div>
            </div>

            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <AlertTitle className="text-blue-800">Acceso de clientes</AlertTitle>
              <AlertDescription className="text-blue-700 text-sm">
                Los clientes pueden acceder con su <strong>email generado</strong> (
                <code>nombre@cliente.caard.pe</code>) y el <strong>código original</strong> que
                usaban en el sistema viejo como contraseña.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
