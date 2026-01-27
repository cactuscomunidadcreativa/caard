/**
 * Página: Registro de Auditoría
 * ==============================
 * Historial de acciones del sistema
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Search,
  Download,
  User,
  FileText,
  Settings,
  Shield,
  Eye,
} from "lucide-react";

// Datos de ejemplo
const mockAuditLogs = [
  {
    id: "1",
    timestamp: "2025-01-26 10:45:32",
    user: "admin@caard.pe",
    userRole: "ADMIN",
    action: "UPDATE",
    resource: "Case",
    resourceId: "ARB-2025-0001",
    description: "Actualizó estado de caso a ADMITTED",
    ipAddress: "192.168.1.100",
  },
  {
    id: "2",
    timestamp: "2025-01-26 10:30:15",
    user: "secretaria@caard.pe",
    userRole: "SECRETARIA",
    action: "CREATE",
    resource: "Document",
    resourceId: "DOC-2025-0156",
    description: "Subió documento: Contestación de demanda",
    ipAddress: "192.168.1.105",
  },
  {
    id: "3",
    timestamp: "2025-01-26 10:15:00",
    user: "arbitro@caard.pe",
    userRole: "ARBITRO",
    action: "READ",
    resource: "Case",
    resourceId: "ARB-2025-0002",
    description: "Consultó expediente asignado",
    ipAddress: "192.168.1.120",
  },
  {
    id: "4",
    timestamp: "2025-01-26 09:45:22",
    user: "admin@caard.pe",
    userRole: "ADMIN",
    action: "UPDATE",
    resource: "User",
    resourceId: "USR-0045",
    description: "Modificó rol de usuario",
    ipAddress: "192.168.1.100",
  },
  {
    id: "5",
    timestamp: "2025-01-26 09:30:10",
    user: "system",
    userRole: "SYSTEM",
    action: "CREATE",
    resource: "Notification",
    resourceId: "NOT-2025-0890",
    description: "Envió notificación automática de plazo",
    ipAddress: "127.0.0.1",
  },
  {
    id: "6",
    timestamp: "2025-01-26 09:00:00",
    user: "staff@caard.pe",
    userRole: "CENTER_STAFF",
    action: "UPDATE",
    resource: "Payment",
    resourceId: "PAY-2025-0045",
    description: "Verificó pago recibido",
    ipAddress: "192.168.1.110",
  },
  {
    id: "7",
    timestamp: "2025-01-25 18:30:45",
    user: "abogado@example.com",
    userRole: "ABOGADO",
    action: "CREATE",
    resource: "Document",
    resourceId: "DOC-2025-0155",
    description: "Subió escrito de alegatos",
    ipAddress: "200.48.15.25",
  },
  {
    id: "8",
    timestamp: "2025-01-25 17:15:00",
    user: "admin@caard.pe",
    userRole: "ADMIN",
    action: "DELETE",
    resource: "Document",
    resourceId: "DOC-2025-0150",
    description: "Eliminó documento duplicado",
    ipAddress: "192.168.1.100",
  },
];

const actionConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CREATE: { label: "Crear", variant: "default" },
  READ: { label: "Consultar", variant: "outline" },
  UPDATE: { label: "Actualizar", variant: "secondary" },
  DELETE: { label: "Eliminar", variant: "destructive" },
};

export default function AuditReportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesResource = filterResource === "all" || log.resource === filterResource;
    return matchesSearch && matchesAction && matchesResource;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registro de Auditoría</h1>
          <p className="text-muted-foreground">
            Historial de acciones realizadas en el sistema
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAuditLogs.length}</p>
                <p className="text-sm text-muted-foreground">Acciones Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(mockAuditLogs.map(l => l.user)).size}
                </p>
                <p className="text-sm text-muted-foreground">Usuarios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockAuditLogs.filter(l => l.action === "UPDATE").length}
                </p>
                <p className="text-sm text-muted-foreground">Modificaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockAuditLogs.filter(l => l.action === "DELETE").length}
                </p>
                <p className="text-sm text-muted-foreground">Eliminaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, recurso o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="CREATE">Crear</SelectItem>
                <SelectItem value="READ">Consultar</SelectItem>
                <SelectItem value="UPDATE">Actualizar</SelectItem>
                <SelectItem value="DELETE">Eliminar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterResource} onValueChange={setFilterResource}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Recurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Case">Casos</SelectItem>
                <SelectItem value="Document">Documentos</SelectItem>
                <SelectItem value="User">Usuarios</SelectItem>
                <SelectItem value="Payment">Pagos</SelectItem>
                <SelectItem value="Notification">Notificaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Acciones</CardTitle>
          <CardDescription>
            {filteredLogs.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.user}</p>
                      <p className="text-xs text-muted-foreground">{log.userRole}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionConfig[log.action]?.variant || "default"}>
                      {actionConfig[log.action]?.label || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.resource}</p>
                      <p className="text-xs font-mono text-muted-foreground">{log.resourceId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {log.description}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {log.ipAddress}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
