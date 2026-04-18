/**
 * CAARD - Cliente de Documentos
 * Interfaz de gestión de documentos con Google Drive y backup
 */

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Filter,
  Upload,
  Download,
  FolderSync,
  HardDrive,
  Cloud,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  MoreHorizontal,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FolderOpen,
  ChevronRight,
  Settings,
  Database,
} from "lucide-react";
import { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Document {
  id: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: bigint;
  driveFileId: string;
  driveWebViewLink: string | null;
  createdAt: Date;
  case: {
    id: string;
    code: string;
    title: string | null;
  };
  folder: {
    id: string;
    key: string;
    name: string;
  } | null;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface CaseFolderNode {
  id: string;
  key: string;
  name: string;
  parentId: string | null;
  driveFolderId: string | null;
  sortOrder: number;
  _count: { documents: number };
}

interface Case {
  id: string;
  code: string;
  title: string | null;
  status: string;
  driveFolderId: string | null;
  folders: CaseFolderNode[];
  _count: { documents: number };
}

interface DocumentsClientProps {
  initialDocuments: Document[];
  cases: Case[];
  stats: {
    total: number;
    byType: Record<string, number>;
  };
  userRole: Role;
}

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

function formatFileSize(bytes: bigint | number): string {
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return FileText;
  return File;
}

export function DocumentsClient({
  initialDocuments,
  cases,
  stats,
  userRole,
}: DocumentsClientProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [backupProgress, setBackupProgress] = useState(0);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [backupStatus, setBackupStatus] = useState<"idle" | "backing" | "success" | "error">("idle");

  // Drive folder picker state
  const [driveCurrent, setDriveCurrent] = useState<{ id: string; name: string; webViewLink?: string } | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderSearch, setFolderSearch] = useState("");
  const [folderResults, setFolderResults] = useState<Array<{ id: string; name: string; owners?: any[]; shared?: boolean }>>([]);
  const [folderLoading, setFolderLoading] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);
  const [folderScope, setFolderScope] = useState<"all" | "mine" | "shared">("shared");
  const [manualFolderId, setManualFolderId] = useState("");

  // Load current folder on mount
  useEffect(() => {
    fetch("/api/integrations/google/drive/folders?search=")
      .then((r) => r.json())
      .then((d) => {
        if (d.current) setDriveCurrent({ id: d.current.id, name: d.current.name, webViewLink: d.current.webViewLink });
      })
      .catch(() => {});
  }, []);

  const searchDriveFolders = async (q: string, scope: "all" | "mine" | "shared" = folderScope) => {
    setFolderLoading(true);
    try {
      const r = await fetch(`/api/integrations/google/drive/folders?scope=${scope}&search=${encodeURIComponent(q)}`);
      const d = await r.json();
      setFolderResults(d.folders || []);
    } finally {
      setFolderLoading(false);
    }
  };

  const saveDriveFolder = async (folder: { id: string; name: string }) => {
    setSavingFolder(true);
    try {
      const r = await fetch("/api/integrations/google/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootFolderId: folder.id }),
      });
      if (r.ok) {
        setDriveCurrent({ id: folder.id, name: folder.name });
        setShowFolderPicker(false);
      }
    } finally {
      setSavingFolder(false);
    }
  };

  const { toast } = useToast();
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // Filtrar documentos
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      search === "" ||
      doc.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
      doc.case.code.toLowerCase().includes(search.toLowerCase());
    const matchesCase = selectedCase === "all" || doc.case.id === selectedCase;
    const matchesType = selectedType === "all" || doc.documentType === selectedType;
    return matchesSearch && matchesCase && matchesType;
  });

  // Sincronizar con Google Drive
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus("syncing");
    setSyncProgress(0);

    try {
      // Simular progreso (en producción esto vendría del servidor)
      const interval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          // Capar en 95 para que la barra no pase de ahí hasta respuesta real
          return Math.min(95, prev + Math.random() * 10);
        });
      }, 500);

      const response = await fetch("/api/documents/import-from-drive", {
        method: "POST",
      });

      clearInterval(interval);

      if (response.ok) {
        const result = await response.json();
        setSyncProgress(100);
        setSyncStatus("success");
        toast({
          title: "Importación completada",
          description: `${result.stats?.casesMatched || 0} casos vinculados, ${result.stats?.filesIndexed || 0} archivos indexados`,
        });

        // Recargar documentos
        const docsResponse = await fetch("/api/documents");
        if (docsResponse.ok) {
          const data = await docsResponse.json();
          setDocuments(data.documents);
        }
      } else {
        throw new Error("Error en sincronización");
      }
    } catch (error) {
      setSyncStatus("error");
      toast({
        title: "Error de sincronización",
        description: "No se pudo sincronizar con Google Drive",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setShowSyncDialog(false);
        setSyncStatus("idle");
        setSyncProgress(0);
      }, 2000);
    }
  };

  // Crear backup local
  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus("backing");
    setBackupProgress(0);

    try {
      const interval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return Math.min(95, prev + Math.random() * 8);
        });
      }, 500);

      const response = await fetch("/api/documents/backup", {
        method: "POST",
      });

      clearInterval(interval);

      if (response.ok) {
        setBackupProgress(100);
        setBackupStatus("success");
        const data = await response.json();
        toast({
          title: "Backup completado",
          description: `Backup creado: ${data.backupPath || "backup_" + new Date().toISOString().split("T")[0]}`,
        });
      } else {
        throw new Error("Error en backup");
      }
    } catch (error) {
      setBackupStatus("error");
      toast({
        title: "Error de backup",
        description: "No se pudo crear el backup local",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
      setTimeout(() => {
        setShowBackupDialog(false);
        setBackupStatus("idle");
        setBackupProgress(0);
      }, 2000);
    }
  };

  // Tipos de documento únicos
  const documentTypes = Array.from(new Set(documents.map((d) => d.documentType)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Gestiona y sincroniza los documentos del sistema
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSyncDialog(true)}
              disabled={isSyncing}
            >
              <Cloud className="mr-2 h-4 w-4" />
              Sincronizar Drive
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBackupDialog(true)}
              disabled={isBackingUp}
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Backup Local
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              En {cases.length} expedientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sincronizados</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documents.filter((d) => d.driveFileId).length}
            </div>
            <p className="text-xs text-muted-foreground">Con Google Drive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expedientes</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.length}</div>
            <p className="text-xs text-muted-foreground">Con documentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentTypes.length}</div>
            <p className="text-xs text-muted-foreground">Categorías</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="cases">Por Expediente</TabsTrigger>
          {isAdmin && <TabsTrigger value="config">Configuración</TabsTrigger>}
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedCase} onValueChange={setSelectedCase}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Expediente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los expedientes</SelectItem>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table - Desktop */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Carpeta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron documentos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const FileIcon = getFileIcon(doc.mimeType);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <FileIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium truncate max-w-[200px]">
                                {doc.originalFileName}
                              </p>
                              {doc.uploadedBy && (
                                <p className="text-xs text-muted-foreground">
                                  Por {doc.uploadedBy.name || doc.uploadedBy.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.case.code}</Badge>
                        </TableCell>
                        <TableCell>
                          {doc.folder ? (
                            <span className="text-sm">{doc.folder.name}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.documentType}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(doc.sizeBytes)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {doc.driveWebViewLink && (
                                <DropdownMenuItem
                                  onClick={() => window.open(doc.driveWebViewLink!, "_blank")}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver en Drive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
                              </DropdownMenuItem>
                              {isAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Documents Cards - Mobile */}
          <div className="md:hidden space-y-3">
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No se encontraron documentos
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.mimeType);
                return (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.originalFileName}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.case.code}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {doc.documentType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.sizeBytes)}</span>
                            <span>•</span>
                            <span>{format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {doc.driveWebViewLink && (
                              <DropdownMenuItem
                                onClick={() => window.open(doc.driveWebViewLink!, "_blank")}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver en Drive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Cases Tab - vista jerárquica estilo Drive */}
        <TabsContent value="cases" className="space-y-2">
          <div className="rounded-lg border bg-white divide-y">
            {cases.map((caseItem) => (
              <details key={caseItem.id} className="group/case">
                <summary className="cursor-pointer list-none flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <svg
                    className="h-4 w-4 text-slate-400 transition-transform group-open/case:rotate-90 flex-shrink-0"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <FolderOpen className="h-5 w-5 text-[#D66829] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#0B2A5B]">{caseItem.code}</span>
                      {caseItem.driveFolderId && <Cloud className="h-3.5 w-3.5 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{caseItem.title || "Sin título"}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {caseItem._count.documents} docs
                  </Badge>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {caseItem.folders.length} carpetas
                  </Badge>
                </summary>
                <div className="bg-slate-50/50 border-t">
                  {caseItem.folders.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-8 py-3 italic">Sin carpetas</p>
                  ) : (
                    <FolderTree folders={caseItem.folders} caseId={caseItem.id} />
                  )}
                  <div className="px-8 py-2 border-t bg-white">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => window.location.href = `/cases/${caseItem.id}`}>
                      Ver expediente completo
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </details>
            ))}
            {cases.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No hay expedientes</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Config Tab - Admin only */}
        {isAdmin && (
          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Google Drive Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Google Drive
                  </CardTitle>
                  <CardDescription>
                    Configuración de sincronización con Google Drive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Conectado</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Reconectar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Carpeta raíz</label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2 border rounded-md bg-muted/30 text-sm flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-[#D66829]" />
                        <span className="truncate">{driveCurrent?.name || "Sin configurar"}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setShowFolderPicker(true); searchDriveFolders(""); }}>
                        Cambiar
                      </Button>
                    </div>
                    {driveCurrent?.webViewLink && (
                      <a href={driveCurrent.webViewLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D66829] hover:underline">
                        Abrir en Drive →
                      </a>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sincronización automática</label>
                    <Select defaultValue="manual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="hourly">Cada hora</SelectItem>
                        <SelectItem value="daily">Diaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={() => setShowSyncDialog(true)}>
                    <FolderSync className="mr-2 h-4 w-4" />
                    Sincronizar ahora
                  </Button>
                </CardContent>
              </Card>

              {/* Backup Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backup Local
                  </CardTitle>
                  <CardDescription>
                    Configuración de respaldos en el servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Último backup</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(), "dd MMM yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      OK
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ruta de backup</label>
                    <Input value="/var/backups/caard" disabled />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Backup automático</label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={() => setShowBackupDialog(true)}>
                    <HardDrive className="mr-2 h-4 w-4" />
                    Crear backup ahora
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Importar desde Google Drive
            </DialogTitle>
            <DialogDescription>
              Lee la carpeta raíz configurada y vincula los expedientes y documentos a la BD.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {syncStatus === "idle" && (
              <div className="text-center space-y-2">
                <FolderSync className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Recorrerá las subcarpetas de tu carpeta raíz, las matchea con cada expediente por código y registra cada PDF como documento del caso. <strong>No descarga ni copia archivos</strong> — los PDFs siguen viviendo en Drive.
                </p>
              </div>
            )}

            {syncStatus === "syncing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                </div>
                <Progress value={syncProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Sincronizando... {Math.round(syncProgress)}%
                </p>
              </div>
            )}

            {syncStatus === "success" && (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-sm font-medium text-green-600">
                  Sincronización completada
                </p>
              </div>
            )}

            {syncStatus === "error" && (
              <div className="text-center space-y-2">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  Error en la sincronización
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {syncStatus === "idle" && (
              <>
                <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSync}>
                  <FolderSync className="mr-2 h-4 w-4" />
                  Iniciar sincronización
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Crear Backup Local
            </DialogTitle>
            <DialogDescription>
              Se creará un respaldo de todos los documentos en el servidor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {backupStatus === "idle" && (
              <div className="text-center space-y-2">
                <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Se respaldarán {stats.total} documentos de {cases.length} expedientes
                </p>
              </div>
            )}

            {backupStatus === "backing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                </div>
                <Progress value={backupProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Creando backup... {Math.round(backupProgress)}%
                </p>
              </div>
            )}

            {backupStatus === "success" && (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-sm font-medium text-green-600">
                  Backup creado exitosamente
                </p>
              </div>
            )}

            {backupStatus === "error" && (
              <div className="text-center space-y-2">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  Error al crear backup
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {backupStatus === "idle" && (
              <>
                <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleBackup}>
                  <HardDrive className="mr-2 h-4 w-4" />
                  Crear backup
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drive Folder Picker */}
      <Dialog open={showFolderPicker} onOpenChange={setShowFolderPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seleccionar carpeta de Google Drive</DialogTitle>
            <DialogDescription>
              Esta será la carpeta raíz donde se organizarán los expedientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-1 border rounded-md p-1 bg-muted">
              {(["shared", "mine", "all"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setFolderScope(s); searchDriveFolders(folderSearch, s); }}
                  className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                    folderScope === s ? "bg-[#0B2A5B] text-white" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {s === "shared" ? "Compartidas conmigo" : s === "mine" ? "Mis carpetas" : "Todas"}
                </button>
              ))}
            </div>
            <Input
              placeholder="Buscar carpeta por nombre..."
              value={folderSearch}
              onChange={(e) => {
                setFolderSearch(e.target.value);
                searchDriveFolders(e.target.value, folderScope);
              }}
            />
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-1">¿Sabes el ID de la carpeta? Pégalo aquí:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Folder ID de Google Drive"
                  value={manualFolderId}
                  onChange={(e) => setManualFolderId(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!manualFolderId.trim() || savingFolder}
                  onClick={() => saveDriveFolder({ id: manualFolderId.trim(), name: manualFolderId.trim() })}
                >
                  Usar
                </Button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto border rounded-md divide-y">
              {folderLoading && (
                <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
              )}
              {!folderLoading && folderResults.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">Sin resultados</div>
              )}
              {folderResults.map((f) => (
                <button
                  key={f.id}
                  onClick={() => saveDriveFolder({ id: f.id, name: f.name })}
                  disabled={savingFolder}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <FolderOpen className="h-5 w-5 text-[#D66829] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{f.name}</p>
                    {f.owners && f.owners[0] && (
                      <p className="text-xs text-muted-foreground truncate">
                        Owner: {f.owners[0].emailAddress}
                      </p>
                    )}
                  </div>
                  {driveCurrent?.id === f.id && (
                    <Badge variant="secondary" className="text-xs">Actual</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderPicker(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Árbol de carpetas (respetando jerarquía parentId + orden sortOrder).
// Todas las carpetas se muestran contraídas por defecto.
function FolderTree({
  folders,
  caseId,
}: {
  folders: CaseFolderNode[];
  caseId: string;
}) {
  // Construir tree por parentId
  const byParent = new Map<string | null, CaseFolderNode[]>();
  for (const f of folders) {
    const key = f.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(f);
  }
  // Ordenar cada grupo por sortOrder (ya vienen ordenadas del server, pero doble check)
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  const roots = byParent.get(null) || [];
  if (roots.length === 0) {
    // Si no hay raíces (todas las carpetas tienen parentId), considerar todas como raíces
    return (
      <div className="divide-y divide-slate-100">
        {folders.map((f) => (
          <FolderNode
            key={f.id}
            folder={f}
            caseId={caseId}
            depth={0}
            byParent={byParent}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {roots.map((f) => (
        <FolderNode
          key={f.id}
          folder={f}
          caseId={caseId}
          depth={0}
          byParent={byParent}
        />
      ))}
    </div>
  );
}

function FolderNode({
  folder,
  caseId,
  depth,
  byParent,
}: {
  folder: CaseFolderNode;
  caseId: string;
  depth: number;
  byParent: Map<string | null, CaseFolderNode[]>;
}) {
  const children = byParent.get(folder.id) || [];
  const hasChildren = children.length > 0;
  // Padding izquierdo escala con la profundidad (como Drive)
  const paddingLeft = 2 + depth * 1.5; // rem

  return (
    <details className="group/folder">
      <summary
        className="cursor-pointer list-none flex items-center gap-3 py-2.5 pr-3 hover:bg-white transition-colors"
        style={{ paddingLeft: `${paddingLeft}rem` }}
      >
        <svg
          className="h-3.5 w-3.5 text-slate-400 transition-transform group-open/folder:rotate-90 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <FolderOpen className="h-4 w-4 text-[#0B2A5B]/70 flex-shrink-0" />
        <span className="text-sm font-medium text-[#0B2A5B] flex-1 truncate">
          {folder.name}
        </span>
        {hasChildren && (
          <Badge variant="outline" className="text-xs">
            {children.length} sub
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {folder._count.documents}
        </Badge>
      </summary>
      <div className="bg-white">
        {/* Subcarpetas */}
        {hasChildren && (
          <div className="divide-y divide-slate-100">
            {children.map((c) => (
              <FolderNode
                key={c.id}
                folder={c}
                caseId={caseId}
                depth={depth + 1}
                byParent={byParent}
              />
            ))}
          </div>
        )}
        {/* Documentos de esta carpeta */}
        {folder._count.documents > 0 && (
          <FolderDocuments caseId={caseId} folderId={folder.id} depth={depth} />
        )}
      </div>
    </details>
  );
}

// Componente que carga documentos de una carpeta on-demand
function FolderDocuments({
  caseId,
  folderId,
  depth = 1,
}: {
  caseId: string;
  folderId: string;
  depth?: number;
}) {
  const [docs, setDocs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDocs(null);
    setLoading(true);
    fetch(`/api/documents?caseId=${caseId}&folderId=${folderId}&pageSize=500`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setDocs(d.documents || d.items || []);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, folderId]);

  const paddingLeft = `${3.5 + depth * 1.5}rem`;

  if (loading)
    return (
      <p className="text-xs text-muted-foreground py-2" style={{ paddingLeft }}>
        Cargando...
      </p>
    );
  // Si no hay documentos, no renderizamos nada (evita ruido visual
  // en carpetas que solo tienen subcarpetas o en el estado de carga inicial).
  if (!docs || docs.length === 0) return null;

  return (
    <ul className="bg-white">
      {docs.map((d: any) => (
        <li key={d.id}>
          <a
            href={`/api/documents/${d.id}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 pr-3 hover:bg-[#D66829]/5 border-b border-slate-100 last:border-0 transition-colors"
            style={{ paddingLeft }}
          >
            <FileText className="h-3.5 w-3.5 text-[#D66829] flex-shrink-0" />
            <span className="text-xs flex-1 truncate">{d.originalFileName || d.title}</span>
            <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
          </a>
        </li>
      ))}
    </ul>
  );
}
