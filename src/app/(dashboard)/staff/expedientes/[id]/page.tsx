/**
 * CAARD - Detalle de Expediente (Staff)
 * Vista detallada de un caso para el personal del centro
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FolderOpen,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Clock,
  Scale,
  Mail,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Presentada",
  UNDER_REVIEW: "En revisión",
  PENDING_PAYMENT: "Pendiente de pago",
  ADMITTED: "Admitida",
  ARBITRATOR_SELECTION: "Selección de árbitro",
  TRIBUNAL_CONSTITUTED: "Tribunal constituido",
  IN_PROCESS: "En proceso",
  HEARING_SCHEDULED: "Audiencia programada",
  AWARD_PENDING: "Laudo pendiente",
  CLOSED: "Cerrado",
  ARCHIVED: "Archivado",
};

export default async function StaffExpedienteDetallePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "CENTER_STAFF") {
    redirect("/login");
  }

  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
      arbitrationType: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      lawyers: {
        where: { isActive: true },
        include: {
          lawyer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      deadlines: {
        orderBy: { dueAt: "asc" },
      },
      hearings: {
        orderBy: { hearingAt: "desc" },
      },
    },
  });

  if (!caseData) {
    notFound();
  }

  const formatCurrency = (amountCents: number, currency: string = "PEN") => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
    }).format(amountCents / 100);
  };

  // Separar miembros por rol
  const claimants = caseData.members.filter(m => m.role === "DEMANDANTE");
  const respondents = caseData.members.filter(m => m.role === "DEMANDADO");
  const arbitrators = caseData.members.filter(m => m.role === "ARBITRO");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff/expedientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-mono">{caseData.code}</h1>
            <Badge>{statusLabels[caseData.status] || caseData.status}</Badge>
          </div>
          <p className="text-lg text-muted-foreground">{caseData.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Enviar Notificación
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generar Documento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="partes">Partes</TabsTrigger>
          <TabsTrigger value="arbitros">Árbitros</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="plazos">Plazos</TabsTrigger>
          <TabsTrigger value="audiencias">Audiencias</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Información del Caso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número de expediente</p>
                  <p className="font-mono font-medium">{caseData.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{caseData.arbitrationType.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge>{statusLabels[caseData.status] || caseData.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cuantía</p>
                  <p className="font-medium">
                    {caseData.disputeAmountCents
                      ? formatCurrency(Number(caseData.disputeAmountCents), caseData.currency || "PEN")
                      : "No especificada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de creación</p>
                  <p className="font-medium">
                    {new Date(caseData.createdAt).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{caseData.documents.length}</p>
                    <p className="text-xs text-muted-foreground">Documentos</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{caseData.payments.length}</p>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{caseData.hearings.length}</p>
                    <p className="text-xs text-muted-foreground">Audiencias</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{arbitrators.length}</p>
                    <p className="text-xs text-muted-foreground">Árbitros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Partes */}
        <TabsContent value="partes">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demandante(s)</CardTitle>
              </CardHeader>
              <CardContent>
                {claimants.length === 0 ? (
                  <p className="text-muted-foreground">No registrado</p>
                ) : (
                  <div className="space-y-3">
                    {claimants.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{member.user?.name || member.displayName || "Sin nombre"}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email || member.email || "Sin email"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demandado(s)</CardTitle>
              </CardHeader>
              <CardContent>
                {respondents.length === 0 ? (
                  <p className="text-muted-foreground">No registrado</p>
                ) : (
                  <div className="space-y-3">
                    {respondents.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{member.user?.name || member.displayName || "Sin nombre"}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email || member.email || "Sin email"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {caseData.lawyers.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Abogados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {caseData.lawyers.map((cl) => (
                      <div key={cl.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="p-2 bg-green-100 rounded-full">
                          <Scale className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{cl.lawyer.name}</p>
                          <p className="text-sm text-muted-foreground">{cl.lawyer.email}</p>
                          <Badge variant="outline" className="mt-1">
                            {cl.representationType === "DEMANDANTE" ? "Demandante" : "Demandado"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Árbitros */}
        <TabsContent value="arbitros">
          <Card>
            <CardHeader>
              <CardTitle>Tribunal Arbitral</CardTitle>
            </CardHeader>
            <CardContent>
              {arbitrators.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay árbitros asignados a este caso
                </p>
              ) : (
                <div className="space-y-3">
                  {arbitrators.map((arb) => (
                    <div
                      key={arb.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Scale className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{arb.user?.name || arb.displayName || "Sin nombre"}</p>
                          <p className="text-sm text-muted-foreground">
                            {arb.user?.email || arb.email || "Sin email"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Árbitro</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos del Expediente</CardTitle>
              <CardDescription>
                {caseData.documents.length} documento(s) registrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caseData.documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay documentos en este expediente
                </p>
              ) : (
                <div className="space-y-2">
                  {caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.originalFileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.documentType} - {new Date(doc.createdAt).toLocaleDateString("es-PE")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
              <CardDescription>
                Estado de pagos del caso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caseData.payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay pagos registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {caseData.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.concept}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence:{" "}
                            {payment.dueAt
                              ? new Date(payment.dueAt).toLocaleDateString("es-PE")
                              : "Sin fecha"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(payment.amountCents, payment.currency)}
                        </p>
                        <Badge
                          variant={
                            payment.status === "CONFIRMED" ? "default" : "secondary"
                          }
                        >
                          {payment.status === "CONFIRMED" ? "Pagado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plazos */}
        <TabsContent value="plazos">
          <Card>
            <CardHeader>
              <CardTitle>Plazos Procesales</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.deadlines.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay plazos registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {caseData.deadlines.map((deadline) => {
                    const isOverdue = !deadline.isCompleted && new Date(deadline.dueAt) < new Date();
                    return (
                      <div
                        key={deadline.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{deadline.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {deadline.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {new Date(deadline.dueAt).toLocaleDateString("es-PE")}
                          </p>
                          <Badge
                            variant={
                              deadline.isCompleted
                                ? "default"
                                : isOverdue
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {deadline.isCompleted
                              ? "Completado"
                              : isOverdue
                              ? "Vencido"
                              : "Pendiente"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audiencias */}
        <TabsContent value="audiencias">
          <Card>
            <CardHeader>
              <CardTitle>Audiencias</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.hearings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay audiencias programadas
                </p>
              ) : (
                <div className="space-y-2">
                  {caseData.hearings.map((hearing) => {
                    const isPast = new Date(hearing.hearingAt) < new Date();
                    return (
                      <div
                        key={hearing.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{hearing.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {hearing.location || "Virtual"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {new Date(hearing.hearingAt).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <Badge variant={isPast ? "secondary" : "default"}>
                            {isPast ? "Realizada" : "Programada"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
