"use client";

/**
 * CAARD CMS - Editor Visual de Secciones
 * ======================================
 * Editor tipo WordPress/Elementor para contenido de secciones
 * Con soporte completo para subida de imágenes
 */

import { useState } from "react";
import {
  Type,
  Image,
  Link as LinkIcon,
  Plus,
  Trash2,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "./image-uploader";

// ====================
// Editor de HERO
// ====================
interface HeroContent {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundOverlay?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonStyle?: "primary" | "secondary" | "outline";
  secondButtonText?: string;
  secondButtonLink?: string;
  secondButtonStyle?: "primary" | "secondary" | "outline";
  textAlign?: "left" | "center" | "right";
  height?: "sm" | "md" | "lg" | "full";
  textColor?: string;
}

export function HeroEditor({
  content,
  onChange,
}: {
  content: HeroContent;
  onChange: (content: HeroContent) => void;
}) {
  const update = (field: keyof HeroContent, value: any) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título Principal</Label>
        <Input
          value={content.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Bienvenido a CAARD"
          className="text-lg font-semibold"
        />
      </div>

      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <Textarea
          value={content.subtitle || ""}
          onChange={(e) => update("subtitle", e.target.value)}
          placeholder="Centro de Arbitraje y Resolución de Disputas"
          rows={2}
        />
      </div>

      <Separator />

      {/* Imagen de fondo con uploader */}
      <ImageUploader
        label="Imagen de Fondo"
        description="Sube o selecciona una imagen para el banner"
        value={content.backgroundImage}
        onChange={(url) => update("backgroundImage", url)}
        onRemove={() => update("backgroundImage", "")}
        aspectRatio="video"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Overlay (Opacidad)</Label>
          <Select
            value={content.backgroundOverlay || "50"}
            onValueChange={(v) => update("backgroundOverlay", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sin overlay</SelectItem>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color de Texto</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={content.textColor || "#ffffff"}
              onChange={(e) => update("textColor", e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <Input
              value={content.textColor || "#ffffff"}
              onChange={(e) => update("textColor", e.target.value)}
              placeholder="#ffffff"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      <Separator />

      <Label className="text-base font-semibold">Botón Principal</Label>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Texto</Label>
          <Input
            value={content.buttonText || ""}
            onChange={(e) => update("buttonText", e.target.value)}
            placeholder="Comenzar"
          />
        </div>
        <div className="space-y-2">
          <Label>Enlace</Label>
          <Input
            value={content.buttonLink || ""}
            onChange={(e) => update("buttonLink", e.target.value)}
            placeholder="/contacto"
          />
        </div>
        <div className="space-y-2">
          <Label>Estilo</Label>
          <Select
            value={content.buttonStyle || "primary"}
            onValueChange={(v) => update("buttonStyle", v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primario</SelectItem>
              <SelectItem value="secondary">Secundario</SelectItem>
              <SelectItem value="outline">Contorno</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Label className="text-base font-semibold">Botón Secundario (opcional)</Label>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Texto</Label>
          <Input
            value={content.secondButtonText || ""}
            onChange={(e) => update("secondButtonText", e.target.value)}
            placeholder="Más información"
          />
        </div>
        <div className="space-y-2">
          <Label>Enlace</Label>
          <Input
            value={content.secondButtonLink || ""}
            onChange={(e) => update("secondButtonLink", e.target.value)}
            placeholder="/servicios"
          />
        </div>
        <div className="space-y-2">
          <Label>Estilo</Label>
          <Select
            value={content.secondButtonStyle || "outline"}
            onValueChange={(v) => update("secondButtonStyle", v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primario</SelectItem>
              <SelectItem value="secondary">Secundario</SelectItem>
              <SelectItem value="outline">Contorno</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Alineación del Texto</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={content.textAlign === "left" ? "default" : "outline"}
              size="icon"
              onClick={() => update("textAlign", "left")}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={content.textAlign === "center" || !content.textAlign ? "default" : "outline"}
              size="icon"
              onClick={() => update("textAlign", "center")}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={content.textAlign === "right" ? "default" : "outline"}
              size="icon"
              onClick={() => update("textAlign", "right")}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Altura</Label>
          <Select
            value={content.height || "md"}
            onValueChange={(v) => update("height", v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Pequeña (300px)</SelectItem>
              <SelectItem value="md">Mediana (450px)</SelectItem>
              <SelectItem value="lg">Grande (600px)</SelectItem>
              <SelectItem value="full">Pantalla completa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border overflow-hidden">
        <p className="text-xs text-muted-foreground p-2 bg-muted">Vista previa</p>
        <div
          className="p-8 min-h-[200px] flex flex-col justify-center relative"
          style={{
            backgroundImage: content.backgroundImage
              ? `url(${content.backgroundImage})`
              : "linear-gradient(135deg, #D66829 0%, #1a365d 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            textAlign: content.textAlign || "center",
          }}
        >
          {content.backgroundOverlay && content.backgroundOverlay !== "0" && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: parseInt(content.backgroundOverlay) / 100 }}
            />
          )}
          <div className="relative z-10" style={{ color: content.textColor || "#ffffff" }}>
            <h2 className="text-2xl font-bold mb-2">
              {content.title || "Título del Hero"}
            </h2>
            {content.subtitle && (
              <p className="opacity-90 mb-4">{content.subtitle}</p>
            )}
            <div className="flex gap-2 justify-center">
              {content.buttonText && (
                <button
                  className={`px-4 py-2 rounded-lg font-medium ${
                    content.buttonStyle === "outline"
                      ? "border-2 border-current"
                      : content.buttonStyle === "secondary"
                      ? "bg-white text-gray-900"
                      : "bg-[#D66829] text-white"
                  }`}
                >
                  {content.buttonText}
                </button>
              )}
              {content.secondButtonText && (
                <button
                  className={`px-4 py-2 rounded-lg font-medium ${
                    content.secondButtonStyle === "outline"
                      ? "border-2 border-current"
                      : content.secondButtonStyle === "secondary"
                      ? "bg-white text-gray-900"
                      : "bg-[#D66829] text-white"
                  }`}
                >
                  {content.secondButtonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================
// Editor de TARJETAS
// ====================
interface CardItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  link?: string;
  linkText?: string;
}

interface CardsContent {
  cards: CardItem[];
  columns?: 2 | 3 | 4;
  style?: "simple" | "bordered" | "elevated" | "image-top";
}

export function CardsEditor({
  content,
  onChange,
}: {
  content: CardsContent;
  onChange: (content: CardsContent) => void;
}) {
  const cards = content.cards || [];

  const addCard = () => {
    onChange({
      ...content,
      cards: [
        ...cards,
        {
          id: `card-${Date.now()}`,
          title: "Nueva tarjeta",
          description: "",
        },
      ],
    });
  };

  const updateCard = (index: number, updates: Partial<CardItem>) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], ...updates };
    onChange({ ...content, cards: newCards });
  };

  const removeCard = (index: number) => {
    onChange({
      ...content,
      cards: cards.filter((_, i) => i !== index),
    });
  };

  const moveCard = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cards.length) return;

    const newCards = [...cards];
    [newCards[index], newCards[newIndex]] = [newCards[newIndex], newCards[index]];
    onChange({ ...content, cards: newCards });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Columnas</Label>
          <Select
            value={String(content.columns || 3)}
            onValueChange={(v) =>
              onChange({ ...content, columns: parseInt(v) as 2 | 3 | 4 })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 columnas</SelectItem>
              <SelectItem value="3">3 columnas</SelectItem>
              <SelectItem value="4">4 columnas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estilo</Label>
          <Select
            value={content.style || "simple"}
            onValueChange={(v) =>
              onChange({ ...content, style: v as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="bordered">Con borde</SelectItem>
              <SelectItem value="elevated">Elevado</SelectItem>
              <SelectItem value="image-top">Con imagen arriba</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tarjetas ({cards.length})</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCard}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>

        {cards.map((card, index) => (
          <Card key={card.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveCard(index, "up")}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveCard(index, "down")}
                  disabled={index === cards.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-3">
                {/* Imagen de la tarjeta */}
                <ImageUploader
                  label="Imagen"
                  value={card.image}
                  onChange={(url) => updateCard(index, { image: url })}
                  onRemove={() => updateCard(index, { image: "" })}
                  aspectRatio="video"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={card.title}
                    onChange={(e) => updateCard(index, { title: e.target.value })}
                    placeholder="Título"
                  />
                  <Input
                    value={card.icon || ""}
                    onChange={(e) => updateCard(index, { icon: e.target.value })}
                    placeholder="Icono (nombre lucide)"
                  />
                </div>
                <Textarea
                  value={card.description || ""}
                  onChange={(e) => updateCard(index, { description: e.target.value })}
                  placeholder="Descripción"
                  rows={2}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={card.link || ""}
                    onChange={(e) => updateCard(index, { link: e.target.value })}
                    placeholder="Enlace (ej: /servicios)"
                  />
                  <Input
                    value={card.linkText || ""}
                    onChange={(e) => updateCard(index, { linkText: e.target.value })}
                    placeholder="Texto del enlace"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => removeCard(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ====================
// Editor de ACORDEÓN (FAQ)
// ====================
interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionContent {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export function AccordionEditor({
  content,
  onChange,
}: {
  content: AccordionContent;
  onChange: (content: AccordionContent) => void;
}) {
  const items = content.items || [];

  const addItem = () => {
    onChange({
      ...content,
      items: [
        ...items,
        {
          id: `faq-${Date.now()}`,
          question: "Nueva pregunta",
          answer: "",
        },
      ],
    });
  };

  const updateItem = (index: number, field: keyof AccordionItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...content, items: newItems });
  };

  const removeItem = (index: number) => {
    onChange({
      ...content,
      items: items.filter((_, i) => i !== index),
    });
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange({ ...content, items: newItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Preguntas Frecuentes ({items.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {items.map((item, index) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveItem(index, "up")}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground text-center">{index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveItem(index, "down")}
                disabled={index === items.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-3">
              <Input
                value={item.question}
                onChange={(e) => updateItem(index, "question", e.target.value)}
                placeholder="Pregunta"
                className="font-medium"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(index, "answer", e.target.value)}
                placeholder="Respuesta (soporta Markdown)"
                rows={3}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ====================
// Editor de ESTADÍSTICAS
// ====================
interface StatItem {
  id: string;
  value: string;
  label: string;
  suffix?: string;
  prefix?: string;
  icon?: string;
}

interface StatsContent {
  stats: StatItem[];
  style?: "simple" | "boxed" | "icon";
  columns?: 2 | 3 | 4;
}

export function StatsEditor({
  content,
  onChange,
}: {
  content: StatsContent;
  onChange: (content: StatsContent) => void;
}) {
  const stats = content.stats || [];

  const addStat = () => {
    onChange({
      ...content,
      stats: [
        ...stats,
        {
          id: `stat-${Date.now()}`,
          value: "100",
          label: "Nueva estadística",
        },
      ],
    });
  };

  const updateStat = (index: number, updates: Partial<StatItem>) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], ...updates };
    onChange({ ...content, stats: newStats });
  };

  const removeStat = (index: number) => {
    onChange({
      ...content,
      stats: stats.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Columnas</Label>
          <Select
            value={String(content.columns || 4)}
            onValueChange={(v) =>
              onChange({ ...content, columns: parseInt(v) as 2 | 3 | 4 })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 columnas</SelectItem>
              <SelectItem value="3">3 columnas</SelectItem>
              <SelectItem value="4">4 columnas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estilo</Label>
          <Select
            value={content.style || "simple"}
            onValueChange={(v) =>
              onChange({ ...content, style: v as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="boxed">Con caja</SelectItem>
              <SelectItem value="icon">Con icono</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label>Estadísticas ({stats.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addStat}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {stats.map((stat, index) => (
          <Card key={stat.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div className="grid gap-2 grid-cols-3">
                  <Input
                    value={stat.prefix || ""}
                    onChange={(e) => updateStat(index, { prefix: e.target.value })}
                    placeholder="Prefijo"
                  />
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStat(index, { value: e.target.value })}
                    placeholder="Valor"
                    className="font-bold text-center"
                  />
                  <Input
                    value={stat.suffix || ""}
                    onChange={(e) => updateStat(index, { suffix: e.target.value })}
                    placeholder="Sufijo"
                  />
                </div>
                <Input
                  value={stat.label}
                  onChange={(e) => updateStat(index, { label: e.target.value })}
                  placeholder="Etiqueta"
                />
                <Input
                  value={stat.icon || ""}
                  onChange={(e) => updateStat(index, { icon: e.target.value })}
                  placeholder="Icono (nombre lucide)"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => removeStat(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview */}
      {stats.length > 0 && (
        <div className="rounded-lg border p-6 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-3">Vista previa</p>
          <div className={`grid gap-4 grid-cols-2 md:grid-cols-${content.columns || 4}`}>
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <p className="text-3xl font-bold text-[#D66829]">
                  {stat.prefix}
                  {stat.value}
                  {stat.suffix}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ====================
// Editor de CTA
// ====================
interface CtaContent {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  buttonStyle?: "primary" | "secondary" | "outline";
  secondButtonText?: string;
  secondButtonLink?: string;
  bgColor?: string;
  textColor?: string;
  backgroundImage?: string;
}

export function CtaEditor({
  content,
  onChange,
}: {
  content: CtaContent;
  onChange: (content: CtaContent) => void;
}) {
  const update = (field: keyof CtaContent, value: any) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input
          value={content.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="¿Listo para comenzar?"
          className="text-lg font-semibold"
        />
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={content.description || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Contáctenos hoy para resolver sus disputas"
          rows={2}
        />
      </div>

      <Separator />

      {/* Imagen de fondo opcional */}
      <ImageUploader
        label="Imagen de Fondo (opcional)"
        value={content.backgroundImage}
        onChange={(url) => update("backgroundImage", url)}
        onRemove={() => update("backgroundImage", "")}
        aspectRatio="wide"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Texto del Botón</Label>
          <Input
            value={content.buttonText || ""}
            onChange={(e) => update("buttonText", e.target.value)}
            placeholder="Contáctenos"
          />
        </div>
        <div className="space-y-2">
          <Label>Enlace</Label>
          <Input
            value={content.buttonLink || ""}
            onChange={(e) => update("buttonLink", e.target.value)}
            placeholder="/contacto"
          />
        </div>
        <div className="space-y-2">
          <Label>Estilo</Label>
          <Select
            value={content.buttonStyle || "primary"}
            onValueChange={(v) => update("buttonStyle", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primario</SelectItem>
              <SelectItem value="secondary">Secundario</SelectItem>
              <SelectItem value="outline">Contorno</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Botón Secundario (opcional)</Label>
          <Input
            value={content.secondButtonText || ""}
            onChange={(e) => update("secondButtonText", e.target.value)}
            placeholder="Más información"
          />
        </div>
        <div className="space-y-2">
          <Label>Enlace Secundario</Label>
          <Input
            value={content.secondButtonLink || ""}
            onChange={(e) => update("secondButtonLink", e.target.value)}
            placeholder="/servicios"
          />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Color de Fondo</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={content.bgColor || "#D66829"}
              onChange={(e) => update("bgColor", e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <Input
              value={content.bgColor || "#D66829"}
              onChange={(e) => update("bgColor", e.target.value)}
              placeholder="#D66829"
              className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Color de Texto</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={content.textColor || "#ffffff"}
              onChange={(e) => update("textColor", e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <Input
              value={content.textColor || "#ffffff"}
              onChange={(e) => update("textColor", e.target.value)}
              placeholder="#ffffff"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg p-8 text-center relative overflow-hidden"
        style={{
          backgroundColor: content.bgColor || "#D66829",
          color: content.textColor || "#ffffff",
          backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {content.backgroundImage && (
          <div className="absolute inset-0 bg-black/50" />
        )}
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">{content.title || "Título del CTA"}</h3>
          {content.description && <p className="mb-4 opacity-90">{content.description}</p>}
          <div className="flex gap-2 justify-center">
            <button
              className={`px-6 py-2 rounded-lg font-medium ${
                content.buttonStyle === "outline"
                  ? "border-2 border-current"
                  : content.buttonStyle === "secondary"
                  ? "bg-white text-gray-900"
                  : "bg-white/20 backdrop-blur"
              }`}
            >
              {content.buttonText || "Botón"}
            </button>
            {content.secondButtonText && (
              <button className="px-6 py-2 rounded-lg font-medium border-2 border-current">
                {content.secondButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================
// Editor de TEXTO
// ====================
interface TextContent {
  content: string;
  alignment?: "left" | "center" | "right";
}

export function TextEditor({
  content,
  onChange,
}: {
  content: TextContent;
  onChange: (content: TextContent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Alineación:</Label>
        <Button
          type="button"
          variant={content.alignment === "left" || !content.alignment ? "default" : "outline"}
          size="icon"
          onClick={() => onChange({ ...content, alignment: "left" })}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={content.alignment === "center" ? "default" : "outline"}
          size="icon"
          onClick={() => onChange({ ...content, alignment: "center" })}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={content.alignment === "right" ? "default" : "outline"}
          size="icon"
          onClick={() => onChange({ ...content, alignment: "right" })}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        value={content.content || ""}
        onChange={(e) => onChange({ ...content, content: e.target.value })}
        placeholder="Escribe tu contenido aquí... (soporta Markdown)"
        rows={10}
        className="font-mono"
      />

      <p className="text-xs text-muted-foreground">
        Puedes usar Markdown: **negrita**, *cursiva*, [enlaces](url), listas con - o 1.
      </p>
    </div>
  );
}

// ====================
// Editor de IMAGEN ÚNICA
// ====================
interface ImageContent {
  src: string;
  alt?: string;
  caption?: string;
  width?: "full" | "large" | "medium" | "small";
  alignment?: "left" | "center" | "right";
  link?: string;
}

export function ImageEditor({
  content,
  onChange,
}: {
  content: ImageContent;
  onChange: (content: ImageContent) => void;
}) {
  const update = (field: keyof ImageContent, value: any) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <ImageUploader
        label="Imagen"
        value={content.src}
        onChange={(url) => update("src", url)}
        onRemove={() => update("src", "")}
        aspectRatio="auto"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Texto alternativo (SEO)</Label>
          <Input
            value={content.alt || ""}
            onChange={(e) => update("alt", e.target.value)}
            placeholder="Descripción de la imagen"
          />
        </div>
        <div className="space-y-2">
          <Label>Enlace (opcional)</Label>
          <Input
            value={content.link || ""}
            onChange={(e) => update("link", e.target.value)}
            placeholder="/pagina o https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pie de imagen</Label>
        <Input
          value={content.caption || ""}
          onChange={(e) => update("caption", e.target.value)}
          placeholder="Pie de imagen opcional"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tamaño</Label>
          <Select
            value={content.width || "full"}
            onValueChange={(v) => update("width", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeño (25%)</SelectItem>
              <SelectItem value="medium">Mediano (50%)</SelectItem>
              <SelectItem value="large">Grande (75%)</SelectItem>
              <SelectItem value="full">Completo (100%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Alineación</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={content.alignment === "left" ? "default" : "outline"}
              size="icon"
              onClick={() => update("alignment", "left")}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={content.alignment === "center" || !content.alignment ? "default" : "outline"}
              size="icon"
              onClick={() => update("alignment", "center")}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={content.alignment === "right" ? "default" : "outline"}
              size="icon"
              onClick={() => update("alignment", "right")}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================
// Editor de GALERÍA
// ====================
interface GalleryItem {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
}

interface GalleryContent {
  images: GalleryItem[];
  columns?: 2 | 3 | 4;
  gap?: "none" | "small" | "medium" | "large";
}

export function GalleryEditor({
  content,
  onChange,
}: {
  content: GalleryContent;
  onChange: (content: GalleryContent) => void;
}) {
  const images = content.images || [];

  const addImage = () => {
    onChange({
      ...content,
      images: [
        ...images,
        {
          id: `img-${Date.now()}`,
          src: "",
        },
      ],
    });
  };

  const updateImage = (index: number, updates: Partial<GalleryItem>) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], ...updates };
    onChange({ ...content, images: newImages });
  };

  const removeImage = (index: number) => {
    onChange({
      ...content,
      images: images.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Columnas</Label>
          <Select
            value={String(content.columns || 3)}
            onValueChange={(v) =>
              onChange({ ...content, columns: parseInt(v) as 2 | 3 | 4 })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 columnas</SelectItem>
              <SelectItem value="3">3 columnas</SelectItem>
              <SelectItem value="4">4 columnas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Espacio entre imágenes</Label>
          <Select
            value={content.gap || "medium"}
            onValueChange={(v) => onChange({ ...content, gap: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin espacio</SelectItem>
              <SelectItem value="small">Pequeño</SelectItem>
              <SelectItem value="medium">Mediano</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label>Imágenes ({images.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {images.map((image, index) => (
          <Card key={image.id} className="p-3">
            <div className="space-y-3">
              <ImageUploader
                value={image.src}
                onChange={(url) => updateImage(index, { src: url })}
                onRemove={() => updateImage(index, { src: "" })}
                aspectRatio="square"
              />
              <Input
                value={image.alt || ""}
                onChange={(e) => updateImage(index, { alt: e.target.value })}
                placeholder="Texto alternativo"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ====================
// Editor de SLIDER/BANNER
// ====================
interface SlideItem {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
}

interface SliderContent {
  slides: SlideItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  showPlayPause?: boolean;
  height?: "sm" | "md" | "lg" | "xl" | "full";
  effect?: "fade" | "slide" | "zoom";
}

export function SliderEditor({
  content,
  onChange,
}: {
  content: SliderContent;
  onChange: (content: SliderContent) => void;
}) {
  const slides = content.slides || [];

  const addSlide = () => {
    onChange({
      ...content,
      slides: [
        ...slides,
        {
          id: `slide-${Date.now()}`,
          image: "",
          title: "Nuevo Slide",
          textAlign: "center",
          overlayOpacity: 40,
        },
      ],
    });
  };

  const updateSlide = (index: number, updates: Partial<SlideItem>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    onChange({ ...content, slides: newSlides });
  };

  const removeSlide = (index: number) => {
    onChange({
      ...content,
      slides: slides.filter((_, i) => i !== index),
    });
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    onChange({ ...content, slides: newSlides });
  };

  return (
    <div className="space-y-4">
      {/* Configuración general del slider */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Altura</Label>
          <Select
            value={content.height || "lg"}
            onValueChange={(v) => onChange({ ...content, height: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Pequeña (400px)</SelectItem>
              <SelectItem value="md">Mediana (500px)</SelectItem>
              <SelectItem value="lg">Grande (600px)</SelectItem>
              <SelectItem value="xl">Extra Grande (700px)</SelectItem>
              <SelectItem value="full">Pantalla completa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Efecto de transición</Label>
          <Select
            value={content.effect || "fade"}
            onValueChange={(v) => onChange({ ...content, effect: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fade">Desvanecer</SelectItem>
              <SelectItem value="slide">Deslizar</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Intervalo (ms)</Label>
          <Input
            type="number"
            value={content.autoPlayInterval || 5000}
            onChange={(e) => onChange({ ...content, autoPlayInterval: parseInt(e.target.value) })}
            min={1000}
            step={500}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={content.autoPlay !== false}
            onCheckedChange={(v) => onChange({ ...content, autoPlay: v })}
          />
          <Label>Auto-reproducción</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={content.showArrows !== false}
            onCheckedChange={(v) => onChange({ ...content, showArrows: v })}
          />
          <Label>Mostrar flechas</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={content.showDots !== false}
            onCheckedChange={(v) => onChange({ ...content, showDots: v })}
          />
          <Label>Mostrar puntos</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={content.showPlayPause || false}
            onCheckedChange={(v) => onChange({ ...content, showPlayPause: v })}
          />
          <Label>Control play/pause</Label>
        </div>
      </div>

      <Separator />

      {/* Lista de slides */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Slides ({slides.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSlide}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Slide
        </Button>
      </div>

      {slides.map((slide, index) => (
        <Card key={slide.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveSlide(index, "up")}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground text-center font-bold">{index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveSlide(index, "down")}
                disabled={index === slides.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              {/* Imagen del slide */}
              <ImageUploader
                label="Imagen de fondo"
                value={slide.image}
                onChange={(url) => updateSlide(index, { image: url })}
                onRemove={() => updateSlide(index, { image: "" })}
                aspectRatio="video"
              />

              {/* Textos */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={slide.title || ""}
                    onChange={(e) => updateSlide(index, { title: e.target.value })}
                    placeholder="Título del slide"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    value={slide.subtitle || ""}
                    onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                    placeholder="Subtítulo opcional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={slide.description || ""}
                  onChange={(e) => updateSlide(index, { description: e.target.value })}
                  placeholder="Descripción del slide"
                  rows={2}
                />
              </div>

              {/* Botones */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Botón principal</Label>
                  <div className="grid gap-2 grid-cols-2">
                    <Input
                      value={slide.buttonText || ""}
                      onChange={(e) => updateSlide(index, { buttonText: e.target.value })}
                      placeholder="Texto"
                    />
                    <Input
                      value={slide.buttonUrl || ""}
                      onChange={(e) => updateSlide(index, { buttonUrl: e.target.value })}
                      placeholder="URL"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Botón secundario</Label>
                  <div className="grid gap-2 grid-cols-2">
                    <Input
                      value={slide.secondaryButtonText || ""}
                      onChange={(e) => updateSlide(index, { secondaryButtonText: e.target.value })}
                      placeholder="Texto"
                    />
                    <Input
                      value={slide.secondaryButtonUrl || ""}
                      onChange={(e) => updateSlide(index, { secondaryButtonUrl: e.target.value })}
                      placeholder="URL"
                    />
                  </div>
                </div>
              </div>

              {/* Estilos */}
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Alineación</Label>
                  <Select
                    value={slide.textAlign || "center"}
                    onValueChange={(v) => updateSlide(index, { textAlign: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Izquierda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Derecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Overlay</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={slide.overlayColor || "#000000"}
                      onChange={(e) => updateSlide(index, { overlayColor: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      type="number"
                      value={slide.overlayOpacity ?? 40}
                      onChange={(e) => updateSlide(index, { overlayOpacity: parseInt(e.target.value) })}
                      min={0}
                      max={100}
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color texto</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={slide.textColor || "#ffffff"}
                      onChange={(e) => updateSlide(index, { textColor: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => removeSlide(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ====================
// Editor de VIDEO
// ====================
interface VideoContent {
  videoUrl?: string;
  videoFile?: string;
  thumbnail?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  caption?: string;
}

export function VideoEditor({
  content,
  onChange,
}: {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
}) {
  const update = (field: keyof VideoContent, value: any) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>URL del Video (YouTube, Vimeo, o directo)</Label>
        <Input
          value={content.videoUrl || ""}
          onChange={(e) => update("videoUrl", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="text-xs text-muted-foreground">
          Soporta: YouTube, Vimeo, o URL directa de video
        </p>
      </div>

      <ImageUploader
        label="Miniatura (thumbnail)"
        description="Imagen que se muestra antes de reproducir"
        value={content.thumbnail}
        onChange={(url) => update("thumbnail", url)}
        onRemove={() => update("thumbnail", "")}
        aspectRatio="video"
      />

      <div className="space-y-2">
        <Label>Pie de video</Label>
        <Input
          value={content.caption || ""}
          onChange={(e) => update("caption", e.target.value)}
          placeholder="Descripción del video"
        />
      </div>

      <Separator />

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={content.autoPlay || false}
            onCheckedChange={(v) => update("autoPlay", v)}
          />
          <Label>Auto-reproducción</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={content.muted || false}
            onCheckedChange={(v) => update("muted", v)}
          />
          <Label>Silenciado</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={content.loop || false}
            onCheckedChange={(v) => update("loop", v)}
          />
          <Label>Repetir</Label>
        </div>
      </div>

      {/* Preview */}
      {content.videoUrl && (
        <div className="rounded-lg border overflow-hidden">
          <p className="text-xs text-muted-foreground p-2 bg-muted">Vista previa</p>
          <div className="aspect-video bg-slate-900 flex items-center justify-center">
            <p className="text-white/50">Video: {content.videoUrl}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================
// Editor de PRICING
// ====================
interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: string;
  currency?: string;
  period?: string;
  features: string[];
  buttonText?: string;
  buttonUrl?: string;
  featured?: boolean;
  featuredLabel?: string;
}

interface PricingContent {
  plans: PricingPlan[];
  badge?: string;
}

export function PricingEditor({
  content,
  onChange,
}: {
  content: PricingContent;
  onChange: (content: PricingContent) => void;
}) {
  const plans = content.plans || [];

  const addPlan = () => {
    onChange({
      ...content,
      plans: [
        ...plans,
        {
          id: `plan-${Date.now()}`,
          name: "Nuevo Plan",
          price: "0",
          features: ["Característica 1"],
          buttonText: "Seleccionar",
          buttonUrl: "#",
        },
      ],
    });
  };

  const updatePlan = (index: number, updates: Partial<PricingPlan>) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], ...updates };
    onChange({ ...content, plans: newPlans });
  };

  const removePlan = (index: number) => {
    onChange({
      ...content,
      plans: plans.filter((_, i) => i !== index),
    });
  };

  const addFeature = (planIndex: number) => {
    const plan = plans[planIndex];
    updatePlan(planIndex, { features: [...(plan.features || []), "Nueva característica"] });
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    const plan = plans[planIndex];
    const newFeatures = [...(plan.features || [])];
    newFeatures[featureIndex] = value;
    updatePlan(planIndex, { features: newFeatures });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    const plan = plans[planIndex];
    updatePlan(planIndex, {
      features: (plan.features || []).filter((_, i) => i !== featureIndex),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Badge (etiqueta superior)</Label>
        <Input
          value={content.badge || ""}
          onChange={(e) => onChange({ ...content, badge: e.target.value })}
          placeholder="Nuestros Planes"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Planes ({plans.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPlan}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Plan
        </Button>
      </div>

      {plans.map((plan, index) => (
        <Card key={plan.id} className={`p-4 ${plan.featured ? "ring-2 ring-[#D66829]" : ""}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Plan {index + 1}</span>
                {plan.featured && (
                  <span className="px-2 py-0.5 rounded text-xs bg-[#D66829] text-white">Destacado</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => removePlan(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={plan.name}
                  onChange={(e) => updatePlan(index, { name: e.target.value })}
                  placeholder="Básico"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={plan.description || ""}
                  onChange={(e) => updatePlan(index, { description: e.target.value })}
                  placeholder="Para empezar"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Input
                  value={plan.currency || "S/"}
                  onChange={(e) => updatePlan(index, { currency: e.target.value })}
                  placeholder="S/"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio</Label>
                <Input
                  value={plan.price}
                  onChange={(e) => updatePlan(index, { price: e.target.value })}
                  placeholder="99"
                />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Input
                  value={plan.period || ""}
                  onChange={(e) => updatePlan(index, { period: e.target.value })}
                  placeholder="por mes"
                />
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={plan.featured || false}
                    onCheckedChange={(v) => updatePlan(index, { featured: v })}
                  />
                  <Label>Destacado</Label>
                </div>
              </div>
            </div>

            {plan.featured && (
              <div className="space-y-2">
                <Label>Etiqueta destacado</Label>
                <Input
                  value={plan.featuredLabel || ""}
                  onChange={(e) => updatePlan(index, { featuredLabel: e.target.value })}
                  placeholder="Más Popular"
                />
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Texto del botón</Label>
                <Input
                  value={plan.buttonText || ""}
                  onChange={(e) => updatePlan(index, { buttonText: e.target.value })}
                  placeholder="Comenzar"
                />
              </div>
              <div className="space-y-2">
                <Label>URL del botón</Label>
                <Input
                  value={plan.buttonUrl || ""}
                  onChange={(e) => updatePlan(index, { buttonUrl: e.target.value })}
                  placeholder="/contacto"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Características</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addFeature(index)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              {(plan.features || []).map((feature, fIndex) => (
                <div key={fIndex} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, fIndex, e.target.value)}
                    placeholder="Característica"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeFeature(index, fIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ====================
// Editor de FEATURE GRID
// ====================
interface FeatureItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

interface FeatureGridContent {
  features: FeatureItem[];
  columns?: 2 | 3 | 4 | 6;
  badge?: string;
}

export function FeatureGridEditor({
  content,
  onChange,
}: {
  content: FeatureGridContent;
  onChange: (content: FeatureGridContent) => void;
}) {
  const features = content.features || [];

  const addFeature = () => {
    onChange({
      ...content,
      features: [
        ...features,
        {
          id: `feature-${Date.now()}`,
          title: "Nueva característica",
          icon: "checkCircle",
        },
      ],
    });
  };

  const updateFeature = (index: number, updates: Partial<FeatureItem>) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], ...updates };
    onChange({ ...content, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    onChange({
      ...content,
      features: features.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Badge (etiqueta)</Label>
          <Input
            value={content.badge || ""}
            onChange={(e) => onChange({ ...content, badge: e.target.value })}
            placeholder="Características"
          />
        </div>
        <div className="space-y-2">
          <Label>Columnas</Label>
          <Select
            value={String(content.columns || 3)}
            onValueChange={(v) => onChange({ ...content, columns: parseInt(v) as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 columnas</SelectItem>
              <SelectItem value="3">3 columnas</SelectItem>
              <SelectItem value="4">4 columnas</SelectItem>
              <SelectItem value="6">6 columnas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Características ({features.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addFeature}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {features.map((feature, index) => (
          <Card key={feature.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div className="grid gap-2 grid-cols-2">
                  <Input
                    value={feature.title}
                    onChange={(e) => updateFeature(index, { title: e.target.value })}
                    placeholder="Título"
                  />
                  <Input
                    value={feature.icon || ""}
                    onChange={(e) => updateFeature(index, { icon: e.target.value })}
                    placeholder="Icono (lucide)"
                  />
                </div>
                <Textarea
                  value={feature.description || ""}
                  onChange={(e) => updateFeature(index, { description: e.target.value })}
                  placeholder="Descripción"
                  rows={2}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => removeFeature(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ====================
// Editor de SPLIT CONTENT
// ====================
interface SplitContentData {
  image?: string;
  imagePosition?: "left" | "right";
  badge?: string;
  text?: string;
  features?: string[];
  buttons?: Array<{ text: string; url: string; variant?: "primary" | "secondary" }>;
  floatingCard?: { value: string; label: string };
}

export function SplitContentEditor({
  content,
  onChange,
}: {
  content: SplitContentData;
  onChange: (content: SplitContentData) => void;
}) {
  const update = (field: keyof SplitContentData, value: any) => {
    onChange({ ...content, [field]: value });
  };

  const features = content.features || [];
  const buttons = content.buttons || [];

  return (
    <div className="space-y-4">
      <ImageUploader
        label="Imagen"
        value={content.image}
        onChange={(url) => update("image", url)}
        onRemove={() => update("image", "")}
        aspectRatio="square"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Posición de imagen</Label>
          <Select
            value={content.imagePosition || "left"}
            onValueChange={(v) => update("imagePosition", v)}
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
        <div className="space-y-2">
          <Label>Badge</Label>
          <Input
            value={content.badge || ""}
            onChange={(e) => update("badge", e.target.value)}
            placeholder="Sobre nosotros"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Contenido (HTML)</Label>
        <Textarea
          value={content.text || ""}
          onChange={(e) => update("text", e.target.value)}
          placeholder="<p>Tu contenido aquí...</p>"
          rows={4}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Lista de características</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => update("features", [...features, "Nueva característica"])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
        {features.map((feature, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={feature}
              onChange={(e) => {
                const newFeatures = [...features];
                newFeatures[index] = e.target.value;
                update("features", newFeatures);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => update("features", features.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Botones</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => update("buttons", [...buttons, { text: "Nuevo botón", url: "#" }])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
        {buttons.map((btn, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={btn.text}
              onChange={(e) => {
                const newBtns = [...buttons];
                newBtns[index] = { ...newBtns[index], text: e.target.value };
                update("buttons", newBtns);
              }}
              placeholder="Texto"
            />
            <Input
              value={btn.url}
              onChange={(e) => {
                const newBtns = [...buttons];
                newBtns[index] = { ...newBtns[index], url: e.target.value };
                update("buttons", newBtns);
              }}
              placeholder="URL"
            />
            <Select
              value={btn.variant || "primary"}
              onValueChange={(v) => {
                const newBtns = [...buttons];
                newBtns[index] = { ...newBtns[index], variant: v as any };
                update("buttons", newBtns);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primario</SelectItem>
                <SelectItem value="secondary">Secundario</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => update("buttons", buttons.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Tarjeta flotante (opcional)</Label>
        <div className="grid gap-2 grid-cols-2">
          <Input
            value={content.floatingCard?.value || ""}
            onChange={(e) => update("floatingCard", { ...(content.floatingCard || {}), value: e.target.value })}
            placeholder="Valor (ej: +500)"
          />
          <Input
            value={content.floatingCard?.label || ""}
            onChange={(e) => update("floatingCard", { ...(content.floatingCard || {}), label: e.target.value })}
            placeholder="Etiqueta (ej: Casos resueltos)"
          />
        </div>
      </div>
    </div>
  );
}

// ====================
// Editor de LOGO CLOUD
// ====================
interface LogoItem {
  id: string;
  url: string;
  name?: string;
}

interface LogoCloudContent {
  logos: LogoItem[];
  style?: "grid" | "marquee";
}

export function LogoCloudEditor({
  content,
  onChange,
}: {
  content: LogoCloudContent;
  onChange: (content: LogoCloudContent) => void;
}) {
  const logos = content.logos || [];

  const addLogo = () => {
    onChange({
      ...content,
      logos: [...logos, { id: `logo-${Date.now()}`, url: "", name: "" }],
    });
  };

  const updateLogo = (index: number, updates: Partial<LogoItem>) => {
    const newLogos = [...logos];
    newLogos[index] = { ...newLogos[index], ...updates };
    onChange({ ...content, logos: newLogos });
  };

  const removeLogo = (index: number) => {
    onChange({ ...content, logos: logos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Estilo de visualización</Label>
        <Select
          value={content.style || "grid"}
          onValueChange={(v) => onChange({ ...content, style: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid estático</SelectItem>
            <SelectItem value="marquee">Marquee animado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Logos ({logos.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLogo}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {logos.map((logo, index) => (
          <Card key={logo.id} className="p-3">
            <div className="space-y-2">
              <ImageUploader
                value={logo.url}
                onChange={(url) => updateLogo(index, { url })}
                onRemove={() => updateLogo(index, { url: "" })}
                aspectRatio="wide"
              />
              <Input
                value={logo.name || ""}
                onChange={(e) => updateLogo(index, { name: e.target.value })}
                placeholder="Nombre del cliente"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-destructive"
                onClick={() => removeLogo(index)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ====================
// Editor de EQUIPO (TEAM)
// ====================
interface TeamMember {
  id: string;
  name: string;
  role: string;
  image?: string;
  bio?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  category?: string;
}

interface TeamContent {
  members: TeamMember[];
  columns?: 2 | 3 | 4;
  showBio?: boolean;
  showContact?: boolean;
  layout?: "grid" | "list" | "cards";
}

export function TeamEditor({
  content,
  onChange,
}: {
  content: TeamContent;
  onChange: (content: TeamContent) => void;
}) {
  const members = content.members || [];

  const addMember = () => {
    onChange({
      ...content,
      members: [
        ...members,
        {
          id: crypto.randomUUID(),
          name: "",
          role: "",
        },
      ],
    });
  };

  const updateMember = (index: number, updates: Partial<TeamMember>) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], ...updates };
    onChange({ ...content, members: newMembers });
  };

  const removeMember = (index: number) => {
    onChange({
      ...content,
      members: members.filter((_, i) => i !== index),
    });
  };

  const moveMember = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= members.length) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[newIndex]] = [newMembers[newIndex], newMembers[index]];
    onChange({ ...content, members: newMembers });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Columnas</Label>
          <Select
            value={String(content.columns || 3)}
            onValueChange={(v) => onChange({ ...content, columns: Number(v) as 2 | 3 | 4 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Columnas</SelectItem>
              <SelectItem value="3">3 Columnas</SelectItem>
              <SelectItem value="4">4 Columnas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={content.layout || "grid"}
            onValueChange={(v) => onChange({ ...content, layout: v as "grid" | "list" | "cards" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Cuadrícula</SelectItem>
              <SelectItem value="cards">Tarjetas</SelectItem>
              <SelectItem value="list">Lista</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={content.showBio || false}
              onCheckedChange={(v) => onChange({ ...content, showBio: v })}
            />
            <Label>Mostrar Bio</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={content.showContact || false}
              onCheckedChange={(v) => onChange({ ...content, showContact: v })}
            />
            <Label>Mostrar Contacto</Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Miembros del Equipo ({members.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addMember}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Miembro
        </Button>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveMember(index, "up")}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveMember(index, "down")}
                  disabled={index === members.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="w-32 shrink-0">
                <ImageUploader
                  value={member.image}
                  onChange={(url) => updateMember(index, { image: url })}
                  onRemove={() => updateMember(index, { image: "" })}
                  aspectRatio="square"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={member.name || ""}
                      onChange={(e) => updateMember(index, { name: e.target.value })}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cargo/Rol</Label>
                    <Input
                      value={member.role || ""}
                      onChange={(e) => updateMember(index, { role: e.target.value })}
                      placeholder="Ej: Árbitro Principal"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Categoría (opcional)</Label>
                    <Input
                      value={member.category || ""}
                      onChange={(e) => updateMember(index, { category: e.target.value })}
                      placeholder="Ej: Consejo Directivo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">LinkedIn (opcional)</Label>
                    <Input
                      value={member.linkedin || ""}
                      onChange={(e) => updateMember(index, { linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>

                {content.showContact && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={member.email || ""}
                        onChange={(e) => updateMember(index, { email: e.target.value })}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Teléfono</Label>
                      <Input
                        value={member.phone || ""}
                        onChange={(e) => updateMember(index, { phone: e.target.value })}
                        placeholder="+51 999 999 999"
                      />
                    </div>
                  </div>
                )}

                {content.showBio && (
                  <div className="space-y-1">
                    <Label className="text-xs">Biografía</Label>
                    <Textarea
                      value={member.bio || ""}
                      onChange={(e) => updateMember(index, { bio: e.target.value })}
                      placeholder="Breve descripción profesional..."
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive shrink-0"
                onClick={() => removeMember(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No hay miembros todavía</p>
          <Button type="button" variant="outline" size="sm" onClick={addMember} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Agregar primer miembro
          </Button>
        </div>
      )}
    </div>
  );
}

// ====================
// Editor de TESTIMONIOS (TESTIMONIALS)
// ====================
interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole?: string;
  authorCompany?: string;
  authorImage?: string;
  rating?: number;
}

interface TestimonialsContent {
  testimonials: Testimonial[];
  columns?: 1 | 2 | 3;
  showRating?: boolean;
  autoplay?: boolean;
  layout?: "grid" | "carousel" | "masonry";
}

export function TestimonialsEditor({
  content,
  onChange,
}: {
  content: TestimonialsContent;
  onChange: (content: TestimonialsContent) => void;
}) {
  const testimonials = content.testimonials || [];

  const addTestimonial = () => {
    onChange({
      ...content,
      testimonials: [
        ...testimonials,
        {
          id: crypto.randomUUID(),
          quote: "",
          authorName: "",
        },
      ],
    });
  };

  const updateTestimonial = (index: number, updates: Partial<Testimonial>) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], ...updates };
    onChange({ ...content, testimonials: newTestimonials });
  };

  const removeTestimonial = (index: number) => {
    onChange({
      ...content,
      testimonials: testimonials.filter((_, i) => i !== index),
    });
  };

  const moveTestimonial = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= testimonials.length) return;
    const newTestimonials = [...testimonials];
    [newTestimonials[index], newTestimonials[newIndex]] = [newTestimonials[newIndex], newTestimonials[index]];
    onChange({ ...content, testimonials: newTestimonials });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Columnas</Label>
          <Select
            value={String(content.columns || 3)}
            onValueChange={(v) => onChange({ ...content, columns: Number(v) as 1 | 2 | 3 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Columna</SelectItem>
              <SelectItem value="2">2 Columnas</SelectItem>
              <SelectItem value="3">3 Columnas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={content.layout || "grid"}
            onValueChange={(v) => onChange({ ...content, layout: v as "grid" | "carousel" | "masonry" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Cuadrícula</SelectItem>
              <SelectItem value="carousel">Carrusel</SelectItem>
              <SelectItem value="masonry">Mampostería</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={content.showRating || false}
              onCheckedChange={(v) => onChange({ ...content, showRating: v })}
            />
            <Label>Mostrar Rating</Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Testimonios ({testimonials.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTestimonial}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Testimonio
        </Button>
      </div>

      <div className="space-y-3">
        {testimonials.map((testimonial, index) => (
          <Card key={testimonial.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveTestimonial(index, "up")}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveTestimonial(index, "down")}
                  disabled={index === testimonials.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Testimonio</Label>
                  <Textarea
                    value={testimonial.quote || ""}
                    onChange={(e) => updateTestimonial(index, { quote: e.target.value })}
                    placeholder="Lo que dice el cliente..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-20 shrink-0">
                    <ImageUploader
                      value={testimonial.authorImage}
                      onChange={(url) => updateTestimonial(index, { authorImage: url })}
                      onRemove={() => updateTestimonial(index, { authorImage: "" })}
                      aspectRatio="square"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Nombre del Autor</Label>
                        <Input
                          value={testimonial.authorName || ""}
                          onChange={(e) => updateTestimonial(index, { authorName: e.target.value })}
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cargo</Label>
                        <Input
                          value={testimonial.authorRole || ""}
                          onChange={(e) => updateTestimonial(index, { authorRole: e.target.value })}
                          placeholder="Gerente General"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Empresa</Label>
                        <Input
                          value={testimonial.authorCompany || ""}
                          onChange={(e) => updateTestimonial(index, { authorCompany: e.target.value })}
                          placeholder="Empresa S.A.C."
                        />
                      </div>
                      {content.showRating && (
                        <div className="space-y-1">
                          <Label className="text-xs">Rating (1-5)</Label>
                          <Select
                            value={String(testimonial.rating || 5)}
                            onValueChange={(v) => updateTestimonial(index, { rating: Number(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                              <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                              <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                              <SelectItem value="2">⭐⭐ (2)</SelectItem>
                              <SelectItem value="1">⭐ (1)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive shrink-0"
                onClick={() => removeTestimonial(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No hay testimonios todavía</p>
          <Button type="button" variant="outline" size="sm" onClick={addTestimonial} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Agregar primer testimonio
          </Button>
        </div>
      )}

      {/* Preview */}
      {testimonials.length > 0 && (
        <div className="rounded-lg border p-6 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-3">Vista previa</p>
          <div className={`grid gap-4 md:grid-cols-${content.columns || 3}`}>
            {testimonials.slice(0, 3).map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm italic mb-3">"{testimonial.quote || "Testimonio..."}"</p>
                <div className="flex items-center gap-2">
                  {testimonial.authorImage ? (
                    <img
                      src={testimonial.authorImage}
                      alt={testimonial.authorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{testimonial.authorName || "Nombre"}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.authorRole}
                      {testimonial.authorCompany && ` - ${testimonial.authorCompany}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ====================
// Editor Principal
// ====================
export function VisualSectionEditor({
  type,
  content,
  onChange,
}: {
  type: string;
  content: any;
  onChange: (content: any) => void;
}) {
  switch (type) {
    case "HERO":
      return <HeroEditor content={content || {}} onChange={onChange} />;
    case "SLIDER":
    case "BANNER":
      return <SliderEditor content={content || { slides: [] }} onChange={onChange} />;
    case "CARDS":
      return <CardsEditor content={content || { cards: [] }} onChange={onChange} />;
    case "FEATURE_GRID":
      return <FeatureGridEditor content={content || { features: [] }} onChange={onChange} />;
    case "ACCORDION":
      return <AccordionEditor content={content || { items: [] }} onChange={onChange} />;
    case "STATS":
      return <StatsEditor content={content || { stats: [] }} onChange={onChange} />;
    case "CTA":
      return <CtaEditor content={content || {}} onChange={onChange} />;
    case "TEXT":
      return <TextEditor content={content || {}} onChange={onChange} />;
    case "IMAGE":
      return <ImageEditor content={content || {}} onChange={onChange} />;
    case "GALLERY":
      return <GalleryEditor content={content || { images: [] }} onChange={onChange} />;
    case "VIDEO":
      return <VideoEditor content={content || {}} onChange={onChange} />;
    case "PRICING":
      return <PricingEditor content={content || { plans: [] }} onChange={onChange} />;
    case "SPLIT_CONTENT":
      return <SplitContentEditor content={content || {}} onChange={onChange} />;
    case "LOGO_CLOUD":
      return <LogoCloudEditor content={content || { logos: [] }} onChange={onChange} />;
    case "TEAM":
      return <TeamEditor content={content || { members: [] }} onChange={onChange} />;
    case "TESTIMONIALS":
      return <TestimonialsEditor content={content || { testimonials: [] }} onChange={onChange} />;
    default:
      return (
        <div className="space-y-2">
          <Label>Contenido (JSON)</Label>
          <Textarea
            className="font-mono text-sm"
            rows={8}
            value={JSON.stringify(content || {}, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON
              }
            }}
            placeholder="{}"
          />
          <p className="text-xs text-muted-foreground">
            Editor visual no disponible para este tipo. Edita el JSON directamente.
          </p>
        </div>
      );
  }
}

export default VisualSectionEditor;
