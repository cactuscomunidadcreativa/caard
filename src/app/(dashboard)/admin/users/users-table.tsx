/**
 * CAARD - Tabla de Usuarios con filtros y paginación
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Shield,
  Building2,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EditUserDialog } from "./edit-user-dialog";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phoneE164: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  center: { id: string; name: string; code: string } | null;
}

interface Center {
  id: string;
  name: string;
  code: string;
}

interface UsersTableProps {
  initialUsers: User[];
  initialTotal: number;
  centers: Center[];
  isSuperAdmin: boolean;
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin General",
  CENTER_STAFF: "Personal Centro",
  SECRETARIA: "Secretaría",
  ARBITRO: "Árbitro",
  ABOGADO: "Abogado",
  DEMANDANTE: "Demandante",
  DEMANDADO: "Demandado",
  ESTUDIANTE: "Estudiante",
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-purple-100 text-purple-700",
  CENTER_STAFF: "bg-indigo-100 text-indigo-700",
  SECRETARIA: "bg-blue-100 text-blue-700",
  ARBITRO: "bg-cyan-100 text-cyan-700",
  ABOGADO: "bg-amber-100 text-amber-700",
  DEMANDANTE: "bg-green-100 text-green-700",
  DEMANDADO: "bg-orange-100 text-orange-700",
  ESTUDIANTE: "bg-teal-100 text-teal-700",
};

export function UsersTable({ initialUsers, initialTotal, centers, isSuperAdmin }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("isActive", statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotal(data.pagination.total);
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Estado para el dialog de eliminación permanente
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [deleteRelations, setDeleteRelations] = useState<{
    caseMemberships?: number;
    lawyerCases?: number;
    documents?: number;
    arbitratorRegistry?: number;
  } | null>(null);

  const handleHardDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const url = `/api/admin/users/${userToDelete.id}?hard=true${forceDelete ? "&force=true" : ""}`;
      const r = await fetch(url, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.requiresForce && d.relations) {
          setDeleteRelations(d.relations);
          setForceDelete(true);
          setDeleteError(d.error);
          return;
        }
        throw new Error(d.error || "Error al eliminar");
      }
      toast({
        title: "Usuario eliminado permanentemente",
        description: `${userToDelete.name || userToDelete.email} fue removido del sistema.`,
      });
      setUserToDelete(null);
      setForceDelete(false);
      setDeleteRelations(null);
      fetchUsers();
    } catch (e: any) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (response.ok) {
        toast({
          title: user.isActive ? "Usuario desactivado" : "Usuario activado",
          description: `${user.name || user.email} ha sido ${user.isActive ? "desactivado" : "activado"}.`,
        });
        fetchUsers();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar estado",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </form>

        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              {isSuperAdmin && <TableHead className="w-[70px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={!user.isActive ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-[#D66829]/10 text-[#D66829]">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name || "Sin nombre"}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phoneE164 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phoneE164}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={ROLE_COLORS[user.role]}>
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.center ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{user.center.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.createdAt), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteError(null);
                              setForceDelete(false);
                              setDeleteRelations(null);
                            }}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar permanentemente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de edición */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          centers={centers}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Dialog de eliminación permanente */}
      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
            setDeleteError(null);
            setForceDelete(false);
            setDeleteRelations(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar usuario permanentemente
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong>irreversible</strong>. El usuario será
              removido del sistema y no podrá iniciar sesión.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="space-y-2 rounded-lg border p-3 bg-muted/30 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{userToDelete.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rol:</span>
                <Badge variant="secondary">{userToDelete.role}</Badge>
              </div>
            </div>
          )}

          {deleteRelations && (
            <div className="rounded bg-yellow-50 border border-yellow-300 p-3 text-sm text-yellow-900">
              <p className="font-semibold flex items-center gap-1 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Tiene datos asociados
              </p>
              <ul className="list-disc ml-5 space-y-0.5 text-xs">
                {deleteRelations.caseMemberships ? (
                  <li>{deleteRelations.caseMemberships} membresías de caso</li>
                ) : null}
                {deleteRelations.lawyerCases ? (
                  <li>{deleteRelations.lawyerCases} representaciones como abogado</li>
                ) : null}
                {deleteRelations.documents ? (
                  <li>{deleteRelations.documents} documentos subidos</li>
                ) : null}
                {deleteRelations.arbitratorRegistry ? (
                  <li>Registro de árbitro</li>
                ) : null}
              </ul>
              <p className="mt-2 text-xs">
                El historial de los casos se conserva sin nombre. Confirma que
                quieres eliminar igual.
              </p>
            </div>
          )}

          {deleteError && !deleteRelations && (
            <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {forceDelete ? "Eliminar igual" : "Eliminar"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
