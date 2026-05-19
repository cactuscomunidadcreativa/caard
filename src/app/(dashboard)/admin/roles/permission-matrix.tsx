"use client";

/**
 * Matriz editable de permisos por rol.
 *
 * Cada celda es un checkbox que persiste su cambio vía
 * PATCH /api/admin/role-permissions. Cambios optimistas con rollback
 * si la API falla. SUPER_ADMIN sale como solo lectura (tiene comodín).
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Shield, Check, X, AlertCircle } from "lucide-react";

interface MatrixProps {
  roles: Array<{ role: string; displayName: string }>;
}

const PERMISSION_GROUPS: { key: string; label: string }[] = [
  { key: "cases", label: "Expedientes" },
  { key: "members", label: "Miembros del caso" },
  { key: "documents", label: "Documentos y escritos" },
  { key: "deadlines", label: "Plazos procesales" },
  { key: "hearings", label: "Audiencias" },
  { key: "payments", label: "Pagos / Órdenes de pago" },
  { key: "installments", label: "Fraccionamientos" },
  { key: "liquidations", label: "Liquidaciones" },
  { key: "emergencies", label: "Arbitraje de emergencia" },
  { key: "recusations", label: "Recusaciones" },
  { key: "sanctions", label: "Sanciones" },
  { key: "arbitrators", label: "Árbitros (registro)" },
  { key: "users", label: "Usuarios" },
  { key: "cms", label: "CMS / Contenido público" },
  { key: "notifications", label: "Notificaciones" },
  { key: "reports", label: "Reportes" },
  { key: "ai", label: "Inteligencia artificial" },
  { key: "integrations", label: "Integraciones" },
  { key: "system", label: "Configuración del sistema" },
  { key: "audit", label: "Auditoría" },
];

// Etiquetas por acción + overrides puntuales por permiso completo
const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  read: "Leer detalle",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
  download: "Descargar",
  proveer: "Proveer (resolver)",
  refund: "Reembolsar",
  confirm: "Confirmar",
  approve: "Aprobar",
  verify: "Verificar",
  designate: "Designar",
  respond: "Responder",
  decide: "Decidir",
  publish: "Publicar",
  templates: "Plantillas",
  export: "Exportar",
  send: "Enviar",
  impersonate: "Suplantar",
  assign_arbitrator: "Asignar árbitro",
  block: "Bloquear",
  sanction: "Sancionar",
  use: "Usar",
  admin: "Administrar",
  manage: "Gestionar",
  rules: "Reglas",
  tariffs: "Tarifas",
  holidays: "Feriados",
  center: "Datos del centro",
};

// Aclaraciones por permiso específico (semántica del flujo)
const PERMISSION_HINTS: Record<string, string> = {
  "hearings.create":
    "Árbitros: sugieren fechas (que el centro confirma). Staff: programa directo.",
  "hearings.update": "Solo el centro confirma o modifica una audiencia oficial.",
  "documents.proveer":
    "Privilegio del árbitro: emite resolución sobre un escrito presentado.",
  "cases.assign_arbitrator": "Asigna árbitros al caso (centro).",
  "payments.refund": "Reembolsar pagos ya confirmados.",
  "users.impersonate":
    "Iniciar sesión como otro usuario (solo SUPER_ADMIN — alto riesgo).",
};

function actionLabel(perm: string): string {
  const action = perm.split(".")[1] || perm;
  return ACTION_LABELS[action] || action;
}

export function PermissionMatrix({ roles }: MatrixProps) {
  const [effective, setEffective] = useState<Record<string, Set<string>>>({});
  const [overridden, setOverridden] = useState<Set<string>>(new Set()); // "role|perm"
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<string>>(new Set()); // "role|perm" en vuelo

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/role-permissions");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const eff: Record<string, Set<string>> = {};
      for (const [role, list] of Object.entries(d.effective || {})) {
        eff[role] = new Set(list as string[]);
      }
      setEffective(eff);
      setPermissions(d.permissions || []);
      const ovr = new Set<string>();
      for (const o of d.overrides || []) {
        ovr.add(`${o.role}|${o.permission}`);
      }
      setOverridden(ovr);
    } catch (e: any) {
      toast.error(e?.message || "Error cargando permisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groups = useMemo(() => {
    return PERMISSION_GROUPS.map((g) => ({
      ...g,
      perms: permissions.filter((p) => p.startsWith(`${g.key}.`)),
    })).filter((g) => g.perms.length > 0);
  }, [permissions]);

  const totalPermissions = permissions.length;
  const totalOverrides = overridden.size;

  const toggle = async (role: string, permission: string, current: boolean) => {
    const key = `${role}|${permission}`;
    if (pending.has(key)) return;
    if (role === "SUPER_ADMIN") {
      toast.info("SUPER_ADMIN tiene acceso total y no se puede modificar");
      return;
    }
    setPending((s) => new Set([...s, key]));

    // Optimista
    setEffective((prev) => {
      const next = { ...prev };
      const set = new Set(next[role] || []);
      if (current) set.delete(permission);
      else set.add(permission);
      next[role] = set;
      return next;
    });

    try {
      const r = await fetch("/api/admin/role-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permission, granted: !current }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Error");
      // Refrescar el flag de override usando el GET (más fiable)
      fetchData();
    } catch (e: any) {
      // Rollback
      setEffective((prev) => {
        const next = { ...prev };
        const set = new Set(next[role] || []);
        if (current) set.add(permission);
        else set.delete(permission);
        next[role] = set;
        return next;
      });
      toast.error(e?.message || "No se pudo guardar el cambio");
    } finally {
      setPending((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Matriz de permisos detallados
            </CardTitle>
            <CardDescription>
              Click en cualquier celda para activar/desactivar el permiso. Los
              cambios aplican a todos los usuarios del rol. SUPER_ADMIN tiene
              comodín y no se edita.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{totalPermissions} permisos</Badge>
            {totalOverrides > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {totalOverrides} {totalOverrides === 1 ? "ajuste" : "ajustes"} aplicados
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Cargando matriz de permisos...
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.key}>
                <h3 className="text-sm font-semibold text-[#0B2A5B] mb-2 flex items-center gap-2">
                  {group.label}
                  <Badge variant="outline" className="text-xs font-normal">
                    {group.perms.length}
                  </Badge>
                </h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="min-w-[220px] font-medium">
                          Permiso
                        </TableHead>
                        {roles.map((r) => (
                          <TableHead
                            key={r.role}
                            className="text-center text-xs font-medium whitespace-nowrap"
                            title={r.displayName}
                          >
                            {r.role}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.perms.map((perm) => {
                        const hint = PERMISSION_HINTS[perm];
                        return (
                          <TableRow key={perm} className="hover:bg-slate-50/60">
                            <TableCell className="text-sm">
                              <div className="font-medium">{actionLabel(perm)}</div>
                              <div className="text-[11px] text-muted-foreground font-mono">
                                {perm}
                              </div>
                              {hint && (
                                <div className="text-[11px] text-amber-700 mt-1 flex items-start gap-1">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span>{hint}</span>
                                </div>
                              )}
                            </TableCell>
                            {roles.map((r) => {
                              const has = effective[r.role]?.has(perm) || false;
                              const isOverride = overridden.has(`${r.role}|${perm}`);
                              const key = `${r.role}|${perm}`;
                              const isPending = pending.has(key);
                              const isLocked = r.role === "SUPER_ADMIN";
                              return (
                                <TableCell
                                  key={r.role}
                                  className="text-center align-middle"
                                >
                                  <button
                                    type="button"
                                    disabled={isLocked || isPending}
                                    onClick={() => toggle(r.role, perm, has)}
                                    className={`relative inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
                                      isLocked
                                        ? "cursor-default opacity-60"
                                        : "cursor-pointer hover:bg-slate-200"
                                    } ${
                                      has
                                        ? "bg-emerald-100"
                                        : "bg-slate-50"
                                    } ${isOverride ? "ring-2 ring-amber-400" : ""}`}
                                    title={
                                      isLocked
                                        ? "SUPER_ADMIN tiene comodín *"
                                        : isOverride
                                        ? `Personalizado (default: ${has ? "permitido" : "denegado"})`
                                        : has
                                        ? "Permitido (default del rol). Click para revocar."
                                        : "Denegado (default del rol). Click para otorgar."
                                    }
                                  >
                                    {isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : has ? (
                                      <Check className="h-4 w-4 text-emerald-700" />
                                    ) : (
                                      <X className="h-4 w-4 text-slate-300" />
                                    )}
                                  </button>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-700" />
                </span>
                Permiso activo
                <span className="text-muted-foreground ml-3 inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded ring-2 ring-amber-400" />
                  Personalizado (difiere del default)
                </span>
              </div>
              <p className="text-muted-foreground">
                Los cambios persisten en BD y aplican en el próximo request de
                cada usuario del rol. Cada modificación queda en{" "}
                <code className="text-[11px]">/admin/auditoria</code>.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
