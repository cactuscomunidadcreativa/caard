/**
 * Página: Configuración de Tarifas
 * =================================
 * Gestión de tarifas y honorarios del centro
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Settings,
} from "lucide-react";

// Datos de ejemplo
const mockFeeConfigurations = [
  {
    id: "1",
    name: "Tasa de Administración - Hasta 100K",
    type: "TASA_ARBITRAL",
    minAmount: 0,
    maxAmount: 100000,
    calculationType: "PERCENTAGE",
    value: 3,
    minimumFee: 1500,
    isActive: true,
  },
  {
    id: "2",
    name: "Tasa de Administración - 100K a 500K",
    type: "TASA_ARBITRAL",
    minAmount: 100001,
    maxAmount: 500000,
    calculationType: "PERCENTAGE",
    value: 2.5,
    minimumFee: 3000,
    isActive: true,
  },
  {
    id: "3",
    name: "Tasa de Administración - 500K a 1M",
    type: "TASA_ARBITRAL",
    minAmount: 500001,
    maxAmount: 1000000,
    calculationType: "PERCENTAGE",
    value: 2,
    minimumFee: 12500,
    isActive: true,
  },
  {
    id: "4",
    name: "Honorarios Árbitro Único - Hasta 100K",
    type: "HONORARIOS_ARBITRO",
    minAmount: 0,
    maxAmount: 100000,
    calculationType: "PERCENTAGE",
    value: 5,
    minimumFee: 3000,
    isActive: true,
  },
  {
    id: "5",
    name: "Honorarios Árbitro Único - 100K a 500K",
    type: "HONORARIOS_ARBITRO",
    minAmount: 100001,
    maxAmount: 500000,
    calculationType: "PERCENTAGE",
    value: 4,
    minimumFee: 5000,
    isActive: true,
  },
  {
    id: "6",
    name: "Gastos Administrativos Fijos",
    type: "GASTOS_ADMINISTRATIVOS",
    minAmount: 0,
    maxAmount: null,
    calculationType: "FIXED",
    value: 500,
    minimumFee: null,
    isActive: true,
  },
];

const refundRates = [
  { stage: "ANTES_INSTALACION", percentage: 80, description: "Antes de la instalación del tribunal" },
  { stage: "INSTALADO", percentage: 50, description: "Tribunal instalado, antes de audiencias" },
  { stage: "AUDIENCIAS", percentage: 25, description: "Durante el período de audiencias" },
  { stage: "ALEGATOS", percentage: 0, description: "Después de alegatos" },
];

const typeLabels: Record<string, string> = {
  TASA_ARBITRAL: "Tasa Arbitral",
  HONORARIOS_ARBITRO: "Honorarios de Árbitro",
  HONORARIOS_SECRETARIA: "Honorarios de Secretaría",
  GASTOS_ADMINISTRATIVOS: "Gastos Administrativos",
  GASTOS_PERITAJE: "Gastos de Peritaje",
};

export default function FeesConfigPage() {
  const [configurations, setConfigurations] = useState(mockFeeConfigurations);
  const [selectedConfig, setSelectedConfig] = useState<typeof mockFeeConfigurations[0] | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState("");

  const handleToggleActive = (id: string) => {
    setConfigurations(configurations.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const calculateFees = (amount: number) => {
    const results: { type: string; name: string; amount: number }[] = [];

    // Agrupar por tipo y encontrar la configuración aplicable
    const types = [...new Set(configurations.filter(c => c.isActive).map(c => c.type))];

    types.forEach(type => {
      const configsOfType = configurations.filter(c =>
        c.type === type &&
        c.isActive &&
        amount >= c.minAmount &&
        (c.maxAmount === null || amount <= c.maxAmount)
      );

      if (configsOfType.length > 0) {
        const config = configsOfType[0];
        let calculatedAmount = 0;

        if (config.calculationType === "PERCENTAGE") {
          calculatedAmount = (amount * config.value) / 100;
          if (config.minimumFee && calculatedAmount < config.minimumFee) {
            calculatedAmount = config.minimumFee;
          }
        } else {
          calculatedAmount = config.value;
        }

        results.push({
          type: config.type,
          name: typeLabels[config.type] || config.type,
          amount: calculatedAmount,
        });
      }
    });

    return results;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Tarifas</h1>
          <p className="text-muted-foreground">
            Gestione las tarifas y honorarios del centro de arbitraje
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCalculator(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculadora
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarifa
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fees">Tarifas</TabsTrigger>
          <TabsTrigger value="refunds">Tasas de Devolución</TabsTrigger>
        </TabsList>

        {/* Tarifas */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Tabla de Tarifas</CardTitle>
              <CardDescription>
                Configuración de tarifas según cuantía del caso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Rango de Cuantía</TableHead>
                    <TableHead>Cálculo</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config) => (
                    <TableRow key={config.id} className={!config.isActive ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {config.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabels[config.type] || config.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        S/ {config.minAmount.toLocaleString()}
                        {config.maxAmount ? ` - S/ ${config.maxAmount.toLocaleString()}` : "+"}
                      </TableCell>
                      <TableCell>
                        {config.calculationType === "PERCENTAGE"
                          ? `${config.value}%`
                          : `S/ ${config.value.toLocaleString()}`
                        }
                      </TableCell>
                      <TableCell>
                        {config.minimumFee
                          ? `S/ ${config.minimumFee.toLocaleString()}`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={config.isActive}
                          onCheckedChange={() => handleToggleActive(config.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedConfig(config);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devoluciones */}
        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Tasas de Devolución</CardTitle>
              <CardDescription>
                Porcentaje de devolución según la etapa procesal al momento del desistimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa Procesal</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Porcentaje de Devolución</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRates.map((rate) => (
                    <TableRow key={rate.stage}>
                      <TableCell className="font-medium">
                        {rate.stage.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{rate.description}</TableCell>
                      <TableCell>
                        <span className={rate.percentage > 0 ? "text-green-600" : "text-red-600"}>
                          {rate.percentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Calculadora */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculadora de Costos Arbitrales
            </DialogTitle>
            <DialogDescription>
              Calcule los costos estimados según la cuantía del caso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Cuantía del Caso (S/)</Label>
              <Input
                type="number"
                placeholder="Ingrese la cuantía"
                value={calculatorAmount}
                onChange={(e) => setCalculatorAmount(e.target.value)}
              />
            </div>

            {calculatorAmount && parseFloat(calculatorAmount) > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Desglose de Costos</h4>
                <div className="space-y-2">
                  {calculateFees(parseFloat(calculatorAmount)).map((fee, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>{fee.name}</span>
                      <span className="font-bold">S/ {fee.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-bold">TOTAL ESTIMADO</span>
                    <span className="text-xl font-bold">
                      S/ {calculateFees(parseFloat(calculatorAmount))
                        .reduce((sum, f) => sum + f.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Los costos reales pueden variar según las circunstancias específicas del caso.
                  Este cálculo es solo referencial.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalculator(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarifa</DialogTitle>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input defaultValue={selectedConfig.name} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select defaultValue={selectedConfig.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TASA_ARBITRAL">Tasa Arbitral</SelectItem>
                    <SelectItem value="HONORARIOS_ARBITRO">Honorarios de Árbitro</SelectItem>
                    <SelectItem value="HONORARIOS_SECRETARIA">Honorarios de Secretaría</SelectItem>
                    <SelectItem value="GASTOS_ADMINISTRATIVOS">Gastos Administrativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cuantía Mínima (S/)</Label>
                  <Input type="number" defaultValue={selectedConfig.minAmount} />
                </div>
                <div className="space-y-2">
                  <Label>Cuantía Máxima (S/)</Label>
                  <Input
                    type="number"
                    defaultValue={selectedConfig.maxAmount || ""}
                    placeholder="Sin límite"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Cálculo</Label>
                  <Select defaultValue={selectedConfig.calculationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                      <SelectItem value="FIXED">Monto Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" defaultValue={selectedConfig.value} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monto Mínimo (S/)</Label>
                <Input
                  type="number"
                  defaultValue={selectedConfig.minimumFee || ""}
                  placeholder="Sin mínimo"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
