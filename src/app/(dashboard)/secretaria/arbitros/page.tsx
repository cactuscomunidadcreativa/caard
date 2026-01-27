/**
 * Página: Registro de Árbitros
 * =============================
 * Gestión del registro de árbitros del centro
 */

"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo
const mockArbitrators = [
  {
    id: "1",
    name: "Dr. Carlos Mendoza Rivera",
    email: "cmendoza@example.com",
    phone: "+51 999 888 777",
    specialty: ["COMERCIAL", "CIVIL"],
    status: "ACTIVE",
    category: "PRINCIPAL",
    caseCount: 45,
    avgResolutionDays: 120,
    rating: 4.8,
    admissionDate: "2020-01-15",
    education: "Doctor en Derecho - PUCP",
    experience: "25 años de experiencia en litigios comerciales",
  },
  {
    id: "2",
    name: "Dra. María García López",
    email: "mgarcia@example.com",
    phone: "+51 999 777 666",
    specialty: ["CIVIL", "LABORAL"],
    status: "ACTIVE",
    category: "PRINCIPAL",
    caseCount: 38,
    avgResolutionDays: 110,
    rating: 4.9,
    admissionDate: "2019-06-20",
    education: "Magíster en Arbitraje - Universidad de Lima",
    experience: "20 años en resolución de conflictos",
  },
  {
    id: "3",
    name: "Dr. Roberto Sánchez Vega",
    email: "rsanchez@example.com",
    phone: "+51 999 666 555",
    specialty: ["ADMINISTRATIVO", "CONSTITUCIONAL"],
    status: "SUSPENDED",
    category: "ADJUNTO",
    caseCount: 22,
    avgResolutionDays: 140,
    rating: 4.5,
    admissionDate: "2021-03-10",
    education: "Doctor en Derecho Administrativo - USMP",
    experience: "15 años en derecho público",
    suspensionReason: "Pendiente actualización de certificaciones",
  },
  {
    id: "4",
    name: "Dra. Ana Torres Huamán",
    email: "atorres@example.com",
    phone: "+51 999 555 444",
    specialty: ["COMERCIAL", "INTERNACIONAL"],
    status: "ACTIVE",
    category: "EMERGENCIA",
    caseCount: 15,
    avgResolutionDays: 95,
    rating: 4.7,
    admissionDate: "2022-01-05",
    education: "LLM International Arbitration - Queen Mary",
    experience: "12 años en arbitraje internacional",
  },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedArbitrator, setSelectedArbitrator] = useState<typeof mockArbitrators[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredArbitrators = mockArbitrators.filter(arb => {
    const matchesSearch = arb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arb.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || arb.status === filterStatus;
    const matchesCategory = filterCategory === "all" || arb.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeCount = mockArbitrators.filter(a => a.status === "ACTIVE").length;
  const totalCases = mockArbitrators.reduce((sum, a) => sum + a.caseCount, 0);
  const avgRating = mockArbitrators.reduce((sum, a) => sum + a.rating, 0) / mockArbitrators.length;

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
                <p className="text-2xl font-bold">{mockArbitrators.length}</p>
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
