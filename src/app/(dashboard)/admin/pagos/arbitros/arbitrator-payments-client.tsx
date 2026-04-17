"use client";

/**
 * CAARD - Cliente de Pagos a Árbitros
 */

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calculator,
  Loader2,
  Eye,
  Download,
  Building2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ArbitratorPayment {
  id: string;
  caseId: string;
  arbitratorId: string;
  arbitratorUserId: string;
  concept: string;
  description: string | null;
  taxpayerType: string;
  arbitratorRuc: string | null;
  grossAmountCents: number;
  currency: string;
  igvCents: number;
  igvRate: number;
  retencion4taCents: number;
  retencion4taRate: number;
  retencion4taApplied: boolean;
  detractionCents: number;
  detractionRate: number;
  detractionApplied: boolean;
  totalDeductionsCents: number;
  netPaymentCents: number;
  status: string;
  issuedAt: Date;
  dueAt: Date | null;
  paidAt: Date | null;
  reciboHonorariosNumber: string | null;
  case?: { id: string; code: string; title: string | null };
  arbitratorUser?: { id: string; name: string | null; email: string };
}

interface Arbitrator {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
}

interface Case {
  id: string;
  code: string;
  title: string | null;
}

interface Props {
  payments: ArbitratorPayment[];
  arbitrators: Arbitrator[];
  cases: Case[];
}

const STATUS_CONFIG = {
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  CONFIRMED: { label: "Confirmado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  FAILED: { label: "Fallido", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const TAXPAYER_TYPE_CONFIG = {
  PERSONA_NATURAL: { label: "Persona Natural", description: "Retención 4ta categoría" },
  PERSONA_JURIDICA: { label: "Persona Jurídica", description: "Con IGV" },
  NO_DOMICILIADO: { label: "No Domiciliado", description: "Retención 30%" },
};

export function ArbitratorPaymentsClient({
  payments,
  arbitrators,
  cases,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ArbitratorPayment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    caseId: "",
    arbitratorId: "",
    concept: "HONORARIOS_CASO",
    description: "",
    grossAmount: 0,
    taxpayerType: "PERSONA_NATURAL",
    arbitratorRuc: "",
    bankAccountNumber: "",
    bankName: "",
  });

  // Calculated taxes preview
  const [taxPreview, setTaxPreview] = useState<{
    igv: number;
    retencion4ta: number;
    detraction: number;
    netPayment: number;
  } | null>(null);

  const calculateTaxPreview = (amount: number, taxpayerType: string, voucherType?: string) => {
    if (amount <= 0) {
      setTaxPreview(null);
      return;
    }
    // amount viene en soles, trabajamos en céntimos para precisión
    const amountCents = Math.round(amount * 100);
    let igv = 0;
    let retencion4ta = 0;
    let detraction = 0;
    let netPayment = amountCents;

    // ---- RHE (Recibo por Honorarios Electrónico) - Persona Natural 4ta categoría ----
    // Base imponible = monto (no hay IGV)
    // Retención 4ta: 8% solo si MONTO > S/. 1,500 (art. 74 LIR)
    // No hay detracción para RHE
    if (taxpayerType === "PERSONA_NATURAL" || voucherType === "RHE") {
      if (amountCents > 150000) {
        retencion4ta = Math.round(amountCents * 0.08);
      }
      netPayment = amountCents - retencion4ta;
    }

    // ---- FACTURA - Persona Jurídica con IGV ----
    // El "amount" ingresado es la BASE IMPONIBLE (sin IGV)
    // IGV = 18% de la base
    // Total factura = base + IGV
    // Detracción 12% sobre TOTAL (con IGV) si > S/. 700 en servicios empresariales
    else if (taxpayerType === "PERSONA_JURIDICA" || voucherType === "FACTURA") {
      const base = amountCents;
      igv = Math.round(base * 0.18);
      const totalFactura = base + igv;
      // Detracción aplica sobre el TOTAL con IGV si es > S/. 700
      if (totalFactura > 70000) {
        detraction = Math.round(totalFactura * 0.12);
      }
      // Neto a transferir al proveedor = total - detracción (la detracción va a SUNAT)
      netPayment = totalFactura - detraction;
    }

    // ---- NO DOMICILIADO ----
    // Retención 30% sobre el total
    else if (taxpayerType === "NO_DOMICILIADO") {
      retencion4ta = Math.round(amountCents * 0.30);
      netPayment = amountCents - retencion4ta;
    }

    setTaxPreview({
      igv: igv / 100,
      retencion4ta: retencion4ta / 100,
      detraction: detraction / 100,
      netPayment: netPayment / 100,
    });
  };

  const handleCreatePayment = async () => {
    if (!formData.caseId || !formData.arbitratorId || formData.grossAmount <= 0) {
      setError("Complete todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/arbitrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: formData.caseId,
          arbitratorId: formData.arbitratorId,
          concept: formData.concept,
          description: formData.description || null,
          grossAmountCents: Math.round(formData.grossAmount * 100),
          taxpayerType: formData.taxpayerType,
          arbitratorRuc: formData.arbitratorRuc || null,
          bankAccountNumber: formData.bankAccountNumber || null,
          bankName: formData.bankName || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear pago");
      }

      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.case?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.arbitratorUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.concept.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalPending = payments.filter((p) => p.status === "PENDING").length;
  const totalPendingAmount = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.netPaymentCents, 0) / 100;
  const totalPaid = payments.filter((p) => p.status === "CONFIRMED").length;
  const totalRetentions = payments.reduce((sum, p) => sum + p.retencion4taCents, 0) / 100;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pagos a Árbitros</h1>
          <p className="text-muted-foreground">
            Gestión de honorarios con retenciones y detracciones
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pago
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{totalPending}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              S/. {totalPendingAmount.toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{totalPaid}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Retenciones 4ta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">S/. {totalRetentions.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              A declarar a SUNAT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Árbitros Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{arbitrators.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por caso, árbitro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="CONFIRMED">Confirmados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caso</TableHead>
                <TableHead>Árbitro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Retención</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const statusConfig = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">{payment.case?.code}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {payment.case?.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{payment.arbitratorUser?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.arbitratorRuc && `RUC: ${payment.arbitratorRuc}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TAXPAYER_TYPE_CONFIG[payment.taxpayerType as keyof typeof TAXPAYER_TYPE_CONFIG]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {payment.currency} {(payment.grossAmountCents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {payment.retencion4taApplied && (
                        <>- {payment.currency} {(payment.retencion4taCents / 100).toFixed(2)}</>
                      )}
                      {payment.detractionApplied && (
                        <div className="text-orange-600">
                          Det: - {payment.currency} {(payment.detractionCents / 100).toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {payment.currency} {(payment.netPaymentCents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(payment.issuedAt).toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontraron pagos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#D66829]" />
              Nuevo Pago a Árbitro
            </DialogTitle>
            <DialogDescription>
              Registre un pago de honorarios. El sistema calculará automáticamente las retenciones aplicables.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Caso *</Label>
                <Select
                  value={formData.caseId}
                  onValueChange={(v) => setFormData({ ...formData, caseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un caso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} - {c.title || "Sin título"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Árbitro *</Label>
                <Select
                  value={formData.arbitratorId}
                  onValueChange={(v) => setFormData({ ...formData, arbitratorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un árbitro" />
                  </SelectTrigger>
                  <SelectContent>
                    {arbitrators.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.user.name || a.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Comprobante *</Label>
                <Select
                  value={formData.taxpayerType}
                  onValueChange={(v) => {
                    setFormData({ ...formData, taxpayerType: v });
                    calculateTaxPreview(formData.grossAmount, v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONA_NATURAL">
                      <div>
                        <div>Recibo por Honorarios (RHE)</div>
                        <div className="text-xs text-muted-foreground">Persona natural · monto - retención 8% = neto</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="PERSONA_JURIDICA">
                      <div>
                        <div>Factura (Persona Jurídica)</div>
                        <div className="text-xs text-muted-foreground">Persona jurídica · monto + IGV 18%</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="NO_DOMICILIADO">
                      <div>
                        <div>No domiciliado</div>
                        <div className="text-xs text-muted-foreground">Retención 30%</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.taxpayerType === "PERSONA_JURIDICA" ? "Monto sin IGV (S/.) *" : "Monto honorarios (S/.) *"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.grossAmount || ""}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, grossAmount: amount });
                    calculateTaxPreview(amount, formData.taxpayerType);
                  }}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>RUC del Árbitro</Label>
                <Input
                  value={formData.arbitratorRuc}
                  onChange={(e) => setFormData({ ...formData, arbitratorRuc: e.target.value })}
                  placeholder="20123456789"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del pago..."
                  rows={2}
                />
              </div>
            </div>

            {/* Tax Preview */}
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Cálculo de Impuestos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {taxPreview ? (
                    <>
                      {formData.taxpayerType === "PERSONA_JURIDICA" ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base imponible:</span>
                            <span className="font-medium">S/. {formData.grossAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IGV (18%):</span>
                            <span className="text-blue-600">+ S/. {taxPreview.igv.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold border-t pt-1">
                            <span>Total Factura:</span>
                            <span>S/. {(formData.grossAmount + taxPreview.igv).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monto honorarios:</span>
                          <span className="font-medium">S/. {formData.grossAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {taxPreview.retencion4ta > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Retención {formData.taxpayerType === "NO_DOMICILIADO" ? "no domiciliado (30%)" : "4ta categoría (8%)"}:
                          </span>
                          <span className="text-red-600">- S/. {taxPreview.retencion4ta.toFixed(2)}</span>
                        </div>
                      )}

                      {taxPreview.detraction > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Detracción 12% (va a SUNAT):</span>
                          <span className="text-orange-600">- S/. {taxPreview.detraction.toFixed(2)}</span>
                        </div>
                      )}

                      <hr />

                      <div className="flex justify-between text-lg font-bold">
                        <span>
                          {formData.taxpayerType === "PERSONA_JURIDICA"
                            ? "CAARD paga al árbitro:"
                            : "CAARD paga al árbitro (neto):"}
                        </span>
                        <span className="text-green-600">S/. {taxPreview.netPayment.toFixed(2)}</span>
                      </div>

                      {formData.taxpayerType === "PERSONA_JURIDICA" && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          (Factura: base {formData.grossAmount.toFixed(2)} + IGV {taxPreview.igv.toFixed(2)}
                          {taxPreview.detraction > 0 ? ` - Detracción ${taxPreview.detraction.toFixed(2)}` : ""})
                        </div>
                      )}
                      {formData.taxpayerType === "PERSONA_NATURAL" && taxPreview.retencion4ta > 0 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          (RHE: honorarios {formData.grossAmount.toFixed(2)} - retención {taxPreview.retencion4ta.toFixed(2)})
                        </div>
                      )}

                      {formData.taxpayerType === "PERSONA_NATURAL" && (
                        <Alert className="mt-2">
                          <FileText className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            El árbitro debe emitir Recibo por Honorarios electrónico.
                            Los honorarios de personas naturales NO están gravados con IGV.
                          </AlertDescription>
                        </Alert>
                      )}

                      {formData.taxpayerType === "PERSONA_JURIDICA" && taxPreview.detraction > 0 && (
                        <Alert className="mt-2">
                          <Building2 className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Debe depositar la detracción en la cuenta del Banco de la Nación
                            del proveedor antes de pagar.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Ingrese el monto para ver el cálculo de impuestos
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Cuenta Bancaria del Árbitro</Label>
                <Input
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder="Número de cuenta"
                />
              </div>

              <div className="space-y-2">
                <Label>Banco</Label>
                <Select
                  value={formData.bankName}
                  onValueChange={(v) => setFormData({ ...formData, bankName: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BCP">BCP</SelectItem>
                    <SelectItem value="BBVA">BBVA</SelectItem>
                    <SelectItem value="Interbank">Interbank</SelectItem>
                    <SelectItem value="Scotiabank">Scotiabank</SelectItem>
                    <SelectItem value="BanBif">BanBif</SelectItem>
                    <SelectItem value="Banco de la Nación">Banco de la Nación</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePayment} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Crear Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Pago</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Caso:</span>
                    <span className="font-medium">{selectedPayment.case?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Árbitro:</span>
                    <span className="font-medium">{selectedPayment.arbitratorUser?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RUC:</span>
                    <span>{selectedPayment.arbitratorRuc || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <Badge variant="outline">
                      {TAXPAYER_TYPE_CONFIG[selectedPayment.taxpayerType as keyof typeof TAXPAYER_TYPE_CONFIG]?.label}
                    </Badge>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto Bruto:</span>
                    <span className="font-medium">
                      {selectedPayment.currency} {(selectedPayment.grossAmountCents / 100).toFixed(2)}
                    </span>
                  </div>
                  {selectedPayment.igvCents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGV ({(selectedPayment.igvRate * 100).toFixed(0)}%):</span>
                      <span className="text-blue-600">
                        {selectedPayment.currency} {(selectedPayment.igvCents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedPayment.retencion4taApplied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Retención 4ta ({(selectedPayment.retencion4taRate * 100).toFixed(0)}%):
                      </span>
                      <span className="text-red-600">
                        - {selectedPayment.currency} {(selectedPayment.retencion4taCents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedPayment.detractionApplied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Detracción ({(selectedPayment.detractionRate * 100).toFixed(0)}%):
                      </span>
                      <span className="text-orange-600">
                        - {selectedPayment.currency} {(selectedPayment.detractionCents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Neto a Pagar:</span>
                    <span className="text-green-600">
                      {selectedPayment.currency} {(selectedPayment.netPaymentCents / 100).toFixed(2)}
                    </span>
                  </div>
                  {selectedPayment.reciboHonorariosNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recibo por Honorarios:</span>
                      <span>{selectedPayment.reciboHonorariosNumber}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Registrado: {new Date(selectedPayment.issuedAt).toLocaleString("es-PE")}
                </span>
                {selectedPayment.paidAt && (
                  <span className="text-sm text-green-600">
                    Pagado: {new Date(selectedPayment.paidAt).toLocaleString("es-PE")}
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
