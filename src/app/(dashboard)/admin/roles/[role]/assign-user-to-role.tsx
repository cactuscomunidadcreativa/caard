"use client";

/**
 * Componente para buscar usuarios y asignarles el rol actual.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FoundUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
}

interface Props {
  targetRole: string;
  targetRoleLabel: string;
}

export function AssignUserToRole({ targetRole, targetRoleLabel }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [justAssigned, setJustAssigned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/users?search=${encodeURIComponent(query)}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || data.items || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleAssign = async (userId: string) => {
    setAssigning(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "No se pudo asignar el rol");
      }
      setJustAssigned(userId);
      // Actualizar fila local
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      setTimeout(() => setJustAssigned(null), 2000);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Asignar usuarios a este rol
        </CardTitle>
        <CardDescription className="text-xs">
          Busque por nombre o email y asigne el rol <strong>{targetRoleLabel}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios por nombre o email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {error && (
          <div className="rounded bg-red-50 border border-red-200 text-red-700 text-xs p-2">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Buscando...
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No se encontraron usuarios
          </p>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {results.map((u) => {
            const alreadyHas = u.role === targetRole;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-2 border rounded-lg p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {u.name || u.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {u.role}
                    </Badge>
                    {!u.isActive && (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={alreadyHas ? "ghost" : "default"}
                  className={
                    !alreadyHas
                      ? "bg-[#D66829] hover:bg-[#c45a22]"
                      : ""
                  }
                  disabled={alreadyHas || assigning === u.id}
                  onClick={() => handleAssign(u.id)}
                >
                  {assigning === u.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : justAssigned === u.id || alreadyHas ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      {alreadyHas ? "Ya tiene" : "Asignado"}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Asignar
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
