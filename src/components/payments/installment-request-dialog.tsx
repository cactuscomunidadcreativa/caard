"use client";

/**
 * CAARD - Diálogo para Solicitar Fraccionamiento de Pago
 */

import { useState } from "react";
import {
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Split,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface InstallmentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentOrder: {
    id: string;
    orderNumber: string;
    concept: string;
    totalCents: number;
    currency: string;
    caseCode: string;
  };
  onSuccess?: () => void;
}

export function InstallmentRequestDialog({
  open,
  onOpenChange,
  paymentOrder,
  onSuccess,
}: InstallmentRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [numberOfInstallments, setNumberOfInstallments] = useState(3);
  const [reason, setReason] = useState("");
  const [firstDueDate, setFirstDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split("T")[0];
  });

  const totalAmount = paymentOrder.totalCents / 100;
  const installmentAmount = Math.ceil(paymentOrder.totalCents / numberOfInstallments) / 100;

  const handleSubmit = async () => {
    if (!reason || reason.length < 20) {
      setError("Por favor explique el motivo del fraccionamiento (mínimo 20 caracteres)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/installments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentOrderId: paymentOrder.id,
          numberOfInstallments,
          reason,
          firstDueDate: new Date(firstDueDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar la solicitud");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setSuccess(false);
      setReason("");
      setNumberOfInstallments(3);
      onOpenChange(false);
    }
  };

  // Generar preview de cuotas
  const previewInstallments = [];
  for (let i = 0; i < numberOfInstallments; i++) {
    const dueDate = new Date(firstDueDate);
    dueDate.setDate(dueDate.getDate() + i * 30);
    const isLast = i === numberOfInstallments - 1;
    const amount = isLast
      ? totalAmount - installmentAmount * (numberOfInstallments - 1)
      : installmentAmount;
    previewInstallments.push({
      number: i + 1,
      amount: amount.toFixed(2),
      dueDate: dueDate.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5 text-[#D66829]" />
            Solicitar Fraccionamiento
          </DialogTitle>
          <DialogDescription>
            Solicite el fraccionamiento de la orden de pago. Un administrador revisará su solicitud.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Solicitud Enviada</h3>
            <p className="text-muted-foreground mb-4">
              Su solicitud de fraccionamiento ha sido enviada. Recibirá una notificación cuando sea revisada.
            </p>
            <Button onClick={handleClose}>Cerrar</Button>
          </div>
        ) : (
          <>
            {/* Info de la orden */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Orden:</span>
                  <span className="font-medium">{paymentOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Caso:</span>
                  <span className="font-medium">{paymentOrder.caseCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Concepto:</span>
                  <span className="font-medium">{paymentOrder.concept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="font-bold text-lg">
                    {paymentOrder.currency} {totalAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Número de cuotas */}
              <div className="space-y-2">
                <Label htmlFor="installments">Número de Cuotas</Label>
                <Select
                  value={numberOfInstallments.toString()}
                  onValueChange={(v) => setNumberOfInstallments(parseInt(v))}
                >
                  <SelectTrigger id="installments">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} cuotas ({paymentOrder.currency}{" "}
                        {(Math.ceil(paymentOrder.totalCents / n) / 100).toFixed(2)} c/u aprox.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha primera cuota */}
              <div className="space-y-2">
                <Label htmlFor="firstDue">Fecha Primera Cuota</Label>
                <Input
                  id="firstDue"
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo de la Solicitud *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explique el motivo por el cual solicita el fraccionamiento del pago..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 20 caracteres. {reason.length}/20
                </p>
              </div>

              {/* Preview de cuotas */}
              <div className="space-y-2">
                <Label>Cronograma de Cuotas (Estimado)</Label>
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Cuota</th>
                        <th className="text-left p-2">Vencimiento</th>
                        <th className="text-right p-2">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewInstallments.map((inst) => (
                        <tr key={inst.number} className="border-t">
                          <td className="p-2">{inst.number}ª</td>
                          <td className="p-2">{inst.dueDate}</td>
                          <td className="p-2 text-right font-medium">
                            {paymentOrder.currency} {inst.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || reason.length < 20}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Split className="mr-2 h-4 w-4" />
                    Solicitar Fraccionamiento
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
