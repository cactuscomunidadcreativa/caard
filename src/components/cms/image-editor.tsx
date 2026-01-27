/**
 * CAARD CMS - Editor de Imágenes Avanzado
 * Recortar, redimensionar, rotar, filtros, ajustes
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Crop,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sun,
  Contrast,
  Droplets,
  X,
  Check,
  Undo,
  Redo,
  Download,
  Upload,
  Image as ImageIcon,
  Move,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageEditorProps {
  image: string;
  onSave: (editedImage: string, metadata: ImageMetadata) => void;
  onCancel: () => void;
  aspectRatios?: AspectRatio[];
}

interface AspectRatio {
  name: string;
  value: number | null; // null = free
  icon: React.ReactNode;
}

interface ImageMetadata {
  width: number;
  height: number;
  cropArea?: CropArea;
  filters: Filters;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

const defaultAspectRatios: AspectRatio[] = [
  { name: "Libre", value: null, icon: <Move className="h-4 w-4" /> },
  { name: "1:1", value: 1, icon: <Square className="h-4 w-4" /> },
  { name: "16:9", value: 16/9, icon: <RectangleHorizontal className="h-4 w-4" /> },
  { name: "4:3", value: 4/3, icon: <RectangleHorizontal className="h-4 w-4" /> },
  { name: "3:2", value: 3/2, icon: <RectangleHorizontal className="h-4 w-4" /> },
  { name: "9:16", value: 9/16, icon: <RectangleVertical className="h-4 w-4" /> },
  { name: "21:9", value: 21/9, icon: <RectangleHorizontal className="h-4 w-4" /> },
];

const defaultFilters: Filters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

const presetFilters = [
  { name: "Original", filters: defaultFilters },
  { name: "Brillante", filters: { ...defaultFilters, brightness: 115, contrast: 105 } },
  { name: "Cálido", filters: { ...defaultFilters, sepia: 20, saturation: 110 } },
  { name: "Frío", filters: { ...defaultFilters, saturation: 80, brightness: 105 } },
  { name: "B&N", filters: { ...defaultFilters, grayscale: 100 } },
  { name: "Vintage", filters: { ...defaultFilters, sepia: 40, contrast: 90, brightness: 95 } },
  { name: "Dramático", filters: { ...defaultFilters, contrast: 130, saturation: 120 } },
  { name: "Suave", filters: { ...defaultFilters, brightness: 105, contrast: 90, blur: 1 } },
];

export function ImageEditor({
  image,
  onSave,
  onCancel,
  aspectRatios = defaultAspectRatios,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"crop" | "adjust" | "filters">("crop");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [history, setHistory] = useState<Filters[]>([defaultFilters]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);

      // Set initial crop area to full image
      setCropArea({
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      });
    };
    img.src = image;
  }, [image]);

  // Draw image on canvas
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;

    if (!canvas || !ctx || !img || !imageLoaded) return;

    // Set canvas size
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = 500;
    const scale = Math.min(
      containerWidth / img.width,
      containerHeight / img.height
    ) * (zoom / 100);

    const displayWidth = img.width * scale;
    const displayHeight = img.height * scale;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Apply filters
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      blur(${filters.blur}px)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
    `;

    // Draw image
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    ctx.restore();

    // Draw crop overlay if in crop mode
    if (mode === "crop" && cropArea) {
      const scaleX = displayWidth / img.width;
      const scaleY = displayHeight / img.height;

      // Semi-transparent overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear crop area
      ctx.clearRect(
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY
      );

      // Redraw image in crop area
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        blur(${filters.blur}px)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
      `;
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      ctx.restore();

      // Crop border
      ctx.strokeStyle = "#D66829";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY
      );

      // Grid lines (rule of thirds)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      const cropX = cropArea.x * scaleX;
      const cropY = cropArea.y * scaleY;
      const cropW = cropArea.width * scaleX;
      const cropH = cropArea.height * scaleY;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(cropX + cropW / 3, cropY);
      ctx.lineTo(cropX + cropW / 3, cropY + cropH);
      ctx.moveTo(cropX + (cropW * 2) / 3, cropY);
      ctx.lineTo(cropX + (cropW * 2) / 3, cropY + cropH);
      // Horizontal lines
      ctx.moveTo(cropX, cropY + cropH / 3);
      ctx.lineTo(cropX + cropW, cropY + cropH / 3);
      ctx.moveTo(cropX, cropY + (cropH * 2) / 3);
      ctx.lineTo(cropX + cropW, cropY + (cropH * 2) / 3);
      ctx.stroke();
    }
  }, [imageLoaded, zoom, rotation, flipH, flipV, filters, mode, cropArea]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // Update filters with history
  const updateFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFilters);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFilters(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFilters(history[historyIndex + 1]);
    }
  };

  const resetFilters = () => {
    updateFilters(defaultFilters);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(100);
  };

  // Apply aspect ratio to crop
  const applyAspectRatio = (ratio: number | null) => {
    setSelectedAspectRatio(ratio);
    if (!ratio || !imageSize.width || !imageSize.height) return;

    const imgRatio = imageSize.width / imageSize.height;
    let newWidth, newHeight;

    if (ratio > imgRatio) {
      newWidth = imageSize.width;
      newHeight = imageSize.width / ratio;
    } else {
      newHeight = imageSize.height;
      newWidth = imageSize.height * ratio;
    }

    setCropArea({
      x: (imageSize.width - newWidth) / 2,
      y: (imageSize.height - newHeight) / 2,
      width: newWidth,
      height: newHeight,
    });
  };

  // Export cropped/edited image
  const exportImage = () => {
    const img = imageRef.current;
    if (!img) return;

    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Use crop area or full image
    const crop = cropArea || { x: 0, y: 0, width: img.width, height: img.height };

    exportCanvas.width = crop.width;
    exportCanvas.height = crop.height;

    // Apply transformations
    ctx.save();
    ctx.translate(exportCanvas.width / 2, exportCanvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-exportCanvas.width / 2, -exportCanvas.height / 2);

    // Apply filters
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      blur(${filters.blur}px)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
    `;

    // Draw cropped area
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );
    ctx.restore();

    // Get data URL
    const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.9);

    const metadata: ImageMetadata = {
      width: crop.width,
      height: crop.height,
      cropArea: crop,
      filters,
      rotation,
      flipH,
      flipV,
    };

    onSave(dataUrl, metadata);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex === 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex === history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Restablecer
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={exportImage} className="bg-[#D66829] hover:bg-[#c45a22]">
            <Check className="h-4 w-4 mr-2" />
            Aplicar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center p-4 bg-slate-900"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>

        {/* Controls Panel */}
        <div className="w-80 border-l bg-white overflow-y-auto">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="w-full rounded-none border-b h-12 bg-slate-50">
              <TabsTrigger value="crop" className="flex-1">
                <Crop className="h-4 w-4 mr-2" />
                Recortar
              </TabsTrigger>
              <TabsTrigger value="adjust" className="flex-1">
                <Sun className="h-4 w-4 mr-2" />
                Ajustar
              </TabsTrigger>
              <TabsTrigger value="filters" className="flex-1">
                <ImageIcon className="h-4 w-4 mr-2" />
                Filtros
              </TabsTrigger>
            </TabsList>

            {/* Crop Tab */}
            <TabsContent value="crop" className="p-4 space-y-6">
              {/* Aspect Ratio */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Proporción</Label>
                <div className="grid grid-cols-4 gap-2">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.name}
                      onClick={() => applyAspectRatio(ratio.value)}
                      className={cn(
                        "p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors",
                        selectedAspectRatio === ratio.value
                          ? "border-[#D66829] bg-[#D66829]/10 text-[#D66829]"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {ratio.icon}
                      {ratio.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotation */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Rotación</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => r - 90)}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    -90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => r + 90)}
                    className="flex-1"
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    +90°
                  </Button>
                </div>
                <div className="mt-2">
                  <Slider
                    value={[rotation]}
                    onValueChange={([v]) => setRotation(v)}
                    min={-180}
                    max={180}
                    step={1}
                  />
                  <p className="text-xs text-center mt-1 text-slate-500">{rotation}°</p>
                </div>
              </div>

              {/* Flip */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Voltear</Label>
                <div className="flex gap-2">
                  <Button
                    variant={flipH ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFlipH(!flipH)}
                    className={cn("flex-1", flipH && "bg-[#D66829] hover:bg-[#c45a22]")}
                  >
                    <FlipHorizontal className="h-4 w-4 mr-1" />
                    Horizontal
                  </Button>
                  <Button
                    variant={flipV ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFlipV(!flipV)}
                    className={cn("flex-1", flipV && "bg-[#D66829] hover:bg-[#c45a22]")}
                  >
                    <FlipVertical className="h-4 w-4 mr-1" />
                    Vertical
                  </Button>
                </div>
              </div>

              {/* Zoom */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Zoom</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[zoom]}
                    onValueChange={([v]) => setZoom(v)}
                    min={50}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom((z) => Math.min(200, z + 10))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center mt-1 text-slate-500">{zoom}%</p>
              </div>
            </TabsContent>

            {/* Adjust Tab */}
            <TabsContent value="adjust" className="p-4 space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Brillo
                </Label>
                <Slider
                  value={[filters.brightness]}
                  onValueChange={([v]) => updateFilters({ ...filters, brightness: v })}
                  min={0}
                  max={200}
                  step={1}
                />
                <p className="text-xs text-right text-slate-500">{filters.brightness}%</p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Contraste
                </Label>
                <Slider
                  value={[filters.contrast]}
                  onValueChange={([v]) => updateFilters({ ...filters, contrast: v })}
                  min={0}
                  max={200}
                  step={1}
                />
                <p className="text-xs text-right text-slate-500">{filters.contrast}%</p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Saturación
                </Label>
                <Slider
                  value={[filters.saturation]}
                  onValueChange={([v]) => updateFilters({ ...filters, saturation: v })}
                  min={0}
                  max={200}
                  step={1}
                />
                <p className="text-xs text-right text-slate-500">{filters.saturation}%</p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2">Desenfoque</Label>
                <Slider
                  value={[filters.blur]}
                  onValueChange={([v]) => updateFilters({ ...filters, blur: v })}
                  min={0}
                  max={10}
                  step={0.5}
                />
                <p className="text-xs text-right text-slate-500">{filters.blur}px</p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2">Escala de grises</Label>
                <Slider
                  value={[filters.grayscale]}
                  onValueChange={([v]) => updateFilters({ ...filters, grayscale: v })}
                  min={0}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-right text-slate-500">{filters.grayscale}%</p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2">Sepia</Label>
                <Slider
                  value={[filters.sepia]}
                  onValueChange={([v]) => updateFilters({ ...filters, sepia: v })}
                  min={0}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-right text-slate-500">{filters.sepia}%</p>
              </div>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="p-4">
              <Label className="text-sm font-medium mb-3 block">Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {presetFilters.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateFilters(preset.filters)}
                    className={cn(
                      "p-3 rounded-lg border text-sm text-left transition-all",
                      JSON.stringify(filters) === JSON.stringify(preset.filters)
                        ? "border-[#D66829] bg-[#D66829]/10"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Dialog wrapper for ImageEditor
export function ImageEditorDialog({
  image,
  open,
  onOpenChange,
  onSave,
}: {
  image: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (editedImage: string, metadata: ImageMetadata) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <ImageEditor
          image={image}
          onSave={(img, meta) => {
            onSave(img, meta);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
