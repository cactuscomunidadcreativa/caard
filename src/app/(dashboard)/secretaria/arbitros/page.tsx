/**
 * Página: Registro de Árbitros
 * =============================
 * Gestión del registro de árbitros del centro
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Plus,
  Search,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Award,
  Briefcase,
  GraduationCap,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface ArbitratorItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string[];
  status: string;
  category: string;
  caseCount: number;
  avgResolutionDays: number;
  rating: number;
  admissionDate: string;
  education: string;
  experience: string;
  suspensionReason?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Activo", variant: "default" },
  SUSPENDED: { label: "Suspendido", variant: "destructive" },
  INACTIVE: { label: "Inactivo", variant: "outline" },
  PENDING: { label: "Pendiente", variant: "secondary" },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  PRINCIPAL: { label: "Principal", color: "bg-blue-100 text-blue-800" },
  ADJUNTO: { label: "Adjunto", color: "bg-green-100 text-green-800" },
  EMERGENCIA: { label: "Emergencia", color: "bg-amber-100 text-amber-800" },
  HONORARIO: { label: "Honorario", color: "bg-purple-100 text-purple-800" },
};

export default function ArbitrosRegistroPage() {
  const [arbitratorsList, setArbitratorsList] = useState<ArbitratorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedArbitrator, setSelectedArbitrator] = useState<ArbitratorItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    async function fetchArbitrators() {
      try {
        const res = await fetch("/api/cms/arbitrators?limit=100");
        if (res.ok) {
          const data = await res.json();
          const items = (data.arbitrators || []).map((a: any) => ({
            id: a.id,
            name: a.user?.name || "—",
            email: a.user?.email || "—",
            phone: "",
            specialty: a.specializations || [],
            status: a.status || "ACTIVE",
            category: a.acceptsEmergency ? "EMERGENCIA" : "PRINCIPAL",
            caseCount: a.casesCompleted || 0,
            avgResolutionDays: 0,
            rating: 0,
            admissionDate: a.approvalDate ? new Date(a.approvalDate).toISOString().split("T")[0] : "",
            education: "",
            experience: a.availabilityNotes || "",
          }));
          setArbitratorsList(items);
        }
      } catch (error) {
        console.error("Error fetching arbitrators:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArbitrators();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredArbitrators = arbitratorsList.filter(arb => {
    const matchesSearch = arb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arb.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || arb.status === filterStatus;
    const matchesCategory = filterCategory === "all" || arb.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeCount = arbitratorsList.filter(a => a.status === "ACTIVE").length;
  const totalCases = arbitratorsList.reduce((sum, a) => sum + a.caseCount, 0);
  const avgRating = arbitratorsList.length > 0 ? arbitratorsList.reduce((sum, a) => sum + a.rating, 0) / arbitratorsList.length : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registro de Árbitros</h1>
          <p className="text-muted-foreground">
            Gestión del nómina de árbitros del centro
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/secretaria/arbitros/recusaciones">
              Ver Recusaciones
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Árbitro
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{arbitratorsList.length}</p>
                <p className="text-sm text-muted-foreground">Total Árbitros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCases}</p>
                <p className="text-sm text-muted-foreground">Casos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Rating Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
                <SelectItem value="INACTIVE">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="PRINCIPAL">Principal</SelectItem>
                <SelectItem value="ADJUNTO">Adjunto</SelectItem>
                <SelectItem value="EMERGENCIA">Emergencia</SelectItem>
                <SelectItem value="HONORARIO">Honorario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Árbitros */}
      <Card>
        <CardHeader>
          <CardTitle>Nómina de Árbitros</CardTitle>
          <CardDescription>
            {filteredArbitrators.length} árbitro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Casos</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArbitrators.map((arbitrator) => (
                <TableRow key={arbitrator.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{arbitrator.name}</p>
                      <p className="text-sm text-muted-foreground">{arbitrator.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {arbitrator.specialty.map(s => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig[arbitrator.category]?.color}`}>
                      {categoryConfig[arbitrator.category]?.label}
                    </span>
                  </TableCell>
                  <TableCell>{arbitrator.caseCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-amber-500" />
                      {arbitrator.rating}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[arbitrator.status]?.variant}>
                      {statusConfig[arbitrator.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedArbitrator(arbitrator);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Perfil del Árbitro</DialogTitle>
          </DialogHeader>
          {selectedArbitrator && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedArbitrator.name}</h3>
                  <p className="text-muted-foreground">{selectedArbitrator.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={statusConfig[selectedArbitrator.status]?.variant}>
                      {statusConfig[selectedArbitrator.status]?.label}
                    </Badge>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig[selectedArbitrator.category]?.color}`}>
                      {categoryConfig[selectedArbitrator.category]?.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedArbitrator.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Admisión</Label>
                  <p className="font-medium">{selectedArbitrator.admissionDate}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" /> Formación
                </Label>
                <p className="font-medium">{selectedArbitrator.education}</p>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> Experiencia
                </Label>
                <p className="font-medium">{selectedArbitrator.experience}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Especialidades</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedArbitrator.specialty.map(s => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedArbitrator.caseCount}</p>
                  <p className="text-sm text-muted-foreground">Casos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedArbitrator.avgResolutionDays}</p>
                  <p className="text-sm text-muted-foreground">Días Prom.</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Award className="h-5 w-5 text-amber-500" />
                    {selectedArbitrator.rating}
                  </p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
              </div>

              {selectedArbitrator.status === "SUSPENDED" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Motivo de suspensión:</strong> {(selectedArbitrator as any).suspensionReason}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
