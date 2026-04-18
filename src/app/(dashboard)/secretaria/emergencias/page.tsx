/**
 * Página: Arbitrajes de Emergencia
 * =================================
 * Gestión de solicitudes de arbitraje de emergencia
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Play,
  Eye,
  Loader2,
} from "lucide-react";

interface Emergency {
  id: string;
  caseCode: string;
  requestDate: string;
  urgencyReason: string;
  requestedMeasure: string;
  status: string;
  assignedArbitrator: string | null;
  deadlineHours: number;
  hoursRemaining: number;
  requestor: string;
  resolution?: string;
}

interface ArbitratorOption {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  PENDING_VERIFICATION: { label: "Por Verificar", variant: "destructive", color: "text-red-600" },
  VERIFIED: { label: "Verificado", variant: "secondary", color: "text-blue-600" },
  ARBITRATOR_ASSIGNED: { label: "Árbitro Asignado", variant: "default", color: "text-green-600" },
  IN_PROGRESS: { label: "En Proceso", variant: "default", color: "text-blue-600" },
  RESOLVED: { label: "Resuelto", variant: "outline", color: "text-gray-600" },
  REJECTED: { label: "Rechazado", variant: "outline", color: "text-gray-600" },
};

export default function EmergenciasPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [arbitrators, setArbitrators] = useState<ArbitratorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedArbitrator, setSelectedArbitrator] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const merged: Emergency[] = [];

        // 1. EmergencyRequest rows (flujo formal)
        try {
          const res = await fetch("/api/emergency");
          if (res.ok) {
            const data = await res.json();
            const items = (data.items || data.emergencies || data.data || []).map(
              (e: any) => {
                const requestDate = new Date(e.requestDate || e.createdAt);
                const deadlineHours = e.deadlineHours || 24;
                const deadlineMs =
                  requestDate.getTime() + deadlineHours * 60 * 60 * 1000;
                const hoursRemaining = Math.max(
                  0,
                  Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60))
                );
                return {
                  id: e.id,
                  caseCode:
                    e.requestNumber || e.case?.code || e.id.slice(0, 8),
                  requestDate: e.requestDate || e.createdAt,
                  urgencyReason: e.urgencyReason || e.reason || "",
                  requestedMeasure: e.requestedMeasure || "",
                  status: e.status,
                  assignedArbitrator:
                    e.assignedArbitrator?.name || e.arbitratorName || null,
                  deadlineHours,
                  hoursRemaining,
                  requestor: e.requestor || e.case?.claimantName || "—",
                  resolution: e.resolution,
                };
              }
            );
            merged.push(...items);
          }
        } catch {}

        // 2. Cases con procedureType=EMERGENCY o código ARBEME
        try {
          const res2 = await fetch(
            "/api/cases?pageSize=200&procedureType=EMERGENCY"
          );
          if (res2.ok) {
            const data = await res2.json();
            const items = (data.items || []).map((c: any) => {
              const arbitrator = (c.members || []).find(
                (m: any) => m.role === "ARBITRO" && m.isPrimary
              );
              const requestDate = new Date(c.createdAt || c.submittedAt);
              const deadlineHours = 96; // 4 días hábiles = ~96 horas
              const deadlineMs =
                requestDate.getTime() + deadlineHours * 60 * 60 * 1000;
              const hoursRemaining = Math.max(
                0,
                Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60))
              );
              return {
                id: `case_${c.id}`,
                caseCode: c.code,
                requestDate: c.createdAt || c.submittedAt,
                urgencyReason: c.title || "Solicitud de arbitraje de emergencia",
                requestedMeasure: "Ver expediente para detalles",
                status:
                  c.status === "CLOSED"
                    ? "RESOLVED"
                    : c.status === "IN_PROCESS"
                    ? "IN_PROGRESS"
                    : c.status === "ADMITTED"
                    ? "VERIFIED"
                    : c.status === "REJECTED"
                    ? "REJECTED"
                    : "PENDING_VERIFICATION",
                assignedArbitrator: arbitrator?.displayName || null,
                deadlineHours,
                hoursRemaining,
                requestor: c.claimantName || "—",
              };
            });
            // Evitar duplicar si ya está como EmergencyRequest.case
            const existingCodes = new Set(merged.map((m) => m.caseCode));
            for (const it of items) {
              if (!existingCodes.has(it.caseCode)) merged.push(it);
            }
          }
        } catch {}

        // Ordenar por fecha desc
        merged.sort(
          (a, b) =>
            new Date(b.requestDate).getTime() -
            new Date(a.requestDate).getTime()
        );
        setEmergencies(merged);

        // Fetch arbitrators for assignment
        const arbRes = await fetch("/api/cms/arbitrators?status=ACTIVE&limit=50");
        if (arbRes.ok) {
          const arbData = await arbRes.json();
          const arbs = (arbData.arbitrators || []).map((a: any) => ({
            id: a.id,
            name: a.user?.name || a.name || "—",
            specialty: (a.specializations || [])[0] || "General",
            available: a.status === "ACTIVE",
          }));
          setArbitrators(arbs);
        }
      } catch (error) {
        console.error("Error fetching emergencies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingEmergencies = emergencies.filter(e => e.status === "PENDING_VERIFICATION");
  const activeEmergencies = emergencies.filter(e =>
    ["VERIFIED", "ARBITRATOR_ASSIGNED", "IN_PROGRESS"].includes(e.status)
  );

  const handleAssign = () => {
    // TODO: Implementar asignación
    console.log("Assign:", { selectedEmergency, selectedArbitrator });
    setShowAssignDialog(false);
    setSelectedArbitrator("");
  };

  const handleVerify = (emergency: typeof emergencies[0]) => {
    // TODO: Implementar verificación
    console.log("Verify:", emergency.id);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-500" />
            Arbitrajes de Emergencia
          </h1>
          <p className="text-muted-foreground">
            Solicitudes urgentes que requieren resolución en 24-48 horas
          </p>
        </div>
      </div>

      {/* Alerta de Pendientes */}
      {pendingEmergencies.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">
                  {pendingEmergencies.length} solicitud(es) pendiente(s) de verificación
                </h3>
                <p className="text-sm text-red-600">
                  Requieren atención inmediata según el reglamento de arbitraje de emergencia
                </p>
              </div>
              <Button className="ml-auto" variant="destructive">
                Atender Ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingEmergencies.length}</p>
                <p className="text-sm text-muted-foreground">Por Verificar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeEmergencies.length}</p>
                <p className="text-sm text-muted-foreground">En Proceso</p>
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
                  {emergencies.filter(e => e.status === "RESOLVED").length}
                </p>
                <p className="text-sm text-muted-foreground">Resueltos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <User className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {arbitrators.filter(a => a.available).length}
                </p>
                <p className="text-sm text-muted-foreground">Árbitros Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Emergencias */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Emergencia</CardTitle>
          <CardDescription>
            Gestione las solicitudes de arbitraje de emergencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Tiempo Restante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Árbitro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emergencies.map((emergency) => (
                <TableRow key={emergency.id}>
                  <TableCell className="font-mono font-medium">
                    {emergency.caseCode}
                  </TableCell>
                  <TableCell>{emergency.requestor}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {emergency.urgencyReason}
                  </TableCell>
                  <TableCell>
                    {new Date(emergency.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {emergency.hoursRemaining > 0 ? (
                      <span className={emergency.hoursRemaining <= 6 ? "text-red-600 font-bold" :
                                      emergency.hoursRemaining <= 12 ? "text-amber-600" : ""}>
                        {emergency.hoursRemaining}h
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[emergency.status]?.variant || "default"}>
                      {statusConfig[emergency.status]?.label || emergency.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {emergency.assignedArbitrator || (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEmergency(emergency);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {emergency.status === "PENDING_VERIFICATION" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(emergency)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verificar
                        </Button>
                      )}

                      {["PENDING_VERIFICATION", "VERIFIED"].includes(emergency.status) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedEmergency(emergency);
                            setShowAssignDialog(true);
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Asignar
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

      {/* Dialog de Asignación */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Árbitro de Emergencia</DialogTitle>
            <DialogDescription>
              Seleccione un árbitro disponible para {selectedEmergency?.caseCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Árbitro</Label>
              <Select value={selectedArbitrator} onValueChange={setSelectedArbitrator}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un árbitro" />
                </SelectTrigger>
                <SelectContent>
                  {arbitrators
                    .filter(a => a.available)
                    .map(arb => (
                      <SelectItem key={arb.id} value={arb.id}>
                        {arb.name} - {arb.specialty}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas de asignación</Label>
              <Textarea
                placeholder="Observaciones sobre la asignación..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={!selectedArbitrator}>
              Confirmar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Solicitud de Emergencia</DialogTitle>
            <DialogDescription>
              {selectedEmergency?.caseCode}
            </DialogDescription>
          </DialogHeader>
          {selectedEmergency && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Solicitante</Label>
                  <p className="font-medium">{selectedEmergency.requestor}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Solicitud</Label>
                  <p className="font-medium">
                    {new Date(selectedEmergency.requestDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Motivo de Urgencia</Label>
                <p className="font-medium">{selectedEmergency.urgencyReason}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Medida Solicitada</Label>
                <p className="font-medium">{selectedEmergency.requestedMeasure}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <p>
                    <Badge variant={statusConfig[selectedEmergency.status]?.variant}>
                      {statusConfig[selectedEmergency.status]?.label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Árbitro Asignado</Label>
                  <p className="font-medium">
                    {selectedEmergency.assignedArbitrator || "Sin asignar"}
                  </p>
                </div>
              </div>
              {selectedEmergency.status === "RESOLVED" && (
                <div>
                  <Label className="text-muted-foreground">Resolución</Label>
                  <p className="font-medium">{(selectedEmergency as any).resolution}</p>
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
    </div>
  );
}
