"use client";

/**
 * CAARD - Site Health Dashboard Client
 * ====================================
 * Real-time monitoring of system health, storage, errors, and incidents
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Server,
  Cloud,
  RefreshCw,
  Download,
  Wifi,
  WifiOff,
  Clock,
  BarChart3,
  ArrowLeft,
  AlertCircle,
  FileWarning,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  ExternalLink,
  Bug,
  FileText,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
  breakdown: {
    documents: number;
    images: number;
    backups: number;
    logs: number;
    other: number;
  };
}

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  lastCheck: Date;
  message?: string;
}

interface Incident {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  affectedService?: string;
}

interface ErrorLog {
  id: string;
  level: "error" | "warn" | "info";
  message: string;
  source: string;
  timestamp: Date;
  count: number;
}

export function SiteHealthClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Simulated data - In production, these would come from API
  const [storage, setStorage] = useState<StorageInfo>({
    used: 2.4 * 1024 * 1024 * 1024, // 2.4 GB in bytes
    total: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
    percentage: 24,
    breakdown: {
      documents: 1.2 * 1024 * 1024 * 1024,
      images: 0.8 * 1024 * 1024 * 1024,
      backups: 0.3 * 1024 * 1024 * 1024,
      logs: 0.05 * 1024 * 1024 * 1024,
      other: 0.05 * 1024 * 1024 * 1024,
    },
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Database (Neon PostgreSQL)", status: "healthy", latency: 45, lastCheck: new Date() },
    { name: "Authentication (NextAuth)", status: "healthy", latency: 12, lastCheck: new Date() },
    { name: "Email Service (SMTP)", status: "healthy", latency: 230, lastCheck: new Date() },
    { name: "SMS Service (Twilio)", status: "degraded", latency: 850, lastCheck: new Date(), message: "High latency detected" },
    { name: "File Storage", status: "healthy", latency: 65, lastCheck: new Date() },
    { name: "CDN (Vercel)", status: "healthy", latency: 8, lastCheck: new Date() },
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "1",
      type: "warning",
      title: "High SMS Latency",
      description: "SMS service experiencing higher than normal latency. Messages may be delayed.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resolved: false,
      affectedService: "SMS Service",
    },
    {
      id: "2",
      type: "info",
      title: "Scheduled Maintenance",
      description: "Database maintenance scheduled for Sunday 3:00 AM - 5:00 AM",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolved: false,
    },
    {
      id: "3",
      type: "error",
      title: "Email Delivery Failure",
      description: "Batch email delivery failed for 12 notifications. Automatic retry scheduled.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      resolved: true,
    },
  ]);

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([
    { id: "1", level: "error", message: "Failed to send notification: SMTP timeout", source: "NotificationService", timestamp: new Date(Date.now() - 30 * 60 * 1000), count: 3 },
    { id: "2", level: "warn", message: "Rate limit approaching for SMS API", source: "SMSService", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), count: 1 },
    { id: "3", level: "error", message: "Database connection pool exhausted", source: "Prisma", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), count: 2 },
    { id: "4", level: "warn", message: "Large file upload detected (>10MB)", source: "FileUpload", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), count: 5 },
    { id: "5", level: "info", message: "Backup completed successfully", source: "BackupService", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), count: 1 },
  ]);

  // System metrics
  const [metrics, setMetrics] = useState({
    uptime: 99.95,
    avgResponseTime: 145,
    requestsToday: 12450,
    errorsToday: 23,
    activeUsers: 45,
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLastRefresh(new Date());
    setIsRefreshing(false);
    toast.success("Health status refreshed");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4" />;
      case "down":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const overallHealth = services.every((s) => s.status === "healthy")
    ? "healthy"
    : services.some((s) => s.status === "down")
    ? "critical"
    : "degraded";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#D66829]" />
          <p className="text-muted-foreground">Loading health status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/reports">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                overallHealth === "healthy" ? "bg-green-100" :
                overallHealth === "degraded" ? "bg-yellow-100" : "bg-red-100"
              )}>
                <Activity className={cn(
                  "h-5 w-5",
                  overallHealth === "healthy" ? "text-green-600" :
                  overallHealth === "degraded" ? "text-yellow-600" : "text-red-600"
                )} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Site Health</h1>
                <p className="text-sm text-muted-foreground">
                  System monitoring and status
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatDate(lastRefresh)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <Card className={cn(
        "mb-6 border-l-4",
        overallHealth === "healthy" ? "border-l-green-500 bg-green-50/50" :
        overallHealth === "degraded" ? "border-l-yellow-500 bg-yellow-50/50" :
        "border-l-red-500 bg-red-50/50"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {overallHealth === "healthy" ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : overallHealth === "degraded" ? (
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h2 className="font-semibold text-lg">
                  {overallHealth === "healthy" ? "All Systems Operational" :
                   overallHealth === "degraded" ? "Partial System Degradation" :
                   "System Critical"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {overallHealth === "healthy"
                    ? "All services are running normally"
                    : incidents.filter((i) => !i.resolved).length + " active incidents"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{metrics.uptime}%</p>
              <p className="text-sm text-muted-foreground">30-day uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">Avg</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.avgResponseTime}ms</p>
            <p className="text-sm text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs text-green-600">+12%</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.requestsToday.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Requests today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Bug className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs text-red-600">{metrics.errorsToday}</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.errorsToday}</p>
            <p className="text-sm text-muted-foreground">Errors today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.activeUsers}</p>
            <p className="text-sm text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="logs">Error Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Services Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Service Status
                </CardTitle>
                <CardDescription>Real-time health of all services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded", getStatusColor(service.status))}>
                          {getStatusIcon(service.status)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          {service.message && (
                            <p className="text-xs text-muted-foreground">{service.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {service.latency && (
                          <p className={cn(
                            "text-sm font-medium",
                            service.latency < 100 ? "text-green-600" :
                            service.latency < 500 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {service.latency}ms
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(service.lastCheck)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Recent Incidents
                    </CardTitle>
                    <CardDescription>Latest system events</CardDescription>
                  </div>
                  <Link href="#incidents">
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incidents.slice(0, 3).map((incident) => (
                    <div
                      key={incident.id}
                      className={cn(
                        "p-3 rounded-lg border-l-4",
                        incident.type === "error" ? "border-l-red-500 bg-red-50/50" :
                        incident.type === "warning" ? "border-l-yellow-500 bg-yellow-50/50" :
                        "border-l-blue-500 bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{incident.title}</p>
                            {incident.resolved && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {incident.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatDate(incident.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Storage Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Usage
                </CardTitle>
                <CardDescription>
                  {formatBytes(storage.used)} of {formatBytes(storage.total)} used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Used</span>
                    <span className="font-medium">{storage.percentage}%</span>
                  </div>
                  <Progress
                    value={storage.percentage}
                    className={cn(
                      "h-3",
                      storage.percentage > 90 ? "[&>div]:bg-red-500" :
                      storage.percentage > 70 ? "[&>div]:bg-yellow-500" :
                      "[&>div]:bg-green-500"
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(storage.breakdown).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        {key === "documents" && <FileText className="h-4 w-4 text-blue-500" />}
                        {key === "images" && <Database className="h-4 w-4 text-purple-500" />}
                        {key === "backups" && <Cloud className="h-4 w-4 text-green-500" />}
                        {key === "logs" && <FileWarning className="h-4 w-4 text-yellow-500" />}
                        {key === "other" && <HardDrive className="h-4 w-4 text-gray-500" />}
                        <span className="capitalize text-sm font-medium">{key}</span>
                      </div>
                      <p className="text-lg font-bold">{formatBytes(value)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((value / storage.total) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Storage Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Storage Management</CardTitle>
                <CardDescription>Optimize your storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Backup
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileWarning className="h-4 w-4 mr-2" />
                  Clear Old Logs
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Optimize Database
                </Button>
                <Separator className="my-4" />
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">Storage Limit</p>
                  <p className="text-xs text-muted-foreground">
                    Your current plan allows up to {formatBytes(storage.total)} of storage.
                    Upgrade for more space.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Incident History
                  </CardTitle>
                  <CardDescription>System events and alerts</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {incidents.filter((i) => !i.resolved).length} Active
                  </Badge>
                  <Badge variant="secondary">
                    {incidents.length} Total
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        incident.resolved ? "opacity-60" : ""
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          incident.type === "error" ? "bg-red-100" :
                          incident.type === "warning" ? "bg-yellow-100" :
                          "bg-blue-100"
                        )}>
                          {incident.type === "error" ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : incident.type === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{incident.title}</h3>
                              {incident.resolved ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(incident.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {incident.description}
                          </p>
                          {incident.affectedService && (
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                <Server className="h-3 w-3 mr-1" />
                                {incident.affectedService}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Error Logs
                  </CardTitle>
                  <CardDescription>Recent errors and warnings</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-[80px]">Count</TableHead>
                    <TableHead className="w-[120px]">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            log.level === "error" ? "text-red-600 border-red-300 bg-red-50" :
                            log.level === "warn" ? "text-yellow-600 border-yellow-300 bg-yellow-50" :
                            "text-blue-600 border-blue-300 bg-blue-50"
                          )}
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-md truncate">
                        {log.message}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.source}
                      </TableCell>
                      <TableCell>
                        {log.count > 1 && (
                          <Badge variant="secondary">{log.count}x</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cloudflare Integration Notice */}
      <Card className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Enable Cloudflare Protection</h3>
              <p className="text-sm text-muted-foreground">
                Improve security, performance, and DDoS protection with Cloudflare integration.
              </p>
            </div>
            <Button className="bg-[#D66829] hover:bg-[#c45a22]">
              <Zap className="h-4 w-4 mr-2" />
              Configure Cloudflare
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
