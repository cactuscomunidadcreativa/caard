"use client";

/**
 * CAARD - Componente de Subida de Documentos
 * Permite subir archivos o pegar enlaces externos (Drive, WeTransfer, etc.)
 */

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Link as LinkIcon,
  X,
  FileText,
  File,
  FileSpreadsheet,
  Image,
  Loader2,
  ExternalLink,
  Check,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadedFile {
  url: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  fileType?: string;
  isExternalLink?: boolean;
  linkType?: string;
}

interface DocumentUploaderProps {
  value?: string;
  onChange: (url: string, fileInfo?: UploadedFile) => void;
  category?: string;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  excel: <FileSpreadsheet className="h-8 w-8 text-green-600" />,
  word: <FileText className="h-8 w-8 text-blue-600" />,
  powerpoint: <FileText className="h-8 w-8 text-orange-500" />,
  image: <Image className="h-8 w-8 text-purple-500" />,
  file: <File className="h-8 w-8 text-gray-500" />,
};

const LINK_PATTERNS = [
  { pattern: /drive\.google\.com/i, name: "Google Drive", icon: "drive" },
  { pattern: /dropbox\.com/i, name: "Dropbox", icon: "dropbox" },
  { pattern: /wetransfer\.com|we\.tl/i, name: "WeTransfer", icon: "wetransfer" },
  { pattern: /onedrive\.live\.com|1drv\.ms/i, name: "OneDrive", icon: "onedrive" },
  { pattern: /box\.com/i, name: "Box", icon: "box" },
  { pattern: /mediafire\.com/i, name: "MediaFire", icon: "mediafire" },
  { pattern: /mega\.nz/i, name: "MEGA", icon: "mega" },
  { pattern: /icloud\.com/i, name: "iCloud", icon: "icloud" },
];

function detectLinkType(url: string): { name: string; icon: string } | null {
  for (const { pattern, name, icon } of LINK_PATTERNS) {
    if (pattern.test(url)) {
      return { name, icon };
    }
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileTypeFromUrl(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv"].includes(ext || "")) return "excel";
  if (["doc", "docx"].includes(ext || "")) return "word";
  if (["ppt", "pptx"].includes(ext || "")) return "powerpoint";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "image";
  return "file";
}

export function DocumentUploader({
  value,
  onChange,
  category = "general",
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.jpg,.jpeg,.png",
  maxSize = 50,
  label,
  placeholder = "Arrastra un archivo o haz clic para seleccionar",
  className,
  showPreview = true,
}: DocumentUploaderProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState(value || "");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(
    value ? { url: value, fileType: getFileTypeFromUrl(value) } : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setUploadProgress(0);

      // Validar tamaño
      if (file.size > maxSize * 1024 * 1024) {
        setError(`El archivo excede el límite de ${maxSize}MB`);
        setUploading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        // Simular progreso mientras sube
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const response = await fetch("/api/cms/documents/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al subir el archivo");
        }

        const data = await response.json();

        const fileInfo: UploadedFile = {
          url: data.url,
          filename: data.filename,
          originalName: data.originalName,
          mimeType: data.mimeType,
          size: data.size,
          fileType: data.fileType,
          isExternalLink: false,
        };

        setUploadedFile(fileInfo);
        onChange(data.url, fileInfo);
      } catch (err: any) {
        setError(err.message || "Error al subir el archivo");
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 500);
      }
    },
    [category, maxSize, onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileUpload(e.target.files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleExternalLink = useCallback(() => {
    if (!externalUrl.trim()) {
      setError("Por favor ingresa una URL válida");
      return;
    }

    // Validar que sea una URL
    try {
      new URL(externalUrl);
    } catch {
      setError("La URL ingresada no es válida");
      return;
    }

    setError(null);
    const linkType = detectLinkType(externalUrl);

    const fileInfo: UploadedFile = {
      url: externalUrl,
      isExternalLink: true,
      linkType: linkType?.name,
      fileType: getFileTypeFromUrl(externalUrl),
    };

    setUploadedFile(fileInfo);
    onChange(externalUrl, fileInfo);
  }, [externalUrl, onChange]);

  const handleRemove = useCallback(() => {
    setUploadedFile(null);
    setExternalUrl("");
    onChange("", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label>{label}</Label>}

      {/* Preview del archivo actual */}
      {showPreview && uploadedFile && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          {FILE_ICONS[uploadedFile.fileType || "file"]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {uploadedFile.originalName || uploadedFile.filename || "Archivo"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {uploadedFile.size && (
                <span>{formatFileSize(uploadedFile.size)}</span>
              )}
              {uploadedFile.isExternalLink && uploadedFile.linkType && (
                <span className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {uploadedFile.linkType}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tabs para subir o pegar enlace */}
      {!uploadedFile && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir archivo
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Enlace externo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50",
                uploading && "pointer-events-none opacity-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />

              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{placeholder}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo {maxSize}MB - PDF, Word, Excel, PowerPoint, imágenes
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-3 space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Pega un enlace de Google Drive, Dropbox, WeTransfer, OneDrive u otro servicio de almacenamiento.
              </p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={externalUrl}
                  onChange={(e) => {
                    setExternalUrl(e.target.value);
                    setError(null);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleExternalLink()}
                />
                <Button type="button" onClick={handleExternalLink}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Soportados:</span>
                <span className="bg-muted px-2 py-0.5 rounded">Google Drive</span>
                <span className="bg-muted px-2 py-0.5 rounded">Dropbox</span>
                <span className="bg-muted px-2 py-0.5 rounded">WeTransfer</span>
                <span className="bg-muted px-2 py-0.5 rounded">OneDrive</span>
                <span className="bg-muted px-2 py-0.5 rounded">Box</span>
                <span className="bg-muted px-2 py-0.5 rounded">MEGA</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
