/**
 * Dashboard: Parte (Demandante/Demandado)
 * ========================================
 * Panel principal para los roles DEMANDANTE y DEMANDADO
 * Vista simplificada de sus casos, documentos y notificaciones
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Usa searchParams → requiere render dinámico por request.
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Clock,
  Upload,
  ArrowRight,
  AlertTriangle,
  Bell,
  MessageSquare,
  FolderOpen,
  DollarSign,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// Helpers para estado
const statusConfig: Record<
  string,
  { label: string; color: string; icon: any; description: string }
> = {
  DRAFT: {
    label: "Borrador",
    color: "bg-gray-100 text-gray-800",
    icon: FileText,
    description: "Su solicitud está en borrador",
  },
  SUBMITTED: {
    label: "Enviada",
    color: "bg-blue-100 text-blue-800",
    icon: Loader2,
    description: "Su solicitud ha sido enviada y está en espera de revisión",
  },
  UNDER_REVIEW: {
    label: "En Revisión",
    color: "bg-yellow-100 text-yellow-800",
    icon: Loader2,
    description: "Su solicitud está siendo revisada por la secretaría",
  },
  OBSERVED: {
    label: "Observada",
    color: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
    description: "Su solicitud tiene observaciones que debe subsanar",
  },
  ADMITTED: {
    label: "Admitida",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Su demanda ha sido admitida",
  },
  REJECTED: {
    label: "Rechazada",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description: "Su solicitud ha sido rechazada",
  },
  IN_PROCESS: {
    label: "En Proceso",
    color: "bg-blue-100 text-blue-800",
    icon: Loader2,
    description: "El proceso arbitral está en curso",
  },
  AWAITING_PAYMENT: {
    label: "Pendiente de Pago",
    color: "bg-yellow-100 text-yellow-800",
    icon: DollarSign,
    description: "Tiene un pago pendiente para continuar",
  },
  CLOSED: {
    label: "Cerrado",
    color: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
    description: "El proceso ha concluido",
  },
};

// Componente de estado del caso
function CaseStatusCard({ caseData }: { caseData: any }) {
  const status = statusConfig[caseData.status] || {
    label: caseData.status,
    color: "bg-gray-100",
    icon: FileText,
    description: "",
  };
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${status.color.split(" ")[0]}`} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{caseData.code}</CardTitle>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
        <CardDescription>{caseData.title || "Mi caso de arbitraje"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <StatusIcon className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-medium">Estado actual</p>
            <p className="text-sm text-muted-foreground">{status.description}</p>
          </div>
        </div>

        {caseData.currentStage && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Etapa procesal:</span>
            <span className="font-medium">
              {caseData.currentStage.replace(/_/g, " ")}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button className="flex-1" asChild>
            <Link href={`/parte/caso/${caseData.id}`}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Ver mi expediente
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de pagos pendientes
async function PendingPayments({ userId, caseIds }: { userId: string; caseIds: string[] }) {
  const payments = await prisma.paymentOrder.findMany({
    where: {
      caseId: { in: caseIds },
      status: { in: ["PENDING", "OVERDUE"] },
    },
    include: {
      case: {
        select: { code: true },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>No tiene pagos pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => {
        const isOverdue = payment.status === "OVERDUE";
        const daysRemaining = Math.ceil(
          (new Date(payment.dueAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        return (
          <Card
            key={payment.id}
            className={
              isOverdue ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""
            }
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{payment.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.case.code} • {payment.orderNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    S/ {(payment.totalCents / 100).toFixed(2)}
                  </p>
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue
                      ? "VENCIDO"
                      : daysRemaining <= 0
                      ? "Vence HOY"
                      : `Vence en ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""}`}
                  </Badge>
                </div>
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href={`/parte/pagos/${payment.id}`}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Realizar pago
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Componente de documentos del caso
async function CaseDocuments({ caseIds }: { caseIds: string[] }) {
  const documents = await prisma.caseDocument.findMany({
    where: {
      caseId: { in: caseIds },
      status: "ACTIVE",
    },
    include: {
      case: {
        select: { code: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2" />
        <p>No hay documentos en su expediente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium line-clamp-1">{doc.originalFileName}</p>
              <p className="text-sm text-muted-foreground">
                {doc.documentType} •{" "}
                {new Date(doc.createdAt).toLocaleDateString("es-PE")}
              </p>
            </div>
          </div>
          {doc.driveWebViewLink && (
            <Button variant="ghost" size="icon" asChild>
              <a
                href={doc.driveWebViewLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// Componente de notificaciones
async function PartyNotifications({ userId }: { userId: string }) {
  const notifications = await prisma.notificationQueue.findMany({
    where: {
      userId,
      status: "SENT",
    },
    include: {
      case: {
        select: { code: true },
      },
    },
    orderBy: { sentAt: "desc" },
    take: 10,
  });

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-2" />
        <p>No tiene notificaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="flex items-start gap-3 p-3 rounded-lg border"
        >
          <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{notif.subject || "Notificación"}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notif.body}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {notif.sentAt
                ? new Date(notif.sentAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de plazos relevantes
async function PartyDeadlines({ caseIds }: { caseIds: string[] }) {
  const deadlines = await prisma.processDeadline.findMany({
    where: {
      caseId: { in: caseIds },
      status: "ACTIVE",
      // Solo mostrar plazos que afectan a la parte
      type: {
        in: ["PAYMENT", "CONTESTACION", "RECONVENCION", "SUBSANACION"],
      },
    },
    include: {
      case: {
        select: { code: true },
      },
    },
    orderBy: { dueAt: "asc" },
    take: 5,
  });

  if (deadlines.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <Clock className="h-5 w-5" />
          Plazos Importantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((deadline) => {
            const daysRemaining = Math.ceil(
              (new Date(deadline.dueAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            );
            const isUrgent = daysRemaining <= 3;

            return (
              <div
                key={deadline.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{deadline.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {deadline.case.code}
                  </p>
                </div>
                <Badge variant={isUrgent ? "destructive" : "secondary"}>
                  {daysRemaining <= 0
                    ? "HOY"
                    : daysRemaining === 1
                    ? "MAÑANA"
                    : `${daysRemaining} días`}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PartePage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true, centerId: true },
  });

  if (
    !user ||
    !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "DEMANDANTE", "DEMANDADO"].includes(user.role)
  ) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const staffRoles = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];
  const isStaffPreview = staffRoles.includes(user.role);

  // Obtener casos donde es parte (vista normal de demandante/demandado)
  const memberCases = await prisma.caseMember.findMany({
    where: {
      userId: session.user.id,
      role: { in: ["DEMANDANTE", "DEMANDADO"] },
    },
    include: {
      case: true,
    },
  });

  let cases = memberCases.map((m) => m.case);
  let caseIds = cases.map((c) => c.id);
  let previewCaseCode: string | null = null;

  // MODO PREVIEW: si es staff/admin y no tiene casos propios (o pasa ?caseId=X),
  // mostrar un caso específico como si fuera parte (para soporte/QA).
  if (isStaffPreview && sp.caseId) {
    const previewed = await prisma.case.findUnique({
      where: { id: sp.caseId },
      select: { id: true, code: true, title: true, status: true, currentStage: true },
    });
    if (previewed) {
      cases = [previewed as any];
      caseIds = [previewed.id];
      previewCaseCode = previewed.code;
    }
  }

  // Lista de casos disponibles para que el staff elija (solo en preview mode)
  const availableCases = isStaffPreview
    ? await prisma.case.findMany({
        where: user.centerId ? { centerId: user.centerId } : {},
        select: { id: true, code: true, title: true, status: true },
        orderBy: [{ year: "desc" }, { sequence: "desc" }],
        take: 50,
      })
    : [];

  // Contar pagos pendientes
  const pendingPaymentsCount = await prisma.paymentOrder.count({
    where: {
      caseId: { in: caseIds },
      status: { in: ["PENDING", "OVERDUE"] },
    },
  });

  const roleLabel =
    user.role === "DEMANDANTE"
      ? "Demandante"
      : user.role === "DEMANDADO"
        ? "Demandado"
        : "Modo Admin (vista de parte)";

  return (
    <div className="space-y-8">
      {/* Banner de preview para staff */}
      {isStaffPreview && (
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <p className="font-semibold text-blue-900 dark:text-blue-300">
                  Vista de parte (modo admin)
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  {previewCaseCode
                    ? <>Previsualizando el panel del expediente <strong>{previewCaseCode}</strong> como lo vería una parte.</>
                    : "Selecciona un expediente para previsualizar su panel como lo vería una parte. Útil para soporte, QA o acompañamiento."}
                </p>
              </div>
              <form action="/parte" method="get" className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-blue-900 dark:text-blue-300">
                  Caso:
                </label>
                <select
                  name="caseId"
                  defaultValue={sp.caseId || ""}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[260px]"
                >
                  <option value="">— Selecciona expediente —</option>
                  {availableCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                      {c.title ? ` — ${c.title.slice(0, 60)}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-md bg-[#D66829] text-white text-sm hover:bg-[#c45a22]"
                >
                  Previsualizar
                </button>
                {sp.caseId && (
                  <a
                    href="/parte"
                    className="h-9 inline-flex items-center px-3 rounded-md border text-sm"
                  >
                    Limpiar
                  </a>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bienvenido a CAARD</h1>
        <p className="text-muted-foreground">
          {user.name || user.email} • {roleLabel}
        </p>
      </div>

      {/* Alertas de pagos */}
      {pendingPaymentsCount > 0 && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                  Tiene {pendingPaymentsCount} pago
                  {pendingPaymentsCount !== 1 ? "s" : ""} pendiente
                  {pendingPaymentsCount !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  Realice el pago para continuar con su proceso
                </p>
              </div>
              <Button className="ml-auto" asChild>
                <Link href="#pagos">Ver pagos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plazos importantes */}
      <Suspense fallback={null}>
        <PartyDeadlines caseIds={caseIds} />
      </Suspense>

      {/* Mis Casos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Mi Caso</h2>
        {cases.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No tiene casos registrados
              </p>
              <Button className="mt-4" asChild>
                <Link href="/nueva-demanda">Iniciar nueva demanda</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cases.map((caseData) => (
              <CaseStatusCard key={caseData.id} caseData={caseData} />
            ))}
          </div>
        )}
      </div>

      {/* Tabs de contenido */}
      {cases.length > 0 && (
        <Tabs defaultValue="pagos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pagos" id="pagos">
              <DollarSign className="h-4 w-4 mr-2" />
              Pagos
              {pendingPaymentsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingPaymentsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documentos">
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="notificaciones">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pagos">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes</CardTitle>
                <CardDescription>
                  Realice sus pagos para continuar con el proceso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="animate-pulse h-40" />}>
                  <PendingPayments
                    userId={session.user.id}
                    caseIds={caseIds}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documentos del Expediente</CardTitle>
                  <CardDescription>
                    Documentos presentados en su caso
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/parte/documentos/subir">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir documento
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="animate-pulse h-40" />}>
                  <CaseDocuments caseIds={caseIds} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificaciones">
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>
                  Comunicaciones sobre su caso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="animate-pulse h-40" />}>
                  <PartyNotifications userId={session.user.id} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Asistente IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ¿Tiene dudas sobre su proceso?
          </CardTitle>
          <CardDescription>
            Nuestro asistente virtual puede ayudarle con preguntas frecuentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/parte/asistente">
              Consultar al asistente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card>
        <CardHeader>
          <CardTitle>¿Necesita ayuda?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Si tiene alguna duda sobre su proceso, puede contactar a la
            secretaría:
          </p>
          <p className="text-sm">
            📧 secretaria@caard.pe
            <br />
            📞 (01) 234-5678
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
