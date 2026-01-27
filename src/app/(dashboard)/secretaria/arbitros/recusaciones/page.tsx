/**
 * Página: Recusaciones de Árbitros
 * =================================
 * Gestión de solicitudes de recusación
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  User,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo
const mockRecusations = [
  {
    id: "1",
    caseCode: "ARB-2025-0001",
    arbitratorName: "Dr. Carlos Mendoza Rivera",
    requestedBy: "Empresa ABC S.A.C.",
    requestedByRole: "DEMANDANTE",
    requestDate: "2025-01-20",
    reason: "Conflicto de interés - El árbitro fue asesor legal del demandado hace 2 años",
    status: "PENDING",
    evidence: ["Carta de representación 2023", "Contrato de servicios"],
  },
  {
    id: "2",
    caseCode: "ARB-2025-0002",
    arbitratorName: "Dra. María García López",
    requestedBy: "Tech Solutions Perú",
    requestedByRole: "DEMANDADO",
    requestDate: "2025-01-18",
    reason: "Falta de imparcialidad - Declaraciones públicas sobre el caso",
    status: "ACCEPTED",
    evidence: ["Publicación en LinkedIn", "Artículo de opinión"],
    resolution: "Se acepta la recusación. Se procede a designar nuevo árbitro.",
    resolvedDate: "2025-01-22",
  },
  {
    id: "3",
    caseCode: "ARB-2024-0089",
    arbitratorName: "Dr. Roberto Sánchez Vega",
    requestedBy: "Importaciones del Sur",
    requestedByRole: "DEMANDANTE",
    requestDate: "2025-01-15",
    reason: "Relación familiar con parte contraria",
    status: "REJECTED",
    evidence: ["Declaración jurada"],
    resolution: "Se rechaza por falta de pruebas suficientes. El parentesco alegado no está acreditado.",
    resolvedDate: "2025-01-19",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente", variant: "secondary" },
  ACCEPTED: { label: "Aceptada", variant: "default" },
  REJECTED: { label: "Rechazada", variant: "destructive" },
  WITHDRAWN: { label: "Desistida", variant: "outline" },
};

export default function RecusacionesPage() {
  const [selectedRecusation, setSelectedRecusation] = useState<typeof mockRecusations[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolveAction, setResolveAction] = useState<"accept" | "reject" | null>(null);

  const pendingRecusations = mockRecusations.filter(r => r.status === "PENDING");

  const handleResolve = () => {
    // TODO: Implementar resolución
    console.log("Resolve:", { selectedRecusation, resolution, resolveAction });
    setShowResolveDialog(false);
    setResolution("");
    setResolveAction(null);
  };

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
          <h1 className="text-3xl font-bold">Recusaciones</h1>
          <p className="text-muted-foreground">
            Gestión de solicitudes de recusación de árbitros
          </p>
        </div>
      </div>

      {/* Alerta de Pendientes */}
      {pendingRecusations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  {pendingRecusations.length} recusación(es) pendiente(s) de resolución
                </h3>
                <p className="text-sm text-amber-600">
                  Deben ser resueltas en el plazo reglamentario
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRecusations.length}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
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
                <p className="text-2xl font-bold">
                  {mockRecusations.filter(r => r.status === "ACCEPTED").length}
                </p>
                <p className="text-sm text-muted-foreground">Aceptadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockRecusations.filter(r => r.status === "REJECTED").length}
                </p>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockRecusations.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Recusaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Recusación</CardTitle>
          <CardDescription>
            Historial de recusaciones presentadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expediente</TableHead>
                <TableHead>Árbitro</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecusations.map((recusation) => (
                <TableRow key={recusation.id}>
                  <TableCell className="font-mono font-medium">
                    {recusation.caseCode}
                  </TableCell>
                  <TableCell>{recusation.arbitratorName}</TableCell>
                  <TableCell>
                    <div>
                      <p>{recusation.requestedBy}</p>
                      <p className="text-xs text-muted-foreground">
                        {recusation.requestedByRole}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{recusation.requestDate}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {recusation.reason}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[recusation.status]?.variant}>
                      {statusConfig[recusation.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecusation(recusation);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {recusation.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecusation(recusation);
                            setShowResolveDialog(true);
                          }}
                        >
                          Resolver
                        </Button>
                      )}
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
            <DialogTitle>Detalle de Recusación</DialogTitle>
            <DialogDescription>
              {selectedRecusation?.caseCode}
            </DialogDescription>
          </DialogHeader>
          {selectedRecusation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Árbitro Recusado</Label>
                  <p className="font-medium">{selectedRecusation.arbitratorName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <p>
                    <Badge variant={statusConfig[selectedRecusation.status]?.variant}>
                      {statusConfig[selectedRecusation.status]?.label}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Solicitante</Label>
                  <p className="font-medium">{selectedRecusation.requestedBy}</p>
                  <p className="text-sm text-muted-foreground">
                    ({selectedRecusation.requestedByRole})
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Solicitud</Label>
                  <p className="font-medium">{selectedRecusation.requestDate}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Motivo de la Recusación</Label>
                <p className="font-medium">{selectedRecusation.reason}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Medios Probatorios</Label>
                <ul className="list-disc list-inside mt-1">
                  {selectedRecusation.evidence.map((ev, idx) => (
                    <li key={idx} className="text-sm">{ev}</li>
                  ))}
                </ul>
              </div>

              {selectedRecusation.resolution && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-muted-foreground">Resolución</Label>
                  <p className="font-medium mt-1">{selectedRecusation.resolution}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Resuelta el: {selectedRecusation.resolvedDate}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resolución */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Recusación</DialogTitle>
            <DialogDescription>
              {selectedRecusation?.caseCode} - {selectedRecusation?.arbitratorName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={resolveAction === "accept" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setResolveAction("accept")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceptar Recusación
              </Button>
              <Button
                variant={resolveAction === "reject" ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setResolveAction("reject")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Recusación
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Fundamento de la Resolución</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Ingrese los fundamentos de la resolución..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolveAction || !resolution.trim()}
            >
              Confirmar Resolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
