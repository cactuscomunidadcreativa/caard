/**
 * CAARD - Cliente de Administración de Pagos
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Copy,
  ExternalLink,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Send,
  Plus,
  Split,
  Trash2,
} from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface InstallmentInfo {
  id: string;
  number: number;
  status: string;
  amountCents: number;
  dueAt: string;
  paidAt: string | null;
}

interface InstallmentPlan {
  id: string;
  status: string;
  numberOfInstallments: number;
  paidInstallments: number;
  installments: InstallmentInfo[];
}

interface PaymentOrder {
  id: string;
  concept: string | null;
  description: string | null;
  totalCents: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  caseCode: string | null;
  caseId: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  installmentPlan?: InstallmentPlan | null;
}

interface Payment {
  id: string;
  provider: string;
  status: string;
  currency: string;
  amountCents: number;
  concept: string | null;
  paidAt: string | null;
  createdAt: string;
  caseCode: string | null;
  culqiChargeId: string | null;
}

interface Stats {
  pendingOrders: number;
  paidOrders: number;
  totalCollected: number;
  paymentsThisMonth: number;
}

interface PaymentsPageClientProps {
  paymentOrders: PaymentOrder[];
  payments: Payment[];
  stats: Stats;
}

// Formatear moneda
function formatCurrency(amount: number, currency: string = "PEN"): string {
  const value = amount / 100;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(value);
}

// Mapeo de conceptos
const CONCEPT_LABELS: Record<string, string> = {
  REGISTRO: "Tasa de Registro",
  ARBITRAJE: "Gastos de Arbitraje",
  HONORARIOS: "Honorarios",
  ADMINISTRACION: "Gastos Admin.",
  DEPOSITO: "Depósito",
  OTROS: "Otros",
};

// Status badges
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    PENDING: { label: "Pendiente", variant: "outline", icon: Clock },
    PAID: { label: "Pagado", variant: "default", icon: CheckCircle },
    CANCELLED: { label: "Cancelado", variant: "destructive", icon: XCircle },
    CONFIRMED: { label: "Confirmado", variant: "default", icon: CheckCircle },
    FAILED: { label: "Fallido", variant: "destructive", icon: AlertCircle },
  };

  const { label, variant, icon: Icon } = config[status] || { label: status, variant: "secondary", icon: AlertCircle };

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function PaymentsPageClient({
  paymentOrders,
  payments,
  stats,
}: PaymentsPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [installmentDetail, setInstallmentDetail] = useState<PaymentOrder | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<PaymentOrder | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteOrder) return;
    setIsDeleting(true);
    try {
      const reason = deleteReason.trim() || "Eliminado desde panel de pagos";
      const res = await fetch(
        `/api/payment-orders/${deleteOrder.id}?reason=${encodeURIComponent(reason)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "No se pudo cancelar la orden");
      }
      toast.success("Orden anulada correctamente");
      setDeleteOrder(null);
      setDeleteReason("");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar órdenes
  const filteredOrders = paymentOrders.filter((order) => {
    const matchesSearch =
      order.caseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.createdByEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtrar pagos
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.caseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.culqiChargeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Copiar link de pago
  const copyPaymentLink = (orderId: string) => {
    const link = `${window.location.origin}/pago/${orderId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de pago copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            Administra órdenes de pago y visualiza el historial de transacciones
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pagos/nueva-orden">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden de Pago
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Esperando pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidOrders}</div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#D66829]">
              {formatCurrency(stats.totalCollected, "PEN")}
            </div>
            <p className="text-xs text-muted-foreground">Histórico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos este mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paymentsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Transacciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por expediente, email o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="PAID">Pagados</SelectItem>
            <SelectItem value="CANCELLED">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders" className="gap-2">
            <Receipt className="h-4 w-4" />
            Órdenes de Pago
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Historial de Pagos
          </TabsTrigger>
        </TabsList>

        {/* Órdenes de Pago */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de Pago</CardTitle>
              <CardDescription>
                Lista de órdenes de pago generadas. Comparte el link de pago con los usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID / Expediente</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron órdenes de pago
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const hasPlan = !!order.installmentPlan;
                      return (
                      <TableRow
                        key={order.id}
                        className={hasPlan ? "cursor-pointer hover:bg-muted/30" : ""}
                        onClick={hasPlan ? () => setInstallmentDetail(order) : undefined}
                      >
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                            {order.caseCode && (
                              <p className="text-xs text-muted-foreground">{order.caseCode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">
                                {CONCEPT_LABELS[order.concept || ""] || order.concept || "Sin concepto"}
                              </p>
                              {hasPlan && (
                                <Badge variant="outline" className="gap-1 text-blue-700 border-blue-300 bg-blue-50">
                                  <Split className="h-3 w-3" />
                                  {order.installmentPlan!.paidInstallments}/
                                  {order.installmentPlan!.numberOfInstallments} cuotas
                                </Badge>
                              )}
                            </div>
                            {order.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {order.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {formatCurrency(order.totalCents, order.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString("es-PE")}
                            </p>
                            {order.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                Vence: {new Date(order.dueDate).toLocaleDateString("es-PE")}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {hasPlan && (
                                <DropdownMenuItem onClick={() => setInstallmentDetail(order)}>
                                  <Split className="h-4 w-4 mr-2" />
                                  Ver fraccionamiento
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => copyPaymentLink(order.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar link de pago
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/pago/${order.id}`} target="_blank">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Abrir página de pago
                                </Link>
                              </DropdownMenuItem>
                              {order.status === "PENDING" && (
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar recordatorio
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/pagos/${order.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                              {order.status !== "PAID" && order.status !== "CANCELLED" && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => setDeleteOrder(order)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Anular orden
                                </DropdownMenuItem>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de Pagos */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                Todos los pagos procesados a través de Culqi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Culqi</TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron pagos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">
                          {payment.culqiChargeId?.slice(0, 12) || "-"}...
                        </TableCell>
                        <TableCell>
                          {payment.caseCode || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {CONCEPT_LABELS[payment.concept || ""] || payment.concept || "-"}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-green-600">
                          {formatCurrency(payment.amountCents, payment.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} />
                        </TableCell>
                        <TableCell>
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString("es-PE", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Detalle de fraccionamiento */}
      <Dialog open={!!installmentDetail} onOpenChange={(v) => !v && setInstallmentDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Split className="h-5 w-5 text-blue-600" />
              Detalle del Fraccionamiento
            </DialogTitle>
            <DialogDescription>
              {installmentDetail?.caseCode ? `Expediente ${installmentDetail.caseCode}` : ""}
              {" — "}
              {installmentDetail
                ? `${installmentDetail.installmentPlan?.paidInstallments ?? 0}/${installmentDetail.installmentPlan?.numberOfInstallments ?? 0} cuotas pagadas`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {installmentDetail?.installmentPlan && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm bg-muted/50 rounded-lg p-3">
                <span className="text-muted-foreground">Monto total</span>
                <span className="font-bold">
                  {formatCurrency(installmentDetail.totalCents, installmentDetail.currency)}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {installmentDetail.installmentPlan.installments.map((inst) => (
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
                      <span className="font-medium text-sm">Cuota {inst.number}</span>
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
                      {formatCurrency(inst.amountCents, installmentDetail.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence: {new Date(inst.dueAt).toLocaleDateString("es-PE")}
                    </p>
                    {inst.paidAt && (
                      <p className="text-xs text-green-600">
                        Pagado: {new Date(inst.paidAt).toLocaleDateString("es-PE")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallmentDetail(null)}>
              Cerrar
            </Button>
            <Button asChild>
              <Link href="/admin/pagos/fraccionamientos">Ir a Fraccionamientos</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar anulación */}
      <Dialog open={!!deleteOrder} onOpenChange={(v) => !v && setDeleteOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Anular Orden de Pago
            </DialogTitle>
            <DialogDescription>
              Esta acción marcará la orden como cancelada. No se puede deshacer fácilmente.
            </DialogDescription>
          </DialogHeader>
          {deleteOrder && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Expediente:</span>
                  <span className="font-medium">{deleteOrder.caseCode || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span className="font-bold">
                    {formatCurrency(deleteOrder.totalCents, deleteOrder.currency)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Motivo de la anulación</label>
                <Input
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ej: Orden duplicada, pagado por otro medio..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOrder(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Anulando..." : "Sí, anular orden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
