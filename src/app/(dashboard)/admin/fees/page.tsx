/**
 * CAARD - Configuración de Tarifas (Server Component)
 *
 * Las tablas se renderizan server-side: el HTML final llega al navegador
 * con los valores, pero las tablas/fórmulas como código NO viajan al
 * bundle del cliente. La calculadora interactiva está en
 * `FeesCalculator` y consume /api/public/fees/calculate.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calculator, DollarSign } from "lucide-react";
import {
  TRIBUNAL_NACIONAL,
  ARBITRO_UNICO_NACIONAL,
  GASTOS_CENTRO_NACIONAL,
  EMERGENCIA_NACIONAL,
  TRIBUNAL_INTERNACIONAL,
  INTERNACIONAL_PERCENT,
} from "@/lib/fees/caard-tariffs";
import { FeesCalculator } from "./fees-calculator";

export default function FeesPage() {
  const tables = [
    { name: "Tribunal Arbitral Nacional (S/.)", data: TRIBUNAL_NACIONAL, currency: "S/." },
    { name: "Árbitro Único Nacional (S/.)", data: ARBITRO_UNICO_NACIONAL, currency: "S/." },
    { name: "Gastos del Centro Nacional (S/.)", data: GASTOS_CENTRO_NACIONAL, currency: "S/." },
    { name: "Emergencia Nacional (S/.)", data: EMERGENCIA_NACIONAL, currency: "S/." },
    { name: "Tribunal Arbitral Internacional ($)", data: TRIBUNAL_INTERNACIONAL, currency: "$" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Tarifas</h1>
        <p className="text-muted-foreground">
          Tarifas oficiales del centro según reglamento vigente
        </p>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="tables">
            <DollarSign className="h-4 w-4 mr-2" />
            Tablas de Tarifas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <FeesCalculator />
        </TabsContent>

        <TabsContent value="tables">
          <div className="space-y-4">
            {tables.map((t) => (
              <Card key={t.name}>
                <CardHeader className="bg-[#0B2A5B] text-white rounded-t-lg py-3">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Desde</TableHead>
                        <TableHead>Hasta</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Sobre excedente de</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {t.data.map((b, i) => (
                        <TableRow key={i}>
                          <TableCell>{t.currency} {b.minAmount.toLocaleString()}</TableCell>
                          <TableCell>{b.maxAmount ? `${t.currency} ${b.maxAmount.toLocaleString()}` : "∞"}</TableCell>
                          <TableCell className="font-medium">{t.currency} {b.baseFee.toLocaleString()}</TableCell>
                          <TableCell>{b.percent ? `${(b.percent * 100).toFixed(2)}%` : b.flat ? "Fijo" : "-"}</TableCell>
                          <TableCell>{b.over ? `${t.currency} ${b.over.toLocaleString()}` : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-900">
                  <strong>Internacional (porcentaje plano):</strong> Honorarios{" "}
                  <Badge variant="secondary">{(INTERNACIONAL_PERCENT.tribunal * 100).toFixed(1)}%</Badge> + Gastos del Centro{" "}
                  <Badge variant="secondary">{(INTERNACIONAL_PERCENT.gastosCentro * 100).toFixed(1)}%</Badge> sobre el monto del contrato.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
