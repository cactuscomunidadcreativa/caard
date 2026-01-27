"use client";

/**
 * CAARD - Gestión de Plantillas de Notificación (Simplificado)
 * Permite crear y editar plantillas para traslados y notificaciones
 */

import { useState, useEffect } from "react";
import {
  Mail,
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  Loader2,
  Search,
  Smartphone,
  MessageSquare,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Tipos de plantilla
const TEMPLATE_TYPES = [
  { value: "TRASLADO", label: "Traslado" },
  { value: "NOTIFICACION_ADMISION", label: "Admisión" },
  { value: "NOTIFICACION_RECHAZO", label: "Rechazo" },
  { value: "NOTIFICACION_AUDIENCIA", label: "Audiencia" },
  { value: "NOTIFICACION_LAUDO", label: "Laudo" },
  { value: "RECORDATORIO_PLAZO", label: "Recordatorio" },
  { value: "REQUERIMIENTO_PAGO", label: "Pago" },
  { value: "DESIGNACION_ARBITRO", label: "Árbitro" },
  { value: "OTP", label: "OTP" },
  { value: "GENERAL", label: "General" },
];

// Variables disponibles con descripciones claras
const VARIABLES = [
  { key: "{{caseNumber}}", label: "Nº Expediente", desc: "ARB-2025-0001" },
  { key: "{{caseName}}", label: "Nombre del Caso", desc: "Título del arbitraje" },
  { key: "{{partyName}}", label: "Nombre de Parte", desc: "Destinatario" },
  { key: "{{claimantName}}", label: "Demandante", desc: "Nombre completo" },
  { key: "{{respondentName}}", label: "Demandado", desc: "Nombre completo" },
  { key: "{{arbitratorName}}", label: "Árbitro", desc: "Árbitro asignado" },
  { key: "{{lawyerName}}", label: "Abogado", desc: "Representante legal" },
  { key: "{{documentName}}", label: "Documento", desc: "Nombre del escrito" },
  { key: "{{deadlineDate}}", label: "Fecha Plazo", desc: "Fecha de vencimiento" },
  { key: "{{daysRemaining}}", label: "Días Restantes", desc: "Para el plazo" },
  { key: "{{hearingDate}}", label: "Fecha Audiencia", desc: "Día programado" },
  { key: "{{hearingTime}}", label: "Hora Audiencia", desc: "Hora programada" },
  { key: "{{hearingLocation}}", label: "Lugar/Link", desc: "Ubicación o Zoom" },
  { key: "{{amount}}", label: "Monto", desc: "Valor monetario" },
  { key: "{{paymentConcept}}", label: "Concepto Pago", desc: "Descripción" },
  { key: "{{today}}", label: "Fecha Actual", desc: "Hoy automático" },
  { key: "{{centerName}}", label: "Centro", desc: "CAARD" },
  { key: "{{secretaryName}}", label: "Secretario", desc: "Nombre secretario" },
  { key: "{{rejectionReason}}", label: "Motivo Rechazo", desc: "Razón" },
  { key: "{{code}}", label: "Código OTP", desc: "Verificación" },
];

interface Template {
  id: string;
  name: string;
  code: string;
  type: string;
  emailSubject: string | null;
  emailBody: string | null;
  smsBody: string | null;
  whatsappBody: string | null;
  isActive: boolean;
  isDefault: boolean;
}

export function NotificationTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Estado del formulario
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "GENERAL",
    emailSubject: "",
    emailBody: "",
    smsBody: "",
    whatsappBody: "",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notification-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      toast.error("Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      type: "GENERAL",
      emailSubject: "",
      emailBody: "",
      smsBody: "",
      whatsappBody: "",
    });
    setEditingId(null);
    setShowNew(false);
  };

  const handleEdit = (template: Template) => {
    setForm({
      name: template.name,
      code: template.code,
      type: template.type,
      emailSubject: template.emailSubject || "",
      emailBody: template.emailBody || "",
      smsBody: template.smsBody || "",
      whatsappBody: template.whatsappBody || "",
    });
    setEditingId(template.id);
    setShowNew(true);
  };

  const handleDuplicate = (template: Template) => {
    setForm({
      name: `${template.name} (copia)`,
      code: `${template.code}_COPY`,
      type: template.type,
      emailSubject: template.emailSubject || "",
      emailBody: template.emailBody || "",
      smsBody: template.smsBody || "",
      whatsappBody: template.whatsappBody || "",
    });
    setEditingId(null);
    setShowNew(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.type) {
      toast.error("Complete nombre, código y tipo");
      return;
    }

    if (!form.emailSubject && !form.smsBody && !form.whatsappBody) {
      toast.error("Agregue contenido a al menos un canal");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/notification-templates/${editingId}`
        : "/api/admin/notification-templates";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast.success(editingId ? "Plantilla actualizada" : "Plantilla creada");
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;

    try {
      const res = await fetch(`/api/admin/notification-templates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Plantilla eliminada");
      loadTemplates();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      await fetch(`/api/admin/notification-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      loadTemplates();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const copyVariable = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success(`${v} copiado`);
  };

  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#D66829] flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Plantillas de Notificación
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Email, SMS y WhatsApp
          </p>
        </div>
        {!showNew && (
          <Button
            onClick={() => setShowNew(true)}
            className="bg-[#D66829] hover:bg-[#c45a22]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva
          </Button>
        )}
      </div>

      {/* Formulario Nueva/Editar */}
      {showNew && (
        <Card className="mb-6 border-[#D66829]/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingId ? "Editar Plantilla" : "Nueva Plantilla"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info básica */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      code: editingId ? form.code : generateCode(e.target.value),
                    })
                  }
                  placeholder="Traslado de demanda"
                />
              </div>
              <div>
                <Label className="text-xs">Código *</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    })
                  }
                  placeholder="TRASLADO_DEMANDA"
                  disabled={!!editingId}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Variables con descripciones */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">
                  Variables automáticas (datos del caso)
                </p>
                <p className="text-xs text-muted-foreground">
                  Clic para copiar
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {VARIABLES.map((v) => (
                  <div
                    key={v.key}
                    className="flex items-center gap-2 p-2 rounded border bg-background cursor-pointer hover:border-[#D66829] hover:bg-[#D66829]/5 transition-colors"
                    onClick={() => copyVariable(v.key)}
                    title={`Clic para copiar: ${v.key}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{v.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {v.desc}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                      {v.key.replace(/[{}]/g, "")}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 border-t pt-2">
                Estas variables se reemplazan automáticamente con la información real del expediente al enviar la notificación.
              </p>
            </div>

            {/* Canales */}
            <div className="grid gap-4">
              {/* Email */}
              <div className="space-y-2 p-3 border rounded-lg">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email
                </Label>
                <Input
                  value={form.emailSubject}
                  onChange={(e) =>
                    setForm({ ...form, emailSubject: e.target.value })
                  }
                  placeholder="Asunto del email"
                  className="text-sm"
                />
                <Textarea
                  value={form.emailBody}
                  onChange={(e) =>
                    setForm({ ...form, emailBody: e.target.value })
                  }
                  placeholder="Cuerpo del email..."
                  rows={4}
                  className="text-sm"
                />
              </div>

              {/* SMS y WhatsApp lado a lado */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 p-3 border rounded-lg">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Smartphone className="h-4 w-4 text-gray-600" />
                    SMS
                    <span className="text-xs text-muted-foreground ml-auto">
                      {form.smsBody.length}/160
                    </span>
                  </Label>
                  <Textarea
                    value={form.smsBody}
                    onChange={(e) =>
                      setForm({ ...form, smsBody: e.target.value.substring(0, 320) })
                    }
                    placeholder="Mensaje corto..."
                    rows={3}
                    maxLength={320}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2 p-3 border rounded-lg">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    WhatsApp
                  </Label>
                  <Textarea
                    value={form.whatsappBody}
                    onChange={(e) =>
                      setForm({ ...form, whatsappBody: e.target.value })
                    }
                    placeholder="Mensaje de WhatsApp..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#D66829] hover:bg-[#c45a22]"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar plantillas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de plantillas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No hay plantillas</p>
            <Button
              onClick={() => setShowNew(true)}
              className="mt-4 bg-[#D66829] hover:bg-[#c45a22]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`${!template.isActive ? "opacity-60" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {TEMPLATE_TYPES.find((t) => t.value === template.type)?.label ||
                          template.type}
                      </Badge>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Sistema
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {template.code}
                    </p>

                    {/* Canales */}
                    <div className="flex gap-2 mt-2">
                      {template.emailSubject && (
                        <Badge variant="outline" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Badge>
                      )}
                      {template.smsBody && (
                        <Badge variant="outline" className="text-xs">
                          <Smartphone className="h-3 w-3 mr-1" />
                          SMS
                        </Badge>
                      )}
                      {template.whatsappBody && (
                        <Badge
                          variant="outline"
                          className="text-xs text-green-700"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          WA
                        </Badge>
                      )}
                    </div>

                    {/* Vista previa expandible */}
                    {expandedId === template.id && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                        {template.emailSubject && (
                          <div>
                            <span className="font-medium">Email:</span>{" "}
                            {template.emailSubject}
                          </div>
                        )}
                        {template.smsBody && (
                          <div>
                            <span className="font-medium">SMS:</span>{" "}
                            {template.smsBody}
                          </div>
                        )}
                        {template.whatsappBody && (
                          <div>
                            <span className="font-medium">WhatsApp:</span>{" "}
                            {template.whatsappBody}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={() => handleToggleActive(template)}
                      disabled={template.isDefault}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setExpandedId(
                          expandedId === template.id ? null : template.id
                        )
                      }
                      title="Vista previa"
                    >
                      {expandedId === template.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(template)}
                      disabled={template.isDefault}
                      title="Editar"
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
