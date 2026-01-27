"use client";

/**
 * CAARD - Panel de Secretaría: Revisión de Solicitudes
 * Solo accesible para roles SECRETARIA y SUPER_ADMIN
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Case {
  id: string;
  code: string;
  title: string;
  status: string;
  claimantName: string;
  respondentName: string;
  submittedAt: string;
  arbitrationType: {
    code: string;
    name: string;
  };
  _count: {
    documents: number;
    payments: number;
  };
}

interface PaginatedResponse {
  items: Case[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  SUBMITTED: { label: "Pendiente", variant: "outline", icon: Clock },
  ADMITTED: { label: "Admitido", variant: "default", icon: CheckCircle },
  REJECTED: { label: "Rechazado", variant: "destructive", icon: XCircle },
  IN_PROCESS: { label: "En proceso", variant: "secondary", icon: FileText },
};

export default function SecretariaSolicitudesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  // Modal de revisión
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [reviewAction, setReviewAction] = useState<"ADMIT" | "REJECT" | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar casos
  useEffect(() => {
    loadCases();
  }, [statusFilter, pagination.page]);

  async function loadCases() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        pageSize: "10",
      });
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/cases?${params}`);
      if (response.ok) {
        const data: PaginatedResponse = await response.json();
        setCases(data.items);
        setPagination({
          page: data.page,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading cases:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Buscar
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadCases();
  }

  // Revisar solicitud
  async function handleReview() {
    if (!selectedCase || !reviewAction) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/cases/${selectedCase.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        // Recargar lista
        loadCases();
        // Cerrar modal
        setSelectedCase(null);
        setReviewAction(null);
        setReviewComment("");
      }
    } catch (error) {
      console.error("Error reviewing case:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Revisión de Solicitudes</h1>
        <p className="text-muted-foreground">
          Revise y procese las solicitudes arbitrales pendientes
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, demandante o demandado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBMITTED">Pendientes</SelectItem>
                  <SelectItem value="ADMITTED">Admitidos</SelectItem>
                  <SelectItem value="REJECTED">Rechazados</SelectItem>
                  <SelectItem value="IN_PROCESS">En Proceso</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => loadCases()}>
                <Loader2 className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusFilter === "SUBMITTED" ? pagination.total : "-"}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de casos */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes {STATUS_CONFIG[statusFilter]?.label}</CardTitle>
          <CardDescription>
            {pagination.total} solicitud{pagination.total !== 1 ? "es" : ""} encontrada{pagination.total !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caso) => {
                const statusConfig = STATUS_CONFIG[caso.status] || STATUS_CONFIG.SUBMITTED;
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={caso.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-medium text-primary">
                          {caso.code}
                        </span>
                        <Badge variant={statusConfig.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline">{caso.arbitrationType.name}</Badge>
                      </div>

                      <h3 className="font-medium truncate">{caso.title}</h3>

                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {caso.claimantName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {caso.respondentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(caso.submittedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/cases/${caso.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>

                      {caso.status === "SUBMITTED" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedCase(caso);
                              setReviewAction("ADMIT");
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Admitir
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedCase(caso);
                              setReviewAction("REJECT");
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de revisión */}
      <Dialog open={!!selectedCase && !!reviewAction} onOpenChange={() => {
        setSelectedCase(null);
        setReviewAction(null);
        setReviewComment("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "ADMIT" ? "Admitir Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {selectedCase?.code} - {selectedCase?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {reviewAction === "REJECT" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Esta acción rechazará la solicitud. El demandante será notificado
                    y deberá subsanar las observaciones o presentar una nueva solicitud.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comment">
                {reviewAction === "ADMIT" ? "Observaciones (opcional)" : "Motivo del rechazo *"}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  reviewAction === "ADMIT"
                    ? "Agregue observaciones si lo considera necesario..."
                    : "Indique el motivo por el cual se rechaza la solicitud..."
                }
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCase(null);
                setReviewAction(null);
                setReviewComment("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={reviewAction === "ADMIT" ? "default" : "destructive"}
              onClick={handleReview}
              disabled={isSubmitting || (reviewAction === "REJECT" && !reviewComment.trim())}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : reviewAction === "ADMIT" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Admisión
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirmar Rechazo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
