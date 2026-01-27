"use client";

/**
 * CAARD - Cliente de Listado de Liquidaciones
 * Componente cliente con tabla filtrable y acciones
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  Search,
  Download,
  Eye,
  Filter,
  ChevronDown,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

interface Liquidacion {
  id: string;
  caseId: string;
  caseCode: string;
  caseTitle: string | null;
  caseStatus: string;
  claimantName: string;
  respondentName: string;
  totalArbitratorFeesCents: number;
  totalAdminFeesCents: number;
  processStatus: string;
  arbitratorFeesCount: number;
  adminPaymentsCount: number;
  hasInstallmentPlan: boolean;
  installmentProgress: string | null;
  createdAt: string;
  awardDate: string | null;
}

interface Props {
  liquidaciones: Liquidacion[];
}

// Formateador de montos
function formatAmount(cents: number): string {
  return `S/. ${(cents / 100).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
  })}`;
}

// Estado del proceso con colores
function ProcessStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    PENDING: { label: "Pendiente", variant: "secondary" },
    IN_PROGRESS: { label: "En Proceso", variant: "default" },
    LAUDADO: { label: "Laudado", variant: "outline" },
    COMPLETED: { label: "Completado", variant: "outline" },
  };

  const { label, variant } = variants[status] || {
    label: status,
    variant: "secondary" as const,
  };

  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {status === "LAUDADO" && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}

export function LiquidacionesClient({ liquidaciones }: Props) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtrar liquidaciones
  const filteredLiquidaciones = useMemo(() => {
    return liquidaciones.filter((liq) => {
      const matchesSearch =
        liq.caseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        liq.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        liq.respondentName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || liq.processStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [liquidaciones, searchTerm, statusFilter]);

  // Estadisticas
  const stats = useMemo(() => {
    const total = liquidaciones.length;
    const laudados = liquidaciones.filter(
      (l) => l.processStatus === "LAUDADO"
    ).length;
    const conFraccionamiento = liquidaciones.filter(
      (l) => l.hasInstallmentPlan
    ).length;
    const totalHonorarios = liquidaciones.reduce(
      (sum, l) => sum + l.totalArbitratorFeesCents,
      0
    );
    const totalAdmin = liquidaciones.reduce(
      (sum, l) => sum + l.totalAdminFeesCents,
      0
    );

    return {
      total,
      laudados,
      conFraccionamiento,
      totalHonorarios,
      totalAdmin,
    };
  }, [liquidaciones]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            {t.sidebar.liquidations}
          </h1>
          <p className="text-muted-foreground">
            Gestiona las liquidaciones de todos los casos arbitrales
          </p>
        </div>
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Liquidaciones</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Procesos Laudados</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {stats.laudados}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Honorarios</CardDescription>
            <CardTitle className="text-lg">
              {formatAmount(stats.totalHonorarios)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Con Fraccionamiento</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              {stats.conFraccionamiento}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por expediente, demandante o demandado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="IN_PROGRESS">En Proceso</SelectItem>
                <SelectItem value="LAUDADO">Laudado</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLiquidaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                No se encontraron liquidaciones
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros de busqueda"
                  : "Las liquidaciones se crean desde la vista de cada caso"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Partes</TableHead>
                    <TableHead className="text-right">
                      Honorarios Arbitrales
                    </TableHead>
                    <TableHead className="text-right">Gastos Admin.</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">
                      Fraccionamiento
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLiquidaciones.map((liq) => (
                    <TableRow key={liq.id}>
                      <TableCell>
                        <Link
                          href={`/cases/${liq.caseId}`}
                          className="font-medium hover:underline"
                        >
                          {liq.caseCode}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {liq.caseTitle}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-blue-600">
                            DTE: {liq.claimantName}
                          </div>
                          <div className="text-yellow-600">
                            DDO: {liq.respondentName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(liq.totalArbitratorFeesCents)}
                        <div className="text-xs text-muted-foreground">
                          {liq.arbitratorFeesCount} arbitro(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(liq.totalAdminFeesCents)}
                        <div className="text-xs text-muted-foreground">
                          {liq.adminPaymentsCount} concepto(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <ProcessStatusBadge status={liq.processStatus} />
                      </TableCell>
                      <TableCell className="text-center">
                        {liq.hasInstallmentPlan ? (
                          <Badge variant="outline" className="bg-blue-50">
                            <Wallet className="h-3 w-3 mr-1" />
                            {liq.installmentProgress}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/cases/${liq.caseId}/liquidacion`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Liquidacion
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a
                                href={`/api/liquidations/${liq.id}/export`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Exportar Excel
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
