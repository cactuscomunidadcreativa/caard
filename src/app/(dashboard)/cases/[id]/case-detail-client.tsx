"use client";

/**
 * CAARD - Detalle de Expediente (Client Component)
 * Muestra toda la informacion del expediente con tabs
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Scale,
  DollarSign,
  Layers,
  FileText,
  Users,
  Gavel,
  CreditCard,
  Clock,
  StickyNote,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import {
  CASE_STATUS_LABELS,
  ROLE_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/types";
import type {
  CaseStatus,
  Role,
  PaymentStatus,
  ArbitrationScope,
  ProcedureType,
  TribunalMode,
  ProcessStage,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Types (serialized from server)
// ---------------------------------------------------------------------------

interface SerializedCase {
  id: string;
  code: string;
  title: string | null;
  status: CaseStatus;
  scope: ArbitrationScope;
  procedureType: ProcedureType;
  tribunalMode: TribunalMode;
  currentStage: ProcessStage | null;
  disputeAmountCents: string | null; // BigInt serialized
  currency: string;
  claimantName: string | null;
  respondentName: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  submittedAt: string | null;
  admittedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  year: number;
  sequence: number;
  center: { id: string; code: string; name: string };
  arbitrationType: {
    id: string;
    code: string;
    name: string;
    kind: string;
    tribunalMode: string;
  };
  members: SerializedMember[];
  lawyers: SerializedLawyer[];
  folders: SerializedFolder[];
  documents: SerializedDocument[];
  payments: SerializedPayment[];
  deadlines: SerializedDeadline[];
  notes: SerializedNote[];
}

interface SerializedMember {
  id: string;
  role: Role;
  displayName: string | null;
  email: string | null;
  phoneE164: string | null;
  isPrimary: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null } | null;
}

interface SerializedLawyer {
  id: string;
  lawyer: { id: string; name: string | null; email: string | null };
  representedMember: { id: string; displayName: string | null; role: Role } | null;
}

interface SerializedFolder {
  id: string;
  key: string;
  name: string;
}

interface SerializedDocument {
  id: string;
  documentType: string;
  description: string | null;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string; // BigInt serialized
  status: string;
  driveWebViewLink: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string | null } | null;
  folder: { id: string; key: string; name: string } | null;
}

interface SerializedPayment {
  id: string;
  concept: string;
  description: string | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface SerializedDeadline {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  isCompleted: boolean;
  completedAt: string | null;
}

interface SerializedNote {
  id: string;
  title: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  author: { id: string; name: string | null } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCOPE_LABELS: Record<ArbitrationScope, string> = {
  NACIONAL: "Nacional",
  INTERNACIONAL: "Internacional",
};

const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  REGULAR: "Regular",
  EMERGENCY: "Emergencia",
};

const TRIBUNAL_LABELS: Record<TribunalMode, string> = {
  SOLE_ARBITRATOR: "Arbitro Unico",
  TRIBUNAL_3: "Tribunal (3 arbitros)",
};

const STAGE_LABELS: Record<ProcessStage, string> = {
  DEMANDA: "Demanda",
  CONTESTACION: "Contestacion",
  RECONVENCION: "Reconvencion",
  PROBATORIA: "Probatoria",
  AUDIENCIA_PRUEBAS: "Audiencia de Pruebas",
  INFORMES_ORALES: "Informes Orales",
  LAUDO: "Laudo",
};

function formatCurrency(cents: string | null, currency: string): string {
  if (!cents) return "No especificada";
  const amount = Number(cents) / 100;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatFileSize(bytes: string): string {
  const b = Number(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function isOverdue(dueAt: string): boolean {
  return new Date(dueAt) < new Date();
}

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    REQUIRED: "bg-amber-100 text-amber-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-600",
    OVERDUE: "bg-red-100 text-red-800",
    REFUNDED: "bg-blue-100 text-blue-800",
  };
  return (
    <Badge variant="secondary" className={styles[status]}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface CaseDetailClientProps {
  caseData: SerializedCase;
}

export default function CaseDetailClient({ caseData }: CaseDetailClientProps) {
  const router = useRouter();

  const arbitrators = caseData.members.filter((m) => m.role === "ARBITRO");
  const parties = caseData.members.filter(
    (m) => m.role === "DEMANDANTE" || m.role === "DEMANDADO"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/cases")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ color: "#0B2A5B" }}>
                {caseData.code}
              </h1>
              <CaseStatusBadge status={caseData.status} />
              {caseData.isBlocked && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Bloqueado
                </Badge>
              )}
            </div>
            {caseData.title && (
              <p className="text-muted-foreground mt-1">{caseData.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Blocked warning */}
      {caseData.isBlocked && caseData.blockReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <span className="font-semibold">Motivo de bloqueo:</span>{" "}
          {caseData.blockReason}
        </div>
      )}

      {/* Info cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#0B2A5B" }}
            >
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Tipo de Arbitraje
              </p>
              <p className="font-semibold text-sm">
                {caseData.arbitrationType.name}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#D66829" }}
            >
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cuantia</p>
              <p className="font-semibold text-sm">
                {formatCurrency(caseData.disputeAmountCents, caseData.currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#0B2A5B" }}
            >
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Fecha de Presentacion
              </p>
              <p className="font-semibold text-sm">
                {formatDate(caseData.submittedAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#D66829" }}
            >
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Etapa Procesal</p>
              <p className="font-semibold text-sm">
                {caseData.currentStage
                  ? STAGE_LABELS[caseData.currentStage]
                  : "Sin asignar"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="general" className="gap-1.5">
            <FileText className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="partes" className="gap-1.5">
            <Users className="h-4 w-4" />
            Partes
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {parties.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="arbitros" className="gap-1.5">
            <Gavel className="h-4 w-4" />
            Arbitros
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {arbitrators.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Documentos
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {caseData.documents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pagos" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            Pagos
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {caseData.payments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="plazos" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Plazos
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {caseData.deadlines.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="notas" className="gap-1.5">
            <StickyNote className="h-4 w-4" />
            Notas
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {caseData.notes.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ---- Tab: General ---- */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informacion General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <InfoRow label="Codigo" value={caseData.code} />
                <InfoRow label="Titulo" value={caseData.title || "-"} />
                <InfoRow
                  label="Estado"
                  value={CASE_STATUS_LABELS[caseData.status]}
                />
                <InfoRow
                  label="Alcance"
                  value={SCOPE_LABELS[caseData.scope]}
                />
                <InfoRow
                  label="Tipo de Procedimiento"
                  value={PROCEDURE_LABELS[caseData.procedureType]}
                />
                <InfoRow
                  label="Modo de Tribunal"
                  value={TRIBUNAL_LABELS[caseData.tribunalMode]}
                />
                <InfoRow
                  label="Tipo de Arbitraje"
                  value={caseData.arbitrationType.name}
                />
                <InfoRow
                  label="Cuantia"
                  value={formatCurrency(
                    caseData.disputeAmountCents,
                    caseData.currency
                  )}
                />
                <InfoRow
                  label="Etapa Procesal"
                  value={
                    caseData.currentStage
                      ? STAGE_LABELS[caseData.currentStage]
                      : "-"
                  }
                />
                <InfoRow label="Centro" value={caseData.center.name} />
                <InfoRow
                  label="Demandante"
                  value={caseData.claimantName || "-"}
                />
                <InfoRow
                  label="Demandado"
                  value={caseData.respondentName || "-"}
                />
                <InfoRow
                  label="Fecha de Presentacion"
                  value={formatDate(caseData.submittedAt)}
                />
                <InfoRow
                  label="Fecha de Admision"
                  value={formatDate(caseData.admittedAt)}
                />
                <InfoRow
                  label="Fecha de Cierre"
                  value={formatDate(caseData.closedAt)}
                />
                <InfoRow
                  label="Fecha de Creacion"
                  value={formatDateTime(caseData.createdAt)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Partes ---- */}
        <TabsContent value="partes">
          <Card>
            <CardHeader>
              <CardTitle>Partes del Expediente</CardTitle>
            </CardHeader>
            <CardContent>
              {parties.length === 0 ? (
                <EmptyState text="No hay partes registradas." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Nombre</th>
                        <th className="pb-3 pr-4 font-medium">Rol</th>
                        <th className="pb-3 pr-4 font-medium">Email</th>
                        <th className="pb-3 pr-4 font-medium">Telefono</th>
                        <th className="pb-3 font-medium">Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parties.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium">
                            {member.displayName ||
                              member.user?.name ||
                              "-"}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline">
                              {ROLE_LABELS[member.role] || member.role}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {member.email || member.user?.email || "-"}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {member.phoneE164 || "-"}
                          </td>
                          <td className="py-3">
                            {member.isPrimary && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Abogados */}
              {caseData.lawyers.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Abogados
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Abogado</th>
                          <th className="pb-3 pr-4 font-medium">Email</th>
                          <th className="pb-3 font-medium">Representa a</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseData.lawyers.map((l) => (
                          <tr
                            key={l.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-3 pr-4 font-medium">
                              {l.lawyer.name || "-"}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {l.lawyer.email || "-"}
                            </td>
                            <td className="py-3">
                              {l.representedMember ? (
                                <span>
                                  {l.representedMember.displayName || "-"}{" "}
                                  <Badge variant="outline" className="ml-1">
                                    {ROLE_LABELS[l.representedMember.role] ||
                                      l.representedMember.role}
                                  </Badge>
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Arbitros ---- */}
        <TabsContent value="arbitros">
          <Card>
            <CardHeader>
              <CardTitle>Arbitros</CardTitle>
            </CardHeader>
            <CardContent>
              {arbitrators.length === 0 ? (
                <EmptyState text="No hay arbitros asignados." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Nombre</th>
                        <th className="pb-3 pr-4 font-medium">Email</th>
                        <th className="pb-3 font-medium">Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arbitrators.map((arb) => (
                        <tr
                          key={arb.id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium">
                            {arb.displayName || arb.user?.name || "-"}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {arb.email || arb.user?.email || "-"}
                          </td>
                          <td className="py-3">
                            {arb.isPrimary && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Documentos ---- */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.documents.length === 0 ? (
                <EmptyState text="No hay documentos cargados." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Archivo</th>
                        <th className="pb-3 pr-4 font-medium">Tipo</th>
                        <th className="pb-3 pr-4 font-medium">Carpeta</th>
                        <th className="pb-3 pr-4 font-medium">Tamano</th>
                        <th className="pb-3 pr-4 font-medium">Subido por</th>
                        <th className="pb-3 pr-4 font-medium">Fecha</th>
                        <th className="pb-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caseData.documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium max-w-[200px] truncate">
                            {doc.originalFileName}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline">{doc.documentType}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {doc.folder?.name || "-"}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatFileSize(doc.sizeBytes)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {doc.uploadedBy?.name || "-"}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </td>
                          <td className="py-3">
                            {doc.driveWebViewLink && (
                              <Link
                                href={doc.driveWebViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Ver
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Pagos ---- */}
        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.payments.length === 0 ? (
                <EmptyState text="No hay pagos registrados." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Concepto</th>
                        <th className="pb-3 pr-4 font-medium">Monto</th>
                        <th className="pb-3 pr-4 font-medium">Estado</th>
                        <th className="pb-3 pr-4 font-medium">Vencimiento</th>
                        <th className="pb-3 font-medium">Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caseData.payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium">
                            {payment.concept}
                            {payment.description && (
                              <span className="block text-xs text-muted-foreground">
                                {payment.description}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {new Intl.NumberFormat("es-PE", {
                              style: "currency",
                              currency: payment.currency,
                            }).format(payment.amountCents / 100)}
                          </td>
                          <td className="py-3 pr-4">
                            <PaymentStatusBadge status={payment.status} />
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatDate(payment.dueAt)}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {formatDate(payment.paidAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Plazos ---- */}
        <TabsContent value="plazos">
          <Card>
            <CardHeader>
              <CardTitle>Plazos</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.deadlines.length === 0 ? (
                <EmptyState text="No hay plazos registrados." />
              ) : (
                <div className="space-y-3">
                  {caseData.deadlines.map((deadline) => {
                    const overdue =
                      !deadline.isCompleted && isOverdue(deadline.dueAt);
                    return (
                      <div
                        key={deadline.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 ${
                          overdue
                            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                            : deadline.isCompleted
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                            : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          {deadline.isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : overdue ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              deadline.isCompleted
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {deadline.title}
                          </p>
                          {deadline.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {deadline.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Vence: {formatDate(deadline.dueAt)}
                            {deadline.isCompleted &&
                              deadline.completedAt &&
                              ` | Completado: ${formatDate(deadline.completedAt)}`}
                          </p>
                        </div>
                        {overdue && (
                          <Badge variant="destructive" className="shrink-0">
                            Vencido
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Notas ---- */}
        <TabsContent value="notas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.notes.length === 0 ? (
                <EmptyState text="No hay notas registradas." />
              ) : (
                <div className="space-y-4">
                  {caseData.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {note.title && (
                            <span className="font-semibold">
                              {note.title}
                            </span>
                          )}
                          {note.isPrivate && (
                            <Badge variant="outline" className="text-xs">
                              Privada
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {note.author?.name || "Sistema"} -{" "}
                          {formatDateTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <p className="text-sm">{text}</p>
    </div>
  );
}
