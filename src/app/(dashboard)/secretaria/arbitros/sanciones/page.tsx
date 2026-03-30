/**
 * Página: Sanciones a Árbitros
 * =============================
 * Gestión del registro de sanciones disciplinarias
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
  AlertOctagon,
  Plus,
  Eye,
  ArrowLeft,
  Calendar,
  User,
  FileWarning,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Sanction {
  id: string;
  arbitratorName: string;
  arbitratorId: string;
  type: string;
  reason: string;
  description: string;
  startDate: string;
  endDate: string | null;
  duration: string;
  status: string;
  imposedBy: string;
  caseReference: string;
}

const typeConfig: Record<string, { label: string; color: string; severity: number }> = {
  WARNING: { label: "Amonestación", color: "bg-amber-100 text-amber-800", severity: 1 },
  SUSPENSION: { label: "Suspensión", color: "bg-orange-100 text-orange-800", severity: 2 },
  REMOVAL: { label: "Remoción", color: "bg-red-100 text-red-800", severity: 3 },
  FINE: { label: "Multa", color: "bg-purple-100 text-purple-800", severity: 2 },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Vigente", variant: "destructive" },
  COMPLETED: { label: "Cumplida", variant: "outline" },
  REGISTERED: { label: "Registrada", variant: "secondary" },
  APPEALED: { label: "En Apelación", variant: "default" },
};

export default function SancionesPage() {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    async function fetchSanctions() {
      try {
        // No specific sanctions API exists yet; show empty state
        setSanctions([]);
      } catch (error) {
        console.error("Error fetching sanctions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSanctions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredSanctions = sanctions.filter(s => {
    const matchesType = filterType === "all" || s.type === filterType;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const activeSanctions = sanctions.filter(s => s.status === "ACTIVE");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/secretaria/arbitros">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver a Registro
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Sanciones Disciplinarias</h1>
          <p className="text-muted-foreground">
            Registro de sanciones aplicadas a árbitros
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sanción
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertOctagon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSanctions.length}</p>
                <p className="text-sm text-muted-foreground">Vigentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileWarning className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sanctions.filter(s => s.type === "WARNING").length}
                </p>
                <p className="text-sm text-muted-foreground">Amonestaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sanctions.filter(s => s.type === "SUSPENSION").length}
                </p>
                <p className="text-sm text-muted-foreground">Suspensiones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sanctions.filter(s => s.type === "REMOVAL").length}
                </p>
                <p className="text-sm text-muted-foreground">Remociones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="WARNING">Amonestación</SelectItem>
                <SelectItem value="SUSPENSION">Suspensión</SelectItem>
                <SelectItem value="REMOVAL">Remoción</SelectItem>
                <SelectItem value="FINE">Multa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Vigente</SelectItem>
                <SelectItem value="COMPLETED">Cumplida</SelectItem>
                <SelectItem value="REGISTERED">Registrada</SelectItem>
                <SelectItem value="APPEALED">En Apelación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Sanciones */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Sanciones</CardTitle>
          <CardDescription>
            {filteredSanctions.length} sanción(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Árbitro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Expediente</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSanctions.map((sanction) => (
                <TableRow key={sanction.id}>
                  <TableCell className="font-medium">
                    {sanction.arbitratorName}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig[sanction.type]?.color}`}>
                      {typeConfig[sanction.type]?.label}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {sanction.reason}
                  </TableCell>
                  <TableCell>{sanction.startDate}</TableCell>
                  <TableCell>{sanction.duration}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[sanction.status]?.variant}>
                      {statusConfig[sanction.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {sanction.caseReference}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSanction(sanction);
                        setShowDetailDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
            <DialogTitle>Detalle de Sanción</DialogTitle>
          </DialogHeader>
          {selectedSanction && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeConfig[selectedSanction.type]?.color}`}>
                  {typeConfig[selectedSanction.type]?.label}
                </span>
                <Badge variant={statusConfig[selectedSanction.status]?.variant}>
                  {statusConfig[selectedSanction.status]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Árbitro Sancionado</Label>
                  <p className="font-medium">{selectedSanction.arbitratorName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expediente Relacionado</Label>
                  <p className="font-mono font-medium">{selectedSanction.caseReference}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Motivo</Label>
                <p className="font-medium">{selectedSanction.reason}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Descripción Detallada</Label>
                <p className="text-sm">{selectedSanction.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha Inicio</Label>
                  <p className="font-medium">{selectedSanction.startDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha Fin</Label>
                  <p className="font-medium">{selectedSanction.endDate || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duración</Label>
                  <p className="font-medium">{selectedSanction.duration}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Impuesta por</Label>
                <p className="font-medium">{selectedSanction.imposedBy}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Sanción */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Sanción</DialogTitle>
            <DialogDescription>
              Complete los datos de la sanción disciplinaria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Árbitro</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione árbitro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Dr. Carlos Mendoza Rivera</SelectItem>
                    <SelectItem value="2">Dra. María García López</SelectItem>
                    <SelectItem value="3">Dr. Roberto Sánchez Vega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Sanción</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WARNING">Amonestación</SelectItem>
                    <SelectItem value="SUSPENSION">Suspensión</SelectItem>
                    <SelectItem value="REMOVAL">Remoción</SelectItem>
                    <SelectItem value="FINE">Multa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expediente Relacionado</Label>
              <Input placeholder="Ej: ARB-2025-0001" />
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input placeholder="Breve descripción del motivo" />
            </div>

            <div className="space-y-2">
              <Label>Descripción Detallada</Label>
              <Textarea
                placeholder="Describa los hechos y fundamentos de la sanción..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin (si aplica)</Label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button>
              Registrar Sanción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
