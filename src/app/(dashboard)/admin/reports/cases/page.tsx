/**
 * Página: Reporte de Casos
 * =========================
 * Análisis detallado de expedientes
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
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
} from "lucide-react";

// Datos de ejemplo
const casesByStatus = [
  { status: "En Proceso", count: 45, percentage: 29 },
  { status: "Admitido", count: 38, percentage: 24 },
  { status: "Presentado", count: 28, percentage: 18 },
  { status: "Laudo Emitido", count: 25, percentage: 16 },
  { status: "Cerrado", count: 15, percentage: 10 },
  { status: "Otros", count: 5, percentage: 3 },
];

const casesByType = [
  { type: "Comercial", count: 85, amount: "S/ 12.5M" },
  { type: "Civil", count: 42, amount: "S/ 5.2M" },
  { type: "Laboral", count: 18, amount: "S/ 1.8M" },
  { type: "Construcción", count: 11, amount: "S/ 8.5M" },
];

const monthlyTrend = [
  { month: "Sep 2024", new: 12, closed: 8 },
  { month: "Oct 2024", new: 15, closed: 10 },
  { month: "Nov 2024", new: 18, closed: 12 },
  { month: "Dic 2024", new: 14, closed: 15 },
  { month: "Ene 2025", new: 22, closed: 11 },
];

export default function CasesReportPage() {
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState("2025");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporte de Casos</h1>
          <p className="text-muted-foreground">
            Análisis detallado de expedientes arbitrales
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
            Exportar PDF
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Casos</p>
              <p className="text-3xl font-bold">156</p>
              <p className="text-xs text-green-600">+18% vs año anterior</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cuantía Total</p>
              <p className="text-3xl font-bold">S/ 28M</p>
              <p className="text-xs text-green-600">+25% vs año anterior</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duración Promedio</p>
              <p className="text-3xl font-bold">95 días</p>
              <p className="text-xs text-green-600">-12 días vs año anterior</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tasa de Cierre</p>
              <p className="text-3xl font-bold">87%</p>
              <p className="text-xs text-green-600">+5% vs año anterior</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {casesByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.status}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Casos por Tipo de Arbitraje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Casos</TableHead>
                  <TableHead className="text-right">Cuantía</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {casesByType.map((item) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{item.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia Mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencia Mensual
          </CardTitle>
          <CardDescription>
            Casos nuevos vs casos cerrados en los últimos 5 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Casos Nuevos</TableHead>
                <TableHead className="text-right">Casos Cerrados</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyTrend.map((item) => (
                <TableRow key={item.month}>
                  <TableCell className="font-medium">{item.month}</TableCell>
                  <TableCell className="text-right text-green-600">+{item.new}</TableCell>
                  <TableCell className="text-right text-blue-600">{item.closed}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.new - item.closed >= 0 ? "default" : "secondary"}>
                      {item.new - item.closed >= 0 ? "+" : ""}{item.new - item.closed}
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
