"use client";

/**
 * CAARD - Cliente de Liquidación de Gastos Arbitrales
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Plus,
  Download,
  Save,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Building2,
  Calculator,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

// Tipos
interface ArbitratorFee {
  id: string;
  arbitratorName: string;
  arbitratorId: string | null;
  netAmountCents: number;
  retentionRate: number;
  retentionCents: number;
  grossAmountCents: number;
  dteStatus: string;
  dtePaidAt: string | null;
  dteReceiptNumber: string | null;
  dteReceiptDate: string | null;
  ddoStatus: string;
  ddoPaidAt: string | null;
  ddoReceiptNumber: string | null;
  ddoReceiptDate: string | null;
  subrogationDte: boolean;
  subrogationDdo: boolean;
  subrogationDate: string | null;
  subrogationReceiptNumber: string | null;
}

interface AdminPayment {
  id: string;
  concept: string;
  description: string | null;
  baseAmountCents: number;
  igvRate: number;
  igvCents: number;
  totalCents: number;
  payer: string;
  status: string;
  paidAt: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
}

interface Liquidation {
  id: string;
  liquidationNumber: string;
  claimantName: string;
  respondentName: string;
  presentationFeeCents: number;
  presentationFeeIgvCents: number;
  presentationFeePaidAt: string | null;
  processStatus: string;
  awardDate: string | null;
  status: string;
  totalArbitratorFeesCents: number;
  totalAdminFeesCents: number;
  grandTotalCents: number;
  arbitratorFees: ArbitratorFee[];
  adminPayments: AdminPayment[];
  installmentPlan: any;
}

interface Case {
  id: string;
  code: string;
  title: string | null;
  claimantName: string | null;
  respondentName: string | null;
  status: string;
}

interface Arbitrator {
  id: string;
  name: string;
  userId: string | null;
}

interface Props {
  caso: Case;
  liquidation: Liquidation | null;
  arbitrators: Arbitrator[];
}

// Función para formatear montos
function formatAmount(cents: number): string {
  return `S/. ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

// Componente de estado de pago
function PaymentStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: "P", color: "bg-yellow-100 text-yellow-700" },
    PARTIAL: { label: "P.P", color: "bg-orange-100 text-orange-700" },
    PAID: { label: "P", color: "bg-green-500 text-white" },
    PENDING_CREDIT: { label: "F.A", color: "bg-red-500 text-white" },
    INVOICE_ISSUED: { label: "F.E", color: "bg-blue-100 text-blue-700" },
    RECEIPT_ISSUED: { label: "R.E", color: "bg-purple-100 text-purple-700" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
}

export function LiquidationClient({ caso, liquidation, arbitrators }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const [currentLiquidation, setCurrentLiquidation] = useState<Liquidation | null>(liquidation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isArbitratorDialogOpen, setIsArbitratorDialogOpen] = useState(false);
  const [isAdminPaymentDialogOpen, setIsAdminPaymentDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    claimantName: caso.claimantName || "",
    respondentName: caso.respondentName || "",
    presentationFee: 500,
    presentationFeeIgv: 90,
  });

  const [arbitratorForm, setArbitratorForm] = useState({
    arbitratorName: "",
    arbitratorId: "",
    netAmount: 0,
    retentionRate: 0.08,
  });

  const [adminPaymentForm, setAdminPaymentForm] = useState({
    concept: "",
    description: "",
    baseAmount: 0,
    igvRate: 0.18,
    payer: "DTE",
  });

  const [selectedPaymentItem, setSelectedPaymentItem] = useState<{
    type: "arbitrator" | "admin";
    id: string;
    party?: "DTE" | "DDO";
  } | null>(null);

  // Crear liquidación
  const handleCreateLiquidation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/liquidations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caso.id,
          claimantName: createForm.claimantName,
          respondentName: createForm.respondentName,
          presentationFeeCents: Math.round(createForm.presentationFee * 100),
          presentationFeeIgvCents: Math.round(createForm.presentationFeeIgv * 100),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear liquidación");
      }

      setIsCreateDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Agregar árbitro
  const handleAddArbitrator = async () => {
    if (!currentLiquidation) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/liquidations/${currentLiquidation.id}/arbitrator-fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arbitratorName: arbitratorForm.arbitratorName,
          arbitratorId: arbitratorForm.arbitratorId || undefined,
          netAmountCents: Math.round(arbitratorForm.netAmount * 100),
          retentionRate: arbitratorForm.retentionRate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar árbitro");
      }

      setIsArbitratorDialogOpen(false);
      setArbitratorForm({
        arbitratorName: "",
        arbitratorId: "",
        netAmount: 0,
        retentionRate: 0.08,
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Agregar gasto administrativo
  const handleAddAdminPayment = async () => {
    if (!currentLiquidation) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/liquidations/${currentLiquidation.id}/admin-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: adminPaymentForm.concept,
          description: adminPaymentForm.description || undefined,
          baseAmountCents: Math.round(adminPaymentForm.baseAmount * 100),
          igvRate: adminPaymentForm.igvRate,
          payer: adminPaymentForm.payer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar gasto");
      }

      setIsAdminPaymentDialogOpen(false);
      setAdminPaymentForm({
        concept: "",
        description: "",
        baseAmount: 0,
        igvRate: 0.18,
        payer: "DTE",
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (!currentLiquidation) return;

    try {
      const response = await fetch(`/api/liquidations/${currentLiquidation.id}/export`);

      if (!response.ok) {
        throw new Error("Error al exportar");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Liquidacion_${caso.code.replace(/\//g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Calcular retención en preview
  const retentionPreview = arbitratorForm.netAmount * arbitratorForm.retentionRate;
  const grossPreview = arbitratorForm.netAmount + retentionPreview;

  // Calcular IGV en preview
  const igvPreview = adminPaymentForm.baseAmount * adminPaymentForm.igvRate;
  const totalPreview = adminPaymentForm.baseAmount + igvPreview;

  // Si no hay liquidación, mostrar opción para crear
  if (!currentLiquidation) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>{t("liquidation.noLiquidation")}</CardTitle>
            <CardDescription>
              {t("liquidation.createFirst")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("liquidation.newLiquidation")}
            </Button>
          </CardContent>
        </Card>

        {/* Dialog para crear liquidación */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("liquidation.newLiquidation")}</DialogTitle>
              <DialogDescription>
                Configure la liquidación de gastos para el expediente {caso.code}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>{t("liquidation.claimant")} (DTE)</Label>
                <Input
                  value={createForm.claimantName}
                  onChange={(e) => setCreateForm({ ...createForm, claimantName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("liquidation.respondent")} (DDO)</Label>
                <Input
                  value={createForm.respondentName}
                  onChange={(e) => setCreateForm({ ...createForm, respondentName: e.target.value })}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("liquidation.presentationFee")} (S/.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.presentationFee}
                    onChange={(e) => setCreateForm({ ...createForm, presentationFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("liquidation.igv")} (S/.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.presentationFeeIgv}
                    onChange={(e) => setCreateForm({ ...createForm, presentationFeeIgv: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreateLiquidation} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("common.create")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{t("liquidation.title")}</h1>
          <p className="text-muted-foreground">
            {t("liquidation.subtitle")} - {caso.code}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            {t("liquidation.exportExcel")}
          </Button>
        </div>
      </div>

      {/* Partes */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("liquidation.claimant")} (DTE)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="font-medium">{currentLiquidation.claimantName}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("liquidation.respondent")} (DDO)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="font-medium">{currentLiquidation.respondentName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gastos Preliminares */}
      <Card>
        <CardHeader className="bg-[#D66829] text-white py-2">
          <CardTitle className="text-sm">{t("liquidation.preliminaryExpenses")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("liquidation.presentationFee")}</TableHead>
                <TableHead>DTE</TableHead>
                <TableHead>{t("liquidation.igv")}</TableHead>
                <TableHead>{t("liquidation.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  {formatAmount(currentLiquidation.presentationFeeCents)}
                </TableCell>
                <TableCell>
                  {formatAmount(currentLiquidation.presentationFeeCents)}
                </TableCell>
                <TableCell>
                  {formatAmount(currentLiquidation.presentationFeeIgvCents)}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge
                    status={currentLiquidation.presentationFeePaidAt ? "PAID" : "PENDING"}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Liquidación Principal */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Honorarios Arbitrales */}
        <Card>
          <CardHeader className="bg-[#0B2A5B] text-white py-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{t("liquidation.arbitratorFees")}</CardTitle>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsArbitratorDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("liquidation.addArbitrator")}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {currentLiquidation.arbitratorFees.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay honorarios registrados
              </p>
            ) : (
              <div className="space-y-4">
                {currentLiquidation.arbitratorFees.map((fee) => (
                  <div key={fee.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{fee.arbitratorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("liquidation.netAmount")}: {formatAmount(fee.netAmountCents)} + 8% ({formatAmount(fee.retentionCents)})
                        </p>
                      </div>
                      <p className="font-bold text-lg">
                        {formatAmount(fee.grossAmountCents)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span>DTE</span>
                        <PaymentStatusBadge status={fee.dteStatus} />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                        <span>DDO</span>
                        <PaymentStatusBadge status={fee.ddoStatus} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gastos Administrativos */}
        <Card>
          <CardHeader className="bg-[#0B2A5B] text-white py-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{t("liquidation.adminExpenses")}</CardTitle>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsAdminPaymentDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("liquidation.addAdminExpense")}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {currentLiquidation.adminPayments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay gastos registrados
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">IGV</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLiquidation.adminPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.concept}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.payer === "DTE" ? "Demandante" : payment.payer === "DDO" ? "Demandado" : "Ambos"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatAmount(payment.baseAmountCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatAmount(payment.igvCents)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(payment.totalCents)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Totales */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">{t("liquidation.arbitratorFees")}</p>
              <p className="text-xl font-bold">
                {formatAmount(currentLiquidation.totalArbitratorFeesCents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("liquidation.adminExpenses")}</p>
              <p className="text-xl font-bold">
                {formatAmount(currentLiquidation.totalAdminFeesCents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("liquidation.igv")}</p>
              <p className="text-xl font-bold">
                {formatAmount(
                  currentLiquidation.presentationFeeIgvCents +
                  currentLiquidation.adminPayments.reduce((s, p) => s + p.igvCents, 0)
                )}
              </p>
            </div>
            <div className="bg-[#0B2A5B] text-white rounded-lg p-2">
              <p className="text-sm opacity-80">{t("liquidation.totalAmount")}</p>
              <p className="text-2xl font-bold">
                {formatAmount(currentLiquidation.grandTotalCents)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm">{t("liquidation.legend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">P</Badge>
              <span>{t("liquidation.legendPaid")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-700">P.P</Badge>
              <span>{t("liquidation.legendPartialPayment")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500 text-white">F.A</Badge>
              <span>{t("liquidation.legendPendingCredit")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">I.R.</span>
              <span>{t("liquidation.legendIncomeTax")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">I.G.V.</span>
              <span>{t("liquidation.legendIgv")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">F.E</Badge>
              <span>{t("liquidation.legendInvoiceIssued")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700">R.E</Badge>
              <span>{t("liquidation.legendReceiptIssued")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">C/P</span>
              <span>{t("liquidation.legendPerParty")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">C/A</span>
              <span>{t("liquidation.legendPerArbitrator")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para agregar árbitro */}
      <Dialog open={isArbitratorDialogOpen} onOpenChange={setIsArbitratorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("liquidation.addArbitrator")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{t("liquidation.arbitrator")}</Label>
              {arbitrators.length > 0 ? (
                <Select
                  value={arbitratorForm.arbitratorId}
                  onValueChange={(v) => {
                    const arb = arbitrators.find(a => a.id === v);
                    setArbitratorForm({
                      ...arbitratorForm,
                      arbitratorId: v,
                      arbitratorName: arb?.name || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un árbitro" />
                  </SelectTrigger>
                  <SelectContent>
                    {arbitrators.map((arb) => (
                      <SelectItem key={arb.id} value={arb.id}>
                        {arb.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="manual">Ingresar manualmente...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={arbitratorForm.arbitratorName}
                  onChange={(e) => setArbitratorForm({ ...arbitratorForm, arbitratorName: e.target.value })}
                  placeholder="Nombre del árbitro"
                />
              )}
            </div>

            {arbitratorForm.arbitratorId === "manual" && (
              <div className="space-y-2">
                <Label>Nombre del Árbitro</Label>
                <Input
                  value={arbitratorForm.arbitratorName}
                  onChange={(e) => setArbitratorForm({ ...arbitratorForm, arbitratorName: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("liquidation.netAmount")} (S/.)</Label>
              <Input
                type="number"
                step="0.01"
                value={arbitratorForm.netAmount || ""}
                onChange={(e) => setArbitratorForm({ ...arbitratorForm, netAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("liquidation.retentionRate")} (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={(arbitratorForm.retentionRate * 100).toFixed(2)}
                onChange={(e) => setArbitratorForm({ ...arbitratorForm, retentionRate: parseFloat(e.target.value) / 100 || 0 })}
              />
            </div>

            {arbitratorForm.netAmount > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("liquidation.netAmount")}:</span>
                    <span>{formatAmount(arbitratorForm.netAmount * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("liquidation.retention")} ({(arbitratorForm.retentionRate * 100).toFixed(0)}%):</span>
                    <span>{formatAmount(retentionPreview * 100)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>{t("liquidation.grossAmount")} (c/parte):</span>
                    <span>{formatAmount(grossPreview * 100)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArbitratorDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddArbitrator} disabled={isLoading || !arbitratorForm.arbitratorName}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar gasto administrativo */}
      <Dialog open={isAdminPaymentDialogOpen} onOpenChange={setIsAdminPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("liquidation.addAdminExpense")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Concepto</Label>
              <Select
                value={adminPaymentForm.concept}
                onValueChange={(v) => setAdminPaymentForm({ ...adminPaymentForm, concept: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un concepto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gastos administrativos del centro">
                    Gastos administrativos del centro
                  </SelectItem>
                  <SelectItem value="Gastos por notificación física">
                    Gastos por notificación física
                  </SelectItem>
                  <SelectItem value="Gastos de pericias">
                    Gastos de pericias
                  </SelectItem>
                  <SelectItem value="Otros gastos">
                    Otros gastos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={adminPaymentForm.description}
                onChange={(e) => setAdminPaymentForm({ ...adminPaymentForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto Base (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={adminPaymentForm.baseAmount || ""}
                  onChange={(e) => setAdminPaymentForm({ ...adminPaymentForm, baseAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>IGV (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(adminPaymentForm.igvRate * 100).toFixed(2)}
                  onChange={(e) => setAdminPaymentForm({ ...adminPaymentForm, igvRate: parseFloat(e.target.value) / 100 || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pagador</Label>
              <Select
                value={adminPaymentForm.payer}
                onValueChange={(v) => setAdminPaymentForm({ ...adminPaymentForm, payer: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DTE">Demandante (DTE)</SelectItem>
                  <SelectItem value="DDO">Demandado (DDO)</SelectItem>
                  <SelectItem value="BOTH">Ambas partes (50/50)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {adminPaymentForm.baseAmount > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monto Base:</span>
                    <span>{formatAmount(adminPaymentForm.baseAmount * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGV ({(adminPaymentForm.igvRate * 100).toFixed(0)}%):</span>
                    <span>{formatAmount(igvPreview * 100)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatAmount(totalPreview * 100)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdminPaymentDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddAdminPayment} disabled={isLoading || !adminPaymentForm.concept}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
