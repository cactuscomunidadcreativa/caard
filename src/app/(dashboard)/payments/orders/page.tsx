/**
 * Página: Órdenes de Pago
 * ========================
 * Gestión de órdenes de pago del centro de arbitraje
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Filter,
  Download,
} from "lucide-react";

// Datos de ejemplo
const mockPaymentOrders = [
  {
    id: "1",
    orderNumber: "OP-2025-0001",
    caseCode: "ARB-2025-0001",
    concept: "TASA_ARBITRAL",
    description: "Tasa de administración - Primera cuota",
    amount: 15000,
    currency: "PEN",
    status: "PENDING",
    dueDate: "2025-02-01",
    createdAt: "2025-01-20",
    debtor: "Empresa ABC S.A.C.",
  },
  {
    id: "2",
    orderNumber: "OP-2025-0002",
    caseCode: "ARB-2025-0001",
    concept: "HONORARIOS_ARBITRO",
    description: "Honorarios del árbitro único - 50%",
    amount: 25000,
    currency: "PEN",
    status: "PAID",
    dueDate: "2025-01-25",
    createdAt: "2025-01-15",
    paidAt: "2025-01-24",
    debtor: "Empresa ABC S.A.C.",
  },
  {
    id: "3",
    orderNumber: "OP-2025-0003",
    caseCode: "ARB-2025-0002",
    concept: "GASTOS_ADMINISTRATIVOS",
    description: "Gastos de notificación y otros",
    amount: 500,
    currency: "PEN",
    status: "OVERDUE",
    dueDate: "2025-01-20",
    createdAt: "2025-01-10",
    debtor: "Tech Solutions Perú",
  },
  {
    id: "4",
    orderNumber: "OP-2025-0004",
    caseCode: "ARB-2024-0089",
    concept: "TASA_ARBITRAL",
    description: "Tasa de administración - Cuota final",
    amount: 10000,
    currency: "PEN",
    status: "CANCELLED",
    dueDate: "2025-01-30",
    createdAt: "2025-01-05",
    debtor: "Importaciones del Sur",
    cancellationReason: "Caso cerrado por desistimiento",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  PENDING: { label: "Pendiente", variant: "secondary", icon: Clock },
  PAID: { label: "Pagado", variant: "default", icon: CheckCircle },
  OVERDUE: { label: "Vencido", variant: "destructive", icon: AlertTriangle },
  CANCELLED: { label: "Anulado", variant: "outline", icon: XCircle },
  PARTIAL: { label: "Pago Parcial", variant: "secondary", icon: Clock },
};

const conceptLabels: Record<string, string> = {
  TASA_ARBITRAL: "Tasa Arbitral",
  HONORARIOS_ARBITRO: "Honorarios de Árbitro",
  GASTOS_ADMINISTRATIVOS: "Gastos Administrativos",
  HONORARIOS_SECRETARIA: "Honorarios de Secretaría",
  GASTOS_PERITAJE: "Gastos de Peritaje",
  OTROS: "Otros Conceptos",
};

export default function PaymentOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<typeof mockPaymentOrders[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredOrders = mockPaymentOrders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.caseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.debtor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingTotal = mockPaymentOrders
    .filter(o => o.status === "PENDING")
    .reduce((sum, o) => sum + o.amount, 0);

  const overdueTotal = mockPaymentOrders
    .filter(o => o.status === "OVERDUE")
    .reduce((sum, o) => sum + o.amount, 0);

  const paidTotal = mockPaymentOrders
    .filter(o => o.status === "PAID")
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Órdenes de Pago</h1>
          <p className="text-muted-foreground">
            Gestión de pagos y cobranzas del centro
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Emitido</p>
                <p className="text-xl font-bold">
                  S/ {mockPaymentOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-xl font-bold">
                  S/ {pendingTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencido</p>
                <p className="text-xl font-bold text-red-600">
                  S/ {overdueTotal.toLocaleString()}
                </p>
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
                <p className="text-sm text-muted-foreground">Recaudado</p>
                <p className="text-xl font-bold text-green-600">
                  S/ {paidTotal.toLocaleString()}
                </p>
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
                  placeholder="Buscar por número, expediente o deudor..."
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
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="CANCELLED">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Pago</CardTitle>
          <CardDescription>
            {filteredOrders.length} orden(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Orden</TableHead>
                <TableHead>Expediente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Deudor</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status]?.icon || Clock;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="font-mono">
                      {order.caseCode}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {conceptLabels[order.concept] || order.concept}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.debtor}</TableCell>
                    <TableCell className="font-medium">
                      S/ {order.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {order.dueDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[order.status]?.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[order.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Orden de Pago</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig[selectedOrder.status]?.variant} className="text-base px-3 py-1">
                  {statusConfig[selectedOrder.status]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Expediente</Label>
                  <p className="font-mono font-medium">{selectedOrder.caseCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Emisión</Label>
                  <p className="font-medium">{selectedOrder.createdAt}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Concepto</Label>
                <p className="font-medium">
                  {conceptLabels[selectedOrder.concept]} - {selectedOrder.description}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Deudor</Label>
                <p className="font-medium">{selectedOrder.debtor}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Monto</Label>
                  <p className="text-2xl font-bold">
                    S/ {selectedOrder.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Vencimiento</Label>
                  <p className="font-medium">{selectedOrder.dueDate}</p>
                </div>
              </div>

              {selectedOrder.status === "PAID" && selectedOrder.paidAt && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Pagado el:</strong> {selectedOrder.paidAt}
                  </p>
                </div>
              )}

              {selectedOrder.status === "CANCELLED" && (selectedOrder as any).cancellationReason && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    <strong>Motivo de anulación:</strong> {(selectedOrder as any).cancellationReason}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
            {selectedOrder?.status === "PENDING" && (
              <Button>
                Registrar Pago
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
