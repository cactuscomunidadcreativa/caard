"use client";

/**
 * CAARD - Detalle de Expediente (Client Component)
 * Muestra toda la informacion del expediente con tabs
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  Pencil,
  Plus,
  Trash2,
  X,
  Check,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  visibility?: "ALL" | "STAFF_AND_ARBITRATORS" | "STAFF_ONLY";
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
  updatedAt?: string;
  documentDate?: string | null;
  accessLevel?: "ALL" | "STAFF_AND_ARBITRATORS" | "STAFF_ONLY";
  uploadedBy: { id: string; name: string | null } | null;
  folder: {
    id: string;
    key: string;
    name: string;
    visibility?: "ALL" | "STAFF_AND_ARBITRATORS" | "STAFF_ONLY";
  } | null;
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

const CASE_STATUSES: CaseStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "OBSERVED",
  "ADMITTED",
  "REJECTED",
  "IN_PROCESS",
  "AWAITING_PAYMENT",
  "PAYMENT_OVERDUE",
  "SUSPENDED",
  "CLOSED",
  "ARCHIVED",
];

const PROCESS_STAGES: ProcessStage[] = [
  "DEMANDA",
  "CONTESTACION",
  "RECONVENCION",
  "PROBATORIA",
  "AUDIENCIA_PRUEBAS",
  "INFORMES_ORALES",
  "LAUDO",
];

interface UserSearchItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export default function CaseDetailClient({ caseData }: CaseDetailClientProps) {
  const router = useRouter();

  const arbitrators = caseData.members.filter((m) => m.role === "ARBITRO");
  const parties = caseData.members.filter(
    (m) => m.role === "DEMANDANTE" || m.role === "DEMANDADO"
  );

  // -------- Edit Case dialog --------
  const [infoDocId, setInfoDocId] = useState<string | null>(null);
  const [infoData, setInfoData] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    if (!infoDocId) { setInfoData(null); return; }
    setLoadingInfo(true);
    fetch(`/api/documents/${infoDocId}/audit`)
      .then((r) => r.ok ? r.json() : r.json().then((d) => Promise.reject(d)))
      .then((d) => setInfoData(d))
      .catch(() => {
        // Si no es super admin, cargar solo info básica
        fetch(`/api/documents/${infoDocId}`)
          .then((r) => r.json())
          .then((d) => setInfoData({ document: d, audit: null }))
          .catch(() => setInfoData({ error: true }));
      })
      .finally(() => setLoadingInfo(false));
  }, [infoDocId]);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: caseData.title || "",
    status: caseData.status,
    currentStage: caseData.currentStage || ("" as ProcessStage | ""),
    tribunalMode: caseData.tribunalMode,
    disputeAmount: caseData.disputeAmountCents
      ? (Number(caseData.disputeAmountCents) / 100).toString()
      : "",
    currency: caseData.currency,
    isBlocked: caseData.isBlocked,
    blockReason: caseData.blockReason || "",
    driveFolderId: (caseData as any).driveFolderId || "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  async function handleSaveEdit() {
    setSavingEdit(true);
    try {
      const payload: any = {
        title: editForm.title || null,
        status: editForm.status,
        currentStage: editForm.currentStage || null,
        tribunalMode: editForm.tribunalMode,
        currency: editForm.currency,
        isBlocked: editForm.isBlocked,
        blockReason: editForm.isBlocked ? editForm.blockReason || null : null,
        driveFolderId: editForm.driveFolderId || null,
      };
      if (editForm.disputeAmount !== "") {
        payload.disputeAmount = Number(editForm.disputeAmount);
      }
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar");
      }
      toast.success("Expediente actualizado");
      setEditOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar");
    } finally {
      setSavingEdit(false);
    }
  }

  // -------- Add Member dialog (parties + arbitros) --------
  const [memberDialog, setMemberDialog] = useState<{
    open: boolean;
    mode: "PARTE" | "ARBITRO";
  }>({ open: false, mode: "PARTE" });

  const [memberForm, setMemberForm] = useState<{
    role: Role;
    userId: string | null;
    displayName: string;
    email: string;
    isPrimary: boolean;
  }>({
    role: "DEMANDANTE",
    userId: null,
    displayName: "",
    email: "",
    isPrimary: false,
  });
  const [savingMember, setSavingMember] = useState(false);

  function openAddMember(mode: "PARTE" | "ARBITRO") {
    setMemberForm({
      role: mode === "ARBITRO" ? "ARBITRO" : "DEMANDANTE",
      userId: null,
      displayName: "",
      email: "",
      isPrimary: false,
    });
    setMemberDialog({ open: true, mode });
  }

  async function handleAddMember() {
    if (!memberForm.displayName.trim()) {
      toast.error("Ingrese un nombre");
      return;
    }
    setSavingMember(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: memberForm.userId || undefined,
          displayName: memberForm.displayName,
          email: memberForm.email || undefined,
          role: memberForm.role,
          isPrimary: memberForm.isPrimary,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error");
      }
      toast.success("Miembro agregado");
      setMemberDialog({ open: false, mode: "PARTE" });
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Error al agregar miembro");
    } finally {
      setSavingMember(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("¿Eliminar este miembro?")) return;
    try {
      const res = await fetch(
        `/api/cases/${caseData.id}/members/${memberId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error");
      }
      toast.success("Miembro eliminado");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }

  // -------- Add Deadline dialog --------
  const [deadlineDialog, setDeadlineDialog] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({
    title: "",
    description: "",
    dueAt: "",
  });
  const [savingDeadline, setSavingDeadline] = useState(false);

  async function handleAddDeadline() {
    if (!deadlineForm.title || !deadlineForm.dueAt) {
      toast.error("Complete título y fecha");
      return;
    }
    setSavingDeadline(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deadlineForm.title,
          description: deadlineForm.description || undefined,
          dueAt: new Date(deadlineForm.dueAt).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error");
      }
      toast.success("Plazo agregado");
      setDeadlineDialog(false);
      setDeadlineForm({ title: "", description: "", dueAt: "" });
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSavingDeadline(false);
    }
  }

  async function handleCompleteDeadline(deadlineId: string) {
    try {
      const res = await fetch(
        `/api/cases/${caseData.id}/deadlines/${deadlineId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCompleted: true }),
        }
      );
      if (!res.ok) throw new Error("Error");
      toast.success("Plazo completado");
      window.location.reload();
    } catch {
      toast.error("Error al completar plazo");
    }
  }

  async function handleDeleteDeadline(deadlineId: string) {
    if (!confirm("¿Eliminar este plazo?")) return;
    try {
      const res = await fetch(
        `/api/cases/${caseData.id}/deadlines/${deadlineId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Error");
      toast.success("Plazo eliminado");
      window.location.reload();
    } catch {
      toast.error("Error al eliminar plazo");
    }
  }

  // -------- Add Note dialog --------
  const [noteDialog, setNoteDialog] = useState(false);
  const [noteForm, setNoteForm] = useState({ content: "", isPrivate: true });
  const [savingNote, setSavingNote] = useState(false);

  async function handleAddNote() {
    if (!noteForm.content.trim()) {
      toast.error("Ingrese contenido");
      return;
    }
    setSavingNote(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteForm.content,
          isPrivate: noteForm.isPrivate,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error");
      }
      toast.success("Nota agregada");
      setNoteDialog(false);
      setNoteForm({ content: "", isPrivate: true });
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("¿Eliminar esta nota?")) return;
    try {
      const res = await fetch(
        `/api/cases/${caseData.id}/notes/${noteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Error");
      toast.success("Nota eliminada");
      window.location.reload();
    } catch {
      toast.error("Error al eliminar nota");
    }
  }

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
        <Button
          onClick={() => setEditOpen(true)}
          style={{ backgroundColor: "#0B2A5B", color: "white" }}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Editar Expediente
        </Button>
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
              {caseData.payments.length + ((caseData as any).paymentOrders?.length || 0)}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Partes del Expediente</CardTitle>
              <Button
                size="sm"
                onClick={() => openAddMember("PARTE")}
                style={{ backgroundColor: "#D66829", color: "white" }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Agregar parte
              </Button>
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
                        <th className="pb-3 pr-4 font-medium">Principal</th>
                        <th className="pb-3 font-medium"></th>
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
                          <td className="py-3 pr-4">
                            {member.isPrimary && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.id)}
                              title="Eliminar"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Arbitros</CardTitle>
              <Button
                size="sm"
                onClick={() => openAddMember("ARBITRO")}
                style={{ backgroundColor: "#D66829", color: "white" }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Agregar árbitro
              </Button>
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
                        <th className="pb-3 pr-4 font-medium">Principal</th>
                        <th className="pb-3 font-medium"></th>
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
                          <td className="py-3 pr-4">
                            {arb.isPrimary && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(arb.id)}
                              title="Eliminar"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
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
          {caseData.documents.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState text="No hay documentos cargados." />
              </CardContent>
            </Card>
          ) : (() => {
            // Agrupar documentos por carpeta (folderId → array)
            const byFolder = new Map<string | null, typeof caseData.documents>();
            for (const d of caseData.documents) {
              const key = d.folder?.id ?? null;
              if (!byFolder.has(key)) byFolder.set(key, []);
              byFolder.get(key)!.push(d);
            }

            // Listar carpetas en orden: primero las que tienen docs, ordenadas por nombre
            const foldersWithDocs = caseData.folders
              .filter((f) => byFolder.has(f.id))
              .sort((a, b) => a.name.localeCompare(b.name));
            const sinCarpeta = byFolder.get(null) || [];

            const DocList = ({ items }: { items: typeof caseData.documents }) => (
              <ul className="divide-y">
                {items.length === 0 ? (
                  <li className="py-4 text-sm text-muted-foreground italic px-2">
                    Sin documentos en esta carpeta
                  </li>
                ) : (
                  items.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-1">
                      <Link
                        href={`/api/documents/${doc.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 rounded-md px-3 py-2.5 hover:bg-[#D66829]/10 transition-colors flex-1 min-w-0"
                      >
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#D66829]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0B2A5B] group-hover:underline line-clamp-2">
                            {doc.originalFileName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(doc.documentDate || doc.createdAt)}
                            {doc.sizeBytes ? ` · ${formatFileSize(doc.sizeBytes)}` : ""}
                            {doc.accessLevel && doc.accessLevel !== "ALL" && (
                              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium">
                                {doc.accessLevel === "STAFF_ONLY" ? "🔒 Solo centro" : "👥 Staff + árbitros"}
                              </span>
                            )}
                          </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground mt-1" />
                      </Link>
                      <button
                        onClick={() => setInfoDocId(doc.id)}
                        className="flex-shrink-0 p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Información del documento"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            );

            const FolderSection = ({
              name,
              icon,
              items,
              defaultOpen = true,
            }: {
              name: string;
              icon?: React.ReactNode;
              items: typeof caseData.documents;
              defaultOpen?: boolean;
            }) => (
              <details
                open={defaultOpen}
                className="group/folder rounded-lg border border-slate-200 bg-white overflow-hidden"
              >
                <summary className="cursor-pointer list-none flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#0B2A5B] to-[#1a4185] text-white hover:from-[#0a2654] hover:to-[#163875] transition-colors">
                  <svg
                    className="h-4 w-4 transition-transform group-open/folder:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  {icon}
                  <span className="font-semibold tracking-wide uppercase text-sm flex-1">
                    {name}
                  </span>
                  <span className="text-xs opacity-80 bg-white/10 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </summary>
                <div className="p-2">
                  <DocList items={items} />
                </div>
              </details>
            );

            return (
              <div className="space-y-3">
                {foldersWithDocs.map((folder) => (
                  <FolderSection
                    key={folder.id}
                    name={folder.name}
                    icon={
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    }
                    items={byFolder.get(folder.id)!}
                  />
                ))}
                {sinCarpeta.length > 0 && (
                  <FolderSection
                    name="Sin carpeta asignada"
                    items={sinCarpeta}
                    defaultOpen={false}
                  />
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* ---- Tab: Pagos ---- */}
        <TabsContent value="pagos">
          {(() => {
            const allPayments = [
              ...((caseData as any).paymentOrders || []).map((po: any) => ({
                id: po.id,
                concept: po.concept,
                description: po.description,
                amountCents: po.totalCents || po.amountCents,
                currency: po.currency,
                status: po.status,
                dueAt: po.dueAt,
                paidAt: po.paidAt,
                type: "order",
                orderNumber: po.orderNumber,
              })),
              ...caseData.payments.map((p) => ({
                ...p,
                type: "payment",
                orderNumber: null,
              })),
            ];
            // Dedup by concept — prefer paymentOrders
            const seen = new Set<string>();
            const unique = allPayments.filter((p) => {
              const key = p.type + "_" + p.concept + "_" + p.amountCents;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Pagos y Órdenes</CardTitle>
                </CardHeader>
                <CardContent>
                  {unique.length === 0 ? (
                    <EmptyState text="No hay pagos ni órdenes registradas." />
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
                          {unique.map((payment) => (
                            <tr key={payment.id} className="border-b last:border-0">
                              <td className="py-3 pr-4 font-medium">
                                {payment.concept}
                                {payment.description && (
                                  <span className="block text-xs text-muted-foreground">
                                    {payment.description}
                                  </span>
                                )}
                                {payment.orderNumber && (
                                  <span className="block text-xs font-mono text-muted-foreground">
                                    {payment.orderNumber}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                {new Intl.NumberFormat("es-PE", {
                                  style: "currency",
                                  currency: payment.currency || "PEN",
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
            );
          })()}
        </TabsContent>

        {/* ---- Tab: Plazos ---- */}
        <TabsContent value="plazos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Plazos</CardTitle>
              <Button
                size="sm"
                onClick={() => setDeadlineDialog(true)}
                style={{ backgroundColor: "#D66829", color: "white" }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Agregar plazo
              </Button>
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
                        <div className="flex items-center gap-1 shrink-0">
                          {!deadline.isCompleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCompleteDeadline(deadline.id)}
                              title="Marcar completado"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDeadline(deadline.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
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
              <Button
                size="sm"
                onClick={() => setNoteDialog(true)}
                style={{ backgroundColor: "#D66829", color: "white" }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Agregar nota
              </Button>
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
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="gap-1 text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- Edit Case Dialog ---- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Expediente</DialogTitle>
            <DialogDescription>
              Modifica los datos generales del expediente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Título</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, status: v as CaseStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CASE_STATUS_LABELS[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Etapa Procesal</Label>
              <Select
                value={editForm.currentStage || "__none__"}
                onValueChange={(v) =>
                  setEditForm({
                    ...editForm,
                    currentStage: v === "__none__" ? "" : (v as ProcessStage),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin asignar</SelectItem>
                  {PROCESS_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modo de Tribunal</Label>
              <Select
                value={editForm.tribunalMode}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, tribunalMode: v as TribunalMode })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLE_ARBITRATOR">Árbitro Único</SelectItem>
                  <SelectItem value="TRIBUNAL_3">Tribunal (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cuantía</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.disputeAmount}
                onChange={(e) =>
                  setEditForm({ ...editForm, disputeAmount: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select
                value={editForm.currency}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, currency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">PEN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Switch
                checked={editForm.isBlocked}
                onCheckedChange={(v) =>
                  setEditForm({ ...editForm, isBlocked: v })
                }
              />
              <Label>Expediente bloqueado</Label>
            </div>
            {editForm.isBlocked && (
              <div className="md:col-span-2">
                <Label>Motivo de bloqueo</Label>
                <Textarea
                  value={editForm.blockReason}
                  onChange={(e) =>
                    setEditForm({ ...editForm, blockReason: e.target.value })
                  }
                />
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Carpeta de Google Drive</Label>
              <Input
                placeholder="ID o URL de la carpeta de Drive"
                value={editForm.driveFolderId}
                onChange={(e) =>
                  setEditForm({ ...editForm, driveFolderId: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pega el ID o la URL completa. Ej:{" "}
                <code className="text-[10px]">https://drive.google.com/drive/folders/XXXX</code>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              style={{ backgroundColor: "#0B2A5B", color: "white" }}
            >
              {savingEdit ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Add Member Dialog ---- */}
      <Dialog
        open={memberDialog.open}
        onOpenChange={(o) => setMemberDialog({ ...memberDialog, open: o })}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {memberDialog.mode === "ARBITRO"
                ? "Agregar Árbitro"
                : "Agregar Parte"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {memberDialog.mode === "PARTE" && (
              <div>
                <Label>Rol</Label>
                <Select
                  value={memberForm.role}
                  onValueChange={(v) =>
                    setMemberForm({ ...memberForm, role: v as Role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEMANDANTE">Demandante</SelectItem>
                    <SelectItem value="DEMANDADO">Demandado</SelectItem>
                    <SelectItem value="ABOGADO">Abogado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Buscar usuario existente</Label>
              <UserSearchCombobox
                role={
                  memberDialog.mode === "ARBITRO" ? "ARBITRO" : memberForm.role
                }
                onSelect={(u) => {
                  setMemberForm({
                    ...memberForm,
                    userId: u?.id || null,
                    displayName: u?.name || memberForm.displayName,
                    email: u?.email || memberForm.email,
                  });
                }}
              />
            </div>
            <div>
              <Label>Nombre a mostrar</Label>
              <Input
                value={memberForm.displayName}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    displayName: e.target.value,
                    userId: null,
                  })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={memberForm.email}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, email: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={memberForm.isPrimary}
                onCheckedChange={(v) =>
                  setMemberForm({ ...memberForm, isPrimary: v })
                }
              />
              <Label>Miembro principal</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setMemberDialog({ ...memberDialog, open: false })
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={savingMember}
              style={{ backgroundColor: "#0B2A5B", color: "white" }}
            >
              {savingMember ? "Guardando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Add Deadline Dialog ---- */}
      <Dialog open={deadlineDialog} onOpenChange={setDeadlineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Plazo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={deadlineForm.title}
                onChange={(e) =>
                  setDeadlineForm({ ...deadlineForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={deadlineForm.description}
                onChange={(e) =>
                  setDeadlineForm({
                    ...deadlineForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Fecha de vencimiento</Label>
              <Input
                type="datetime-local"
                value={deadlineForm.dueAt}
                onChange={(e) =>
                  setDeadlineForm({ ...deadlineForm, dueAt: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeadlineDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddDeadline}
              disabled={savingDeadline}
              style={{ backgroundColor: "#0B2A5B", color: "white" }}
            >
              {savingDeadline ? "Guardando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Add Note Dialog ---- */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Contenido</Label>
              <Textarea
                rows={6}
                value={noteForm.content}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, content: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={noteForm.isPrivate}
                onCheckedChange={(v) =>
                  setNoteForm({ ...noteForm, isPrivate: v })
                }
              />
              <Label>Nota privada (solo staff)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={savingNote}
              style={{ backgroundColor: "#0B2A5B", color: "white" }}
            >
              {savingNote ? "Guardando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Document Info Dialog (Get Info style) ---- */}
      <Dialog open={!!infoDocId} onOpenChange={(open) => !open && setInfoDocId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D66829]" />
              Información del documento
            </DialogTitle>
          </DialogHeader>
          {loadingInfo && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {!loadingInfo && infoData?.document && (
            <div className="space-y-5">
              {/* Datos básicos */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="col-span-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Nombre</p>
                  <p className="font-medium break-words">{infoData.document.originalFileName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</p>
                  <p>{infoData.document.documentType || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tamaño</p>
                  <p>{infoData.document.sizeBytes ? formatFileSize(infoData.document.sizeBytes) : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">MIME</p>
                  <p className="font-mono text-xs">{infoData.document.mimeType || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha del documento</p>
                  <p>{infoData.document.documentDate ? formatDate(infoData.document.documentDate) : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Subido el</p>
                  <p>{formatDate(infoData.document.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Modificado</p>
                  <p>{infoData.document.updatedAt ? formatDate(infoData.document.updatedAt) : "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Subido por</p>
                  <p>{infoData.document.uploadedBy?.name || "Sistema"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Visibilidad</p>
                  <Badge variant="outline" className="text-xs">
                    {infoData.document.accessLevel === "STAFF_ONLY"
                      ? "Solo centro"
                      : infoData.document.accessLevel === "STAFF_AND_ARBITRATORS"
                      ? "Staff + árbitros"
                      : "Todos"}
                  </Badge>
                </div>
                {infoData.document.folder && (
                  <div className="col-span-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Carpeta</p>
                    <p>{infoData.document.folder.name}</p>
                  </div>
                )}
                {infoData.document.driveFileId && (
                  <div className="col-span-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Drive ID</p>
                    <p className="font-mono text-xs break-all">{infoData.document.driveFileId}</p>
                  </div>
                )}
              </div>

              {/* Audit log (solo super admin lo recibe poblado) */}
              {infoData.audit && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 pb-1 border-b">
                    Historial ({infoData.audit.length})
                  </h4>
                  {infoData.audit.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Sin registros de auditoría para este documento aún.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-xs max-h-64 overflow-y-auto">
                      {infoData.audit.map((log: any) => (
                        <li
                          key={log.id}
                          className="p-2 rounded border bg-slate-50 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[10px]">
                              {log.action}
                            </Badge>
                            <span className="text-muted-foreground">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <p>
                            <span className="font-medium">
                              {log.actorName || "Sistema"}
                            </span>
                            {log.actorRole && (
                              <span className="text-muted-foreground ml-1">
                                ({log.actorRole})
                              </span>
                            )}
                          </p>
                          {log.ipAddress && (
                            <p className="text-muted-foreground font-mono text-[10px]">
                              IP: {log.ipAddress}
                            </p>
                          )}
                          {log.changes && (
                            <pre className="text-[10px] bg-white p-2 rounded overflow-x-auto">
                              {typeof log.changes === "string"
                                ? log.changes
                                : JSON.stringify(log.changes, null, 2)}
                            </pre>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoDocId(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Search Combobox
// ---------------------------------------------------------------------------

function UserSearchCombobox({
  role,
  onSelect,
}: {
  role: Role;
  onSelect: (user: UserSearchItem | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<UserSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserSearchItem | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (role) params.set("role", role);
        params.set("limit", "20");
        const res = await fetch(`/api/users/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, role]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selected
            ? `${selected.name || selected.email} (${selected.role})`
            : "Buscar usuario..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre o email..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            {!loading && items.length === 0 && (
              <CommandEmpty>Sin resultados. Crea uno nuevo abajo.</CommandEmpty>
            )}
            <CommandGroup>
              {items.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.id}
                  onSelect={() => {
                    setSelected(u);
                    onSelect(u);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{u.name || "(sin nombre)"}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.email} - {u.role}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {selected && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelected(null);
                    onSelect(null);
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
