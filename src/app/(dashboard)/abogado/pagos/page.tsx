/**
 * CAARD - Pagos del Abogado
 * Lista de pagos relacionados con casos del abogado
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default async function AbogadoPagosPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ABOGADO") {
    redirect("/login");
  }

  // Obtener casos del abogado
  const caseLawyers = await prisma.caseLawyer.findMany({
    where: {
      lawyerId: session.user.id,
      isActive: true,
    },
    include: {
      case: {
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  // Extraer todos los pagos de los casos (evitar duplicados)
  const seenPaymentIds = new Set<string>();
  const allPayments = caseLawyers.flatMap((cl) =>
    cl.case.payments
      .filter((payment) => {
        if (seenPaymentIds.has(payment.id)) return false;
        seenPaymentIds.add(payment.id);
        return true;
      })
      .map((payment) => ({
        ...payment,
        // Convertir centavos a monto
        amount: payment.amountCents / 100,
        caseCode: cl.case.code,
        caseTitle: cl.case.title,
        caseId: cl.case.id,
      }))
  );

  // Estadísticas
  const stats = {
    total: allPayments.length,
    pending: allPayments.filter((p) => p.status === "PENDING").length,
    paid: allPayments.filter((p) => p.status === "CONFIRMED").length,
    overdue: allPayments.filter(
      (p) => p.status === "PENDING" && p.dueAt && new Date(p.dueAt) < new Date()
    ).length,
    totalAmount: allPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    paidAmount: allPayments
      .filter((p) => p.status === "CONFIRMED")
      .reduce((sum, p) => sum + (p.amount || 0), 0),
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
      <div>
        <h1 className="text-3xl font-bold">Pagos</h1>
        <p className="text-muted-foreground">
          Estado de pagos de sus casos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            {stats.overdue > 0 && (
              <p className="text-xs text-red-500">{stats.overdue} vencido(s)</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              de {formatCurrency(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            Todos los pagos relacionados con sus casos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.concept}</p>
                      <p className="text-sm text-muted-foreground">
                        Caso: {payment.caseCode}
                      </p>
                      {payment.dueAt && (
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(payment.dueAt).toLocaleDateString("es-PE")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      {getStatusBadge(payment.status, payment.dueAt)}
                    </div>
                    <Link href={`/abogado/casos/${payment.caseId}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagos vencidos destacados */}
      {stats.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pagos Vencidos
            </CardTitle>
            <CardDescription className="text-red-600">
              Los siguientes pagos requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allPayments
                .filter(
                  (p) =>
                    p.status === "PENDING" &&
                    p.dueAt &&
                    new Date(p.dueAt) < new Date()
                )
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium">{payment.concept}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.caseCode} - Venció:{" "}
                        {new Date(payment.dueAt!).toLocaleDateString("es-PE")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-700">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
