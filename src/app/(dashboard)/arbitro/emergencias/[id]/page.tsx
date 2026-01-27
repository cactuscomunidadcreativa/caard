/**
 * CAARD - Detalle de Emergencia Arbitral
 * Vista para que el árbitro revise y responda emergencias
 */

import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmergencyActions } from "./emergency-actions";

export const metadata: Metadata = {
  title: "Emergencia Arbitral | CAARD",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  REQUESTED: { label: "Solicitada", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  PENDING_VERIFICATION: { label: "Pendiente Verificación", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  VERIFICATION_FAILED: { label: "Verificación Fallida", color: "bg-red-100 text-red-800", icon: XCircle },
  PENDING_PAYMENT: { label: "Pendiente Pago", color: "bg-orange-100 text-orange-800", icon: Clock },
  PAYMENT_OVERDUE: { label: "Pago Vencido", color: "bg-red-100 text-red-800", icon: XCircle },
  PENDING_DESIGNATION: { label: "Pendiente Designación", color: "bg-blue-100 text-blue-800", icon: Clock },
  DESIGNATION_OVERDUE: { label: "Designación Vencida", color: "bg-red-100 text-red-800", icon: XCircle },
  PENDING_ACCEPTANCE: { label: "Pendiente Aceptación", color: "bg-blue-100 text-blue-800", icon: Clock },
  IN_PROCESS: { label: "En Proceso", color: "bg-purple-100 text-purple-800", icon: Clock },
  RESOLVED: { label: "Resuelta", color: "bg-green-100 text-green-800", icon: CheckCircle },
  PENDING_MAIN_CASE: { label: "Pendiente Caso Principal", color: "bg-orange-100 text-orange-800", icon: Clock },
  COMPLETED: { label: "Completada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  EXPIRED: { label: "Caducada", color: "bg-gray-100 text-gray-800", icon: XCircle },
  ARCHIVED: { label: "Archivada", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
};

async function getEmergency(id: string, userId: string) {
  const emergency = await prisma.emergencyRequest.findUnique({
    where: { id },
    include: {
      case: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!emergency) return null;

  // Verificar que el árbitro está asignado a esta emergencia
  if (emergency.emergencyArbitratorId !== userId) {
    return null;
  }

  return emergency;
}

export default async function EmergencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !["SUPER_ADMIN", "ADMIN", "ARBITRO"].includes(user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const emergency = await getEmergency(id, session.user.id);

  if (!emergency) {
    notFound();
  }

  const statusConfig = STATUS_CONFIG[emergency.status] || STATUS_CONFIG.REQUESTED;
  const StatusIcon = statusConfig.icon;
  const canRespond = emergency.status === "PENDING_ACCEPTANCE" && !emergency.arbitratorAcceptedAt && !emergency.arbitratorRejectedAt;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/arbitro">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Emergencia Arbitral</h1>
              <p className="text-muted-foreground">
                {emergency.requestNumber}
              </p>
            </div>
          </div>
        </div>
        <Badge className={statusConfig.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la emergencia */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Solicitud</CardTitle>
              <CardDescription>
                Recibida el {format(emergency.requestedAt, "PPP 'a las' HH:mm", { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{emergency.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {emergency.description}
                </p>
              </div>

              {emergency.urgencyJustification && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Justificación de Urgencia
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {emergency.urgencyJustification}
                    </p>
                  </div>
                </>
              )}

              {emergency.requestedMeasures && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Medidas Solicitadas</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {emergency.requestedMeasures}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Acciones del árbitro */}
          {canRespond && (
            <EmergencyActions emergencyId={emergency.id} />
          )}

          {/* Respuesta si ya fue procesada */}
          {emergency.resolution && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resolución
                </CardTitle>
                {emergency.resolvedAt && (
                  <CardDescription>
                    {format(emergency.resolvedAt, "PPP 'a las' HH:mm", { locale: es })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{emergency.resolution}</p>
              </CardContent>
            </Card>
          )}

          {/* Motivo de rechazo */}
          {emergency.arbitratorRejectionReason && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Motivo de Rechazo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{emergency.arbitratorRejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Caso relacionado */}
          {emergency.case && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Caso Relacionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium font-mono">{emergency.case.code}</p>
                  <p className="text-sm text-muted-foreground">{emergency.case.title}</p>
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <Link href={`/arbitro/casos/${emergency.case.id}`}>Ver Caso</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solicitante */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{emergency.requesterName}</p>
                <p className="text-sm text-muted-foreground">
                  {emergency.requesterEmail}
                </p>
                {emergency.requesterPhone && (
                  <p className="text-sm text-muted-foreground">
                    {emergency.requesterPhone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cronología
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Solicitada:</span>
                  <span>{format(emergency.requestedAt, "dd/MM/yyyy HH:mm")}</span>
                </div>
                {emergency.arbitratorDesignatedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Designado:</span>
                    <span>{format(emergency.arbitratorDesignatedAt, "dd/MM/yyyy HH:mm")}</span>
                  </div>
                )}
                {emergency.arbitratorAcceptedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aceptado:</span>
                    <span>{format(emergency.arbitratorAcceptedAt, "dd/MM/yyyy HH:mm")}</span>
                  </div>
                )}
                {emergency.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resuelto:</span>
                    <span>{format(emergency.resolvedAt, "dd/MM/yyyy HH:mm")}</span>
                  </div>
                )}
                {emergency.resolutionDueAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Límite resolución:</span>
                    <span className="text-orange-600">{format(emergency.resolutionDueAt, "dd/MM/yyyy HH:mm")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
