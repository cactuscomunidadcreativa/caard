"use client";

/**
 * CAARD - Cliente de Plantillas de Notificación
 * Permite crear y editar plantillas para traslados y notificaciones
 * Integrado con API y base de datos
 */

import { useState, useEffect } from "react";
import {
  Mail,
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Save,
  Loader2,
  Search,
  Filter,
  Info,
  Smartphone,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Tipos de plantilla
const TEMPLATE_TYPES = [
  { value: "TRASLADO", label: "Traslado de documentos" },
  { value: "NOTIFICACION_ADMISION", label: "Notificación de admisión" },
  { value: "NOTIFICACION_RECHAZO", label: "Notificación de rechazo" },
  { value: "NOTIFICACION_AUDIENCIA", label: "Citación a audiencia" },
  { value: "NOTIFICACION_LAUDO", label: "Notificación de laudo" },
  { value: "RECORDATORIO_PLAZO", label: "Recordatorio de plazo" },
  { value: "REQUERIMIENTO_PAGO", label: "Requerimiento de pago" },
  { value: "DESIGNACION_ARBITRO", label: "Designación de árbitro" },
  { value: "SUSPENSION_CASO", label: "Suspensión de procedimiento" },
  { value: "CIERRE_CASO", label: "Cierre de expediente" },
  { value: "OTP", label: "Código de verificación" },
  { value: "WELCOME", label: "Bienvenida" },
  { value: "GENERAL", label: "Notificación general" },
];

// Variables disponibles para plantillas
const AVAILABLE_VARIABLES = [
  { key: "{{caseNumber}}", description: "Número de expediente" },
  { key: "{{caseName}}", description: "Nombre/título del caso" },
  { key: "{{partyName}}", description: "Nombre de la parte" },
  { key: "{{claimantName}}", description: "Nombre del demandante" },
  { key: "{{respondentName}}", description: "Nombre del demandado" },
  { key: "{{arbitratorName}}", description: "Nombre del árbitro" },
  { key: "{{lawyerName}}", description: "Nombre del abogado" },
  { key: "{{documentName}}", description: "Nombre del documento" },
  { key: "{{deadlineDate}}", description: "Fecha de plazo" },
  { key: "{{hearingDate}}", description: "Fecha de audiencia" },
  { key: "{{hearingTime}}", description: "Hora de audiencia" },
  { key: "{{hearingLocation}}", description: "Lugar de audiencia" },
  { key: "{{amount}}", description: "Monto" },
  { key: "{{paymentConcept}}", description: "Concepto de pago" },
  { key: "{{daysRemaining}}", description: "Días restantes" },
  { key: "{{today}}", description: "Fecha actual" },
  { key: "{{centerName}}", description: "Nombre del centro" },
  { key: "{{secretaryName}}", description: "Nombre del secretario" },
  { key: "{{rejectionReason}}", description: "Motivo de rechazo" },
  { key: "{{code}}", description: "Código OTP" },
];

interface Template {
  id: string;
  name: string;
  code: string;
  type: string;
  emailSubject: string | null;
  emailBody: string | null;
  emailHtmlBody: string | null;
  smsBody: string | null;
  whatsappBody: string | null;
  availableVariables: string[] | null;
  isActive: boolean;
  isDefault: boolean;
  description: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

// Datos de vista previa
const previewData: Record<string, string> = {
  caseNumber: "ARB-2024-0001",
  caseName: "Contrato de Suministro",
  partyName: "Juan Pérez López",
  claimantName: "Empresa ABC S.A.C.",
  respondentName: "Empresa XYZ S.A.",
  arbitratorName: "Dr. Carlos Arbitro",
  lawyerName: "Dra. María Abogada",
  documentName: "Contestación de demanda",
  deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("es-PE"),
  hearingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("es-PE"),
  hearingTime: "10:00 AM",
  hearingLocation: "Sala de Audiencias Virtual - Zoom",
  amount: "S/ 5,000.00",
  paymentConcept: "Gastos Arbitrales",
  daysRemaining: "7",
  today: new Date().toLocaleDateString("es-PE"),
  centerName: "CAARD",
  secretaryName: "Secretaría General CAARD",
  rejectionReason: "Documentación incompleta",
  code: "123456",
};

export function NotificationTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "GENERAL",
    emailSubject: "",
    emailBody: "",
    emailHtmlBody: "",
    smsBody: "",
    whatsappBody: "",
    description: "",
    category: "",
    isActive: true,
  });

  // Cargar plantillas desde API
  useEffect(() => {
    loadTemplates();
  }, [typeFilter]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/admin/notification-templates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        toast.error("Error al cargar plantillas");
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  };

  // Renderizar vista previa
  const renderPreview = (text: string | null | undefined) => {
    if (!text) return "";
    let result = text;
    Object.entries(previewData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return result;
  };

  // Crear/editar plantilla
  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.type) {
      toast.error("Complete nombre, código y tipo");
      return;
    }

    if (!formData.emailSubject && !formData.smsBody && !formData.whatsappBody) {
      toast.error("Agregue contenido al menos a un canal (Email, SMS o WhatsApp)");
      return;
    }

    setSaving(true);
    try {
      const url = selectedTemplate
        ? `/api/admin/notification-templates/${selectedTemplate.id}`
        : "/api/admin/notification-templates";

      const response = await fetch(url, {
        method: selectedTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      toast.success(selectedTemplate ? "Plantilla actualizada" : "Plantilla creada");
      setShowEditor(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar plantilla
  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta plantilla?")) return;

    try {
      const response = await fetch(`/api/admin/notification-templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar");
      }

      toast.success("Plantilla eliminada");
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  // Duplicar plantilla
  const handleDuplicate = (template: Template) => {
    setSelectedTemplate(null);
    setFormData({
      name: `${template.name} (copia)`,
      code: `${template.code}_COPY`,
      type: template.type,
      emailSubject: template.emailSubject || "",
      emailBody: template.emailBody || "",
      emailHtmlBody: template.emailHtmlBody || "",
      smsBody: template.smsBody || "",
      whatsappBody: template.whatsappBody || "",
      description: template.description || "",
      category: template.category || "",
      isActive: true,
    });
    setShowEditor(true);
  };

  // Toggle activo
  const handleToggleActive = async (template: Template) => {
    try {
      const response = await fetch(`/api/admin/notification-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar");
      }

      loadTemplates();
      toast.success(template.isActive ? "Plantilla desactivada" : "Plantilla activada");
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "GENERAL",
      emailSubject: "",
      emailBody: "",
      emailHtmlBody: "",
      smsBody: "",
      whatsappBody: "",
      description: "",
      category: "",
      isActive: true,
    });
    setSelectedTemplate(null);
  };

  // Abrir editor
  const openEditor = (template?: Template) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        code: template.code,
        type: template.type,
        emailSubject: template.emailSubject || "",
        emailBody: template.emailBody || "",
        emailHtmlBody: template.emailHtmlBody || "",
        smsBody: template.smsBody || "",
        whatsappBody: template.whatsappBody || "",
        description: template.description || "",
        category: template.category || "",
        isActive: template.isActive,
      });
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  // Generar código desde nombre
  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  // Filtrar plantillas
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.emailSubject?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  });

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-[#D66829]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Plantillas de Notificación
            </h1>
            <p className="text-sm text-muted-foreground">
              Personaliza las notificaciones por Email, SMS y WhatsApp
            </p>
          </div>
        </div>
        <Button onClick={() => openEditor()} className="bg-[#D66829] hover:bg-[#c45a22]">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Info */}
      <Alert className="mb-6 border-[#D66829]/20 bg-[#D66829]/5">
        <Info className="h-4 w-4 text-[#D66829]" />
        <AlertTitle className="text-[#D66829]">Variables disponibles</AlertTitle>
        <AlertDescription>
          Usa variables como <code className="bg-muted px-1 rounded">{"{{caseNumber}}"}</code> que
          se reemplazarán automáticamente al enviar la notificación.
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TEMPLATE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de plantillas */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay plantillas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crea tu primera plantilla de notificación
              </p>
              <Button onClick={() => openEditor()} className="bg-[#D66829] hover:bg-[#c45a22]">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Canales</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {template.code}
                        </p>
                        {template.isDefault && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Sistema
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {TEMPLATE_TYPES.find((t) => t.value === template.type)?.label || template.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1">
                        {template.emailSubject && (
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {template.smsBody && (
                          <Badge variant="secondary" className="text-xs">
                            <Smartphone className="h-3 w-3 mr-1" />
                            SMS
                          </Badge>
                        )}
                        {template.whatsappBody && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            WA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={() => handleToggleActive(template)}
                          disabled={template.isDefault}
                        />
                        <span className="text-xs text-muted-foreground">
                          {template.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowPreview(true);
                          }}
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditor(template)}
                          title="Editar"
                          disabled={template.isDefault}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicate(template)}
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(template.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
            <DialogDescription>
              Configura el contenido para cada canal de notificación
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre de la plantilla *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        code: selectedTemplate ? formData.code : generateCode(e.target.value),
                      });
                    }}
                    placeholder="Ej: Traslado de demanda"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código único *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })
                    }
                    placeholder="Ej: TRASLADO_DEMANDA"
                    disabled={!!selectedTemplate}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de plantilla *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría (opcional)</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej: Procesal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe cuándo usar esta plantilla..."
                  rows={2}
                />
              </div>

              {/* Variables disponibles */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium mb-3">Variables disponibles</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Clic en una variable para copiarla
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(v.key);
                        toast.success(`"${v.key}" copiado`);
                      }}
                      title={v.description}
                    >
                      {v.key}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Asunto del email
                </Label>
                <Input
                  value={formData.emailSubject}
                  onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                  placeholder="Ej: Traslado de Solicitud - Expediente {{caseNumber}}"
                />
              </div>

              <div className="space-y-2">
                <Label>Cuerpo del email (texto plano)</Label>
                <Textarea
                  value={formData.emailBody}
                  onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                  placeholder="Escribe el contenido del email..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mensaje SMS
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formData.smsBody.length}/160 caracteres
                  </span>
                </Label>
                <Textarea
                  value={formData.smsBody}
                  onChange={(e) => setFormData({ ...formData, smsBody: e.target.value.substring(0, 320) })}
                  placeholder="Mensaje corto para SMS..."
                  rows={4}
                  maxLength={320}
                />
                <p className="text-xs text-muted-foreground">
                  Los SMS tienen un límite de 160 caracteres por mensaje. Mensajes más largos se enviarán en partes.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  Mensaje de WhatsApp
                </Label>
                <Textarea
                  value={formData.whatsappBody}
                  onChange={(e) => setFormData({ ...formData, whatsappBody: e.target.value })}
                  placeholder="Mensaje para WhatsApp (soporta *negritas* y _cursivas_)..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  WhatsApp soporta formato: *negrita*, _cursiva_, ~tachado~
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#D66829] hover:bg-[#c45a22]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Vista Previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Así se verá la notificación con datos de ejemplo
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email" disabled={!selectedTemplate.emailSubject}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" disabled={!selectedTemplate.smsBody}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp" disabled={!selectedTemplate.whatsappBody}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-4">
                {selectedTemplate.emailSubject ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Asunto:</span>
                      </div>
                      <p className="font-medium">{renderPreview(selectedTemplate.emailSubject)}</p>
                    </div>
                    <Separator />
                    <div className="rounded-lg border p-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {renderPreview(selectedTemplate.emailBody)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Sin contenido de email</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sms" className="mt-4">
                {selectedTemplate.smsBody ? (
                  <div className="rounded-lg border p-4 bg-gray-100">
                    <div className="max-w-xs mx-auto bg-white rounded-2xl p-4 shadow-sm">
                      <p className="text-sm">{renderPreview(selectedTemplate.smsBody)}</p>
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {renderPreview(selectedTemplate.smsBody).length} caracteres
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Sin contenido de SMS</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="whatsapp" className="mt-4">
                {selectedTemplate.whatsappBody ? (
                  <div className="rounded-lg border p-4 bg-[#e5ddd5]">
                    <div className="max-w-sm ml-auto bg-[#dcf8c6] rounded-lg p-3 shadow-sm">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {renderPreview(selectedTemplate.whatsappBody)}
                      </pre>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Sin contenido de WhatsApp</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
