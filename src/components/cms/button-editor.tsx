/**
 * CAARD CMS - Editor de Botones Avanzado
 * Permite personalizar completamente la apariencia de botones
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  ExternalLink,
  Mail,
  Phone,
  Play,
  Plus,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonConfig {
  text: string;
  url: string;
  style: "solid" | "outline" | "ghost" | "gradient" | "glow";
  size: "sm" | "md" | "lg" | "xl";
  color: string;
  textColor: string;
  hoverColor?: string;
  icon?: string;
  iconPosition?: "left" | "right";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  target?: "_self" | "_blank";
  animation?: "none" | "pulse" | "bounce" | "shine";
}

const defaultButtonConfig: ButtonConfig = {
  text: "Click aquí",
  url: "#",
  style: "solid",
  size: "md",
  color: "#D66829",
  textColor: "#ffffff",
  icon: undefined,
  iconPosition: "right",
  rounded: "lg",
  shadow: "md",
  fullWidth: false,
  target: "_self",
  animation: "none",
};

const icons: { name: string; icon: React.ReactNode }[] = [
  { name: "none", icon: null },
  { name: "arrow-right", icon: <ArrowRight className="h-4 w-4" /> },
  { name: "arrow-up-right", icon: <ArrowUpRight className="h-4 w-4" /> },
  { name: "chevron-right", icon: <ChevronRight className="h-4 w-4" /> },
  { name: "external-link", icon: <ExternalLink className="h-4 w-4" /> },
  { name: "download", icon: <Download className="h-4 w-4" /> },
  { name: "mail", icon: <Mail className="h-4 w-4" /> },
  { name: "phone", icon: <Phone className="h-4 w-4" /> },
  { name: "play", icon: <Play className="h-4 w-4" /> },
  { name: "plus", icon: <Plus className="h-4 w-4" /> },
  { name: "sparkles", icon: <Sparkles className="h-4 w-4" /> },
  { name: "zap", icon: <Zap className="h-4 w-4" /> },
];

interface ButtonEditorProps {
  config: ButtonConfig;
  onChange: (config: ButtonConfig) => void;
}

export function ButtonEditor({ config, onChange }: ButtonEditorProps) {
  const update = (updates: Partial<ButtonConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="p-6 border rounded-xl bg-slate-50">
        <Label className="text-xs text-slate-500 mb-3 block">Vista previa</Label>
        <div className={cn("flex", config.fullWidth ? "w-full" : "justify-center")}>
          <ButtonPreview config={config} />
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="content" className="flex-1">Contenido</TabsTrigger>
          <TabsTrigger value="style" className="flex-1">Estilo</TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1">Avanzado</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 pt-4">
          <div>
            <Label className="text-xs">Texto del botón</Label>
            <Input
              value={config.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Texto del botón"
            />
          </div>

          <div>
            <Label className="text-xs">URL / Enlace</Label>
            <Input
              value={config.url}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="https://ejemplo.com o /pagina"
            />
          </div>

          <div>
            <Label className="text-xs">Abrir en</Label>
            <Select
              value={config.target || "_self"}
              onValueChange={(v) => update({ target: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Misma ventana</SelectItem>
                <SelectItem value="_blank">Nueva ventana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Icono</Label>
            <div className="grid grid-cols-6 gap-2">
              {icons.map((i) => (
                <button
                  key={i.name}
                  onClick={() => update({ icon: i.name === "none" ? undefined : i.name })}
                  className={cn(
                    "p-2 rounded-lg border transition-colors flex items-center justify-center",
                    config.icon === i.name || (!config.icon && i.name === "none")
                      ? "border-[#D66829] bg-[#D66829]/10"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {i.icon || <span className="text-xs text-slate-400">∅</span>}
                </button>
              ))}
            </div>
          </div>

          {config.icon && (
            <div>
              <Label className="text-xs">Posición del icono</Label>
              <Select
                value={config.iconPosition || "right"}
                onValueChange={(v) => update({ iconPosition: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4 pt-4">
          <div>
            <Label className="text-xs">Estilo</Label>
            <Select
              value={config.style}
              onValueChange={(v) => update({ style: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Sólido</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
                <SelectItem value="gradient">Gradiente</SelectItem>
                <SelectItem value="glow">Con brillo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Tamaño</Label>
            <Select
              value={config.size}
              onValueChange={(v) => update({ size: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Pequeño</SelectItem>
                <SelectItem value="md">Mediano</SelectItem>
                <SelectItem value="lg">Grande</SelectItem>
                <SelectItem value="xl">Extra grande</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Color del botón</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.color}
                onChange={(e) => update({ color: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={config.color}
                onChange={(e) => update({ color: e.target.value })}
                placeholder="#D66829"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Color del texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.textColor}
                onChange={(e) => update({ textColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={config.textColor}
                onChange={(e) => update({ textColor: e.target.value })}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Bordes redondeados</Label>
            <Select
              value={config.rounded || "lg"}
              onValueChange={(v) => update({ rounded: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin redondeo</SelectItem>
                <SelectItem value="sm">Poco</SelectItem>
                <SelectItem value="md">Medio</SelectItem>
                <SelectItem value="lg">Mucho</SelectItem>
                <SelectItem value="full">Completo (píldora)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Sombra</Label>
            <Select
              value={config.shadow || "md"}
              onValueChange={(v) => update({ shadow: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin sombra</SelectItem>
                <SelectItem value="sm">Sutil</SelectItem>
                <SelectItem value="md">Media</SelectItem>
                <SelectItem value="lg">Grande</SelectItem>
                <SelectItem value="xl">Extra grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Ancho completo</Label>
            <input
              type="checkbox"
              checked={config.fullWidth}
              onChange={(e) => update({ fullWidth: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
          </div>

          <div>
            <Label className="text-xs">Animación</Label>
            <Select
              value={config.animation || "none"}
              onValueChange={(v) => update({ animation: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin animación</SelectItem>
                <SelectItem value="pulse">Pulso</SelectItem>
                <SelectItem value="bounce">Rebote</SelectItem>
                <SelectItem value="shine">Brillo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Button Preview Component
export function ButtonPreview({ config }: { config: ButtonConfig }) {
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    xl: "h-14 px-8 text-lg",
  };

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-xl",
    full: "rounded-full",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  const animationClasses = {
    none: "",
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    shine: "btn-shine",
  };

  const getStyleClasses = () => {
    switch (config.style) {
      case "outline":
        return `bg-transparent border-2 hover:opacity-90`;
      case "ghost":
        return `bg-transparent hover:bg-opacity-10`;
      case "gradient":
        return `bg-gradient-to-r hover:opacity-90`;
      case "glow":
        return `hover:opacity-90`;
      default:
        return `hover:opacity-90`;
    }
  };

  const getStyles = () => {
    const styles: React.CSSProperties = {
      color: config.textColor,
    };

    switch (config.style) {
      case "outline":
        styles.borderColor = config.color;
        styles.color = config.color;
        break;
      case "ghost":
        styles.color = config.color;
        break;
      case "gradient":
        styles.backgroundImage = `linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -20)} 100%)`;
        break;
      case "glow":
        styles.backgroundColor = config.color;
        styles.boxShadow = `0 0 20px ${config.color}80`;
        break;
      default:
        styles.backgroundColor = config.color;
    }

    return styles;
  };

  const Icon = config.icon ? icons.find((i) => i.name === config.icon)?.icon : null;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all",
        sizeClasses[config.size],
        roundedClasses[config.rounded || "lg"],
        shadowClasses[config.shadow || "md"],
        animationClasses[config.animation || "none"],
        getStyleClasses(),
        config.fullWidth && "w-full"
      )}
      style={getStyles()}
    >
      {Icon && config.iconPosition === "left" && Icon}
      {config.text}
      {Icon && config.iconPosition === "right" && Icon}
    </button>
  );
}

// Utility to adjust color brightness
function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// Render button from config (for frontend)
export function CmsButton({ config }: { config: ButtonConfig }) {
  if (!config.url) return <ButtonPreview config={config} />;

  const isExternal = config.url.startsWith("http");

  return (
    <a
      href={config.url}
      target={config.target || (isExternal ? "_blank" : "_self")}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      <ButtonPreview config={config} />
    </a>
  );
}

// Multi-button editor for sections
export function ButtonsEditor({
  buttons,
  onChange,
  maxButtons = 3,
}: {
  buttons: ButtonConfig[];
  onChange: (buttons: ButtonConfig[]) => void;
  maxButtons?: number;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addButton = () => {
    if (buttons.length >= maxButtons) return;
    onChange([...buttons, { ...defaultButtonConfig }]);
    setEditingIndex(buttons.length);
  };

  const updateButton = (index: number, config: ButtonConfig) => {
    const newButtons = [...buttons];
    newButtons[index] = config;
    onChange(newButtons);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Button List */}
      <div className="space-y-2">
        {buttons.map((btn, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
              editingIndex === index
                ? "border-[#D66829] bg-[#D66829]/5"
                : "border-slate-200 hover:border-slate-300"
            )}
            onClick={() => setEditingIndex(index)}
          >
            <ButtonPreview config={btn} />
            <span className="flex-1 text-sm text-slate-500 truncate">
              → {btn.url || "Sin enlace"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                removeButton(index);
              }}
            >
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      {/* Add button */}
      {buttons.length < maxButtons && (
        <Button variant="outline" onClick={addButton} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Añadir botón
        </Button>
      )}

      {/* Edit selected button */}
      {editingIndex !== null && buttons[editingIndex] && (
        <div className="mt-4 p-4 border rounded-xl bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Editando botón {editingIndex + 1}</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingIndex(null)}
            >
              Cerrar
            </Button>
          </div>
          <ButtonEditor
            config={buttons[editingIndex]}
            onChange={(config) => updateButton(editingIndex, config)}
          />
        </div>
      )}
    </div>
  );
}
