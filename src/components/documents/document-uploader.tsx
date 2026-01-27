"use client";

/**
 * Componente de Subida de Documentos
 * ===================================
 * Permite subir documentos al expediente con validación y progreso
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos de documentos disponibles
const documentTypes = [
  { value: "DEMANDA", label: "Demanda" },
  { value: "CONTESTACION", label: "Contestación" },
  { value: "RECONVENCION", label: "Reconvención" },
  { value: "PRUEBA_DOCUMENTAL", label: "Prueba Documental" },
  { value: "ALEGATOS", label: "Alegatos" },
  { value: "PODER", label: "Poder de Representación" },
  { value: "CONTRATO", label: "Contrato / Convenio Arbitral" },
  { value: "ESCRITO", label: "Escrito" },
  { value: "ANEXO", label: "Anexo" },
  { value: "VOUCHER_PAGO", label: "Voucher de Pago" },
  { value: "OTRO", label: "Otro" },
];

// Tipos MIME aceptados
const acceptedTypes = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  documentId?: string;
}

interface DocumentUploaderProps {
  caseId: string;
  folderId?: string;
  onUploadComplete?: (documents: any[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function DocumentUploader({
  caseId,
  folderId,
  onUploadComplete,
  maxFiles = 10,
  maxSizeMB = 25,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setGlobalError(null);

      // Manejar archivos rechazados
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((r) => {
          if (r.errors[0]?.code === "file-too-large") {
            return `${r.file.name}: Archivo muy grande (máx ${maxSizeMB}MB)`;
          }
          if (r.errors[0]?.code === "file-invalid-type") {
            return `${r.file.name}: Tipo de archivo no permitido`;
          }
          return `${r.file.name}: ${r.errors[0]?.message}`;
        });
        setGlobalError(errors.join(". "));
      }

      // Verificar límite de archivos
      if (files.length + acceptedFiles.length > maxFiles) {
        setGlobalError(`Máximo ${maxFiles} archivos permitidos`);
        return;
      }

      // Agregar archivos aceptados
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: "pending",
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles, maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: true,
  });

  // Remover archivo de la lista
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Subir archivos
  const handleUpload = async () => {
    if (files.length === 0 || !documentType) {
      setGlobalError("Seleccione tipo de documento y agregue archivos");
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    const uploadedDocs: any[] = [];

    for (const uploadFile of files) {
      if (uploadFile.status === "success") continue;

      // Actualizar estado a uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", uploadFile.file);
        formData.append("caseId", caseId);
        formData.append("documentType", documentType);
        if (folderId) formData.append("folderId", folderId);
        if (description) formData.append("description", description);

        // Simular progreso (en producción usar XMLHttpRequest para progreso real)
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 200);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Error al subir archivo");
        }

        const result = await response.json();
        uploadedDocs.push(result);

        // Actualizar estado a success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "success" as const, progress: 100, documentId: result.id }
              : f
          )
        );
      } catch (error) {
        // Actualizar estado a error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Error desconocido",
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    if (uploadedDocs.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedDocs);
    }
  };

  // Formatear tamaño de archivo
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Obtener icono de estado
  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Documentos</CardTitle>
        <CardDescription>
          Formatos permitidos: PDF, Word, JPG, PNG. Máximo {maxSizeMB}MB por
          archivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de tipo de documento */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de Documento *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo..." />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del documento"
            />
          </div>
        </div>

        {/* Zona de drop */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary">Suelte los archivos aquí...</p>
          ) : (
            <div>
              <p className="text-muted-foreground">
                Arrastre archivos aquí o haga clic para seleccionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Máximo {maxFiles} archivos, {maxSizeMB}MB cada uno
              </p>
            </div>
          )}
        </div>

        {/* Error global */}
        {globalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        {/* Lista de archivos */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                {getStatusIcon(uploadFile.status)}

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(uploadFile.file.size)}
                    {uploadFile.error && (
                      <span className="text-red-500 ml-2">
                        - {uploadFile.error}
                      </span>
                    )}
                  </p>
                  {uploadFile.status === "uploading" && (
                    <Progress value={uploadFile.progress} className="mt-1 h-1" />
                  )}
                </div>

                {uploadFile.status !== "uploading" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(uploadFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botón de subida */}
        {files.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={isUploading || !documentType}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir {files.filter((f) => f.status !== "success").length}{" "}
                archivo(s)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentUploader;
