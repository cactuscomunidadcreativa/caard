"use client";

/**
 * CAARD - Cliente de Configuración de Impuestos
 */

import { useState } from "react";
import {
  Calculator,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  AlertTriangle,
  Info,
  FileText,
  Loader2,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TaxConfiguration {
  id: string;
  taxType: string;
  code: string;
  name: string;
  description: string | null;
  rate: number;
  minimumAmountCents: number | null;
  currency: string;
  appliesTo: string[];
  detractionAccountNumber: string | null;
  detractionBankCode: string | null;
  legalBasis: string | null;
  sunatCode: string | null;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
}

interface TaxConfigurationClientProps {
  configurations: TaxConfiguration[];
}

const TAX_TYPE_INFO = {
  IGV: {
    label: "IGV",
    description: "Impuesto General a las Ventas",
    color: "bg-blue-100 text-blue-700",
    icon: Building2,
    defaultRate: 0.18,
    defaultMinimum: 0,
  },
  DETRACCION: {
    label: "Detracción",
    description: "Sistema de Detracciones SPOT",
    color: "bg-orange-100 text-orange-700",
    icon: Calculator,
    defaultRate: 0.12,
    defaultMinimum: 70000, // S/. 700
  },
  RETENCION_4TA: {
    label: "Retención 4ta",
    description: "Retención de 4ta Categoría",
    color: "bg-purple-100 text-purple-700",
    icon: FileText,
    defaultRate: 0.08,
    defaultMinimum: 150000, // S/. 1,500
  },
  RETENCION_IGV: {
    label: "Retención IGV",
    description: "Retención de IGV (Agentes)",
    color: "bg-green-100 text-green-700",
    icon: Building2,
    defaultRate: 0.03,
    defaultMinimum: 0,
  },
  IR: {
    label: "IR",
    description: "Impuesto a la Renta",
    color: "bg-red-100 text-red-700",
    icon: Calculator,
    defaultRate: 0.30,
    defaultMinimum: 0,
  },
};

export function TaxConfigurationClient({
  configurations,
}: TaxConfigurationClientProps) {
  const [configs, setConfigs] = useState(configurations);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<TaxConfiguration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    taxType: "IGV",
    code: "",
    name: "",
    description: "",
    rate: 0.18,
    minimumAmountCents: 0,
    appliesTo: [] as string[],
    detractionAccountNumber: "",
    legalBasis: "",
    sunatCode: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      taxType: "IGV",
      code: "",
      name: "",
      description: "",
      rate: 0.18,
      minimumAmountCents: 0,
      appliesTo: [],
      detractionAccountNumber: "",
      legalBasis: "",
      sunatCode: "",
      isActive: true,
    });
    setError(null);
  };

  const handleTaxTypeChange = (type: string) => {
    const info = TAX_TYPE_INFO[type as keyof typeof TAX_TYPE_INFO];
    setFormData({
      ...formData,
      taxType: type,
      rate: info?.defaultRate || 0,
      minimumAmountCents: info?.defaultMinimum || 0,
      code: type + "_" + (info?.defaultRate ? (info.defaultRate * 100).toFixed(0) : "0"),
      name: info?.label + " " + ((info?.defaultRate || 0) * 100).toFixed(0) + "%",
    });
  };

  const handleCreateConfig = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          minimumAmountCents: formData.minimumAmountCents || null,
          detractionAccountNumber: formData.detractionAccountNumber || null,
          legalBasis: formData.legalBasis || null,
          sunatCode: formData.sunatCode || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear configuración");
      }

      // Recargar la página para obtener datos actualizados
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditConfig = async () => {
    if (!selectedConfig) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/taxes/${selectedConfig.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          rate: formData.rate,
          minimumAmountCents: formData.minimumAmountCents || null,
          appliesTo: formData.appliesTo,
          detractionAccountNumber: formData.detractionAccountNumber || null,
          legalBasis: formData.legalBasis || null,
          sunatCode: formData.sunatCode || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar configuración");
      }

      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("¿Está seguro de desactivar esta configuración?")) return;

    try {
      const response = await fetch(`/api/admin/taxes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al desactivar");
      }

      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditDialog = (config: TaxConfiguration) => {
    setSelectedConfig(config);
    setFormData({
      taxType: config.taxType,
      code: config.code,
      name: config.name,
      description: config.description || "",
      rate: config.rate,
      minimumAmountCents: config.minimumAmountCents || 0,
      appliesTo: config.appliesTo,
      detractionAccountNumber: config.detractionAccountNumber || "",
      legalBasis: config.legalBasis || "",
      sunatCode: config.sunatCode || "",
      isActive: config.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const activeConfigs = configs.filter((c) => c.isActive);
  const inactiveConfigs = configs.filter((c) => !c.isActive);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Impuestos</h1>
          <p className="text-muted-foreground">
            Configure los impuestos peruanos aplicables (IGV, Detracción, Retención 4ta)
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Configuración
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Información Tributaria Peruana</AlertTitle>
        <AlertDescription className="text-sm space-y-1">
          <p><strong>IGV:</strong> 18% para servicios institucionales (personas jurídicas)</p>
          <p><strong>Detracción:</strong> 12% para servicios &gt; S/. 700 (depósito en Banco de la Nación)</p>
          <p><strong>Retención 4ta:</strong> 8% para honorarios &gt; S/. 1,500 (árbitros personas naturales)</p>
          <p className="text-muted-foreground mt-2">
            Los honorarios de árbitros personas naturales NO están gravados con IGV.
          </p>
        </AlertDescription>
      </Alert>

      {/* Active Configurations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeConfigs.map((config) => {
          const typeInfo = TAX_TYPE_INFO[config.taxType as keyof typeof TAX_TYPE_INFO];
          const Icon = typeInfo?.icon || Calculator;

          return (
            <Card key={config.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={typeInfo?.color || "bg-gray-100"}>
                    {typeInfo?.label || config.taxType}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(config)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeactivate(config.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {config.name}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tasa:</span>
                  <span className="font-bold text-lg">{(config.rate * 100).toFixed(2)}%</span>
                </div>
                {config.minimumAmountCents && config.minimumAmountCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monto mínimo:</span>
                    <span className="font-medium">
                      S/. {(config.minimumAmountCents / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {config.legalBasis && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Base legal: {config.legalBasis}
                  </div>
                )}
                {config.detractionAccountNumber && (
                  <div className="text-xs text-muted-foreground">
                    Cuenta BN: {config.detractionAccountNumber}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600">Activo</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeConfigs.length === 0 && (
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay configuraciones activas</h3>
          <p className="text-muted-foreground mb-4">
            Configure los impuestos para que el sistema pueda calcular automáticamente las retenciones y detracciones.
          </p>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primera Configuración
          </Button>
        </Card>
      )}

      {/* Inactive Configurations */}
      {inactiveConfigs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
            Configuraciones Inactivas
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {inactiveConfigs.map((config) => {
              const typeInfo = TAX_TYPE_INFO[config.taxType as keyof typeof TAX_TYPE_INFO];

              return (
                <Card key={config.id} className="opacity-60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{typeInfo?.label || config.taxType}</Badge>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base">{config.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Tasa: {(config.rate * 100).toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Configuración de Impuesto</DialogTitle>
            <DialogDescription>
              Configure un nuevo tipo de impuesto para el sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Tipo de Impuesto</Label>
              <Select
                value={formData.taxType}
                onValueChange={handleTaxTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TAX_TYPE_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label} - {info.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="IGV_18"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="IGV 18%"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del impuesto..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tasa (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(formData.rate * 100).toFixed(2)}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) / 100 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monto Mínimo (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(formData.minimumAmountCents / 100).toFixed(2)}
                  onChange={(e) => setFormData({ ...formData, minimumAmountCents: Math.round(parseFloat(e.target.value) * 100) })}
                />
              </div>
            </div>

            {formData.taxType === "DETRACCION" && (
              <div className="space-y-2">
                <Label>Cuenta Banco de la Nación</Label>
                <Input
                  value={formData.detractionAccountNumber}
                  onChange={(e) => setFormData({ ...formData, detractionAccountNumber: e.target.value })}
                  placeholder="Número de cuenta de detracciones"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Base Legal</Label>
              <Input
                value={formData.legalBasis}
                onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                placeholder="D.S. 055-99-EF, D.Leg. 940"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Configuración Activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateConfig} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Configuración"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Configuración</DialogTitle>
            <DialogDescription>
              Modifique la configuración del impuesto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Tipo de Impuesto</Label>
              <Input value={formData.taxType} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={formData.code} disabled />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tasa (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(formData.rate * 100).toFixed(2)}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) / 100 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monto Mínimo (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(formData.minimumAmountCents / 100).toFixed(2)}
                  onChange={(e) => setFormData({ ...formData, minimumAmountCents: Math.round(parseFloat(e.target.value) * 100) })}
                />
              </div>
            </div>

            {formData.taxType === "DETRACCION" && (
              <div className="space-y-2">
                <Label>Cuenta Banco de la Nación</Label>
                <Input
                  value={formData.detractionAccountNumber}
                  onChange={(e) => setFormData({ ...formData, detractionAccountNumber: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Base Legal</Label>
              <Input
                value={formData.legalBasis}
                onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Configuración Activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditConfig} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
