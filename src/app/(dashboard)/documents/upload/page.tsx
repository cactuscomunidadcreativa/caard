/**
 * Página: Carga de Documentos
 * ============================
 * Interfaz para subir documentos a expedientes
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentUploader } from "@/components/documents/document-uploader";
import {
  Upload,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const documentTypes = [
  { value: "DEMANDA", label: "Demanda Arbitral" },
  { value: "CONTESTACION", label: "Contestación de Demanda" },
  { value: "RECONVENCION", label: "Reconvención" },
  { value: "PRUEBA", label: "Medio Probatorio" },
  { value: "ALEGATO", label: "Alegato" },
  { value: "ESCRITO", label: "Escrito General" },
  { value: "PODER", label: "Poder de Representación" },
  { value: "CONTRATO", label: "Contrato/Convenio Arbitral" },
  { value: "RESOLUCION", label: "Resolución" },
  { value: "LAUDO", label: "Laudo Arbitral" },
  { value: "OTRO", label: "Otro Documento" },
];

export default function DocumentUploadPage() {
  const [caseCode, setCaseCode] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchCase = async () => {
    if (!caseCode.trim()) return;

    setIsSearching(true);
    // TODO: Implementar búsqueda real
    setTimeout(() => {
      if (caseCode.startsWith("ARB-")) {
        setSelectedCase({
          id: "1",
          code: caseCode,
          title: "Controversia contractual - Servicios de consultoría",
          status: "IN_PROCESS",
          parties: ["Empresa ABC S.A.C.", "Servicios XYZ S.A."],
        });
      } else {
        setSelectedCase(null);
      }
      setIsSearching(false);
    }, 500);
  };

  const handleUpload = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSubmit = async () => {
    // TODO: Implementar envío real
    console.log("Submit:", {
      caseCode,
      documentType,
      description,
      files: uploadedFiles,
    });
  };

  const canSubmit = selectedCase && documentType && uploadedFiles.length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Carga de Documentos</h1>
        <p className="text-muted-foreground">
          Sube documentos a un expediente existente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Búsqueda de Expediente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Seleccionar Expediente
              </CardTitle>
              <CardDescription>
                Ingrese el código del expediente al cual desea adjuntar documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Ej: ARB-2025-0001"
                    value={caseCode}
                    onChange={(e) => setCaseCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchCase()}
                  />
                </div>
                <Button onClick={handleSearchCase} disabled={isSearching}>
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {selectedCase && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">
                        {selectedCase.code}
                      </p>
                      <p className="text-sm text-green-700">
                        {selectedCase.title}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Partes: {selectedCase.parties.join(" vs ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {caseCode && !selectedCase && !isSearching && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">
                        Expediente no encontrado
                      </p>
                      <p className="text-sm text-red-700">
                        Verifique el código e intente nuevamente
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tipo de Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información del Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo de documento" />
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
                <Label>Descripción (Opcional)</Label>
                <Textarea
                  placeholder="Breve descripción del contenido del documento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Área de Carga */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Archivos
              </CardTitle>
              <CardDescription>
                Formatos permitidos: PDF, DOC, DOCX, JPG, PNG. Máximo 25MB por archivo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader
                caseId={selectedCase?.id || ""}
                onUploadComplete={(docs) => setUploadedFiles(docs.map((d: any) => d.file || d))}
                maxFiles={10}
              />
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Expediente</Label>
                <p className="font-medium">
                  {selectedCase?.code || "No seleccionado"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tipo de Documento</Label>
                <p className="font-medium">
                  {documentTypes.find(t => t.value === documentType)?.label || "No seleccionado"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Archivos</Label>
                <p className="font-medium">
                  {uploadedFiles.length} archivo(s) seleccionado(s)
                </p>
              </div>

              <hr />

              <Button
                className="w-full"
                size="lg"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Documentos
              </Button>

              {!canSubmit && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete todos los campos requeridos para continuar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instrucciones */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                <p>Busque el expediente por su código</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                <p>Seleccione el tipo de documento</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                <p>Arrastre o seleccione los archivos</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">4</span>
                <p>Confirme la carga</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
