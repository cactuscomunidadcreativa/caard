"use client";

/**
 * CAARD - Gestión de Fraccionamientos Client Component
 * Permite crear, aprobar y gestionar planes de fraccionamiento
 */

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Split,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  DollarSign,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Check,
  X,
  Plus,
  Settings,
  Building,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock } from "lucide-react";

// Status configuration
const STATUS_CONFIG = {
  PENDING: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Aprobado",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rechazado",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  ACTIVE: {
    label: "En Curso",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Split,
  },
  COMPLETED: {
    label: "Completado",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  DEFAULTED: {
    label: "Incumplido",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: XCircle,
  },
};

interface InstallmentPlan {
  id: string;
  caseId: string;
  paymentOrderId: string;
  requestedById: string;
  requestedAt: Date;
  reason: string;
  attachmentUrl: string | null;
  totalAmountCents: number;
  numberOfInstallments: number;
  installmentAmountCents: number;
  status: keyof typeof STATUS_CONFIG;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  firstDueDate: Date;
  case: {
    id: string;
    code: string;
    title: string | null;
    claimantName: string | null;
    respondentName: string | null;
  };
  requestedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewedBy: {
    id: string;
    name: string | null;
  } | null;
  installments: Array<{
    id: string;
    installmentNumber: number;
    amountCents: number;
    dueAt: Date;
    paidAt: Date | null;
    status: string;
  }>;
}

interface PaymentOrder {
  id: string;
  orderNumber: string;
  concept: string;
  amountCents: number;
  case: {
    id: string;
    code: string;
    title: string | null;
    claimantName: string | null;
    respondentName: string | null;
  };
}

interface Props {
  plans: InstallmentPlan[];
  pendingPaymentOrders?: PaymentOrder[];
  allowPartyRequests?: boolean;
}

export function FraccionamientosClient({
  plans,
  pendingPaymentOrders = [],
  allowPartyRequests = true
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // New state for creating installment plans
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<PaymentOrder | null>(null);
  const [numberOfInstallments, setNumberOfInstallments] = useState(3);
  const [firstDueDate, setFirstDueDate] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [partyRequestsEnabled, setPartyRequestsEnabled] = useState(allowPartyRequests);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Prórroga (extend) state
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendPlan, setExtendPlan] = useState<InstallmentPlan | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState("");
  const [extendInstallmentId, setExtendInstallmentId] = useState<string>("ALL");

  // Estadísticas
  const stats = {
    pending: plans.filter((p) => p.status === "PENDING").length,
    active: plans.filter((p) => p.status === "ACTIVE").length,
    completed: plans.filter((p) => p.status === "COMPLETED").length,
    total: plans.length,
  };

  // Filtrar planes
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      !searchTerm ||
      plan.case.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.requestedBy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.requestedBy.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleReview = async () => {
    if (!selectedPlan || !reviewAction) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payments/installments/${selectedPlan.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
          rejectionReason: reviewAction === "REJECT" ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setShowReviewDialog(false);
      setSelectedPlan(null);
      setReviewNotes("");
      setRejectionReason("");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewDialog = (plan: InstallmentPlan, action: "APPROVE" | "REJECT") => {
    setSelectedPlan(plan);
    setReviewAction(action);
    setShowReviewDialog(true);
  };

  // Create installment plan handler
  const handleCreate = async () => {
    if (!selectedPaymentOrder || !firstDueDate || numberOfInstallments < 2) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/payments/installments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentOrderId: selectedPaymentOrder.id,
          caseId: selectedPaymentOrder.case.id,
          numberOfInstallments,
          firstDueDate,
          reason: createReason || "Plan de fraccionamiento creado por administrador",
          totalAmountCents: selectedPaymentOrder.amountCents,
          createdByAdmin: true, // This skips the approval step
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear fraccionamiento");
      }

      setShowCreateDialog(false);
      setSelectedPaymentOrder(null);
      setNumberOfInstallments(3);
      setFirstDueDate("");
      setCreateReason("");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle party requests setting
  const handleTogglePartyRequests = async (enabled: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/settings/installments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowPartyRequests: enabled }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar configuración");
      }

      setPartyRequestsEnabled(enabled);
    } catch (error: any) {
      alert(error.message);
      setPartyRequestsEnabled(!enabled); // Revert on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate installment amounts
  const calculateInstallmentAmount = () => {
    if (!selectedPaymentOrder) return 0;
    return Math.ceil(selectedPaymentOrder.amountCents / numberOfInstallments);
  };

  // Handle extend (prórroga)
  const handleExtend = async () => {
    if (!extendPlan || !extendDays) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payments/installments/${extendPlan.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: extendDays,
          reason: extendReason || "Prórroga otorgada por administrador",
          installmentId: extendInstallmentId === "ALL" ? undefined : extendInstallmentId,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al prorrogar");
      }
      setShowExtendDialog(false);
      setExtendPlan(null);
      setExtendDays(30);
      setExtendReason("");
      setExtendInstallmentId("ALL");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openExtendDialog = (plan: InstallmentPlan) => {
    setExtendPlan(plan);
    setExtendDays(30);
    setExtendReason("");
    setExtendInstallmentId("ALL");
    setShowExtendDialog(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Split className="h-6 w-6 text-[#D66829]" />
            Fraccionamientos de Pago
          </h1>
          <p className="text-muted-foreground">
            Gestione las solicitudes de fraccionamiento de pagos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Fraccionamiento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Split className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">En Curso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por caso, solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="APPROVED">Aprobados</SelectItem>
                <SelectItem value="ACTIVE">En Curso</SelectItem>
                <SelectItem value="COMPLETED">Completados</SelectItem>
                <SelectItem value="REJECTED">Rechazados</SelectItem>
                <SelectItem value="DEFAULTED">Incumplidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de fraccionamientos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caso</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead className="text-right">Monto Total</TableHead>
                <TableHead className="text-center">Cuotas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron solicitudes de fraccionamiento
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => {
                  const statusConfig = STATUS_CONFIG[plan.status];
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = expandedPlanId === plan.id;
                  const paidInstallments = plan.installments.filter((i) => i.status === "PAID").length;
                  const canExtend = plan.status === "ACTIVE" || plan.status === "APPROVED" || plan.status === "DEFAULTED";

                  return (
                    <Fragment key={plan.id}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="align-top">
                          <Link
                            href={`/admin/expedientes/${plan.case.id}`}
                            className="font-medium text-[#D66829] hover:underline"
                          >
                            {plan.case.code}
                          </Link>
                          {plan.case.title && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {plan.case.title}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{plan.requestedBy.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {plan.requestedBy.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium align-top whitespace-nowrap">
                          S/. {(plan.totalAmountCents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center align-top whitespace-nowrap">
                          {plan.status === "ACTIVE" || plan.status === "COMPLETED" ? (
                            <span className="text-sm">
                              {paidInstallments}/{plan.numberOfInstallments}
                            </span>
                          ) : (
                            <span className="text-sm">{plan.numberOfInstallments}</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(plan.requestedAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {plan.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => openReviewDialog(plan, "APPROVE")}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => openReviewDialog(plan, "REJECT")}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Rechazar
                                </Button>
                              </>
                            )}
                            {canExtend && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => openExtendDialog(plan)}
                                title="Prorrogar cuotas"
                              >
                                <CalendarClock className="h-4 w-4 mr-1" />
                                Prorrogar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                              aria-label={isExpanded ? "Contraer" : "Expandir"}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="space-y-4">
                              {/* Motivo */}
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Motivo de la solicitud
                                </Label>
                                <p className="text-sm mt-1">{plan.reason}</p>
                              </div>

                              {/* Cuotas (si está activo) */}
                              {(plan.status === "ACTIVE" || plan.status === "COMPLETED") &&
                                plan.installments.length > 0 && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">
                                      Cronograma de Cuotas
                                    </Label>
                                    <div className="mt-2 grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                                      {plan.installments.map((inst) => (
                                        <div
                                          key={inst.id}
                                          className={`p-3 rounded-lg border ${
                                            inst.status === "PAID"
                                              ? "bg-green-50 border-green-200"
                                              : inst.status === "OVERDUE"
                                              ? "bg-red-50 border-red-200"
                                              : "bg-white"
                                          }`}
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-sm">
                                              Cuota {inst.installmentNumber}
                                            </span>
                                            <Badge
                                              variant={
                                                inst.status === "PAID"
                                                  ? "default"
                                                  : inst.status === "OVERDUE"
                                                  ? "destructive"
                                                  : "secondary"
                                              }
                                              className="text-xs"
                                            >
                                              {inst.status === "PAID"
                                                ? "Pagado"
                                                : inst.status === "OVERDUE"
                                                ? "Vencido"
                                                : "Pendiente"}
                                            </Badge>
                                          </div>
                                          <p className="text-lg font-bold">
                                            S/. {(inst.amountCents / 100).toFixed(2)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Vence:{" "}
                                            {new Date(inst.dueAt).toLocaleDateString("es-PE")}
                                          </p>
                                          {inst.paidAt && (
                                            <p className="text-xs text-green-600">
                                              Pagado:{" "}
                                              {new Date(inst.paidAt).toLocaleDateString("es-PE")}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Info de revisión */}
                              {plan.reviewedBy && (
                                <div className="flex gap-8 text-sm flex-wrap">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">
                                      Revisado por
                                    </Label>
                                    <p>{plan.reviewedBy.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">
                                      Fecha revisión
                                    </Label>
                                    <p>
                                      {plan.reviewedAt
                                        ? new Date(plan.reviewedAt).toLocaleDateString("es-PE")
                                        : "-"}
                                    </p>
                                  </div>
                                  {plan.rejectionReason && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Motivo rechazo
                                      </Label>
                                      <p className="text-red-600">{plan.rejectionReason}</p>
                                    </div>
                                  )}
                                  {plan.reviewNotes && (
                                    <div className="basis-full">
                                      <Label className="text-xs text-muted-foreground">
                                        Historial / Notas
                                      </Label>
                                      <pre className="text-xs whitespace-pre-wrap mt-1 bg-white/50 p-2 rounded">{plan.reviewNotes}</pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de revisión */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVE"
                ? "Aprobar Fraccionamiento"
                : "Rechazar Fraccionamiento"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "APPROVE"
                ? "Al aprobar, se generarán las cuotas automáticamente."
                : "Indique el motivo del rechazo."}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Caso:</span>
                    <span className="font-medium">{selectedPlan.case.code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Solicitante:</span>
                    <span className="font-medium">{selectedPlan.requestedBy.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Monto:</span>
                    <span className="font-bold">
                      S/. {(selectedPlan.totalAmountCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cuotas:</span>
                    <span className="font-medium">
                      {selectedPlan.numberOfInstallments} x S/.{" "}
                      {(selectedPlan.installmentAmountCents / 100).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Agregue notas sobre esta revisión..."
                  rows={2}
                />
              </div>

              {reviewAction === "REJECT" && (
                <div className="space-y-2">
                  <Label>Motivo del rechazo *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explique por qué se rechaza la solicitud..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReview}
              disabled={isSubmitting || (reviewAction === "REJECT" && !rejectionReason)}
              className={
                reviewAction === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : reviewAction === "APPROVE" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Aprobar
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Rechazar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de creación de fraccionamiento */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Plan de Fraccionamiento
            </DialogTitle>
            <DialogDescription>
              Seleccione una orden de pago pendiente y configure el plan de cuotas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selección de orden de pago */}
            <div className="space-y-2">
              <Label>Orden de Pago a Fraccionar *</Label>
              {pendingPaymentOrders.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center text-muted-foreground">
                    No hay órdenes de pago pendientes disponibles para fraccionar
                  </CardContent>
                </Card>
              ) : (
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {pendingPaymentOrders.map((order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPaymentOrder?.id === order.id
                          ? "ring-2 ring-[#D66829] bg-[#D66829]/5"
                          : ""
                      }`}
                      onClick={() => setSelectedPaymentOrder(order)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#D66829]">
                                {order.orderNumber}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {order.case.code}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {order.concept}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              S/. {(order.amountCents / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {selectedPaymentOrder && (
              <>
                {/* Configuración de cuotas */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Número de Cuotas *</Label>
                    <Select
                      value={numberOfInstallments.toString()}
                      onValueChange={(v) => setNumberOfInstallments(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} cuotas
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Primera Cuota *</Label>
                    <Input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {/* Resumen */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Resumen del Plan</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Monto Total:</span>
                        <span className="font-medium">
                          S/. {(selectedPaymentOrder.amountCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Número de Cuotas:</span>
                        <span className="font-medium">{numberOfInstallments}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                        <span className="text-blue-700 font-medium">Monto por Cuota:</span>
                        <span className="font-bold text-blue-800">
                          S/. {(calculateInstallmentAmount() / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Motivo/Notas */}
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={createReason}
                    onChange={(e) => setCreateReason(e.target.value)}
                    placeholder="Agregue notas sobre este fraccionamiento..."
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedPaymentOrder(null);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !selectedPaymentOrder || !firstDueDate}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Fraccionamiento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de prórroga */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Prorrogar Cuotas
            </DialogTitle>
            <DialogDescription>
              Agregue días adicionales a las fechas de vencimiento de las cuotas pendientes.
            </DialogDescription>
          </DialogHeader>

          {extendPlan && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Caso:</span><span className="font-medium">{extendPlan.case.code}</span></div>
                  <div className="flex justify-between"><span>Solicitante:</span><span className="font-medium">{extendPlan.requestedBy.name}</span></div>
                  <div className="flex justify-between"><span>Plan:</span><span className="font-medium">{extendPlan.numberOfInstallments} cuotas</span></div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Cuota a prorrogar</Label>
                <Select value={extendInstallmentId} onValueChange={setExtendInstallmentId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las cuotas pendientes/vencidas</SelectItem>
                    {extendPlan.installments
                      .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
                      .map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          Cuota {i.installmentNumber} — S/. {(i.amountCents / 100).toFixed(2)} — vence {new Date(i.dueAt).toLocaleDateString("es-PE")}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Días a agregar *</Label>
                <Select value={extendDays.toString()} onValueChange={(v) => setExtendDays(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="45">45 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motivo de la prórroga</Label>
                <Textarea
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="Ej: Solicitud de la parte por dificultades económicas..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleExtend}
              disabled={isSubmitting || !extendDays}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>
              ) : (
                <><CalendarClock className="mr-2 h-4 w-4" />Aplicar Prórroga</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de configuración */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Fraccionamientos
            </DialogTitle>
            <DialogDescription>
              Configure las opciones de fraccionamiento de pagos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Solicitudes por Partes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que las partes del caso soliciten fraccionamientos de pago
                    </p>
                  </div>
                  <Switch
                    checked={partyRequestsEnabled}
                    onCheckedChange={handleTogglePartyRequests}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Información</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>
                    Los administradores siempre pueden crear fraccionamientos directamente
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>
                    Las solicitudes de partes requieren aprobación del administrador
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>
                    Desactivar esta opción no afecta a fraccionamientos existentes
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
