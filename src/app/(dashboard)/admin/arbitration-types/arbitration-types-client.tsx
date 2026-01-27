"use client";

/**
 * CAARD - Cliente de Tipos de Arbitraje
 * Gestión completa de tipos de arbitraje con reglas de notificación
 */

import { useState } from "react";
import {
  Role,
  ArbitrationKind,
  TribunalMode,
  NotificationChannel,
  NotificationEventType,
} from "@prisma/client";
import {
  Scale,
  Plus,
  Settings,
  Bell,
  Building2,
  Briefcase,
  Users,
  Clock,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  X,
  DollarSign,
  Mail,
  MessageSquare,
  Smartphone,
  Filter,
  Search,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

// Tipos
interface NotificationRule {
  id: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  targetRoles: Role[];
  templateKey: string;
  subjectTemplate: string | null;
  bodyTemplate: string | null;
  ruleConfig: any;
  isActive: boolean;
}

interface ArbitrationType {
  id: string;
  centerId: string;
  code: string;
  name: string;
  description: string | null;
  kind: ArbitrationKind;
  tribunalMode: TribunalMode;
  baseFeeCents: number | null;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  center: {
    id: string;
    code: string;
    name: string;
  };
  notificationRules: NotificationRule[];
  _count: {
    cases: number;
  };
}

interface Center {
  id: string;
  code: string;
  name: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  totalCases: number;
  totalRules: number;
}

interface ArbitrationTypesClientProps {
  arbitrationTypes: ArbitrationType[];
  centers: Center[];
  stats: Stats;
  userRole: Role;
  userCenterId?: string;
}

// Constantes de traducción
const KIND_LABELS: Record<ArbitrationKind, string> = {
  INSTITUTIONAL: "Institucional",
  AD_HOC: "Ad Hoc",
};

const TRIBUNAL_MODE_LABELS: Record<TribunalMode, string> = {
  SOLE_ARBITRATOR: "Árbitro Único",
  TRIBUNAL_3: "Tribunal de 3",
};

const EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  CASE_SUBMITTED: "Caso Enviado",
  CASE_OBSERVED: "Caso Observado",
  CASE_ADMITTED: "Caso Admitido",
  CASE_REJECTED: "Caso Rechazado",
  DOCUMENT_UPLOADED: "Documento Subido",
  DOCUMENT_REPLACED: "Documento Reemplazado",
  DEADLINE_UPCOMING: "Plazo Próximo",
  DEADLINE_OVERDUE: "Plazo Vencido",
  HEARING_SCHEDULED: "Audiencia Programada",
  HEARING_UPDATED: "Audiencia Actualizada",
  HEARING_REMINDER: "Recordatorio de Audiencia",
  PAYMENT_REQUIRED: "Pago Requerido",
  PAYMENT_PENDING: "Pago Pendiente",
  PAYMENT_CONFIRMED: "Pago Confirmado",
  PAYMENT_FAILED: "Pago Fallido",
  PAYMENT_OVERDUE: "Pago Vencido",
  AWARD_ISSUED: "Laudo Emitido",
  CASE_CLOSED: "Caso Cerrado",
};

const CHANNEL_CONFIG: Record<
  NotificationChannel,
  { label: string; icon: typeof Mail }
> = {
  EMAIL: { label: "Email", icon: Mail },
  SMS: { label: "SMS", icon: Smartphone },
  WHATSAPP: { label: "WhatsApp", icon: MessageSquare },
  PUSH: { label: "Push", icon: Bell },
  IN_APP: { label: "En App", icon: MessageSquare },
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  CENTER_STAFF: "Staff Centro",
  SECRETARIA: "Secretaría",
  ARBITRO: "Árbitro",
  ABOGADO: "Abogado",
  DEMANDANTE: "Demandante",
  DEMANDADO: "Demandado",
};

const NOTIFICATION_ROLES: Role[] = [
  "SECRETARIA",
  "ARBITRO",
  "ABOGADO",
  "DEMANDANTE",
  "DEMANDADO",
];

export function ArbitrationTypesClient({
  arbitrationTypes: initialTypes,
  centers,
  stats,
  userRole,
  userCenterId,
}: ArbitrationTypesClientProps) {
  const [arbitrationTypes, setArbitrationTypes] =
    useState<ArbitrationType[]>(initialTypes);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCenter, setFilterCenter] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingType, setEditingType] = useState<ArbitrationType | null>(null);
  const [editingRule, setEditingRule] = useState<{
    rule: NotificationRule | null;
    typeId: string;
  } | null>(null);

  // Form state para tipo
  const [typeForm, setTypeForm] = useState({
    centerId: userCenterId || "",
    code: "",
    name: "",
    description: "",
    kind: "INSTITUTIONAL" as ArbitrationKind,
    tribunalMode: "SOLE_ARBITRATOR" as TribunalMode,
    baseFeeCents: "",
    currency: "PEN",
    isActive: true,
  });

  // Form state para regla
  const [ruleForm, setRuleForm] = useState({
    eventType: "CASE_SUBMITTED" as NotificationEventType,
    channel: "EMAIL" as NotificationChannel,
    targetRoles: [] as Role[],
    templateKey: "",
    subjectTemplate: "",
    bodyTemplate: "",
    hoursBefore: "",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar tipos
  const filteredTypes = arbitrationTypes.filter((type) => {
    const matchesSearch =
      type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.center.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCenter =
      filterCenter === "all" || type.centerId === filterCenter;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && type.isActive) ||
      (filterStatus === "inactive" && !type.isActive);

    return matchesSearch && matchesCenter && matchesStatus;
  });

  // Toggle expandir tipo
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Abrir dialog para crear/editar tipo
  const openTypeDialog = (type?: ArbitrationType) => {
    if (type) {
      setEditingType(type);
      setTypeForm({
        centerId: type.centerId,
        code: type.code,
        name: type.name,
        description: type.description || "",
        kind: type.kind,
        tribunalMode: type.tribunalMode,
        baseFeeCents: type.baseFeeCents
          ? (type.baseFeeCents / 100).toString()
          : "",
        currency: type.currency,
        isActive: type.isActive,
      });
    } else {
      setEditingType(null);
      setTypeForm({
        centerId: userCenterId || centers[0]?.id || "",
        code: "",
        name: "",
        description: "",
        kind: "INSTITUTIONAL",
        tribunalMode: "SOLE_ARBITRATOR",
        baseFeeCents: "",
        currency: "PEN",
        isActive: true,
      });
    }
    setShowTypeDialog(true);
  };

  // Abrir dialog para crear/editar regla
  const openRuleDialog = (typeId: string, rule?: NotificationRule) => {
    if (rule) {
      setEditingRule({ rule, typeId });
      setRuleForm({
        eventType: rule.eventType,
        channel: rule.channel,
        targetRoles: rule.targetRoles,
        templateKey: rule.templateKey,
        subjectTemplate: rule.subjectTemplate || "",
        bodyTemplate: rule.bodyTemplate || "",
        hoursBefore: rule.ruleConfig?.hoursBefore?.toString() || "",
        isActive: rule.isActive,
      });
    } else {
      setEditingRule({ rule: null, typeId });
      setRuleForm({
        eventType: "CASE_SUBMITTED",
        channel: "EMAIL",
        targetRoles: [],
        templateKey: "",
        subjectTemplate: "",
        bodyTemplate: "",
        hoursBefore: "",
        isActive: true,
      });
    }
    setShowRuleDialog(true);
  };

  // Guardar tipo de arbitraje
  const handleSaveType = async () => {
    if (!typeForm.code || !typeForm.name || !typeForm.centerId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        centerId: typeForm.centerId,
        code: typeForm.code.toUpperCase(),
        name: typeForm.name,
        description: typeForm.description || null,
        kind: typeForm.kind,
        tribunalMode: typeForm.tribunalMode,
        baseFeeCents: typeForm.baseFeeCents
          ? Math.round(parseFloat(typeForm.baseFeeCents) * 100)
          : null,
        currency: typeForm.currency,
        isActive: typeForm.isActive,
      };

      const response = await fetch(
        editingType
          ? `/api/admin/arbitration-types/${editingType.id}`
          : "/api/admin/arbitration-types",
        {
          method: editingType ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      const { arbitrationType } = await response.json();

      if (editingType) {
        setArbitrationTypes((prev) =>
          prev.map((t) => (t.id === arbitrationType.id ? arbitrationType : t))
        );
      } else {
        setArbitrationTypes((prev) => [...prev, arbitrationType]);
      }

      setShowTypeDialog(false);
    } catch (error) {
      console.error("Error saving type:", error);
      alert(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guardar regla de notificación
  const handleSaveRule = async () => {
    if (!editingRule || !ruleForm.templateKey || ruleForm.targetRoles.length === 0)
      return;

    setIsSubmitting(true);
    try {
      const payload = {
        arbitrationTypeId: editingRule.typeId,
        eventType: ruleForm.eventType,
        channel: ruleForm.channel,
        targetRoles: ruleForm.targetRoles,
        templateKey: ruleForm.templateKey,
        subjectTemplate: ruleForm.subjectTemplate || null,
        bodyTemplate: ruleForm.bodyTemplate || null,
        ruleConfig: ruleForm.hoursBefore
          ? { hoursBefore: parseInt(ruleForm.hoursBefore) }
          : null,
        isActive: ruleForm.isActive,
      };

      const response = await fetch(
        editingRule.rule
          ? `/api/admin/notification-rules/${editingRule.rule.id}`
          : "/api/admin/notification-rules",
        {
          method: editingRule.rule ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar regla");
      }

      // Recargar datos
      window.location.reload();
    } catch (error) {
      console.error("Error saving rule:", error);
      alert(error instanceof Error ? error.message : "Error al guardar regla");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar regla
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("¿Está seguro de eliminar esta regla?")) return;

    try {
      const response = await fetch(`/api/admin/notification-rules/${ruleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error deleting rule:", error);
      alert("Error al eliminar regla");
    }
  };

  // Formatear precio
  const formatPrice = (cents: number | null, currency: string) => {
    if (!cents) return "-";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6" />
            Tipos de Arbitraje
          </h1>
          <p className="text-muted-foreground">
            Gestiona los tipos de arbitraje y sus reglas de notificación
          </p>
        </div>

        <Button onClick={() => openTypeDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Casos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reglas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, nombre o centro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {userRole === "SUPER_ADMIN" && (
              <Select value={filterCenter} onValueChange={setFilterCenter}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los centros</SelectItem>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tipos */}
      <div className="space-y-4">
        {filteredTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scale className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                No hay tipos de arbitraje
              </h3>
              <p className="text-muted-foreground text-center mt-1">
                {searchTerm || filterCenter !== "all" || filterStatus !== "all"
                  ? "No se encontraron resultados con los filtros actuales"
                  : "Crea el primer tipo de arbitraje para comenzar"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTypes.map((type) => (
            <Collapsible
              key={type.id}
              open={expandedIds.has(type.id)}
              onOpenChange={() => toggleExpand(type.id)}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          {expandedIds.has(type.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                          <Badge variant="outline">{type.code}</Badge>
                          <Badge
                            variant={type.isActive ? "default" : "secondary"}
                          >
                            {type.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {type.description || "Sin descripción"}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {type.center.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {TRIBUNAL_MODE_LABELS[type.tribunalMode]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {type._count.cases} casos
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatPrice(type.baseFeeCents, type.currency)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {type.notificationRules.length} reglas
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTypeDialog(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Tabs defaultValue="rules" className="w-full">
                      <TabsList>
                        <TabsTrigger value="rules">
                          <Bell className="h-4 w-4 mr-2" />
                          Reglas de Notificación
                        </TabsTrigger>
                        <TabsTrigger value="config">
                          <Settings className="h-4 w-4 mr-2" />
                          Configuración
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="rules" className="mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Reglas de Notificación</h4>
                          <Button
                            size="sm"
                            onClick={() => openRuleDialog(type.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Regla
                          </Button>
                        </div>

                        {type.notificationRules.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No hay reglas configuradas</p>
                            <p className="text-sm">
                              Agrega reglas para automatizar notificaciones
                            </p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Evento</TableHead>
                                <TableHead>Canal</TableHead>
                                <TableHead>Destinatarios</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[100px]">
                                  Acciones
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {type.notificationRules.map((rule) => {
                                const ChannelIcon =
                                  CHANNEL_CONFIG[rule.channel].icon;
                                return (
                                  <TableRow key={rule.id}>
                                    <TableCell className="font-medium">
                                      {EVENT_TYPE_LABELS[rule.eventType]}
                                      {rule.ruleConfig?.hoursBefore && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({rule.ruleConfig.hoursBefore}h antes)
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <ChannelIcon className="h-4 w-4" />
                                        {CHANNEL_CONFIG[rule.channel].label}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {rule.targetRoles.map((role) => (
                                          <Badge
                                            key={role}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {ROLE_LABELS[role]}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                        {rule.templateKey}
                                      </code>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          rule.isActive ? "default" : "secondary"
                                        }
                                      >
                                        {rule.isActive ? "Activa" : "Inactiva"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            openRuleDialog(type.id, rule)
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleDeleteRule(rule.id)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </TabsContent>

                      <TabsContent value="config" className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Tipo</Label>
                            <p>{KIND_LABELS[type.kind]}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Modo de Tribunal
                            </Label>
                            <p>{TRIBUNAL_MODE_LABELS[type.tribunalMode]}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Tarifa Base
                            </Label>
                            <p>{formatPrice(type.baseFeeCents, type.currency)}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Moneda
                            </Label>
                            <p>{type.currency}</p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>

      {/* Dialog Tipo de Arbitraje */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Editar Tipo de Arbitraje" : "Nuevo Tipo de Arbitraje"}
            </DialogTitle>
            <DialogDescription>
              Configure los parámetros del tipo de arbitraje
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {userRole === "SUPER_ADMIN" && (
                <div className="space-y-2">
                  <Label htmlFor="centerId">Centro *</Label>
                  <Select
                    value={typeForm.centerId}
                    onValueChange={(v) =>
                      setTypeForm({ ...typeForm, centerId: v })
                    }
                    disabled={!!editingType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar centro" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={typeForm.code}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="COMERCIAL"
                  disabled={!!editingType}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={typeForm.name}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, name: e.target.value })
                  }
                  placeholder="Arbitraje Comercial"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={typeForm.description}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, description: e.target.value })
                  }
                  placeholder="Descripción del tipo de arbitraje..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kind">Tipo de Arbitraje</Label>
                <Select
                  value={typeForm.kind}
                  onValueChange={(v) =>
                    setTypeForm({ ...typeForm, kind: v as ArbitrationKind })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tribunalMode">Modo de Tribunal</Label>
                <Select
                  value={typeForm.tribunalMode}
                  onValueChange={(v) =>
                    setTypeForm({ ...typeForm, tribunalMode: v as TribunalMode })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIBUNAL_MODE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseFeeCents">Tarifa Base</Label>
                <Input
                  id="baseFeeCents"
                  type="number"
                  step="0.01"
                  min="0"
                  value={typeForm.baseFeeCents}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, baseFeeCents: e.target.value })
                  }
                  placeholder="500.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={typeForm.currency}
                  onValueChange={(v) =>
                    setTypeForm({ ...typeForm, currency: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">PEN - Soles</SelectItem>
                    <SelectItem value="USD">USD - Dólares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  id="isActive"
                  checked={typeForm.isActive}
                  onCheckedChange={(v) =>
                    setTypeForm({ ...typeForm, isActive: v })
                  }
                />
                <Label htmlFor="isActive">Activo</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveType} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Regla de Notificación */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule?.rule ? "Editar Regla" : "Nueva Regla de Notificación"}
            </DialogTitle>
            <DialogDescription>
              Configure cuándo y a quién se envían las notificaciones
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventType">Evento *</Label>
                <Select
                  value={ruleForm.eventType}
                  onValueChange={(v) =>
                    setRuleForm({
                      ...ruleForm,
                      eventType: v as NotificationEventType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Canal *</Label>
                <Select
                  value={ruleForm.channel}
                  onValueChange={(v) =>
                    setRuleForm({ ...ruleForm, channel: v as NotificationChannel })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Destinatarios *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-md">
                  {NOTIFICATION_ROLES.map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={ruleForm.targetRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRuleForm({
                              ...ruleForm,
                              targetRoles: [...ruleForm.targetRoles, role],
                            });
                          } else {
                            setRuleForm({
                              ...ruleForm,
                              targetRoles: ruleForm.targetRoles.filter(
                                (r) => r !== role
                              ),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`role-${role}`}
                        className="text-sm cursor-pointer"
                      >
                        {ROLE_LABELS[role]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateKey">Template Key *</Label>
                <Input
                  id="templateKey"
                  value={ruleForm.templateKey}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, templateKey: e.target.value })
                  }
                  placeholder="case_submitted_notification"
                />
              </div>

              {(ruleForm.eventType === "DEADLINE_UPCOMING" ||
                ruleForm.eventType === "HEARING_REMINDER") && (
                <div className="space-y-2">
                  <Label htmlFor="hoursBefore">Horas antes</Label>
                  <Input
                    id="hoursBefore"
                    type="number"
                    min="1"
                    value={ruleForm.hoursBefore}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, hoursBefore: e.target.value })
                    }
                    placeholder="48"
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subjectTemplate">Asunto (Template)</Label>
                <Input
                  id="subjectTemplate"
                  value={ruleForm.subjectTemplate}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, subjectTemplate: e.target.value })
                  }
                  placeholder="Nuevo caso recibido: {{caseCode}}"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bodyTemplate">Cuerpo (Template)</Label>
                <Textarea
                  id="bodyTemplate"
                  value={ruleForm.bodyTemplate}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, bodyTemplate: e.target.value })
                  }
                  placeholder="Estimado(a) {{userName}}, se ha recibido un nuevo caso..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  id="ruleIsActive"
                  checked={ruleForm.isActive}
                  onCheckedChange={(v) =>
                    setRuleForm({ ...ruleForm, isActive: v })
                  }
                />
                <Label htmlFor="ruleIsActive">Regla Activa</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRule} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
