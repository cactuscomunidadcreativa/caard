/**
 * CAARD - Constantes del sistema
 */

// =============================================================================
// Información del sistema
// =============================================================================

export const APP_NAME = "CAARD";
export const APP_DESCRIPTION =
  "Sistema Integral de Control de Arbitrajes y Resolución de Disputas";
export const APP_VERSION = "2.0.0";

// =============================================================================
// Configuración por defecto del Centro
// =============================================================================

export const DEFAULT_CENTER = {
  code: "CAARD",
  name: "Centro de Administración de Arbitrajes y Resolución de Disputas",
  timezone: "America/Lima",
  currency: "PEN",
  primaryColor: "#0B2A5B",
  accentColor: "#D66829",
};

// =============================================================================
// Estructura de carpetas para expedientes en Google Drive
// =============================================================================

export const CASE_FOLDER_STRUCTURE = [
  { key: "01_Solicitud", name: "01. Solicitud" },
  { key: "02_Admision", name: "02. Admisión" },
  { key: "03_Contestacion", name: "03. Contestación" },
  { key: "04_Reconvencion", name: "04. Reconvención" },
  { key: "05_Pruebas", name: "05. Pruebas" },
  { key: "06_Audiencias", name: "06. Audiencias" },
  { key: "07_Alegatos", name: "07. Alegatos" },
  { key: "08_Laudo", name: "08. Laudo" },
  { key: "09_Pagos", name: "09. Pagos" },
  { key: "99_Otros", name: "99. Otros" },
] as const;

// =============================================================================
// Tipos de documentos
// =============================================================================

export const DOCUMENT_TYPES = [
  "Solicitud de arbitraje",
  "Poder de representación",
  "Contrato base",
  "Anexos",
  "Contestación",
  "Reconvención",
  "Escrito",
  "Prueba documental",
  "Prueba pericial",
  "Acta de audiencia",
  "Laudo parcial",
  "Laudo final",
  "Voucher de pago",
  "Resolución",
  "Notificación",
  "Otro",
] as const;

// =============================================================================
// MIME types permitidos
// =============================================================================

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
] as const;

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// =============================================================================
// Paginación
// =============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// =============================================================================
// Plazos procesales (días hábiles)
// =============================================================================

export const DEADLINES = {
  CONTESTACION: 15,
  RECONVENCION: 15,
  PRUEBAS: 10,
  ALEGATOS: 5,
  LAUDO: 30,
} as const;

// =============================================================================
// Notificaciones - Recordatorios
// =============================================================================

export const NOTIFICATION_REMINDERS = {
  DEADLINE_WARNING_HOURS: 48, // 2 días antes
  HEARING_REMINDER_HOURS: 24, // 1 día antes
  PAYMENT_OVERDUE_DAYS: 3, // 3 días después de vencido
} as const;

// =============================================================================
// Rutas del sistema
// =============================================================================

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  CASES: "/cases",
  CASE_NEW: "/cases/new",
  CASE_DETAIL: (id: string) => `/cases/${id}`,
  DOCUMENTS: "/documents",
  PAYMENTS: "/payments",
  SETTINGS: "/settings",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_CENTERS: "/admin/centers",
  ADMIN_ARBITRATION_TYPES: "/admin/arbitration-types",
} as const;

// =============================================================================
// API Routes
// =============================================================================

export const API_ROUTES = {
  AUTH: "/api/auth",
  CASES: "/api/cases",
  DOCUMENTS: "/api/documents",
  PAYMENTS: "/api/payments",
  NOTIFICATIONS: "/api/notifications",
  WEBHOOKS: {
    CULQI: "/api/webhooks/culqi",
  },
} as const;
