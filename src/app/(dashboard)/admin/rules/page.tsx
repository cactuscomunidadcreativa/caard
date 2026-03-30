/**
 * Página: Reglas del Sistema
 * ===========================
 * Configuración de reglas y parámetros del sistema
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Clock,
  FileText,
  DollarSign,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface Rule {
  id: string;
  key: string;
  name: string;
  description: string;
  value: string;
  valueType: string;
  category: string;
  isActive: boolean;
  lastModified: string;
}

const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
  PLAZOS: { label: "Plazos", color: "bg-blue-100 text-blue-800", icon: Clock },
  EMERGENCIA: { label: "Emergencia", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  FINANCIERO: { label: "Financiero", color: "bg-green-100 text-green-800", icon: DollarSign },
  NOTIFICACIONES: { label: "Notificaciones", color: "bg-purple-100 text-purple-800", icon: FileText },
  DOCUMENTOS: { label: "Documentos", color: "bg-amber-100 text-amber-800", icon: FileText },
};

export default function RulesConfigPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch("/api/admin/notification-rules");
        if (res.ok) {
          const data = await res.json();
          const items = (data.rules || data || []).map((r: any) => ({
            id: r.id,
            key: r.key || r.name?.toUpperCase().replace(/\s+/g, "_") || "",
            name: r.name || r.key || "",
            description: r.description || "",
            value: String(r.value ?? ""),
            valueType: r.valueType || "NUMBER",
            category: r.category || "GENERAL",
            isActive: r.isActive ?? true,
            lastModified: r.updatedAt ? new Date(r.updatedAt).toISOString().split("T")[0] : "",
          }));
          setRules(items);
        }
      } catch (error) {
        console.error("Error fetching rules:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRules();
  }, []);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRules = rules.filter(rule => {
    const matchesCategory = filterCategory === "all" || rule.category === filterCategory;
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.key.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleActive = (id: string) => {
    setRules(rules.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const formatValue = (rule: Rule) => {
    if (rule.valueType === "BOOLEAN") {
      return rule.value === "true" ? "Sí" : "No";
    }
    return rule.value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reglas del Sistema</h1>
          <p className="text-muted-foreground">
            Configure los parámetros y reglas de negocio del centro
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar regla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="PLAZOS">Plazos</SelectItem>
                <SelectItem value="EMERGENCIA">Emergencia</SelectItem>
                <SelectItem value="FINANCIERO">Financiero</SelectItem>
                <SelectItem value="NOTIFICACIONES">Notificaciones</SelectItem>
                <SelectItem value="DOCUMENTOS">Documentos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Reglas */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Reglas</CardTitle>
          <CardDescription>
            {filteredRules.length} regla(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Modificación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => {
                const CategoryIcon = categoryConfig[rule.category]?.icon || Settings;
                return (
                  <TableRow key={rule.id} className={!rule.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-sm">
                      {rule.key}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold">
                        {formatValue(rule)}
                      </span>
                      {rule.valueType === "NUMBER" && rule.category === "PLAZOS" && (
                        <span className="text-muted-foreground ml-1">días</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig[rule.category]?.color}`}>
                        {categoryConfig[rule.category]?.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleActive(rule.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rule.lastModified}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRule(rule);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Editar Regla */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Regla</DialogTitle>
            <DialogDescription>
              Modifique el valor de la regla
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm text-muted-foreground">{selectedRule.key}</p>
                <p className="font-medium mt-1">{selectedRule.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedRule.description}</p>
              </div>

              <div className="space-y-2">
                <Label>Valor</Label>
                {selectedRule.valueType === "BOOLEAN" ? (
                  <Select defaultValue={selectedRule.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí (Activo)</SelectItem>
                      <SelectItem value="false">No (Inactivo)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : selectedRule.valueType === "TEXT" ? (
                  <Textarea defaultValue={selectedRule.value} />
                ) : (
                  <Input
                    type="number"
                    defaultValue={selectedRule.value}
                  />
                )}
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Atención:</strong> Modificar esta regla puede afectar
                  el funcionamiento del sistema. Asegúrese de conocer las implicaciones.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Regla */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Regla</DialogTitle>
            <DialogDescription>
              Agregue una nueva regla al sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Clave (identificador único)</Label>
              <Input placeholder="Ej: PLAZO_NUEVO_PROCESO" />
              <p className="text-xs text-muted-foreground">
                Use mayúsculas y guiones bajos, sin espacios
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Nombre descriptivo de la regla" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Explique el propósito de esta regla..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Valor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMBER">Número</SelectItem>
                    <SelectItem value="TEXT">Texto</SelectItem>
                    <SelectItem value="BOOLEAN">Sí/No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLAZOS">Plazos</SelectItem>
                    <SelectItem value="EMERGENCIA">Emergencia</SelectItem>
                    <SelectItem value="FINANCIERO">Financiero</SelectItem>
                    <SelectItem value="NOTIFICACIONES">Notificaciones</SelectItem>
                    <SelectItem value="DOCUMENTOS">Documentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Inicial</Label>
              <Input placeholder="Valor por defecto" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button>Crear Regla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
