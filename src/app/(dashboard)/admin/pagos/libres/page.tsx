"use client";

/**
 * CAARD - Pagos Libres (admin)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Plus, Loader2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface FreePayment {
  id: string;
  concept: string;
  description: string | null;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  user: { id: string; name: string | null; email: string | null };
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Pagado", className: "bg-green-100 text-green-700" },
  FAILED: { label: "Fallido", className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelado", className: "bg-gray-100 text-gray-700" },
};

export default function AdminFreePaymentsPage() {
  const [items, setItems] = useState<FreePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/free-payments?limit=100");
        if (!res.ok) throw new Error("Error al cargar");
        const data = await res.json();
        setItems(data.items || []);
      } catch (e: any) {
        toast.error(e.message || "Error al cargar pagos");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const total = items.length;
  const pending = items.filter((p) => p.status === "PENDING").length;
  const paid = items.filter((p) => p.status === "PAID").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-[#D66829]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2A5B]">Pagos Libres</h1>
            <p className="text-sm text-muted-foreground">{total} pagos registrados</p>
          </div>
        </div>
        <Link href="/pago">
          <Button className="bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Pago Libre
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pagados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{paid}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pagos</CardTitle>
          <CardDescription>Pagos libres vinculados o independientes</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => {
                  const st = STATUS_BADGE[p.status] || {
                    label: p.status,
                    className: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <code className="text-xs">{p.id.slice(0, 8)}</code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.user?.name || "-"}</p>
                          <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">{p.concept}</TableCell>
                      <TableCell className="font-medium">
                        {p.currency === "USD" ? "$" : "S/"} {(p.amountCents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={st.className}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/pago/${p.id}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
