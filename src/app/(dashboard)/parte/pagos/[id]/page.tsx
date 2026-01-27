/**
 * CAARD - Detalle de Pago (Parte)
 * Página de detalle y pago para las partes
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Copy
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PagoDetallePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !["DEMANDANTE", "DEMANDADO"].includes(session.user.role || "")) {
    redirect("/login");
  }

  // Obtener el pago con verificación de que el usuario es miembro del caso
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      case: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  // Verificar que el usuario es parte del caso
  if (payment.case.members.length === 0) {
    redirect("/parte");
  }

  const formatCurrency = (amount: number, currency: string = "PEN") => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const isOverdue = payment.status === "PENDING" && payment.dueAt && new Date(payment.dueAt) < new Date();

  const getStatusInfo = () => {
    if (payment.status === "CONFIRMED") {
      return {
        badge: <Badge className="bg-green-100 text-green-700">Pagado</Badge>,
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        message: "Este pago ha sido completado exitosamente.",
      };
    }
    if (payment.status === "CANCELLED") {
      return {
        badge: <Badge variant="secondary">Cancelado</Badge>,
        icon: <AlertCircle className="h-12 w-12 text-gray-400" />,
        message: "Este pago ha sido cancelado.",
      };
    }
    if (isOverdue) {
      return {
        badge: <Badge variant="destructive">Vencido</Badge>,
        icon: <AlertCircle className="h-12 w-12 text-red-500" />,
        message: "Este pago está vencido. Por favor, realice el pago lo antes posible.",
      };
    }
    return {
      badge: <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>,
      icon: <Clock className="h-12 w-12 text-yellow-500" />,
      message: "Este pago está pendiente de realización.",
    };
  };

  const statusInfo = getStatusInfo();
  const amount = payment.amountCents / 100;

  // Datos bancarios de ejemplo (deberían venir de la configuración)
  const bankInfo = {
    banco: "Banco de la Nación",
    cuenta: "00-123-456789-0-12",
    cci: "018-123-00123456789012-34",
    titular: "Centro de Arbitraje CAARD",
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/parte/pagos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a pagos
          </Button>
        </Link>
      </div>

      {/* Estado del pago */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {statusInfo.icon}
            <div className="mt-4 mb-2">{statusInfo.badge}</div>
            <h2 className="text-2xl font-bold mb-2">
              {formatCurrency(amount, payment.currency)}
            </h2>
            <p className="text-muted-foreground">{statusInfo.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Detalles del pago */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles del Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Concepto</p>
              <p className="font-medium">{payment.concept}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Caso</p>
              <p className="font-medium">{payment.case.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className="font-medium">
                {formatCurrency(amount, payment.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de vencimiento</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {payment.dueAt
                  ? new Date(payment.dueAt).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Sin fecha límite"}
              </p>
            </div>
          </div>

          {payment.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                <p className="text-sm">{payment.description}</p>
              </div>
            </>
          )}

          {payment.paidAt && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha de pago</p>
                <p className="font-medium text-green-600">
                  {new Date(payment.paidAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instrucciones de pago (solo si está pendiente) */}
      {payment.status === "PENDING" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Instrucciones de Pago
            </CardTitle>
            <CardDescription>
              Realice la transferencia a la siguiente cuenta bancaria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Banco</p>
                  <p className="font-medium">{bankInfo.banco}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Número de cuenta</p>
                  <p className="font-mono font-medium">{bankInfo.cuenta}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Código interbancario (CCI)</p>
                  <p className="font-mono font-medium">{bankInfo.cci}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Titular</p>
                <p className="font-medium">{bankInfo.titular}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Importante:</strong> Incluya el número de caso{" "}
                <span className="font-mono bg-blue-100 px-1 rounded">
                  {payment.case.code}
                </span>{" "}
                en el concepto de la transferencia. Una vez realizado el pago,
                envíe el comprobante a través del sistema o al correo electrónico
                del centro.
              </p>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Subir Comprobante de Pago
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
