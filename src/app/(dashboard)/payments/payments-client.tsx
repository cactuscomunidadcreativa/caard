"use client";

/**
 * CAARD - Cliente de Pagos
 * Interfaz completa para gestión de pagos
 */

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Upload,
  Calendar,
  Building2,
  User,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { Role, PaymentStatus } from "@prisma/client";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Roles con acceso administrativo
const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];

// Configuración de estados de pago
const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, {
  label: string;
  color: string;
  icon: any;
}> = {
  REQUIRED: {
    label: "Requerido",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
  PENDING: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmado",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Fallido",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: XCircle,
  },
  OVERDUE: {
    label: "Vencido",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertTriangle,
  },
  REFUNDED: {
    label: "Reembolsado",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: RefreshCw,
  },
};

interface Payment {
  id: string;
  caseId: string;
  provider: string;
  status: PaymentStatus;
  currency: string;
  amountCents: number;
  concept: string;
  description: string | null;
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  case: {
    id: string;
    code: string;
    title: string | null;
    claimantName: string | null;
    respondentName: string | null;
  };
  voucherDocument: {
    id: string;
    originalFileName: string;
    driveWebViewLink: string | null;
  } | null;
}

interface PaymentsClientProps {
  payments: Payment[];
  stats: {
    total: number;
    pending: number;
    required: number;
    confirmed: number;
    overdue: number;
    failed: number;
    totalAmountPending: number;
    totalAmountConfirmed: number;
  };
  userRole: Role;
}

// Formatear monto
function formatAmount(cents: number, currency: string = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// Formatear fecha
function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PaymentsClient({ payments, stats, userRole }: PaymentsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);

  const isAdmin = ADMIN_ROLES.includes(userRole);

  // Filtrar pagos
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      search === "" ||
      payment.concept.toLowerCase().includes(search.toLowerCase()) ||
      payment.case.code.toLowerCase().includes(search.toLowerCase()) ||
      (payment.case.title?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Título según rol
  const getPageTitle = () => {
    if (isAdmin) return "Gestión de Pagos";
    if (userRole === "ARBITRO") return "Mis Honorarios";
    return "Mis Pagos Pendientes";
  };

  const getPageDescription = () => {
    if (isAdmin) return "Administra todos los pagos del sistema de arbitraje";
    if (userRole === "ARBITRO") return "Honorarios por tus casos asignados";
    return "Pagos pendientes en tus expedientes";
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getPageDescription()}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button className="bg-[#D66829] hover:bg-[#c45a22]">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Por Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-orange-600">
              {formatAmount(stats.totalAmountPending)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.pending + stats.required + stats.overdue} pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Cobrado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-green-600">
              {formatAmount(stats.totalAmountConfirmed)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.confirmed} pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-red-600">
              {stats.overdue}
            </p>
            <p className="text-xs text-muted-foreground">requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">pagos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por concepto o expediente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <SelectItem value="REQUIRED">Requerido</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="FAILED">Fallido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List - Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No hay pagos</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "No se encontraron pagos con los filtros aplicados"
                  : "No tienes pagos registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => {
            const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={payment.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">
                        {payment.concept}
                      </h3>
                      <Link
                        href={`/cases/${payment.caseId}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {payment.case.code}
                      </Link>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-[#D66829]">
                      {formatAmount(payment.amountCents, payment.currency)}
                    </span>
                    {payment.dueAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence: {formatDate(payment.dueAt)}
                      </span>
                    )}
                  </div>

                  {payment.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {payment.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {!isAdmin && ["REQUIRED", "PENDING", "OVERDUE"].includes(payment.status) && (
                      <Button size="sm" className="flex-1 bg-[#D66829] hover:bg-[#c45a22]">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar
                      </Button>
                    )}
                    {isAdmin && payment.status === "PENDING" && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Payments Table - Desktop */}
      <Card className="hidden lg:block">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg">Lista de Pagos</CardTitle>
          <CardDescription>
            {filteredPayments.length} de {payments.length} pagos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No hay pagos</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "No se encontraron pagos con los filtros aplicados"
                  : "No tienes pagos registrados"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
                    const StatusIcon = statusConfig.icon;
                    const isOverdue =
                      payment.dueAt &&
                      new Date(payment.dueAt) < new Date() &&
                      ["REQUIRED", "PENDING"].includes(payment.status);

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.concept}</p>
                            {payment.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {payment.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/cases/${payment.caseId}`}
                            className="text-blue-600 hover:underline font-mono text-sm"
                          >
                            {payment.case.code}
                          </Link>
                          {payment.case.title && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {payment.case.title}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-[#D66829]">
                            {formatAmount(payment.amountCents, payment.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {payment.dueAt ? (
                            <div className={isOverdue ? "text-red-600" : ""}>
                              <p className="text-sm">{formatDate(payment.dueAt)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(payment.dueAt), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.voucherDocument ? (
                            <a
                              href={payment.voucherDocument.driveWebViewLink || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              Ver
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              {!isAdmin &&
                                ["REQUIRED", "PENDING", "OVERDUE"].includes(
                                  payment.status
                                ) && (
                                  <>
                                    <DropdownMenuItem>
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Pagar ahora
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setShowVoucherDialog(true);
                                      }}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Subir voucher
                                    </DropdownMenuItem>
                                  </>
                                )}
                              {isAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  {payment.status === "PENDING" && (
                                    <DropdownMenuItem className="text-green-600">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Confirmar pago
                                    </DropdownMenuItem>
                                  )}
                                  {["REQUIRED", "PENDING"].includes(
                                    payment.status
                                  ) && (
                                    <DropdownMenuItem className="text-red-600">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Marcar fallido
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para subir voucher */}
      <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Comprobante de Pago</DialogTitle>
            <DialogDescription>
              Sube el comprobante de tu transferencia o depósito para que sea verificado
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedPayment.concept}</p>
                <p className="text-2xl font-bold text-[#D66829]">
                  {formatAmount(selectedPayment.amountCents, selectedPayment.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expediente: {selectedPayment.case.code}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher">Archivo del comprobante</Label>
                <Input id="voucher" type="file" accept="image/*,.pdf" />
                <p className="text-xs text-muted-foreground">
                  Formatos aceptados: PDF, JPG, PNG (máx. 5MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Número de operación, banco, etc."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoucherDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#D66829] hover:bg-[#c45a22]">
              <Upload className="h-4 w-4 mr-2" />
              Subir Comprobante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info para usuarios */}
      {!isAdmin && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Métodos de pago:</strong> Puedes realizar tus pagos mediante
              transferencia bancaria, depósito o pago en línea. Una vez realizado el pago,
              sube el comprobante para que sea verificado por la secretaría.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
