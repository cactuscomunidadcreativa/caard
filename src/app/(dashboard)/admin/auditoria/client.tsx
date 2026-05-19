"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Shield, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: any;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; role: string } | null;
  case: { id: string; code: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 border-green-200",
  UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
  LOGIN: "bg-slate-100 text-slate-700 border-slate-200",
  LOGOUT: "bg-slate-100 text-slate-700 border-slate-200",
  VIEW: "bg-amber-100 text-amber-700 border-amber-200",
  DOWNLOAD: "bg-purple-100 text-purple-700 border-purple-200",
};

export function AuditoriaClient({ userRole }: { userRole: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [action, setAction] = useState<string>("__all__");
  const [entity, setEntity] = useState<string>("__all__");
  const [caseCode, setCaseCode] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [facets, setFacets] = useState<{ entities: string[]; actions: string[] }>({
    entities: [],
    actions: [],
  });

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (action && action !== "__all__") params.set("action", action);
    if (entity && entity !== "__all__") params.set("entity", entity);
    if (caseCode) params.set("caseCode", caseCode);
    if (userQuery) params.set("user", userQuery);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to + "T23:59:59").toISOString());
    params.set("limit", "200");
    try {
      const r = await fetch(`/api/admin/audit-logs?${params}`);
      const d = await r.json();
      if (r.ok) {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        if (d.facets) setFacets(d.facets);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setAction("__all__");
    setEntity("__all__");
    setCaseCode("");
    setUserQuery("");
    setFrom("");
    setTo("");
    setTimeout(fetchLogs, 0);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0B2A5B]">
            <Shield className="h-6 w-6" />
            Auditoría del Centro
          </h1>
          <p className="text-muted-foreground">
            Trazabilidad completa: cada creación, edición, eliminación y acceso
            queda registrado acá. Solo visible para el centro.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {total} {total === 1 ? "evento" : "eventos"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Combiná cualquier criterio. Por defecto se muestran los últimos
            eventos de todo el centro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Acción</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {facets.actions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Entidad</Label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {facets.entities.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Expediente</Label>
              <Input
                value={caseCode}
                onChange={(e) => setCaseCode(e.target.value)}
                placeholder="Ej. 001-2026"
              />
            </div>
            <div className="space-y-1">
              <Label>Usuario (nombre o email)</Label>
              <Input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="natalia / fabricio@..."
              />
            </div>
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hasta</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button onClick={fetchLogs} className="bg-[#0B2A5B] hover:bg-[#0d3570]">
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
          <CardDescription>
            {loading
              ? "Cargando..."
              : `${logs.length} mostrados${logs.length < total ? ` de ${total}` : ""}. Clic en una fila para ver el detalle.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cargando...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Sin eventos para los filtros seleccionados.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isOpen = expanded.has(log.id);
                    const actionColor =
                      ACTION_COLORS[log.action] ||
                      "bg-slate-100 text-slate-700 border-slate-200";
                    const date = new Date(log.createdAt);
                    return (
                      <Fragment key={log.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => toggle(log.id)}
                        >
                          <TableCell>
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            <div>{date.toLocaleDateString("es-PE")}</div>
                            <div className="text-xs text-muted-foreground">
                              {date.toLocaleTimeString("es-PE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={actionColor}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.entity}
                          </TableCell>
                          <TableCell>
                            {log.case ? (
                              <Link
                                href={`/cases/${log.case.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#0B2A5B] hover:underline font-mono text-xs"
                              >
                                {log.case.code}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.user ? (
                              <>
                                <div className="font-medium">
                                  {log.user.name || "—"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {log.user.role}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Sistema
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {log.meta ? JSON.stringify(log.meta).slice(0, 80) : "—"}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="bg-slate-50/60">
                            <TableCell colSpan={7} className="py-3">
                              <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <Field label="entity ID" value={log.entityId} />
                                  <Field
                                    label="Email usuario"
                                    value={log.user?.email || null}
                                  />
                                  <Field label="IP" value={log.ip} />
                                  <Field
                                    label="User-Agent"
                                    value={
                                      log.userAgent
                                        ? log.userAgent.slice(0, 60) +
                                          (log.userAgent.length > 60 ? "..." : "")
                                        : null
                                    }
                                  />
                                </div>
                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    Metadata
                                  </div>
                                  <pre className="bg-white border rounded p-2 overflow-x-auto text-[11px]">
                                    {log.meta
                                      ? JSON.stringify(log.meta, null, 2)
                                      : "(sin metadata)"}
                                  </pre>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
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

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-mono break-all">{value || "—"}</div>
    </div>
  );
}
