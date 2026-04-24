/**
 * /admin/authorization — gestionar permisos por usuario (overrides)
 * + ver matriz de defaults por rol.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
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
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface CatalogItem {
  key: string;
  module: string;
  action: string;
}
interface Override {
  id: string;
  permission: string;
  granted: boolean;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
}
interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function AuthorizationPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [effective, setEffective] = useState<string[]>([]);

  // Formulario nuevo override
  const [showNew, setShowNew] = useState(false);
  const [newPerm, setNewPerm] = useState("");
  const [newGranted, setNewGranted] = useState(true);
  const [newReason, setNewReason] = useState("");
  const [newExpires, setNewExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    const r = await fetch("/api/admin/permissions");
    if (r.ok) {
      const d = await r.json();
      setCatalog(d.catalog);
      setRoleDefaults(d.roleDefaults);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Buscar usuarios
  useEffect(() => {
    if (userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/users?search=${encodeURIComponent(userQuery)}&limit=10`);
      if (r.ok) {
        const d = await r.json();
        setUserResults((d.users || d.items || []).slice(0, 10));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  const loadUserPerms = async (userId: string) => {
    const r = await fetch(`/api/admin/permissions?userId=${userId}`);
    if (r.ok) {
      const d = await r.json();
      setSelectedUser(d.user);
      setOverrides(d.overrides || []);
      setEffective(d.effective || []);
    }
  };

  const selectUser = (u: UserSearchResult) => {
    setUserQuery("");
    setUserResults([]);
    loadUserPerms(u.id);
  };

  const addOverride = async () => {
    if (!selectedUser || !newPerm) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          permission: newPerm,
          granted: newGranted,
          reason: newReason || null,
          expiresAt: newExpires || null,
        }),
      });
      if (r.ok) {
        setShowNew(false);
        setNewPerm("");
        setNewReason("");
        setNewExpires("");
        await loadUserPerms(selectedUser.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const removeOverride = async (id: string) => {
    if (!selectedUser) return;
    await fetch(`/api/admin/permissions?id=${id}`, { method: "DELETE" });
    await loadUserPerms(selectedUser.id);
  };

  const modulesInCatalog = [...new Set(catalog.map((c) => c.module))];

  return (
    <div className="container mx-auto py-6 max-w-6xl space-y-6">
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
          <Shield className="h-6 w-6 text-[#D66829]" />
          Autorizaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona permisos por usuario (overrides) y consulta la matriz de
          defaults por rol.
        </p>
      </div>

      <Tabs defaultValue="user">
        <TabsList>
          <TabsTrigger value="user">Por usuario</TabsTrigger>
          <TabsTrigger value="roles">Matriz de roles</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar usuario</CardTitle>
              <CardDescription>
                Nombre o email. Cuando lo selecciones se muestran sus permisos
                efectivos y overrides actuales.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="pl-9"
                />
              </div>
              {userResults.length > 0 && (
                <div className="absolute left-6 right-6 top-[110px] bg-background border rounded-lg shadow-lg z-10 divide-y">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    >
                      <div className="font-medium">{u.name || u.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email} · {u.role}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedUser && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle>{selectedUser.name || selectedUser.email}</CardTitle>
                      <CardDescription>
                        {selectedUser.email} ·{" "}
                        <Badge variant="secondary">{selectedUser.role}</Badge>
                      </CardDescription>
                    </div>
                    <Dialog open={showNew} onOpenChange={setShowNew}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#D66829] hover:bg-[#c45a22]">
                          <Plus className="h-4 w-4 mr-2" />
                          Override
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Override de permiso</DialogTitle>
                          <DialogDescription>
                            Otorga o revoca un permiso específico para este
                            usuario. Sobrescribe el default de su rol.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Permiso *</Label>
                            <Select value={newPerm} onValueChange={setNewPerm}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un permiso" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[400px]">
                                {modulesInCatalog.map((m) => (
                                  <div key={m}>
                                    <div className="text-xs font-semibold uppercase px-2 py-1 text-muted-foreground">
                                      {m}
                                    </div>
                                    {catalog
                                      .filter((c) => c.module === m)
                                      .map((c) => (
                                        <SelectItem key={c.key} value={c.key}>
                                          {c.key}
                                        </SelectItem>
                                      ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Acción *</Label>
                            <Select
                              value={newGranted ? "grant" : "revoke"}
                              onValueChange={(v) => setNewGranted(v === "grant")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="grant">
                                  Otorgar (agregar al usuario)
                                </SelectItem>
                                <SelectItem value="revoke">
                                  Revocar (quitar del default del rol)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Razón</Label>
                            <Textarea
                              rows={2}
                              value={newReason}
                              onChange={(e) => setNewReason(e.target.value)}
                              placeholder="Justificación..."
                            />
                          </div>
                          <div>
                            <Label>Vence el (opcional)</Label>
                            <Input
                              type="datetime-local"
                              value={newExpires}
                              onChange={(e) => setNewExpires(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowNew(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={addOverride}
                            disabled={saving || !newPerm}
                            className="bg-[#D66829] hover:bg-[#c45a22]"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Guardar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
              </Card>

              {/* Overrides activos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Overrides activos ({overrides.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overrides.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin overrides — usa los permisos default de su rol.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Permiso</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Vence</TableHead>
                          <TableHead>Razón</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overrides.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono text-xs">
                              {o.permission}
                            </TableCell>
                            <TableCell>
                              {o.granted ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Otorgado
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Revocado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {o.expiresAt ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(o.expiresAt).toLocaleDateString("es-PE")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {o.reason || "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeOverride(o.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Permisos efectivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Permisos efectivos ({effective.includes("*") ? "TODOS" : effective.length})
                  </CardTitle>
                  <CardDescription>
                    Default del rol + overrides. Esto es lo que el sistema
                    realmente evalúa.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {effective.includes("*") ? (
                    <Badge className="bg-purple-100 text-purple-800">
                      Wildcard: todos los permisos
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {effective.sort().map((p) => (
                        <Badge key={p} variant="outline" className="font-mono text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de permisos por rol</CardTitle>
              <CardDescription>
                Defaults declarados en <code>src/lib/permissions.ts</code>. Para
                excepciones usa la pestaña "Por usuario".
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                <div className="space-y-6">
                  {Object.entries(roleDefaults).map(([role, perms]) => (
                    <div key={role}>
                      <h3 className="font-semibold mb-2">
                        {role}{" "}
                        <Badge variant="secondary">
                          {perms.includes("*") ? "todos" : perms.length}
                        </Badge>
                      </h3>
                      {perms.includes("*") ? (
                        <Badge className="bg-purple-100 text-purple-800">*</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {perms.sort().map((p) => (
                            <Badge
                              key={p}
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
