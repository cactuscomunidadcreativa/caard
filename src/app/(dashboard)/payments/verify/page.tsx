/**
 * Página: Verificación de Pagos
 * ==============================
 * Panel para verificar y confirmar pagos recibidos
 */

"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Upload,
  Loader2,
} from "lucide-react";

interface PendingPayment {
  id: string;
  orderNumber: string;
  caseCode: string;
  payer: string;
  amount: number;
  declaredAmount: number;
  paymentDate: string;
  paymentMethod: string;
  bankReference: string;
  voucherUrl?: string;
  status: string;
  submittedAt: string;
  discrepancy?: boolean;
}

export default function PaymentVerifyPage() {
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/payments?status=PENDING_VERIFICATION");
        if (res.ok) {
          const data = await res.json();
          const payments = (data.items || data.payments || []).map((p: any) => ({
            id: p.id,
            orderNumber: p.paymentOrder?.orderNumber || p.id.slice(0, 8),
            caseCode: p.paymentOrder?.case?.code || "—",
            payer: p.payerName || p.paymentOrder?.case?.claimantName || "—",
            amount: p.paymentOrder?.totalCents ? p.paymentOrder.totalCents / 100 : 0,
            declaredAmount: p.amountCents ? p.amountCents / 100 : 0,
            paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split("T")[0] : "",
            paymentMethod: p.method || "TRANSFERENCIA",
            bankReference: p.bankReference || "",
            voucherUrl: p.voucherUrl,
            status: p.status,
            submittedAt: p.createdAt || "",
            discrepancy: p.paymentOrder?.totalCents && p.amountCents ? p.paymentOrder.totalCents !== p.amountCents : false,
          }));
          setPendingPayments(payments);
        }

        // Fetch verified count
        const resVerified = await fetch("/api/payments?status=VERIFIED");
        if (resVerified.ok) {
          const dataV = await resVerified.json();
          setVerifiedCount((dataV.payments || dataV || []).length);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const handleVerify = () => {
    // TODO: Implementar verificación
    console.log("Verify:", { selectedPayment, verificationNotes });
    setShowVerifyDialog(false);
    setVerificationNotes("");
  };

  const handleReject = () => {
    // TODO: Implementar rechazo
    console.log("Reject:", { selectedPayment, rejectionReason });
    setShowRejectDialog(false);
    setRejectionReason("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingCount = pendingPayments.length;
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.declaredAmount, 0);
  const discrepancyCount = pendingPayments.filter(p => p.discrepancy).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verificación de Pagos</h1>
          <p className="text-muted-foreground">
            Revise y confirme los pagos declarados por las partes
          </p>
        </div>
      </div>

      {/* Alerta de Pendientes */}
      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  {pendingCount} pago(s) pendiente(s) de verificación
                </h3>
                <p className="text-sm text-amber-600">
                  Total por verificar: S/ {pendingTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Por Verificar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  S/ {pendingTotal.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Monto Pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={discrepancyCount > 0 ? "border-red-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${discrepancyCount > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                <AlertTriangle className={`h-6 w-6 ${discrepancyCount > 0 ? "text-red-600" : "text-gray-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${discrepancyCount > 0 ? "text-red-600" : ""}`}>
                  {discrepancyCount}
                </p>
                <p className="text-sm text-muted-foreground">Con Discrepancia</p>
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
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-sm text-muted-foreground">Verificados Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de orden, expediente o pagador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Pagos Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos Pendientes de Verificación</CardTitle>
          <CardDescription>
            Revise los comprobantes y confirme los pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Expediente</TableHead>
                <TableHead>Pagador</TableHead>
                <TableHead>Monto Orden</TableHead>
                <TableHead>Monto Declarado</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.map((payment) => (
                <TableRow key={payment.id} className={payment.discrepancy ? "bg-red-50" : ""}>
                  <TableCell className="font-mono font-medium">
                    {payment.orderNumber}
                  </TableCell>
                  <TableCell className="font-mono">
                    {payment.caseCode}
                  </TableCell>
                  <TableCell>{payment.payer}</TableCell>
                  <TableCell>
                    S/ {payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className={payment.discrepancy ? "text-red-600 font-bold" : ""}>
                      S/ {payment.declaredAmount.toLocaleString()}
                    </span>
                    {payment.discrepancy && (
                      <Badge variant="destructive" className="ml-2">
                        Diferencia
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {payment.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.paymentDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver voucher"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowVerifyDialog(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verificar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Verificación */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Pago</DialogTitle>
            <DialogDescription>
              Confirme que el pago ha sido recibido correctamente
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orden:</span>
                  <span className="font-mono font-medium">{selectedPayment.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagador:</span>
                  <span className="font-medium">{selectedPayment.payer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto declarado:</span>
                  <span className="font-bold">S/ {selectedPayment.declaredAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referencia bancaria:</span>
                  <span className="font-mono">{selectedPayment.bankReference}</span>
                </div>
              </div>

              {selectedPayment.discrepancy && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Atención:</strong> El monto declarado (S/ {selectedPayment.declaredAmount.toLocaleString()})
                    difiere del monto de la orden (S/ {selectedPayment.amount.toLocaleString()})
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas de verificación (opcional)</Label>
                <Textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Observaciones sobre la verificación..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVerify} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Verificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rechazo */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Pago</DialogTitle>
            <DialogDescription>
              Indique el motivo del rechazo del pago declarado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo del rechazo *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique por qué se rechaza este pago..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
