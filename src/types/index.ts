/**
 * CAARD - Tipos TypeScript centrales
 * Complementan los tipos generados por Prisma
 */

import type {
  Role,
  CaseStatus,
  PaymentStatus,
  NotificationChannel,
  NotificationEventType,
  DocumentStatus,
  AuditAction,
} from "@prisma/client";

// Re-export Prisma enums for convenience
export {
  Role,
  CaseStatus,
  PaymentStatus,
  NotificationChannel,
  NotificationEventType,
  DocumentStatus,
  AuditAction,
};

// =============================================================================
// Session & Auth Types
// =============================================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  centerId: string | null;
}

export interface AuthSession {
  user: SessionUser;
  expires: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// =============================================================================
// Case Types
// =============================================================================

export interface CaseFilters {
  status?: CaseStatus | CaseStatus[];
  arbitrationTypeId?: string;
  year?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CaseCreateInput {
  centerId: string;
  arbitrationTypeId: string;
  title?: string;
  claimantName?: string;
  respondentName?: string;
}

export interface CaseSummary {
  id: string;
  code: string;
  title: string | null;
  status: CaseStatus;
  claimantName: string | null;
  respondentName: string | null;
  submittedAt: Date | null;
  createdAt: Date;
}

// =============================================================================
// Document Types
// =============================================================================

export interface DocumentUploadInput {
  caseId: string;
  folderId?: string;
  documentType: string;
  description?: string;
  file: File;
}

export interface DocumentMetadata {
  id: string;
  caseId: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: bigint;
  driveWebViewLink: string | null;
  version: number;
  status: DocumentStatus;
  createdAt: Date;
}

// =============================================================================
// Payment Types
// =============================================================================

export interface PaymentCreateInput {
  caseId: string;
  concept: string;
  amountCents: number;
  currency?: string;
  description?: string;
  dueAt?: Date;
}

export interface CulqiChargeInput {
  paymentId: string;
  token: string;
  email: string;
}

// =============================================================================
// Notification Types
// =============================================================================

export interface NotificationPayload {
  caseId?: string;
  userId: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  scheduledAt?: Date;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardStats {
  totalCases: number;
  casesInProcess: number;
  pendingPayments: number;
  upcomingDeadlines: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: AuditAction;
  entity: string;
  description: string;
  userId: string | null;
  userName: string | null;
  createdAt: Date;
}

// =============================================================================
// Form Types
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormFieldError {
  field: string;
  message: string;
}

// =============================================================================
// UI State Types
// =============================================================================

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

// =============================================================================
// Case Status Labels (Spanish)
// =============================================================================

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Presentado",
  UNDER_REVIEW: "En Revisión",
  OBSERVED: "Observado",
  ADMITTED: "Admitido",
  REJECTED: "Rechazado",
  IN_PROCESS: "En Trámite",
  AWAITING_PAYMENT: "Pendiente de Pago",
  PAYMENT_OVERDUE: "Pago Vencido",
  SUSPENDED: "Suspendido",
  CLOSED: "Cerrado",
  ARCHIVED: "Archivado",
  EMERGENCY_REQUESTED: "Emergencia Solicitada",
  EMERGENCY_IN_PROCESS: "Emergencia en Proceso",
  EMERGENCY_RESOLVED: "Emergencia Resuelta",
  EMERGENCY_EXPIRED: "Emergencia Expirada",
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador General",
  CENTER_STAFF: "Personal del Centro",
  SECRETARIA: "Secretaría",
  ARBITRO: "Árbitro",
  ABOGADO: "Abogado",
  DEMANDANTE: "Demandante",
  DEMANDADO: "Demandado",
  ESTUDIANTE: "Estudiante",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  REQUIRED: "Requerido",
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  FAILED: "Fallido",
  CANCELLED: "Cancelado",
  OVERDUE: "Vencido",
  REFUNDED: "Reembolsado",
};
