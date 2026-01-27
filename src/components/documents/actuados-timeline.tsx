"use client";

/**
 * Timeline de Actuados
 * =====================
 * Muestra el historial cronológico de actuaciones del expediente
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Download,
  ExternalLink,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Gavel,
  DollarSign,
  Mail,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos de actuación
interface Actuado {
  id: string;
  type: ActuadoType;
  title: string;
  description?: string;
  date: Date;
  author?: string;
  authorRole?: string;
  documentId?: string;
  documentUrl?: string;
  status?: "completed" | "pending" | "cancelled";
  metadata?: Record<string, any>;
}

type ActuadoType =
  | "DEMANDA"
  | "CONTESTACION"
  | "RECONVENCION"
  | "PROVIDENCIA"
  | "RESOLUCION"
  | "LAUDO"
  | "NOTIFICACION"
  | "PAGO"
  | "AUDIENCIA"
  | "DOCUMENTO"
  | "PLAZO"
  | "ESTADO";

// Configuración visual por tipo
const typeConfig: Record<
  ActuadoType,
  { icon: any; color: string; bgColor: string; label: string }
> = {
  DEMANDA: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Demanda",
  },
  CONTESTACION: {
    icon: FileText,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Contestación",
  },
  RECONVENCION: {
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Reconvención",
  },
  PROVIDENCIA: {
    icon: Gavel,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Providencia",
  },
  RESOLUCION: {
    icon: Gavel,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Resolución",
  },
  LAUDO: {
    icon: Gavel,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Laudo",
  },
  NOTIFICACION: {
    icon: Mail,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    label: "Notificación",
  },
  PAGO: {
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    label: "Pago",
  },
  AUDIENCIA: {
    icon: Calendar,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    label: "Audiencia",
  },
  DOCUMENTO: {
    icon: Upload,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Documento",
  },
  PLAZO: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Plazo",
  },
  ESTADO: {
    icon: CheckCircle,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    label: "Cambio de Estado",
  },
};

interface ActuadosTimelineProps {
  actuados: Actuado[];
  caseCode?: string;
  onDownload?: (actuado: Actuado) => void;
  showFilters?: boolean;
  maxHeight?: string;
}

export function ActuadosTimeline({
  actuados,
  caseCode,
  onDownload,
  showFilters = true,
  maxHeight = "600px",
}: ActuadosTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ActuadoType | "ALL">("ALL");

  // Filtrar actuados
  const filteredActuados =
    filter === "ALL"
      ? actuados
      : actuados.filter((a) => a.type === filter);

  // Ordenar por fecha descendente
  const sortedActuados = [...filteredActuados].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Toggle expansión
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener tipos únicos para filtros
  const uniqueTypes = Array.from(new Set(actuados.map((a) => a.type)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Actuados del Expediente</CardTitle>
            <CardDescription>
              {caseCode && `${caseCode} • `}
              {sortedActuados.length} actuaciones
            </CardDescription>
          </div>

          {showFilters && (
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as ActuadoType | "ALL")}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="ALL">Todos</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeConfig[type]?.label || type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          {sortedActuados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>No hay actuados registrados</p>
            </div>
          ) : (
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {sortedActuados.map((actuado, index) => {
                  const config = typeConfig[actuado.type] || typeConfig.DOCUMENTO;
                  const Icon = config.icon;
                  const isExpanded = expandedItems.has(actuado.id);

                  return (
                    <div key={actuado.id} className="relative pl-10">
                      {/* Punto en la línea */}
                      <div
                        className={cn(
                          "absolute left-2.5 w-4 h-4 rounded-full border-2 border-background",
                          config.bgColor
                        )}
                      >
                        <Icon
                          className={cn("h-2.5 w-2.5 m-0.5", config.color)}
                        />
                      </div>

                      {/* Contenido */}
                      <div
                        className={cn(
                          "rounded-lg border p-4 transition-colors",
                          index === 0 && "border-primary/50 bg-primary/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn(config.color, config.bgColor)}
                              >
                                {config.label}
                              </Badge>
                              {actuado.status === "pending" && (
                                <Badge variant="secondary">Pendiente</Badge>
                              )}
                              {actuado.status === "cancelled" && (
                                <Badge variant="destructive">Cancelado</Badge>
                              )}
                            </div>

                            <h4 className="font-semibold">{actuado.title}</h4>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(actuado.date)}
                              </span>
                              {actuado.author && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {actuado.author}
                                  {actuado.authorRole && ` (${actuado.authorRole})`}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {actuado.documentUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDownload?.(actuado)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {actuado.description && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleExpand(actuado.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Descripción expandible */}
                        {isExpanded && actuado.description && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {actuado.description}
                            </p>
                            {actuado.metadata && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <pre>
                                  {JSON.stringify(actuado.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ActuadosTimeline;
