/**
 * CAARD - Gestión de Pagos (Staff)
 * Panel de pagos para personal del centro
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Download,
  Filter,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default async function StaffPagosPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "CENTER_STAFF") {
    redirect("/login");
  }

  const center = await prisma.center.findFirst({
    where: { code: "CAARD" },
  });

  if (!center) {
    redirect("/");
  }

  // Obtener todos los pagos del centro
  const payments = await prisma.payment.findMany({
    where: {
      case: {
        centerId: center.id,
      },
    },
    include: {
      case: {
        select: { id: true, code: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Estadísticas
  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    paid: payments.filter((p) => p.status === "CONFIRMED").length,
    overdue: payments.filter(
      (p) => p.status === "PENDING" && p.dueAt && new Date(p.dueAt) < new Date()
    ).length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amountCents || 0), 0) / 100,
    paidAmount: payments
      .filter((p) => p.status === "CONFIRMED")
      .reduce((sum, p) => sum + (p.amountCents || 0), 0) / 100,
    pendingAmount: payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + (p.amountCents || 0), 0) / 100,
  };

  const getStatusBadge = (status: string, dueAt: Date | null) => {
    if (status === "CONFIRMED") {
      return <Badge className="bg-green-100 text-green-700">Pagado</Badge>;
    }
    if (status === "CANCELLED") {
      return <Badge variant="secondary">Cancelado</Badge>;
    }
    if (dueAt && new Date(dueAt) < new Date()) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = "PEN") => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            Administre los pagos de casos arbitrales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Link href="/staff/pagos/nuevo">
            <Button>
              <CreditCard className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paid} pagos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} pagos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requieren seguimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0
                ? Math.round((stats.paid / stats.total) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paid} de {stats.total} pagos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Pagos</CardTitle>
              <CardDescription>
                Últimos 100 pagos registrados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Concepto</th>
                    <th className="pb-3 font-medium">Caso</th>
                    <th className="pb-3 font-medium">Monto</th>
                    <th className="pb-3 font-medium">Vencimiento</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="py-3">
                        <p className="font-medium">{payment.concept}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString("es-PE")}
                        </p>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/staff/expedientes/${payment.case.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {payment.case.code}
                        </Link>
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(payment.amountCents / 100, payment.currency)}
                      </td>
                      <td className="py-3 text-sm">
                        {payment.dueAt
                          ? new Date(payment.dueAt).toLocaleDateString("es-PE")
                          : "-"}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(payment.status, payment.dueAt)}
                      </td>
                      <td className="py-3">
                        <Link href={`/staff/pagos/${payment.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
