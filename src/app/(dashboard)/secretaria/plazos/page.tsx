/**
 * Página: Gestión de Plazos Procesales
 * =====================================
 * Panel de control de plazos para la secretaría
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Plus,
  RefreshCw,
  FileText,
  Loader2,
} from "lucide-react";

interface Deadline {
  id: string;
  caseCode: string;
  type: string;
  description: string;
  startDate: string;
  dueDate: string;
  businessDays: number;
  status: string;
  daysRemaining: number;
  extensions: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  RUNNING: { label: "En Curso", variant: "default", icon: Clock },
  EXPIRED: { label: "Vencido", variant: "destructive", icon: AlertTriangle },
  COMPLETED: { label: "Completado", variant: "secondary", icon: CheckCircle },
  EXTENDED: { label: "Prorrogado", variant: "outline", icon: RefreshCw },
};

export default function PlazosPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [extensionDays, setExtensionDays] = useState("");
  const [extensionReason, setExtensionReason] = useState("");

  // Crear plazo
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cases, setCases] = useState<{ id: string; code: string }[]>([]);
  const [newDeadline, setNewDeadline] = useState({
    caseId: "",
    type: "CUSTOM" as string,
    title: "",
    description: "",
    businessDays: "10",
  });

  useEffect(() => {
    fetch("/api/cases?pageSize=500")
      .then((r) => r.json())
      .then((d) => setCases((d.items || []).map((c: any) => ({ id: c.id, code: c.code }))))
      .catch(() => {});
  }, []);

  async function handleCreateDeadline() {
    if (!newDeadline.caseId || !newDeadline.title || !newDeadline.businessDays) return;
    setCreating(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: newDeadline.caseId,
          type: newDeadline.type,
          title: newDeadline.title,
          description: newDeadline.description || undefined,
          businessDays: parseInt(newDeadline.businessDays, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear plazo");
      }
      setShowCreateDialog(false);
      setNewDeadline({ caseId: "", type: "CUSTOM", title: "", description: "", businessDays: "10" });
      window.location.reload();
    } catch (e: any) {
      alert(e.message || "Error al crear plazo");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    async function fetchDeadlines() {
      try {
        const res = await fetch("/api/deadlines");
        if (res.ok) {
          const data = await res.json();
          const items = (data.data || data.items || data.deadlines || []).map((d: any) => {
            const now = new Date();
            const dueDate = new Date(d.dueAt || d.dueDate);
            const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
              id: d.id,
              caseCode: d.case?.code || "—",
              type: d.type || "GENERAL",
              description: d.description || "Plazo procesal",
              startDate: d.startDate ? new Date(d.startDate).toISOString().split("T")[0] : "",
              dueDate: dueDate.toISOString().split("T")[0],
              businessDays: d.businessDays || 0,
              status: d.status || (daysRemaining < 0 ? "EXPIRED" : "RUNNING"),
              daysRemaining,
              extensions: d.extensions || 0,
            };
          });
          setDeadlines(items);
        }
      } catch (error) {
        console.error("Error fetching deadlines:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeadlines();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const urgentDeadlines = deadlines.filter(d => d.status === "RUNNING" && d.daysRemaining <= 2);
  const expiredDeadlines = deadlines.filter(d => d.status === "EXPIRED");
  const activeDeadlines = deadlines.filter(d => d.status === "RUNNING");

  const handleExtension = () => {
    // TODO: Implementar lógica de prórroga
    console.log("Extension:", { selectedDeadline, extensionDays, extensionReason });
    setShowExtensionDialog(false);
    setExtensionDays("");
    setExtensionReason("");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Plazos</h1>
          <p className="text-muted-foreground">
            Control y seguimiento de plazos procesales
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plazo
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{expiredDeadlines.length}</p>
                <p className="text-sm text-red-600">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{urgentDeadlines.length}</p>
                <p className="text-sm text-amber-600">Por Vencer (48h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDeadlines.length}</p>
                <p className="text-sm text-muted-foreground">En Curso</p>
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
                <p className="text-2xl font-bold">{deadlines.length}</p>
                <p className="text-sm text-muted-foreground">Total Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="urgent" className="text-amber-600">
            Urgentes ({urgentDeadlines.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-red-600">
            Vencidos ({expiredDeadlines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DeadlineTable
            deadlines={deadlines}
            onExtend={(d) => { setSelectedDeadline(d); setShowExtensionDialog(true); }}
          />
        </TabsContent>

        <TabsContent value="urgent">
          <DeadlineTable
            deadlines={urgentDeadlines}
            onExtend={(d) => { setSelectedDeadline(d); setShowExtensionDialog(true); }}
          />
        </TabsContent>

        <TabsContent value="expired">
          <DeadlineTable
            deadlines={expiredDeadlines}
            onExtend={(d) => { setSelectedDeadline(d); setShowExtensionDialog(true); }}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de Crear Plazo */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Plazo Procesal</DialogTitle>
            <DialogDescription>
              Crear un nuevo plazo para un expediente. Se calculará automáticamente
              la fecha de vencimiento en días hábiles (excluyendo feriados y fines de semana).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Expediente *</Label>
              <Select
                value={newDeadline.caseId}
                onValueChange={(v) => setNewDeadline({ ...newDeadline, caseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un expediente" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de plazo</Label>
              <Select
                value={newDeadline.type}
                onValueChange={(v) => setNewDeadline({ ...newDeadline, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTESTACION">Contestación</SelectItem>
                  <SelectItem value="RECONVENCION">Reconvención</SelectItem>
                  <SelectItem value="CONTESTACION_RECONVENCION">Contestación de reconvención</SelectItem>
                  <SelectItem value="ALEGATOS">Alegatos</SelectItem>
                  <SelectItem value="PAYMENT">Pago</SelectItem>
                  <SelectItem value="DESIGNACION_ARBITRO">Designación de árbitro</SelectItem>
                  <SelectItem value="SUBSANACION">Subsanación</SelectItem>
                  <SelectItem value="RECUSACION_ABSOLUCION">Recusación / Absolución</SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={newDeadline.title}
                onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                placeholder="Ej: Plazo para contestar demanda"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newDeadline.description}
                onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
                placeholder="Detalle adicional..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Días hábiles *</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={newDeadline.businessDays}
                onChange={(e) => setNewDeadline({ ...newDeadline, businessDays: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Se excluyen sábados, domingos y feriados nacionales del Perú.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateDeadline}
              disabled={creating || !newDeadline.caseId || !newDeadline.title}
            >
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</> : "Crear Plazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Prórroga */}
      <Dialog open={showExtensionDialog} onOpenChange={setShowExtensionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Prórroga</DialogTitle>
            <DialogDescription>
              Extender el plazo para {selectedDeadline?.caseCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Días hábiles adicionales</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                placeholder="Ej: 5"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo de la prórroga</Label>
              <Textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Ingrese el motivo justificado..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtensionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtension}>
              Confirmar Prórroga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeadlineTable({
  deadlines,
  onExtend
}: {
  deadlines: Deadline[];
  onExtend: (d: Deadline) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expediente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días Restantes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deadlines.map((deadline) => {
              const StatusIcon = statusConfig[deadline.status]?.icon || Clock;
              return (
                <TableRow key={deadline.id}>
                  <TableCell className="font-mono font-medium">
                    {deadline.caseCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{deadline.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {deadline.description}
                  </TableCell>
                  <TableCell>{deadline.dueDate}</TableCell>
                  <TableCell>
                    <span className={deadline.daysRemaining <= 0 ? "text-red-600 font-bold" :
                                   deadline.daysRemaining <= 2 ? "text-amber-600 font-medium" : ""}>
                      {deadline.daysRemaining <= 0
                        ? `${Math.abs(deadline.daysRemaining)} día(s) de retraso`
                        : `${deadline.daysRemaining} día(s)`
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[deadline.status]?.variant || "default"}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[deadline.status]?.label || deadline.status}
                    </Badge>
                    {deadline.extensions > 0 && (
                      <Badge variant="outline" className="ml-1">
                        +{deadline.extensions} prórr.
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExtend(deadline)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Prorrogar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
