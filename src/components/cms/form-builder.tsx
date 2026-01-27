/**
 * CAARD CMS - Constructor de Formularios Dinámico
 * Permite crear formularios personalizados sin código
 */

"use client";

import { useState } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  Settings,
  Type,
  Mail,
  Phone,
  AlignLeft,
  List,
  CheckSquare,
  Calendar,
  Upload,
  ToggleLeft,
  Hash,
  Link as LinkIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Field Types
export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "time"
  | "datetime"
  | "number"
  | "url"
  | "file"
  | "hidden";

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[]; // For select, checkbox, radio
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  width?: "full" | "half" | "third";
  hidden?: boolean;
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  submitButton: {
    text: string;
    style: "primary" | "secondary" | "outline";
  };
  successMessage: string;
  errorMessage: string;
  redirectUrl?: string;
  emailTo?: string;
  webhookUrl?: string;
}

interface FormBuilderProps {
  config: FormConfig;
  onChange: (config: FormConfig) => void;
}

const fieldTypes: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Texto", icon: <Type className="h-4 w-4" /> },
  { type: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { type: "phone", label: "Teléfono", icon: <Phone className="h-4 w-4" /> },
  { type: "textarea", label: "Área de texto", icon: <AlignLeft className="h-4 w-4" /> },
  { type: "select", label: "Selector", icon: <List className="h-4 w-4" /> },
  { type: "checkbox", label: "Casillas", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "radio", label: "Opciones", icon: <ToggleLeft className="h-4 w-4" /> },
  { type: "date", label: "Fecha", icon: <Calendar className="h-4 w-4" /> },
  { type: "time", label: "Hora", icon: <Clock className="h-4 w-4" /> },
  { type: "number", label: "Número", icon: <Hash className="h-4 w-4" /> },
  { type: "url", label: "URL", icon: <LinkIcon className="h-4 w-4" /> },
  { type: "file", label: "Archivo", icon: <Upload className="h-4 w-4" /> },
];

export function FormBuilder({ config, onChange }: FormBuilderProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      name: `${type}_${config.fields.length + 1}`,
      label: fieldTypes.find((f) => f.type === type)?.label || "Campo",
      required: false,
      width: "full",
      options: ["select", "checkbox", "radio"].includes(type)
        ? [{ label: "Opción 1", value: "option_1" }]
        : undefined,
    };

    onChange({
      ...config,
      fields: [...config.fields, newField],
    });
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    onChange({
      ...config,
      fields: config.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const removeField = (fieldId: string) => {
    onChange({
      ...config,
      fields: config.fields.filter((f) => f.id !== fieldId),
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const duplicateField = (fieldId: string) => {
    const field = config.fields.find((f) => f.id === fieldId);
    if (!field) return;

    const newField: FormField = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (copia)`,
    };

    const index = config.fields.findIndex((f) => f.id === fieldId);
    const newFields = [...config.fields];
    newFields.splice(index + 1, 0, newField);

    onChange({ ...config, fields: newFields });
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const index = config.fields.findIndex((f) => f.id === fieldId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === config.fields.length - 1)
    ) {
      return;
    }

    const newFields = [...config.fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

    onChange({ ...config, fields: newFields });
  };

  const selectedField = config.fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Field Types Panel */}
      <div className="col-span-3 border rounded-xl p-4 bg-slate-50 space-y-4">
        <h3 className="font-semibold text-sm text-slate-700">Tipos de Campo</h3>
        <div className="grid grid-cols-2 gap-2">
          {fieldTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => addField(type)}
              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-slate-200 bg-white hover:border-[#D66829] hover:bg-[#D66829]/5 transition-colors text-xs"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Preview / Builder */}
      <div className="col-span-6 border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <h3 className="font-semibold">Constructor de Formulario</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Editar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Vista previa
              </>
            )}
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[600px]">
          {showPreview ? (
            <FormPreview config={config} />
          ) : (
            <div className="space-y-3">
              {config.fields.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>Arrastra o haz clic en un tipo de campo para añadirlo</p>
                </div>
              ) : (
                config.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={cn(
                      "group relative p-4 rounded-lg border-2 transition-all cursor-pointer",
                      selectedFieldId === field.id
                        ? "border-[#D66829] bg-[#D66829]/5"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    {/* Field Preview */}
                    <div className="flex items-start gap-3">
                      <div className="text-slate-400">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{field.label}</span>
                          {field.required && (
                            <Badge variant="secondary" className="text-xs">
                              Requerido
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {fieldTypes.find((f) => f.type === field.type)?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Nombre: {field.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, "up");
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, "down");
                          }}
                          disabled={index === config.fields.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateField(field.id);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Field Settings Panel */}
      <div className="col-span-3 border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-sm">
            {selectedField ? "Configuración del Campo" : "Configuración del Formulario"}
          </h3>
        </div>

        <div className="p-4 overflow-y-auto max-h-[600px] space-y-4">
          {selectedField ? (
            <FieldSettings
              field={selectedField}
              onChange={(updates) => updateField(selectedField.id, updates)}
            />
          ) : (
            <FormSettings config={config} onChange={onChange} />
          )}
        </div>
      </div>
    </div>
  );
}

// Field Settings Component
function FieldSettings({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-xs">Nombre del campo</Label>
        <Input
          value={field.name}
          onChange={(e) => onChange({ name: e.target.value.replace(/\s/g, "_") })}
        />
      </div>

      {["text", "email", "phone", "textarea", "number", "url"].includes(field.type) && (
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </div>
      )}

      <div>
        <Label className="text-xs">Texto de ayuda</Label>
        <Input
          value={field.helpText || ""}
          onChange={(e) => onChange({ helpText: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-xs">Ancho</Label>
        <Select
          value={field.width || "full"}
          onValueChange={(v) => onChange({ width: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Completo</SelectItem>
            <SelectItem value="half">Mitad</SelectItem>
            <SelectItem value="third">Tercio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Requerido</Label>
        <Switch
          checked={field.required}
          onCheckedChange={(checked) => onChange({ required: checked })}
        />
      </div>

      {/* Options for select, checkbox, radio */}
      {["select", "checkbox", "radio"].includes(field.type) && (
        <div>
          <Label className="text-xs mb-2 block">Opciones</Label>
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])];
                    newOptions[index] = {
                      ...newOptions[index],
                      label: e.target.value,
                      value: e.target.value.toLowerCase().replace(/\s/g, "_"),
                    };
                    onChange({ options: newOptions });
                  }}
                  placeholder="Etiqueta"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    const newOptions = field.options?.filter((_, i) => i !== index);
                    onChange({ options: newOptions });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [
                  ...(field.options || []),
                  { label: `Opción ${(field.options?.length || 0) + 1}`, value: `option_${(field.options?.length || 0) + 1}` },
                ];
                onChange({ options: newOptions });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir opción
            </Button>
          </div>
        </div>
      )}

      {/* Validation for text fields */}
      {["text", "textarea"].includes(field.type) && (
        <div className="space-y-2">
          <Label className="text-xs">Validación</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-slate-500">Mín. caracteres</Label>
              <Input
                type="number"
                value={field.validation?.minLength || ""}
                onChange={(e) =>
                  onChange({
                    validation: {
                      ...field.validation,
                      minLength: parseInt(e.target.value) || undefined,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Máx. caracteres</Label>
              <Input
                type="number"
                value={field.validation?.maxLength || ""}
                onChange={(e) =>
                  onChange({
                    validation: {
                      ...field.validation,
                      maxLength: parseInt(e.target.value) || undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {field.type === "number" && (
        <div className="space-y-2">
          <Label className="text-xs">Validación</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-slate-500">Mínimo</Label>
              <Input
                type="number"
                value={field.validation?.min || ""}
                onChange={(e) =>
                  onChange({
                    validation: {
                      ...field.validation,
                      min: parseInt(e.target.value) || undefined,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Máximo</Label>
              <Input
                type="number"
                value={field.validation?.max || ""}
                onChange={(e) =>
                  onChange({
                    validation: {
                      ...field.validation,
                      max: parseInt(e.target.value) || undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Form Settings Component
function FormSettings({
  config,
  onChange,
}: {
  config: FormConfig;
  onChange: (config: FormConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Título del formulario</Label>
        <Input
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-xs">Descripción</Label>
        <Textarea
          value={config.description || ""}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-xs">Texto del botón</Label>
        <Input
          value={config.submitButton.text}
          onChange={(e) =>
            onChange({
              ...config,
              submitButton: { ...config.submitButton, text: e.target.value },
            })
          }
        />
      </div>

      <div>
        <Label className="text-xs">Estilo del botón</Label>
        <Select
          value={config.submitButton.style}
          onValueChange={(v) =>
            onChange({
              ...config,
              submitButton: { ...config.submitButton, style: v as any },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primario</SelectItem>
            <SelectItem value="secondary">Secundario</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Mensaje de éxito</Label>
        <Textarea
          value={config.successMessage}
          onChange={(e) => onChange({ ...config, successMessage: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-xs">Email de destino</Label>
        <Input
          type="email"
          value={config.emailTo || ""}
          onChange={(e) => onChange({ ...config, emailTo: e.target.value })}
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div>
        <Label className="text-xs">URL de redirección (opcional)</Label>
        <Input
          value={config.redirectUrl || ""}
          onChange={(e) => onChange({ ...config, redirectUrl: e.target.value })}
          placeholder="/gracias"
        />
      </div>
    </div>
  );
}

// Form Preview Component
function FormPreview({ config }: { config: FormConfig }) {
  return (
    <div className="bg-white p-6 rounded-xl border">
      {config.title && (
        <h3 className="text-xl font-bold mb-2">{config.title}</h3>
      )}
      {config.description && (
        <p className="text-slate-600 mb-6">{config.description}</p>
      )}

      <div className="space-y-4">
        {config.fields.map((field) => (
          <FieldPreview key={field.id} field={field} />
        ))}
      </div>

      <Button
        className={cn(
          "w-full mt-6",
          config.submitButton.style === "primary" &&
            "bg-[#D66829] hover:bg-[#c45a22]",
          config.submitButton.style === "secondary" &&
            "bg-slate-600 hover:bg-slate-700",
          config.submitButton.style === "outline" &&
            "border-2 border-[#D66829] text-[#D66829] bg-transparent hover:bg-[#D66829]/10"
        )}
      >
        {config.submitButton.text}
      </Button>
    </div>
  );
}

// Field Preview Component
function FieldPreview({ field }: { field: FormField }) {
  const widthClass = {
    full: "w-full",
    half: "w-1/2",
    third: "w-1/3",
  }[field.width || "full"];

  return (
    <div className={cn("space-y-2", widthClass)}>
      <Label>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.type === "text" && (
        <Input placeholder={field.placeholder} />
      )}

      {field.type === "email" && (
        <Input type="email" placeholder={field.placeholder} />
      )}

      {field.type === "phone" && (
        <Input type="tel" placeholder={field.placeholder} />
      )}

      {field.type === "textarea" && (
        <Textarea placeholder={field.placeholder} />
      )}

      {field.type === "number" && (
        <Input type="number" placeholder={field.placeholder} />
      )}

      {field.type === "url" && (
        <Input type="url" placeholder={field.placeholder} />
      )}

      {field.type === "date" && <Input type="date" />}

      {field.type === "time" && <Input type="time" />}

      {field.type === "datetime" && <Input type="datetime-local" />}

      {field.type === "select" && (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "checkbox" && (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === "radio" && (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input type="radio" name={field.name} />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === "file" && (
        <Input type="file" />
      )}

      {field.helpText && (
        <p className="text-xs text-slate-500">{field.helpText}</p>
      )}
    </div>
  );
}

// Dynamic Form Renderer (for frontend)
export function DynamicForm({
  config,
  onSubmit,
  className,
}: {
  config: FormConfig;
  onSubmit?: (data: Record<string, any>) => Promise<void>;
  className?: string;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSubmitted(true);
    } catch (err) {
      setError(config.errorMessage || "Error al enviar el formulario");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckSquare className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-lg font-medium text-slate-900">
          {config.successMessage}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {config.title && (
        <h3 className="text-xl font-bold mb-2">{config.title}</h3>
      )}
      {config.description && (
        <p className="text-slate-600 mb-6">{config.description}</p>
      )}

      <div className="grid gap-4">
        {config.fields
          .filter((f) => !f.hidden)
          .map((field) => {
            const widthClass = {
              full: "col-span-2",
              half: "col-span-1",
              third: "col-span-1",
            }[field.width || "full"];

            return (
              <div key={field.id} className={cn("space-y-2", widthClass)}>
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <FieldInput
                  field={field}
                  value={formData[field.name]}
                  onChange={(value) =>
                    setFormData({ ...formData, [field.name]: value })
                  }
                />
                {field.helpText && (
                  <p className="text-xs text-slate-500">{field.helpText}</p>
                )}
              </div>
            );
          })}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full mt-6",
          config.submitButton.style === "primary" &&
            "bg-[#D66829] hover:bg-[#c45a22]",
          config.submitButton.style === "secondary" &&
            "bg-slate-600 hover:bg-slate-700",
          config.submitButton.style === "outline" &&
            "border-2 border-[#D66829] text-[#D66829] bg-transparent hover:bg-[#D66829]/10"
        )}
      >
        {isSubmitting ? "Enviando..." : config.submitButton.text}
      </Button>
    </form>
  );
}

// Field Input Component
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          id={field.id}
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "select":
      return (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "checkbox":
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded"
                checked={(value || []).includes(option.value)}
                onChange={(e) => {
                  const currentValues = value || [];
                  if (e.target.checked) {
                    onChange([...currentValues, option.value]);
                  } else {
                    onChange(currentValues.filter((v: string) => v !== option.value));
                  }
                }}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      );

    case "radio":
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name={field.name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      );

    default:
      return (
        <Input
          id={field.id}
          name={field.name}
          type={field.type}
          placeholder={field.placeholder}
          required={field.required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          min={field.validation?.min}
          max={field.validation?.max}
          minLength={field.validation?.minLength}
          maxLength={field.validation?.maxLength}
        />
      );
  }
}
