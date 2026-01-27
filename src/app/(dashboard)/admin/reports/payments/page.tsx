/**
 * Página: Reporte de Pagos
 * =========================
 * Análisis financiero del centro
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DollarSign,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Datos de ejemplo
const revenueByMonth = [
  { month: "Sep 2024", tasas: 85000, honorarios: 120000, gastos: 15000, total: 220000 },
  { month: "Oct 2024", tasas: 92000, honorarios: 135000, gastos: 18000, total: 245000 },
  { month: "Nov 2024", tasas: 78000, honorarios: 110000, gastos: 12000, total: 200000 },
  { month: "Dic 2024", tasas: 95000, honorarios: 145000, gastos: 20000, total: 260000 },
  { month: "Ene 2025", tasas: 88000, honorarios: 140000, gastos: 17000, total: 245000 },
];

const paymentStatus = [
  { status: "Pagado", count: 145, amount: 890000, color: "green" },
  { status: "Pendiente", count: 28, amount: 156000, color: "amber" },
  { status: "Vencido", count: 12, amount: 78000, color: "red" },
  { status: "Anulado", count: 5, amount: 25000, color: "gray" },
];

const topDebtors = [
  { name: "Empresa ABC S.A.C.", amount: 45000, days: 15 },
  { name: "Tech Solutions Perú", amount: 32000, days: 8 },
  { name: "Constructora Norte", amount: 28000, days: 22 },
  { name: "Importaciones del Sur", amount: 18000, days: 5 },
];

export default function PaymentsReportPage() {
  const [year, setYear] = useState("2025");

  const totalRevenue = revenueByMonth.reduce((sum, m) => sum + m.total, 0);
  const pendingAmount = paymentStatus.find(s => s.status === "Pendiente")?.amount || 0;
  const overdueAmount = paymentStatus.find(s => s.status === "Vencido")?.amount || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporte de Pagos</h1>
          <p className="text-muted-foreground">
            Análisis financiero y estado de cobranzas
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recaudación Total</p>
                <p className="text-2xl font-bold">S/ {(totalRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% vs año anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-2xl font-bold">S/ {(pendingAmount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">28 órdenes pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencido</p>
                <p className="text-2xl font-bold text-red-600">S/ {(overdueAmount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-red-600">12 órdenes vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Cobro</p>
                <p className="text-2xl font-bold">92%</p>
                <p className="text-xs text-green-600">+3% vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
            <CardDescription>Desglose por concepto</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Tasas</TableHead>
                  <TableHead className="text-right">Honorarios</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueByMonth.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell className="font-medium">{item.month}</TableCell>
                    <TableCell className="text-right">S/ {(item.tasas / 1000).toFixed(0)}K</TableCell>
                    <TableCell className="text-right">S/ {(item.honorarios / 1000).toFixed(0)}K</TableCell>
                    <TableCell className="text-right">S/ {(item.gastos / 1000).toFixed(0)}K</TableCell>
                    <TableCell className="text-right font-bold">S/ {(item.total / 1000).toFixed(0)}K</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Estado de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Órdenes de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      item.color === "green" ? "default" :
                      item.color === "amber" ? "secondary" :
                      item.color === "red" ? "destructive" : "outline"
                    }>
                      {item.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.count} órdenes
                    </span>
                  </div>
                  <span className="font-bold">
                    S/ {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Principales Deudores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Principales Cuentas por Cobrar
          </CardTitle>
          <CardDescription>
            Deudores con montos pendientes más altos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deudor</TableHead>
                <TableHead className="text-right">Monto Pendiente</TableHead>
                <TableHead className="text-right">Días de Mora</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDebtors.map((debtor) => (
                <TableRow key={debtor.name}>
                  <TableCell className="font-medium">{debtor.name}</TableCell>
                  <TableCell className="text-right">S/ {debtor.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{debtor.days} días</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={debtor.days > 15 ? "destructive" : "secondary"}>
                      {debtor.days > 15 ? "Crítico" : "Pendiente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
