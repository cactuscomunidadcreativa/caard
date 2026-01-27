/**
 * Página: Configuración de Feriados
 * ==================================
 * Gestión del calendario de feriados para cálculo de plazos
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Upload,
} from "lucide-react";

// Datos de ejemplo de feriados 2025
const mockHolidays = [
  { id: "1", date: "2025-01-01", name: "Año Nuevo", type: "NACIONAL", isRecurring: true },
  { id: "2", date: "2025-04-17", name: "Jueves Santo", type: "NACIONAL", isRecurring: false },
  { id: "3", date: "2025-04-18", name: "Viernes Santo", type: "NACIONAL", isRecurring: false },
  { id: "4", date: "2025-05-01", name: "Día del Trabajo", type: "NACIONAL", isRecurring: true },
  { id: "5", date: "2025-06-29", name: "San Pedro y San Pablo", type: "NACIONAL", isRecurring: true },
  { id: "6", date: "2025-07-28", name: "Fiestas Patrias", type: "NACIONAL", isRecurring: true },
  { id: "7", date: "2025-07-29", name: "Fiestas Patrias", type: "NACIONAL", isRecurring: true },
  { id: "8", date: "2025-08-30", name: "Santa Rosa de Lima", type: "NACIONAL", isRecurring: true },
  { id: "9", date: "2025-10-08", name: "Combate de Angamos", type: "NACIONAL", isRecurring: true },
  { id: "10", date: "2025-11-01", name: "Día de Todos los Santos", type: "NACIONAL", isRecurring: true },
  { id: "11", date: "2025-12-08", name: "Inmaculada Concepción", type: "NACIONAL", isRecurring: true },
  { id: "12", date: "2025-12-09", name: "Batalla de Ayacucho", type: "NACIONAL", isRecurring: true },
  { id: "13", date: "2025-12-25", name: "Navidad", type: "NACIONAL", isRecurring: true },
  { id: "14", date: "2025-01-18", name: "Aniversario de Lima", type: "LOCAL", isRecurring: true },
];

const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  NACIONAL: { label: "Nacional", variant: "default" },
  LOCAL: { label: "Local", variant: "secondary" },
  INSTITUCIONAL: { label: "Institucional", variant: "outline" },
};

export default function HolidaysConfigPage() {
  const [holidays, setHolidays] = useState(mockHolidays);
  const [selectedHoliday, setSelectedHoliday] = useState<typeof mockHolidays[0] | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [filterYear, setFilterYear] = useState("2025");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredHolidays = holidays.filter(h => {
    const matchesYear = h.date.startsWith(filterYear);
    const matchesType = filterType === "all" || h.type === filterType;
    return matchesYear && matchesType;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este feriado?")) {
      setHolidays(holidays.filter(h => h.id !== id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  };

  const generateNextYear = () => {
    const nextYear = (parseInt(filterYear) + 1).toString();
    const recurringHolidays = holidays.filter(h => h.isRecurring);

    const newHolidays = recurringHolidays.map((h, idx) => ({
      ...h,
      id: `new-${idx}`,
      date: h.date.replace(filterYear, nextYear),
    }));

    alert(`Se generarían ${newHolidays.length} feriados para el año ${nextYear}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Feriados</h1>
          <p className="text-muted-foreground">
            Configure los feriados para el cálculo de días hábiles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateNextYear}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generar Próximo Año
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Feriado
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Año</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="NACIONAL">Nacional</SelectItem>
                  <SelectItem value="LOCAL">Local</SelectItem>
                  <SelectItem value="INSTITUCIONAL">Institucional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredHolidays.length}</p>
                <p className="text-sm text-muted-foreground">Total Feriados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredHolidays.filter(h => h.type === "NACIONAL").length}
                </p>
                <p className="text-sm text-muted-foreground">Nacionales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredHolidays.filter(h => h.type === "LOCAL").length}
                </p>
                <p className="text-sm text-muted-foreground">Locales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredHolidays.filter(h => h.isRecurring).length}
                </p>
                <p className="text-sm text-muted-foreground">Recurrentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Feriados */}
      <Card>
        <CardHeader>
          <CardTitle>Feriados {filterYear}</CardTitle>
          <CardDescription>
            {filteredHolidays.length} feriado(s) configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Recurrente</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-mono">
                    {holiday.date}
                  </TableCell>
                  <TableCell className="capitalize">
                    {formatDate(holiday.date).split(",")[0]}
                  </TableCell>
                  <TableCell className="font-medium">
                    {holiday.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeConfig[holiday.type]?.variant}>
                      {typeConfig[holiday.type]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {holiday.isRecurring ? (
                      <Badge variant="outline" className="bg-green-50">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sí
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHoliday(holiday);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(holiday.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nuevo Feriado */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Feriado</DialogTitle>
            <DialogDescription>
              Agregue un nuevo feriado al calendario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Nombre del feriado" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NACIONAL">Nacional</SelectItem>
                  <SelectItem value="LOCAL">Local</SelectItem>
                  <SelectItem value="INSTITUCIONAL">Institucional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="recurring" />
              <Label htmlFor="recurring" className="font-normal">
                Es un feriado recurrente (se repite cada año)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Feriado */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Feriado</DialogTitle>
          </DialogHeader>
          {selectedHoliday && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" defaultValue={selectedHoliday.date} />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input defaultValue={selectedHoliday.name} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select defaultValue={selectedHoliday.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NACIONAL">Nacional</SelectItem>
                    <SelectItem value="LOCAL">Local</SelectItem>
                    <SelectItem value="INSTITUCIONAL">Institucional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="recurring-edit" defaultChecked={selectedHoliday.isRecurring} />
                <Label htmlFor="recurring-edit" className="font-normal">
                  Es un feriado recurrente
                </Label>
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
    </div>
  );
}
