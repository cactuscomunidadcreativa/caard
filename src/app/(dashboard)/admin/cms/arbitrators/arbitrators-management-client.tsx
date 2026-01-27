"use client";

/**
 * CAARD - Cliente de Gestión de Árbitros Públicos
 * Maneja el ArbitratorRegistry para la nómina pública de árbitros
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gavel,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  User,
  Mail,
  Phone,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  MoreHorizontal,
  Zap,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// Especialidades disponibles
const SPECIALIZATIONS = [
  { id: "commercial", label: "Derecho Comercial" },
  { id: "state_contracting", label: "Contrataciones del Estado" },
  { id: "construction", label: "Construcción" },
  { id: "corporate", label: "Derecho Corporativo" },
  { id: "mining", label: "Minería" },
  { id: "energy", label: "Energía" },
  { id: "ip", label: "Propiedad Intelectual" },
  { id: "labor", label: "Derecho Laboral" },
  { id: "real_estate", label: "Inmobiliario" },
  { id: "international", label: "Comercio Internacional" },
];

interface Arbitrator {
  id: string;
  userId: string;
  status: string;
  barAssociation: string | null;
  barNumber: string | null;
  specializations: string[];
  acceptsEmergency: boolean;
  availabilityNotes: string | null;
  casesCompleted: number;
  approvalDate: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface ArbitratorsManagementClientProps {
  pagesWithArbitrators?: any[]; // Mantener por compatibilidad
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ArbitratorsManagementClient({
  pagesWithArbitrators,
}: ArbitratorsManagementClientProps) {
  const router = useRouter();
  const [arbitrators, setArbitrators] = useState<Arbitrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedArbitrator, setSelectedArbitrator] = useState<Arbitrator | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    barAssociation: "",
    barNumber: "",
    specializations: [] as string[],
    acceptsEmergency: false,
    availabilityNotes: "",
    status: "ACTIVE",
    image: "",
  });

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    results?: {
      total: number;
      created: number;
      skipped: number;
      errors: string[];
    };
  } | null>(null);

  // Cargar árbitros
  const fetchArbitrators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "20");
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/cms/arbitrators?${params}`);
      const data = await response.json();

      if (response.ok) {
        setArbitrators(data.arbitrators);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      } else {
        toast.error(data.error || "Error al cargar árbitros");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar árbitros");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchArbitrators();
  }, [fetchArbitrators]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      barAssociation: "",
      barNumber: "",
      specializations: [],
      acceptsEmergency: false,
      availabilityNotes: "",
      status: "ACTIVE",
      image: "",
    });
  };

  // Abrir modal de edición
  const handleEdit = (arbitrator: Arbitrator) => {
    setSelectedArbitrator(arbitrator);
    setFormData({
      name: arbitrator.user.name,
      email: arbitrator.user.email,
      phone: "",
      barAssociation: arbitrator.barAssociation || "",
      barNumber: arbitrator.barNumber || "",
      specializations: arbitrator.specializations || [],
      acceptsEmergency: arbitrator.acceptsEmergency,
      availabilityNotes: arbitrator.availabilityNotes || "",
      status: arbitrator.status,
      image: arbitrator.user.image || "",
    });
    setShowEditModal(true);
  };

  // Guardar árbitro (crear o actualizar)
  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Nombre y email son requeridos");
      return;
    }

    setSaving(true);
    try {
      const url = selectedArbitrator
        ? `/api/cms/arbitrators/${selectedArbitrator.id}`
        : "/api/cms/arbitrators";

      const response = await fetch(url, {
        method: selectedArbitrator ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(selectedArbitrator ? "Árbitro actualizado" : "Árbitro creado");
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        setSelectedArbitrator(null);
        fetchArbitrators();
      } else {
        toast.error(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar árbitro
  const handleDelete = async () => {
    if (!selectedArbitrator) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/cms/arbitrators/${selectedArbitrator.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Árbitro eliminado");
        setShowDeleteDialog(false);
        setSelectedArbitrator(null);
        fetchArbitrators();
      } else {
        const data = await response.json();
        toast.error(data.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  // Subir Excel
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Selecciona un archivo");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/cms/arbitrators/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: data.message,
          results: data.results,
        });
        fetchArbitrators();
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Error al procesar archivo",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setUploadResult({
        success: false,
        message: "Error al subir archivo",
      });
    } finally {
      setUploading(false);
    }
  };

  // Descargar plantilla
  const downloadTemplate = () => {
    const template = [
      {
        nombre: "Juan Pérez López",
        email: "juan.perez@ejemplo.com",
        telefono: "+51 999 999 999",
        colegio_abogados: "CAL",
        numero_colegiatura: "12345",
        especialidades: "commercial, construction",
        acepta_emergencia: "si",
        estado: "activo",
      },
    ];

    // Crear CSV
    const headers = Object.keys(template[0]).join(",");
    const rows = template.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    // Descargar
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_arbitros.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Toggle especialidad
  const toggleSpecialization = (specId: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(specId)
        ? prev.specializations.filter((s) => s !== specId)
        : [...prev.specializations, specId],
    }));
  };

  // Formulario de árbitro
  const ArbitratorForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre completo *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Dr. Juan Pérez López"
          />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@ejemplo.com"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Colegio de Abogados</Label>
          <Input
            value={formData.barAssociation}
            onChange={(e) => setFormData({ ...formData, barAssociation: e.target.value })}
            placeholder="CAL, CALL, CAA, etc."
          />
        </div>
        <div className="space-y-2">
          <Label>Número de Colegiatura</Label>
          <Input
            value={formData.barNumber}
            onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })}
            placeholder="12345"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Activo</SelectItem>
            <SelectItem value="INACTIVE">Inactivo</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="SUSPENDED">Suspendido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Especialidades</Label>
        <div className="grid grid-cols-2 gap-2">
          {SPECIALIZATIONS.map((spec) => (
            <div key={spec.id} className="flex items-center space-x-2">
              <Checkbox
                id={spec.id}
                checked={formData.specializations.includes(spec.id)}
                onCheckedChange={() => toggleSpecialization(spec.id)}
              />
              <Label htmlFor={spec.id} className="text-sm font-normal cursor-pointer">
                {spec.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="acceptsEmergency"
          checked={formData.acceptsEmergency}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, acceptsEmergency: checked as boolean })
          }
        />
        <Label htmlFor="acceptsEmergency" className="cursor-pointer">
          Acepta arbitrajes de emergencia
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Notas de disponibilidad</Label>
        <Textarea
          value={formData.availabilityNotes}
          onChange={(e) => setFormData({ ...formData, availabilityNotes: e.target.value })}
          placeholder="Horarios preferidos, restricciones, etc."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>URL de imagen de perfil</Label>
        <Input
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Gavel className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Nómina de Árbitros
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los árbitros del registro público ({totalCount} árbitros)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Subir Excel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setSelectedArbitrator(null);
              setShowAddModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Árbitro
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="INACTIVE">Inactivos</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={fetchArbitrators}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de árbitros */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : arbitrators.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay árbitros</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter
                  ? "No se encontraron árbitros con esos criterios"
                  : "Agrega árbitros manualmente o sube un archivo Excel"}
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Excel
                </Button>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Árbitro
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Árbitro</TableHead>
                  <TableHead className="hidden md:table-cell">Colegiatura</TableHead>
                  <TableHead className="hidden lg:table-cell">Especialidades</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Casos</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arbitrators.map((arbitrator) => (
                  <TableRow key={arbitrator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={arbitrator.user.image || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(arbitrator.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{arbitrator.user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {arbitrator.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {arbitrator.barAssociation && (
                        <span className="text-sm">
                          {arbitrator.barAssociation}
                          {arbitrator.barNumber && ` #${arbitrator.barNumber}`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(arbitrator.specializations || []).slice(0, 2).map((spec) => {
                          const specInfo = SPECIALIZATIONS.find((s) => s.id === spec);
                          return (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {specInfo?.label || spec}
                            </Badge>
                          );
                        })}
                        {(arbitrator.specializations || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{arbitrator.specializations.length - 2}
                          </Badge>
                        )}
                        {arbitrator.acceptsEmergency && (
                          <Badge variant="default" className="text-xs bg-orange-500">
                            <Zap className="h-3 w-3 mr-1" />
                            Emergencia
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          arbitrator.status === "ACTIVE"
                            ? "default"
                            : arbitrator.status === "PENDING"
                            ? "outline"
                            : "secondary"
                        }
                        className={
                          arbitrator.status === "ACTIVE"
                            ? "bg-green-500"
                            : arbitrator.status === "SUSPENDED"
                            ? "bg-red-500 text-white"
                            : ""
                        }
                      >
                        {arbitrator.status === "ACTIVE"
                          ? "Activo"
                          : arbitrator.status === "INACTIVE"
                          ? "Inactivo"
                          : arbitrator.status === "PENDING"
                          ? "Pendiente"
                          : "Suspendido"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">{arbitrator.casesCompleted}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(arbitrator)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedArbitrator(arbitrator);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Agregar */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Árbitro</DialogTitle>
            <DialogDescription>
              Completa la información del nuevo árbitro
            </DialogDescription>
          </DialogHeader>
          <ArbitratorForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Árbitro</DialogTitle>
            <DialogDescription>
              Modifica la información del árbitro
            </DialogDescription>
          </DialogHeader>
          <ArbitratorForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar árbitro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a {selectedArbitrator?.user.name} del registro
              público. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Subir Excel */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Subir Excel de Árbitros
            </DialogTitle>
            <DialogDescription>
              Sube un archivo Excel o CSV con la información de los árbitros
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Descargar plantilla */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Descarga la plantilla con el formato correcto</span>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Plantilla
                </Button>
              </AlertDescription>
            </Alert>

            {/* Selector de archivo */}
            <div className="space-y-2">
              <Label>Archivo Excel o CSV</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] || null);
                  setUploadResult(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Columnas: nombre, email, telefono, colegio_abogados, numero_colegiatura,
                especialidades, acepta_emergencia, estado
              </p>
            </div>

            {/* Resultado de subida */}
            {uploadResult && (
              <Alert variant={uploadResult.success ? "default" : "destructive"}>
                {uploadResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <p className="font-medium">{uploadResult.message}</p>
                  {uploadResult.results && (
                    <div className="mt-2 text-sm">
                      <p>Total: {uploadResult.results.total} filas</p>
                      <p className="text-green-600">
                        Creados: {uploadResult.results.created}
                      </p>
                      <p className="text-yellow-600">
                        Omitidos: {uploadResult.results.skipped}
                      </p>
                      {uploadResult.results.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-red-600">
                            Ver errores ({uploadResult.results.errors.length})
                          </summary>
                          <ul className="mt-1 text-xs space-y-1">
                            {uploadResult.results.errors.slice(0, 10).map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                            {uploadResult.results.errors.length > 10 && (
                              <li>...y {uploadResult.results.errors.length - 10} más</li>
                            )}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                setUploadFile(null);
                setUploadResult(null);
              }}
            >
              Cerrar
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Procesar Archivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link a la página pública */}
      <div className="mt-6 text-center">
        <Link
          href="/registro-arbitros"
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="h-4 w-4" />
          Ver página pública de árbitros
        </Link>
      </div>
    </div>
  );
}
