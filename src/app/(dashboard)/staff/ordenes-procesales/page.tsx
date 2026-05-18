"use client";

/**
 * CAARD - Órdenes Procesales (Staff)
 *
 * Vista cross-caso para que secretaría, staff y administradores vean
 * todas las OPs emitidas, su estado en el flujo (presentada → proveída
 * → notificada) y creen nuevas desde un único panel.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gavel,
  Plus,
  Search,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle,
  MailCheck,
  X,
} from "lucide-react";

interface OP {
  id: string;
  caseId: string;
  caseCode: string;
  caseTitle: string | null;
  documentType: string;
  description: string | null;
  originalFileName: string;
  status: "SUBMITTED" | "PROVEIDO" | "NOTIFIED" | "REJECTED" | null;
  createdAt: string;
  proveidoAt: string | null;
  notifiedAt: string | null;
  driveWebViewLink: string | null;
  uploadedBy: { name: string | null; email: string | null } | null;
}

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  SUBMITTED: {
    label: "Presentada",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  PROVEIDO: {
    label: "Proveída",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: CheckCircle,
  },
  NOTIFIED: {
    label: "Notificada",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: MailCheck,
  },
  REJECTED: {
    label: "Rechazada",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: X,
  },
};

export default function OrdenesProcesalesPage() {
  const [ordenes, setOrdenes] = useState<OP[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/procedural-orders")
      .then((r) => r.json())
      .then((d) => setOrdenes(d.ordenes || []))
      .catch(() => setOrdenes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = ordenes.filter((o) => {
    const needle = q.toLowerCase().trim();
    if (!needle) return true;
    return (
      o.caseCode.toLowerCase().includes(needle) ||
      (o.caseTitle || "").toLowerCase().includes(needle) ||
      (o.description || "").toLowerCase().includes(needle) ||
      o.documentType.toLowerCase().includes(needle) ||
      (o.uploadedBy?.name || "").toLowerCase().includes(needle)
    );
  });

  const counts = {
    total: ordenes.length,
    submitted: ordenes.filter((o) => o.status === "SUBMITTED").length,
    proveido: ordenes.filter((o) => o.status === "PROVEIDO").length,
    notified: ordenes.filter((o) => o.status === "NOTIFIED").length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0B2A5B]">
            <Gavel className="h-6 w-6" />
            Órdenes Procesales
          </h1>
          <p className="text-muted-foreground">
            Gestión cross-expediente de Órdenes Procesales y Resoluciones.
          </p>
        </div>
        <Link href="/staff/ordenes-procesales/nueva">
          <Button className="bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden Procesal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-[#0B2A5B]">{counts.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-amber-600">{counts.submitted}</div>
            <p className="text-sm text-muted-foreground">Pendientes de proveer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-blue-600">{counts.proveido}</div>
            <p className="text-sm text-muted-foreground">Pendientes de notificar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-green-600">{counts.notified}</div>
            <p className="text-sm text-muted-foreground">Notificadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Listado</CardTitle>
              <CardDescription>
                Últimas 200 OPs. Clic en una fila para abrir el expediente.
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por expediente, tipo o autor..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {ordenes.length === 0
                ? "Aún no se han emitido Órdenes Procesales."
                : "Sin resultados para esa búsqueda."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const meta = (o.status && STATUS_META[o.status]) || null;
                    const Icon = meta?.icon || Clock;
                    return (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            href={`/cases/${o.caseId}`}
                            className="font-mono text-[#0B2A5B] hover:underline"
                          >
                            {o.caseCode}
                          </Link>
                          {o.caseTitle && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {o.caseTitle}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{o.documentType}</Badge>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <div className="truncate text-sm" title={o.description || ""}>
                            {o.description || o.originalFileName}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.uploadedBy?.name || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(o.createdAt).toLocaleDateString("es-PE")}
                        </TableCell>
                        <TableCell>
                          {meta ? (
                            <Badge variant="outline" className={`${meta.color} gap-1`}>
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {o.driveWebViewLink && (
                              <a
                                href={o.driveWebViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Abrir
                                </Button>
                              </a>
                            )}
                            <Link href={`/cases/${o.caseId}`}>
                              <Button variant="outline" size="sm">
                                Ver caso
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
