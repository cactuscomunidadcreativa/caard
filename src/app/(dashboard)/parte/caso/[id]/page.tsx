/**
 * CAARD - Detalle de Caso (Vista Parte)
 * Vista del caso para demandantes y demandados
 */

import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import {
  ArrowLeft,
  Scale,
  FileText,
  Calendar,
  User,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Users,
  Gavel,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Mi Caso | CAARD",
};

const CASE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Presentado", color: "bg-blue-100 text-blue-800" },
  PENDING_VERIFICATION: { label: "En Verificación", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PAYMENT: { label: "Pendiente Pago", color: "bg-orange-100 text-orange-800" },
  ADMITTED: { label: "Admitido", color: "bg-green-100 text-green-800" },
  PENDING_RESPONDENT: { label: "Pendiente Demandado", color: "bg-yellow-100 text-yellow-800" },
  ARBITRATOR_SELECTION: { label: "Selección de Árbitro", color: "bg-indigo-100 text-indigo-800" },
  TRIBUNAL_CONSTITUTION: { label: "Constitución Tribunal", color: "bg-indigo-100 text-indigo-800" },
  IN_PROCESS: { label: "En Trámite", color: "bg-purple-100 text-purple-800" },
  AWARD_PENDING: { label: "Laudo Pendiente", color: "bg-pink-100 text-pink-800" },
  CLOSED: { label: "Cerrado", color: "bg-gray-100 text-gray-800" },
  ARCHIVED: { label: "Archivado", color: "bg-gray-100 text-gray-800" },
};

async function getCaseForParty(caseId: string, userId: string) {
  // Verificar que el usuario es parte del caso
  const membership = await prisma.caseMember.findFirst({
    where: {
      caseId,
      userId,
    },
  });

  if (!membership) return null;

  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
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
        where: {
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      deadlines: {
        orderBy: { dueAt: "asc" },
        take: 5,
      },
      paymentOrders: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return caseData;
}

export default async function CaseDetailPage({
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

  if (!user || !["SUPER_ADMIN", "ADMIN", "DEMANDANTE", "DEMANDADO"].includes(user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const caseData = await getCaseForParty(id, session.user.id);

  if (!caseData) {
    notFound();
  }

  const statusConfig = CASE_STATUS_CONFIG[caseData.status] || { label: caseData.status, color: "bg-gray-100 text-gray-800" };
  const demandantes = caseData.members.filter((m) => m.role === "DEMANDANTE");
  const demandados = caseData.members.filter((m) => m.role === "DEMANDADO");
  const pendingPayments = caseData.paymentOrders.filter((p) => p.status === "PENDING");

  // Convertir disputeAmountCents a número normal
  const disputeAmount = caseData.disputeAmountCents ? Number(caseData.disputeAmountCents) / 100 : null;

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parte">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D66829]/10">
              <Scale className="h-6 w-6 text-[#D66829]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono">{caseData.code}</h1>
              <p className="text-muted-foreground">{caseData.title}</p>
            </div>
          </div>
        </div>
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </div>

      {/* Alertas */}
      {pendingPayments.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">
                  Tienes {pendingPayments.length} pago(s) pendiente(s)
                </p>
                <p className="text-sm text-yellow-700">
                  Por favor realiza los pagos para continuar con el proceso.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/parte/pagos">Ver Pagos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="partes">Partes</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="plazos">Plazos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
        </TabsList>

        {/* Tab General */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del Caso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expediente:</span>
                  <span className="font-medium font-mono">{caseData.code}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{caseData.arbitrationType?.name || "Arbitraje"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de Inicio:</span>
                  <span>{format(caseData.createdAt, "dd/MM/yyyy")}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuantía:</span>
                  <span className="font-medium">
                    {disputeAmount
                      ? `${caseData.currency} ${disputeAmount.toLocaleString()}`
                      : "No especificada"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado del Proceso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${statusConfig.color}`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{statusConfig.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Estado actual del caso
                    </p>
                  </div>
                </div>

                {caseData.currentStage && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Etapa:</span>
                      <span>{caseData.currentStage}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Partes */}
        <TabsContent value="partes" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Demandante(s)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {demandantes.length === 0 ? (
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {caseData.claimantName || "Sin demandantes registrados"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {demandantes.map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{m.user?.name || m.displayName}</p>
                          <p className="text-sm text-muted-foreground">{m.user?.email || m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Demandado(s)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {demandados.length === 0 ? (
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {caseData.respondentName || "Sin demandados registrados"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {demandados.map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-100">
                          <User className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{m.user?.name || m.displayName}</p>
                          <p className="text-sm text-muted-foreground">{m.user?.email || m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {caseData.lawyers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gavel className="h-4 w-4" />
                  Abogados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {caseData.lawyers.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="p-2 rounded-full bg-purple-100">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{l.lawyer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Representa: {l.representationType === "DEMANDANTE" ? "Demandante" : "Demandado"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Documentos del Caso</CardTitle>
                <CardDescription>Documentos públicos del expediente</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/parte/documentos/subir?caseId=${caseData.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Subir Documento
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {caseData.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay documentos disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.originalFileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(doc.createdAt, "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Plazos */}
        <TabsContent value="plazos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plazos Pendientes</CardTitle>
              <CardDescription>Fechas importantes del proceso</CardDescription>
            </CardHeader>
            <CardContent>
              {caseData.deadlines.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No tienes plazos pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseData.deadlines.map((deadline) => {
                    const isOverdue = new Date(deadline.dueAt) < new Date();
                    return (
                      <div
                        key={deadline.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          isOverdue ? "border-red-200 bg-red-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isOverdue ? "bg-red-100" : "bg-blue-100"}`}>
                            <Calendar className={`h-4 w-4 ${isOverdue ? "text-red-600" : "text-blue-600"}`} />
                          </div>
                          <div>
                            <p className="font-medium">{deadline.title}</p>
                            <p className={`text-sm ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                              Vence: {format(deadline.dueAt, "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        {isOverdue && (
                          <Badge variant="destructive">Vencido</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pagos */}
        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mis Pagos</CardTitle>
              <CardDescription>Historial de pagos del caso</CardDescription>
            </CardHeader>
            <CardContent>
              {caseData.paymentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No tienes pagos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseData.paymentOrders.map((payment) => {
                    const amount = payment.totalCents / 100;
                    const isPaid = payment.status === "PAID";
                    const isPending = payment.status === "PENDING";
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isPaid ? "bg-green-100" :
                            isPending ? "bg-yellow-100" : "bg-gray-100"
                          }`}>
                            <DollarSign className={`h-4 w-4 ${
                              isPaid ? "text-green-600" :
                              isPending ? "text-yellow-600" : "text-gray-600"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{payment.concept}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.currency} {amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            isPaid ? "bg-green-100 text-green-800" :
                            isPending ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {isPaid ? "Pagado" : isPending ? "Pendiente" : payment.status}
                          </Badge>
                          {isPending && (
                            <Button size="sm" className="mt-2" asChild>
                              <Link href={`/parte/pagos/${payment.id}`}>Pagar</Link>
                            </Button>
                          )}
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
