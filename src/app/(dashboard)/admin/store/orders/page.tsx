"use client";

/**
 * CAARD - Listado de Pedidos de la Tienda
 */

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Loader2,
  Eye,
  Package,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  totalCents: number;
  currency: string;
  status: string;
  createdAt: string;
  items: { title: string; quantity: number }[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  PAID: {
    label: "Pagado",
    className: "bg-green-100 text-green-700",
    icon: CreditCard,
  },
  SHIPPED: {
    label: "Enviado",
    className: "bg-blue-100 text-blue-700",
    icon: Truck,
  },
  DELIVERED: {
    label: "Entregado",
    className: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  REFUNDED: {
    label: "Reembolsado",
    className: "bg-gray-100 text-gray-700",
    icon: AlertCircle,
  },
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Error al cargar pedidos");
      const data = await res.json();
      setOrders(data.orders || data || []);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar pedidos");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      (o.orderNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerEmail || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = orders.length;
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const paid = orders.filter((o) => o.status === "PAID").length;
  const shipped = orders.filter((o) => o.status === "SHIPPED" || o.status === "DELIVERED").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2A5B]">Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total !== 1 ? "pedidos" : "pedido"} en total
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" /> Pagados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" /> Enviados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{shipped}</p>
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
                placeholder="Buscar por n\u00famero, cliente o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="SHIPPED">Enviado</SelectItem>
                <SelectItem value="DELIVERED">Entregado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Listado de Pedidos</CardTitle>
          <CardDescription>Gestiona los pedidos de la tienda</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {filtered.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No se encontraron pedidos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Los pedidos aparecer\u00e1n aqu\u00ed cuando los clientes realicen compras
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N\u00b0 Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    className: "bg-gray-100 text-gray-700",
                    icon: AlertCircle,
                  };
                  const StatusIcon = statusCfg.icon;
                  const date = new Date(order.createdAt);
                  const formattedDate = date.toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {order.customerName || "Sin nombre"}
                          </p>
                          {order.customerEmail && (
                            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {order.currency === "USD" ? "$" : "S/"}{" "}
                          {(order.totalCents / 100).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusCfg.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formattedDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/admin/store/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
