/**
 * /admin/libro-reclamaciones — gestión interna del Libro de Reclamaciones
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Search,
  Eye,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Claim {
  id: string;
  claimNumber: string;
  claimType: "RECLAMO" | "QUEJA";
  status: string;
  consumerName: string;
  consumerEmail: string;
  consumerDocType: string;
  consumerDocNumber: string;
  consumerPhone: string | null;
  consumerAddress: string | null;
  serviceType: string;
  serviceDescription: string;
  amountCents: number | null;
  currency: string | null;
  serviceDate: string | null;
  claimDetail: string;
  consumerRequest: string;
  responseText: string | null;
  receivedAt: string;
  responseDueAt: string;
  respondedAt: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "Recibido", color: "bg-blue-100 text-blue-800" },
  IN_REVIEW: { label: "En revisión", color: "bg-yellow-100 text-yellow-800" },
  RESPONDED: { label: "Respondido", color: "bg-green-100 text-green-800" },
  RESOLVED: { label: "Resuelto", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-800" },
};

export default function LibroReclamacionesAdminPage() {
  const [items, setItems] = useState<Claim[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Claim | null>(null);
  const [responseText, setResponseText] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("q", search.trim());
    const r = await fetch(`/api/admin/consumer-claims?${params.toString()}`);
    if (r.ok) {
      const d = await r.json();
      setItems(d.items || []);
      setCounts(d.counts || {});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const r = await fetch(`/api/admin/consumer-claims?id=${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus || undefined,
        responseText: responseText || undefined,
      }),
    });
    setSaving(false);
    if (r.ok) {
      setSelected(null);
      setResponseText("");
      setNewStatus("");
      await load();
    }
  };

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const overdue = items.filter(
    (c) =>
      ["RECEIVED", "IN_REVIEW"].includes(c.status) &&
      new Date(c.responseDueAt) < new Date()
  ).length;

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-[#D66829]" />
          Libro de Reclamaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestión de reclamos y quejas del consumidor (D.S. 011-2011-PCM).
          Plazo legal de respuesta: 30 días calendario.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold text-blue-600">
              {counts.RECEIVED || 0}
            </p>
            <p className="text-xs text-muted-foreground">Recibidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold text-yellow-600">
              {counts.IN_REVIEW || 0}
            </p>
            <p className="text-xs text-muted-foreground">En revisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold text-green-600">
              {counts.RESPONDED || 0}
            </p>
            <p className="text-xs text-muted-foreground">Respondidos</p>
          </CardContent>
        </Card>
        <Card className={overdue > 0 ? "border-red-300 bg-red-50/40" : ""}>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold text-red-600">{overdue}</p>
            <p className="text-xs text-muted-foreground">Plazo vencido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, nombre, email o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setTimeout(load, 0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="RECEIVED">Recibidos</SelectItem>
              <SelectItem value="IN_REVIEW">En revisión</SelectItem>
              <SelectItem value="RESPONDED">Respondidos</SelectItem>
              <SelectItem value="RESOLVED">Resueltos</SelectItem>
              <SelectItem value="REJECTED">Rechazados</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={load} variant="outline" size="sm">
            Buscar
          </Button>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#D66829]" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No hay reclamaciones registradas con estos filtros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Hoja</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Consumidor</TableHead>
                  <TableHead>Recibido</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => {
                  const isOverdue =
                    ["RECEIVED", "IN_REVIEW"].includes(c.status) &&
                    new Date(c.responseDueAt) < new Date();
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        {c.claimNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            c.claimType === "RECLAMO"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-purple-100 text-purple-800"
                          }
                        >
                          {c.claimType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {c.consumerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.consumerEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(c.receivedAt).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={
                            isOverdue
                              ? "text-red-600 font-semibold flex items-center gap-1"
                              : ""
                          }
                        >
                          {isOverdue && <Clock className="h-3 w-3" />}
                          {new Date(c.responseDueAt).toLocaleDateString("es-PE")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_LABELS[c.status]?.color}>
                          {STATUS_LABELS[c.status]?.label || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelected(c);
                            setResponseText(c.responseText || "");
                            setNewStatus(c.status);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog detalle */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setResponseText("");
            setNewStatus("");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#D66829]" />
              {selected?.claimNumber}
            </DialogTitle>
            <DialogDescription>
              {selected?.claimType === "RECLAMO" ? "Reclamo" : "Queja"}{" "}
              recibido el{" "}
              {selected
                ? new Date(selected.receivedAt).toLocaleString("es-PE")
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Consumidor</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selected.consumerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Documento</p>
                    <p className="font-medium">
                      {selected.consumerDocType} {selected.consumerDocNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selected.consumerEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">
                      {selected.consumerPhone || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Dirección</p>
                    <p className="font-medium">
                      {selected.consumerAddress || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Servicio reclamado ({selected.serviceType})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="whitespace-pre-wrap">
                    {selected.serviceDescription}
                  </p>
                  {selected.amountCents != null && (
                    <p>
                      <span className="text-muted-foreground">Monto:</span>{" "}
                      {selected.currency} {(selected.amountCents / 100).toFixed(2)}
                    </p>
                  )}
                  {selected.serviceDate && (
                    <p>
                      <span className="text-muted-foreground">Fecha:</span>{" "}
                      {new Date(selected.serviceDate).toLocaleDateString("es-PE")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Detalle</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <p className="whitespace-pre-wrap">{selected.claimDetail}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pedido del consumidor</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <p className="whitespace-pre-wrap">{selected.consumerRequest}</p>
                </CardContent>
              </Card>

              {/* Editor de respuesta */}
              <Card className="border-[#D66829]/30 bg-orange-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Send className="h-4 w-4 text-[#D66829]" />
                    Respuesta al consumidor
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Al guardar con texto, se envía email automáticamente al
                    consumidor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Estado</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECEIVED">Recibido</SelectItem>
                        <SelectItem value="IN_REVIEW">En revisión</SelectItem>
                        <SelectItem value="RESPONDED">Respondido</SelectItem>
                        <SelectItem value="RESOLVED">Resuelto</SelectItem>
                        <SelectItem value="REJECTED">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Texto de la respuesta</Label>
                    <Textarea
                      rows={6}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Redacte la respuesta formal al consumidor..."
                    />
                  </div>
                  {selected.respondedAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Última respuesta:{" "}
                      {new Date(selected.respondedAt).toLocaleString("es-PE")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={saving}
            >
              Cerrar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#D66829] hover:bg-[#c45a22]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Guardar{responseText ? " y enviar" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
