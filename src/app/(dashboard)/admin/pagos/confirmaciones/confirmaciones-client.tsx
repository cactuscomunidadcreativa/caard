"use client";

/**
 * CAARD - Cliente de Confirmaciones de Pago
 * Componente cliente para revisar y aprobar/rechazar pagos
 */

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  User,
  Building2,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

interface Payment {
  id: string;
  paymentType: string;
  paymentOrderId: string | null;
  caseId: string | null;
  caseCode: string;
  caseTitle: string | null;
  concept: string;
  expectedAmountCents: number;
  receivedAmountCents: number;
  payerName: string;
  transactionRef: string | null;
  bankName: string | null;
  transactionDate: string | null;
  voucherUrl: string | null;
  notes: string | null;
  status: string;
  registeredBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  createdAt: string;
}

interface Props {
  payments: Payment[];
}

function formatAmount(cents: number): string {
  return `S/. ${(cents / 100).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: React.ReactNode;
    }
  > = {
    PENDING: {
      label: "Pendiente",
      variant: "secondary",
      icon: <Clock className="h-3 w-3" />,
    },
    IN_REVIEW: {
      label: "En Revision",
      variant: "default",
      icon: <Eye className="h-3 w-3" />,
    },
    APPROVED: {
      label: "Aprobado",
      variant: "outline",
      icon: <CheckCircle className="h-3 w-3 text-green-600" />,
    },
    REJECTED: {
      label: "Rechazado",
      variant: "destructive",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const { label, variant, icon } = variants[status] || {
    label: status,
    variant: "secondary" as const,
    icon: null,
  };

  return (
    <Badge variant={variant} className="whitespace-nowrap gap-1">
      {icon}
      {label}
    </Badge>
  );
}

export function ConfirmacionesClient({ payments }: Props) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPayments = payments.filter(
    (p) =>
      p.caseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.registeredBy.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setVerificationNotes("");
    setIsDialogOpen(true);
  };

  const handleVerify = async (approved: boolean) => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/payments/confirmations/${selectedPayment.id}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approved,
            notes: verificationNotes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al verificar el pago");
      }

      toast.success(
        approved ? "Pago aprobado correctamente" : "Pago rechazado"
      );
      setIsDialogOpen(false);
      // Recargar la pagina para actualizar la lista
      window.location.reload();
    } catch (error) {
      toast.error("Error al procesar la verificacion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            {t.sidebar.paymentConfirmations}
          </h1>
          <p className="text-muted-foreground">
            Revisa y aprueba las confirmaciones de pago pendientes
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredPayments.length} pendientes
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por expediente, concepto, pagador o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">
                No hay pagos pendientes de revision
              </h3>
              <p className="text-muted-foreground">
                Todos los pagos han sido procesados
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Pagador / Concepto</TableHead>
                    <TableHead className="text-right">Monto Esperado</TableHead>
                    <TableHead className="text-right">Monto Recibido</TableHead>
                    <TableHead>Datos Bancarios</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.caseId ? (
                          <Link
                            href={`/cases/${payment.caseId}`}
                            className="font-medium hover:underline"
                          >
                            {payment.caseCode}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.payerName}</div>
                        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {payment.concept}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(payment.expectedAmountCents)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatAmount(payment.receivedAmountCents)}
                        {payment.receivedAmountCents !== payment.expectedAmountCents && (
                          <div className={`text-xs ${
                            payment.receivedAmountCents > payment.expectedAmountCents
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            {payment.receivedAmountCents > payment.expectedAmountCents ? "+" : ""}
                            {formatAmount(payment.receivedAmountCents - payment.expectedAmountCents)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.bankName && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {payment.bankName}
                            </div>
                          )}
                          {payment.transactionRef && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              {payment.transactionRef}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">
                              {payment.registeredBy.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(payment.createdAt)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(payment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de revision */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Confirmacion de Pago</DialogTitle>
            <DialogDescription>
              Verifica los datos del pago y el comprobante antes de aprobar o
              rechazar
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Datos del pago */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Expediente</Label>
                  <div className="font-medium">{selectedPayment.caseCode}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pagador</Label>
                  <div className="font-medium">{selectedPayment.payerName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monto Esperado</Label>
                  <div className="font-mono">
                    {formatAmount(selectedPayment.expectedAmountCents)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monto Recibido</Label>
                  <div className="font-mono text-lg font-bold">
                    {formatAmount(selectedPayment.receivedAmountCents)}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Concepto</Label>
                  <div>{selectedPayment.concept}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Banco</Label>
                  <div>{selectedPayment.bankName || "-"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    N de Operacion
                  </Label>
                  <div className="font-mono">
                    {selectedPayment.transactionRef || "-"}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Fecha Transaccion
                  </Label>
                  <div>{formatDate(selectedPayment.transactionDate)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registrado por</Label>
                  <div>{selectedPayment.registeredBy.name}</div>
                </div>
              </div>

              {/* Voucher */}
              {selectedPayment.voucherUrl && (
                <div>
                  <Label className="text-muted-foreground">Comprobante</Label>
                  <div className="mt-2">
                    <a
                      href={selectedPayment.voucherUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver comprobante adjunto
                    </a>
                  </div>
                </div>
              )}

              {/* Notas del usuario */}
              {selectedPayment.notes && (
                <div>
                  <Label className="text-muted-foreground">
                    Notas del usuario
                  </Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {selectedPayment.notes}
                  </div>
                </div>
              )}

              {/* Notas de verificacion */}
              <div>
                <Label htmlFor="verificationNotes">
                  Notas de verificacion (opcional)
                </Label>
                <Textarea
                  id="verificationNotes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Agrega notas sobre la verificacion..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleVerify(false)}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button onClick={() => handleVerify(true)} disabled={isSubmitting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
