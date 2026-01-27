"use client";

/**
 * CAARD CMS - Editor de Menús Mejorado
 * =====================================
 * Editor visual de menús con drag & drop real usando dnd-kit
 * Permite crear, editar, reordenar y anidar items del menú
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Menu,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  Save,
  Loader2,
  Edit2,
  Eye,
  EyeOff,
  FolderOpen,
  CornerDownRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Tipos
interface MenuItem {
  id: string;
  label: string;
  url?: string | null;
  pageSlug?: string | null;
  target?: string;
  icon?: string | null;
  isVisible: boolean;
  children: MenuItem[];
}

interface FlattenedItem {
  id: string;
  item: MenuItem;
  depth: number;
  parentId: string | null;
  index: number;
}

interface MenuEditorProps {
  initialItems?: MenuItem[];
  onSave?: (items: MenuItem[]) => Promise<void>;
  availablePages?: { slug: string; title: string }[];
}

// Generar ID único
const generateId = () => `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Componente de item arrastrable
function SortableMenuItem({
  item,
  depth,
  onEdit,
  onDelete,
  onToggleVisibility,
  onAddChild,
  isExpanded,
  onToggleExpand,
  isDragging,
}: {
  item: MenuItem;
  depth: number;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddChild: (parentId: string) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = item.children && item.children.length > 0;
  const maxDepth = 2;

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all",
          depth > 0 && "border-l-4 border-l-primary/30",
          !item.isVisible && "opacity-50",
          (isDragging || isSortableDragging) && "opacity-50 border-dashed border-primary"
        )}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1 touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Expand toggle */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleExpand(item.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-7" />
        )}

        {/* Icon indicator */}
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          hasChildren ? "bg-primary/10" : "bg-muted"
        )}>
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : item.url ? (
            item.target === "_blank" ? (
              <ExternalLink className="h-4 w-4 text-primary" />
            ) : (
              <LinkIcon className="h-4 w-4 text-primary" />
            )
          ) : item.pageSlug ? (
            <FileText className="h-4 w-4 text-primary" />
          ) : (
            <Menu className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.label}</p>
          <p className="text-xs text-muted-foreground truncate">
            {item.url
              ? item.url
              : item.pageSlug
              ? `/${item.pageSlug}`
              : hasChildren
              ? `${item.children.length} submenú${item.children.length !== 1 ? "s" : ""}`
              : "Solo agrupador"}
          </p>
        </div>

        {/* Depth indicator */}
        {depth > 0 && (
          <Badge variant="outline" className="text-xs shrink-0">
            <CornerDownRight className="h-3 w-3 mr-1" />
            Nivel {depth + 1}
          </Badge>
        )}

        {/* Visibility badge */}
        {!item.isVisible && (
          <Badge variant="secondary" className="text-xs shrink-0">
            Oculto
          </Badge>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleVisibility(item.id)}
            title={item.isVisible ? "Ocultar" : "Mostrar"}
          >
            {item.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAddChild(item.id)}
              title="Agregar submenú"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(item)}
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(item.id)}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente de overlay durante el arrastre
function DragOverlayItem({ item, depth }: { item: MenuItem; depth: number }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border-2 border-primary bg-card shadow-xl",
        depth > 0 && "border-l-4 border-l-primary"
      )}
      style={{ marginLeft: depth * 24, width: "auto", minWidth: 300 }}
    >
      <GripVertical className="h-5 w-5 text-primary" />
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
        <Menu className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{item.label}</p>
      </div>
    </div>
  );
}

// Editor principal
export function MenuEditor({
  initialItems = [],
  onSave,
  availablePages = [],
}: MenuEditorProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    const addExpanded = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          expanded.add(item.id);
          addExpanded(item.children);
        }
      }
    };
    addExpanded(initialItems);
    return expanded;
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Sensores para dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Items aplanados para ordenamiento
  const flattenedItems = useMemo(() => {
    const result: FlattenedItem[] = [];
    const flatten = (items: MenuItem[], parentId: string | null, depth: number) => {
      items.forEach((item, index) => {
        result.push({ id: item.id, item, depth, parentId, index });
        if (expandedItems.has(item.id) && item.children.length > 0) {
          flatten(item.children, item.id, depth + 1);
        }
      });
    };
    flatten(items, null, 0);
    return result;
  }, [items, expandedItems]);

  const sortableIds = useMemo(() => flattenedItems.map((f) => f.id), [flattenedItems]);

  // Item activo durante el arrastre
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return flattenedItems.find((f) => f.id === activeId) || null;
  }, [activeId, flattenedItems]);

  // Actualizar cuando cambian los initialItems
  useEffect(() => {
    setItems(initialItems);
    const expanded = new Set<string>();
    const addExpanded = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          expanded.add(item.id);
          addExpanded(item.children);
        }
      }
    };
    addExpanded(initialItems);
    setExpandedItems(expanded);
  }, [initialItems]);

  // Detectar cambios
  useEffect(() => {
    const initialJson = JSON.stringify(initialItems);
    const currentJson = JSON.stringify(items);
    setHasChanges(initialJson !== currentJson);
  }, [items, initialItems]);

  // Toggle expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeFlat = flattenedItems.find((f) => f.id === active.id);
    const overFlat = flattenedItems.find((f) => f.id === over.id);

    if (!activeFlat || !overFlat) return;

    setItems((prevItems) => {
      // Función recursiva para remover item de su ubicación actual
      const removeItem = (items: MenuItem[], id: string): [MenuItem[], MenuItem | null] => {
        let removed: MenuItem | null = null;
        const newItems = items.filter((item) => {
          if (item.id === id) {
            removed = item;
            return false;
          }
          return true;
        }).map((item) => {
          if (item.children.length > 0) {
            const [newChildren, childRemoved] = removeItem(item.children, id);
            if (childRemoved) removed = childRemoved;
            return { ...item, children: newChildren };
          }
          return item;
        });
        return [newItems, removed];
      };

      const [itemsWithoutActive, removedItem] = removeItem(prevItems, active.id as string);
      if (!removedItem) return prevItems;

      // Si es el mismo nivel padre, reordenar dentro de ese nivel
      if (activeFlat.parentId === overFlat.parentId) {
        if (activeFlat.parentId === null) {
          // Nivel raíz
          const overIndex = itemsWithoutActive.findIndex((item) => item.id === over.id);
          const newItems = [...itemsWithoutActive];
          newItems.splice(overIndex, 0, removedItem);
          return newItems;
        } else {
          // Dentro de un padre
          const updateChildren = (items: MenuItem[]): MenuItem[] => {
            return items.map((item) => {
              if (item.id === activeFlat.parentId) {
                const overIndex = item.children.findIndex((c) => c.id === over.id);
                const newChildren = [...item.children];
                newChildren.splice(overIndex, 0, removedItem);
                return { ...item, children: newChildren };
              }
              if (item.children.length > 0) {
                return { ...item, children: updateChildren(item.children) };
              }
              return item;
            });
          };
          return updateChildren(itemsWithoutActive);
        }
      }

      // Diferentes niveles - insertar después del over item en su nivel
      if (overFlat.parentId === null) {
        // Mover a nivel raíz
        const overIndex = itemsWithoutActive.findIndex((item) => item.id === over.id);
        const newItems = [...itemsWithoutActive];
        newItems.splice(overIndex + 1, 0, removedItem);
        return newItems;
      } else {
        // Mover dentro de otro padre
        const updateChildren = (items: MenuItem[]): MenuItem[] => {
          return items.map((item) => {
            if (item.id === overFlat.parentId) {
              const overIndex = item.children.findIndex((c) => c.id === over.id);
              const newChildren = [...item.children];
              newChildren.splice(overIndex + 1, 0, removedItem);
              return { ...item, children: newChildren };
            }
            if (item.children.length > 0) {
              return { ...item, children: updateChildren(item.children) };
            }
            return item;
          });
        };
        return updateChildren(itemsWithoutActive);
      }
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Abrir dialog para nuevo item
  const handleAddItem = (parentId: string | null = null) => {
    setParentIdForNew(parentId);
    setEditingItem({
      id: generateId(),
      label: "",
      url: null,
      pageSlug: null,
      target: "_self",
      icon: null,
      isVisible: true,
      children: [],
    });
    setIsDialogOpen(true);
  };

  // Editar item existente
  const handleEditItem = (item: MenuItem) => {
    setEditingItem({ ...item });
    setParentIdForNew(null);
    setIsDialogOpen(true);
  };

  // Guardar item
  const handleSaveItem = () => {
    if (!editingItem || !editingItem.label.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setItems((prev) => {
      const updateItems = (items: MenuItem[]): MenuItem[] => {
        return items.map((item) => {
          if (item.id === editingItem.id) {
            return { ...editingItem, children: item.children };
          }
          if (item.children.length > 0) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      };

      const existsInTree = (items: MenuItem[]): boolean => {
        for (const item of items) {
          if (item.id === editingItem.id) return true;
          if (item.children.length > 0 && existsInTree(item.children)) return true;
        }
        return false;
      };

      if (!existsInTree(prev)) {
        if (parentIdForNew) {
          const addToParent = (items: MenuItem[]): MenuItem[] => {
            return items.map((item) => {
              if (item.id === parentIdForNew) {
                return { ...item, children: [...item.children, editingItem] };
              }
              if (item.children.length > 0) {
                return { ...item, children: addToParent(item.children) };
              }
              return item;
            });
          };
          // Expandir el padre automáticamente
          setExpandedItems((prev) => new Set([...prev, parentIdForNew]));
          return addToParent(prev);
        }
        return [...prev, editingItem];
      }

      return updateItems(prev);
    });

    setIsDialogOpen(false);
    setEditingItem(null);
    setParentIdForNew(null);
  };

  // Eliminar item
  const handleDeleteItem = (id: string) => {
    const removeItem = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter((item) => item.id !== id)
        .map((item) => ({
          ...item,
          children: removeItem(item.children),
        }));
    };
    setItems(removeItem(items));
  };

  // Toggle visibilidad
  const handleToggleVisibility = (id: string) => {
    const toggleVisibility = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, isVisible: !item.isVisible };
        }
        if (item.children.length > 0) {
          return { ...item, children: toggleVisibility(item.children) };
        }
        return item;
      });
    };
    setItems(toggleVisibility(items));
  };

  // Guardar menú
  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(items);
      toast.success("Menú guardado correctamente");
    } catch (error) {
      console.error("Error saving menu:", error);
      toast.error("Error al guardar el menú");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Menu className="h-5 w-5" />
            Editor de Menú
          </h3>
          <p className="text-sm text-muted-foreground">
            Arrastra los items para reordenarlos, usa + para crear submenús
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Cambios sin guardar
            </Badge>
          )}
          <Button onClick={() => handleAddItem()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Item
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Menú
          </Button>
        </div>
      </div>

      {/* Lista de items con drag & drop */}
      <Card>
        <CardContent className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Menu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Menú vacío</h3>
              <p className="text-muted-foreground mb-4">
                Agrega items para crear el menú de navegación
              </p>
              <Button onClick={() => handleAddItem()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer item
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {flattenedItems.map((flatItem) => (
                    <SortableMenuItem
                      key={flatItem.id}
                      item={flatItem.item}
                      depth={flatItem.depth}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      onToggleVisibility={handleToggleVisibility}
                      onAddChild={handleAddItem}
                      isExpanded={expandedItems.has(flatItem.item.id)}
                      onToggleExpand={toggleExpand}
                      isDragging={activeId === flatItem.id}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeItem ? (
                  <DragOverlayItem item={activeItem.item} depth={activeItem.depth} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {parentIdForNew
                ? "Agregar submenú"
                : editingItem?.children?.length === 0 && !items.find((i) => i.id === editingItem?.id)
                ? "Nuevo item de menú"
                : "Editar item"}
            </DialogTitle>
            <DialogDescription>
              Configura las propiedades del elemento del menú
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Nombre *</Label>
                <Input
                  id="label"
                  value={editingItem.label}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, label: e.target.value })
                  }
                  placeholder="Ej: Servicios"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tipo de enlace</Label>
                <Select
                  value={editingItem.pageSlug ? "page" : editingItem.url ? "url" : "none"}
                  onValueChange={(v) => {
                    if (v === "page") {
                      setEditingItem({ ...editingItem, url: null, pageSlug: "" });
                    } else if (v === "url") {
                      setEditingItem({ ...editingItem, url: "", pageSlug: null });
                    } else {
                      setEditingItem({ ...editingItem, url: null, pageSlug: null });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Solo agrupador (sin enlace)</SelectItem>
                    <SelectItem value="page">Página interna</SelectItem>
                    <SelectItem value="url">URL personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingItem.pageSlug !== null && editingItem.pageSlug !== undefined && (
                <div className="space-y-2">
                  <Label htmlFor="pageSlug">Página</Label>
                  {availablePages.length > 0 ? (
                    <Select
                      value={editingItem.pageSlug || ""}
                      onValueChange={(v) =>
                        setEditingItem({ ...editingItem, pageSlug: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una página" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePages.map((page) => (
                          <SelectItem key={page.slug} value={page.slug}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="pageSlug"
                      value={editingItem.pageSlug || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, pageSlug: e.target.value })
                      }
                      placeholder="Ej: nosotros"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Slug de la página (sin /)
                  </p>
                </div>
              )}

              {editingItem.url !== null && editingItem.url !== undefined && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={editingItem.url || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, url: e.target.value })
                      }
                      placeholder="https://ejemplo.com o /ruta"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Abrir en nueva pestaña</Label>
                      <p className="text-xs text-muted-foreground">
                        Se abrirá en una nueva ventana
                      </p>
                    </div>
                    <Switch
                      checked={editingItem.target === "_blank"}
                      onCheckedChange={(checked) =>
                        setEditingItem({
                          ...editingItem,
                          target: checked ? "_blank" : "_self",
                        })
                      }
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Visible en menú</Label>
                  <p className="text-xs text-muted-foreground">
                    Mostrar este item en la navegación
                  </p>
                </div>
                <Switch
                  checked={editingItem.isVisible}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, isVisible: checked })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem}>
              {parentIdForNew || !items.find((i) => i.id === editingItem?.id)
                ? "Agregar"
                : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MenuEditor;
