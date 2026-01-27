"use client";

/**
 * CAARD - Nuevo Escrito (Abogado)
 * Formulario para presentar un nuevo escrito procesal
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface Case {
  id: string;
  caseNumber: string;
  title: string;
}

const DOCUMENT_TYPES = [
  { value: "DEMANDA", label: "Demanda" },
  { value: "CONTESTACION", label: "Contestación" },
  { value: "RECONVENCION", label: "Reconvención" },
  { value: "ESCRITO", label: "Escrito General" },
  { value: "ALEGATO", label: "Alegato" },
  { value: "RECURSO", label: "Recurso" },
  { value: "PRUEBA", label: "Medio Probatorio" },
  { value: "OTRO", label: "Otro" },
];

export default function NuevoEscritoPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    caseId: "",
    documentType: "",
    title: "",
    description: "",
  });

  // Cargar casos del abogado
  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch("/api/cases?role=lawyer");
        if (response.ok) {
          const data = await response.json();
          setCases(data.cases || []);
        }
      } catch (error) {
        console.error("Error loading cases:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCases();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de archivo
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Solo se permiten archivos PDF o Word");
        return;
      }
      // Validar tamaño (20MB max)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("El archivo no puede superar 20MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.caseId) {
      toast.error("Selecciona un caso");
      return;
    }

    if (!formData.documentType) {
      toast.error("Selecciona el tipo de documento");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    if (!file) {
      toast.error("Debes adjuntar un archivo");
      return;
    }

    setIsSubmitting(true);

    try {
      // Primero subir el archivo
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("caseId", formData.caseId);

      const uploadResponse = await fetch("/api/documents", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir el archivo");
      }

      const uploadResult = await uploadResponse.json();

      // Luego crear el documento en el caso
      const docResponse = await fetch(`/api/cases/${formData.caseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploadResult.id,
          type: formData.documentType,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      if (!docResponse.ok) {
        throw new Error("Error al registrar el documento");
      }

      toast.success("Escrito presentado correctamente");
      router.push("/abogado");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al presentar el escrito");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/abogado">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#D66829]" />
            Nuevo Escrito
          </h1>
          <p className="text-muted-foreground">
            Presenta un nuevo escrito procesal
          </p>
        </div>
      </div>

      {cases.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes casos asignados. Contacta a la secretaría si crees que esto es un error.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Información del Escrito</CardTitle>
              <CardDescription>
                Completa los datos y adjunta el documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Caso */}
              <div className="space-y-2">
                <Label htmlFor="case">Caso *</Label>
                <Select
                  value={formData.caseId}
                  onValueChange={(v) => setFormData({ ...formData, caseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el caso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de documento */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Documento *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(v) => setFormData({ ...formData, documentType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título del Escrito *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Contestación de demanda"
                  maxLength={200}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descripción del contenido..."
                  rows={3}
                />
              </div>

              {/* Archivo */}
              <div className="space-y-2">
                <Label htmlFor="file">Documento *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {file ? (
                    <div className="space-y-2">
                      <FileText className="h-10 w-10 mx-auto text-[#D66829]" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Cambiar archivo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arrastra un archivo o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF o Word, máximo 20MB
                      </p>
                      <input
                        type="file"
                        id="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("file")?.click()}
                      >
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link href="/abogado">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#D66829] hover:bg-[#c45a22]"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Presentar Escrito
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
