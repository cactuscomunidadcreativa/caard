/**
 * CAARD - Servicio Unificado de Google Workspace
 * Maneja Gmail API, Google Calendar API y coordina con Google Drive
 * Usa las mismas credenciales OAuth2 para todos los servicios
 */

import { google, type gmail_v1, type calendar_v3 } from "googleapis";

// Scopes necesarios para todos los servicios de Google Workspace
export const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
];

// ============================================================
// Tipos
// ============================================================

export interface GmailSendOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: GmailAttachment[];
}

export interface GmailAttachment {
  filename: string;
  content: Buffer | string;
  mimeType: string;
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string; displayName?: string }[];
  conferenceData?: {
    createRequest?: { requestId: string; conferenceSolutionKey: { type: string } };
  };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  colorId?: string;
}

export interface CalendarEventResult {
  id: string;
  htmlLink: string;
  summary: string;
  start: string;
  end: string;
  meetLink?: string;
  attendees?: { email: string; responseStatus?: string }[];
}

// ============================================================
// Servicio principal
// ============================================================

export class GoogleWorkspaceService {
  private auth: InstanceType<typeof google.auth.OAuth2>;
  private _gmail: gmail_v1.Gmail | null = null;
  private _calendar: calendar_v3.Calendar | null = null;
  private configured: boolean;
  private _dbTokenLoaded: boolean = false;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000"}/api/integrations/google/callback`;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || "";

    this.auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    if (refreshToken) {
      this.auth.setCredentials({ refresh_token: refreshToken });
      this.configured = true;
    } else {
      this.configured = false;
    }
  }

  /**
   * Carga el refresh token desde la BD del centro si no está en env vars.
   * Esto permite que la autorización desde /admin/integrations funcione
   * sin necesidad de agregar GOOGLE_REFRESH_TOKEN a Vercel manualmente.
   */
  async loadTokenFromDB(force: boolean = false): Promise<boolean> {
    if (this.configured && !force) return true;
    if (this._dbTokenLoaded && !force) return this.configured;

    try {
      // Import prisma dinámicamente para evitar circular deps
      const { prisma } = await import("@/lib/prisma");
      const center = await prisma.center.findFirst({
        where: { code: "CAARD" },
        select: { notificationSettings: true },
      });

      const settings = center?.notificationSettings as Record<string, any> | null;
      const dbToken = settings?.googleRefreshToken;

      this._dbTokenLoaded = true;

      if (dbToken) {
        this.auth.setCredentials({ refresh_token: dbToken });
        this.configured = true;
        return true;
      }
    } catch (error) {
      console.error("Error loading Google token from DB:", error);
    }
    return false;
  }

  /**
   * Asegura que el servicio esté configurado (env vars o BD)
   */
  async ensureConfigured(force: boolean = false): Promise<boolean> {
    if (this.configured && !force) return true;
    return this.loadTokenFromDB(force);
  }

  /**
   * Resetea el estado del singleton (útil después de re-autorización)
   */
  reset(): void {
    this.configured = false;
    this._dbTokenLoaded = false;
    this._gmail = null;
    this._calendar = null;
  }

  /**
   * Retorna el cliente OAuth2 compartido (para Drive u otros servicios)
   */
  getAuthClient() {
    return this.auth;
  }

  /**
   * Verifica si el servicio tiene credenciales configuradas
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Genera URL de autorización con todos los scopes de Workspace
   */
  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: "offline",
      scope: GOOGLE_WORKSPACE_SCOPES,
      prompt: "consent",
    });
  }

  /**
   * Intercambia código de autorización por tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    this.configured = true;

    return {
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || "",
      expiryDate: tokens.expiry_date || 0,
    };
  }

  // ============================================================
  // Gmail API
  // ============================================================

  private get gmail(): gmail_v1.Gmail {
    if (!this._gmail) {
      this._gmail = google.gmail({ version: "v1", auth: this.auth });
    }
    return this._gmail;
  }

  /**
   * Envía un email mediante la Gmail API
   */
  async sendEmail(options: GmailSendOptions): Promise<GmailSendResult> {
    await this.ensureConfigured();
    if (!this.configured) {
      return { success: false, error: "Google Workspace no configurado. Autoriza desde /admin/integrations" };
    }

    try {
      const toAddresses = Array.isArray(options.to) ? options.to.join(", ") : options.to;
      const fromAddr = options.fromName
        ? `"${options.fromName}" <${options.from || "sis@caardpe.com"}>`
        : options.from || "sis@caardpe.com";

      // Construir headers del email
      const headers: string[] = [
        `From: ${fromAddr}`,
        `To: ${toAddresses}`,
        `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`,
        "MIME-Version: 1.0",
      ];

      if (options.cc && options.cc.length > 0) {
        headers.push(`Cc: ${options.cc.join(", ")}`);
      }
      if (options.bcc && options.bcc.length > 0) {
        headers.push(`Bcc: ${options.bcc.join(", ")}`);
      }
      if (options.replyTo) {
        headers.push(`Reply-To: ${options.replyTo}`);
      }

      let rawMessage: string;

      if (options.attachments && options.attachments.length > 0) {
        // Email con adjuntos (multipart/mixed)
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

        const parts: string[] = [];

        // Cuerpo HTML
        parts.push(
          `--${boundary}\r\n` +
          "Content-Type: text/html; charset=UTF-8\r\n" +
          "Content-Transfer-Encoding: base64\r\n\r\n" +
          Buffer.from(options.htmlBody).toString("base64") + "\r\n"
        );

        // Adjuntos
        for (const att of options.attachments) {
          const content = typeof att.content === "string"
            ? att.content
            : att.content.toString("base64");
          parts.push(
            `--${boundary}\r\n` +
            `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n` +
            `Content-Disposition: attachment; filename="${att.filename}"\r\n` +
            "Content-Transfer-Encoding: base64\r\n\r\n" +
            content + "\r\n"
          );
        }

        parts.push(`--${boundary}--`);
        rawMessage = headers.join("\r\n") + "\r\n\r\n" + parts.join("");
      } else {
        // Email simple
        headers.push("Content-Type: text/html; charset=UTF-8");
        headers.push("Content-Transfer-Encoding: base64");
        rawMessage = headers.join("\r\n") + "\r\n\r\n" + Buffer.from(options.htmlBody).toString("base64");
      }

      // Codificar en base64url para la API de Gmail
      const encodedMessage = Buffer.from(rawMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        success: true,
        messageId: response.data.id || undefined,
        threadId: response.data.threadId || undefined,
      };
    } catch (error) {
      console.error("Gmail API send error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown Gmail API error",
      };
    }
  }

  /**
   * Envía emails en lote (secuencial con rate limiting básico)
   */
  async sendBulkEmails(
    recipients: GmailSendOptions[]
  ): Promise<{ total: number; sent: number; failed: number; results: GmailSendResult[] }> {
    const results: GmailSendResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.sendEmail(recipient);
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting: ~25 emails/sec max en Gmail API
      if (recipients.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return { total: recipients.length, sent, failed, results };
  }

  // ============================================================
  // Google Calendar API
  // ============================================================

  private get calendar(): calendar_v3.Calendar {
    if (!this._calendar) {
      this._calendar = google.calendar({ version: "v3", auth: this.auth });
    }
    return this._calendar;
  }

  /**
   * Crea un evento en Google Calendar
   */
  async createEvent(
    calendarId: string = "primary",
    event: CalendarEvent
  ): Promise<CalendarEventResult> {
    await this.ensureConfigured();
    if (!this.configured) {
      throw new Error("Google Workspace no configurado. Autoriza desde /admin/integrations");
    }

    const requestBody: calendar_v3.Schema$Event = {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      attendees: event.attendees?.map((a) => ({
        email: a.email,
        displayName: a.displayName,
      })),
      reminders: event.reminders || {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    // Si se solicita Google Meet
    if (event.conferenceData?.createRequest) {
      requestBody.conferenceData = {
        createRequest: {
          requestId: event.conferenceData.createRequest.requestId,
          conferenceSolutionKey: {
            type: event.conferenceData.createRequest.conferenceSolutionKey.type,
          },
        },
      };
    }

    const response = await this.calendar.events.insert({
      calendarId,
      requestBody,
      conferenceDataVersion: event.conferenceData ? 1 : 0,
      sendUpdates: "all",
    });

    const data = response.data;
    return {
      id: data.id || "",
      htmlLink: data.htmlLink || "",
      summary: data.summary || "",
      start: data.start?.dateTime || data.start?.date || "",
      end: data.end?.dateTime || data.end?.date || "",
      meetLink: data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri || undefined,
      attendees: data.attendees?.map((a) => ({
        email: a.email || "",
        responseStatus: a.responseStatus || "",
      })),
    };
  }

  /**
   * Actualiza un evento existente
   */
  async updateEvent(
    calendarId: string = "primary",
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEventResult> {
    if (!this.configured) {
      throw new Error("Google Workspace not configured");
    }

    const requestBody: calendar_v3.Schema$Event = {};

    if (updates.summary !== undefined) requestBody.summary = updates.summary;
    if (updates.description !== undefined) requestBody.description = updates.description;
    if (updates.location !== undefined) requestBody.location = updates.location;
    if (updates.start) requestBody.start = updates.start;
    if (updates.end) requestBody.end = updates.end;
    if (updates.attendees) {
      requestBody.attendees = updates.attendees.map((a) => ({
        email: a.email,
        displayName: a.displayName,
      }));
    }

    const response = await this.calendar.events.patch({
      calendarId,
      eventId,
      requestBody,
      sendUpdates: "all",
    });

    const data = response.data;
    return {
      id: data.id || "",
      htmlLink: data.htmlLink || "",
      summary: data.summary || "",
      start: data.start?.dateTime || data.start?.date || "",
      end: data.end?.dateTime || data.end?.date || "",
      meetLink: data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri || undefined,
      attendees: data.attendees?.map((a) => ({
        email: a.email || "",
        responseStatus: a.responseStatus || "",
      })),
    };
  }

  /**
   * Elimina (cancela) un evento
   */
  async deleteEvent(
    calendarId: string = "primary",
    eventId: string
  ): Promise<void> {
    if (!this.configured) {
      throw new Error("Google Workspace not configured");
    }

    await this.calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });
  }

  /**
   * Lista eventos en un rango de tiempo
   */
  async listEvents(
    calendarId: string = "primary",
    timeMin: string,
    timeMax: string,
    options?: { maxResults?: number; query?: string }
  ): Promise<CalendarEventResult[]> {
    if (!this.configured) {
      throw new Error("Google Workspace not configured");
    }

    const response = await this.calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults: options?.maxResults || 100,
      singleEvents: true,
      orderBy: "startTime",
      q: options?.query,
    });

    return (response.data.items || []).map((item) => ({
      id: item.id || "",
      htmlLink: item.htmlLink || "",
      summary: item.summary || "",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      meetLink: item.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri || undefined,
      attendees: item.attendees?.map((a) => ({
        email: a.email || "",
        responseStatus: a.responseStatus || "",
      })),
    }));
  }
}

// ============================================================
// Singleton
// ============================================================

let instance: GoogleWorkspaceService | null = null;

export function getGoogleWorkspaceService(): GoogleWorkspaceService {
  if (!instance) {
    instance = new GoogleWorkspaceService();
  }
  return instance;
}

/** Alias de conveniencia */
export const googleWorkspace = {
  get service() {
    return getGoogleWorkspaceService();
  },
  sendEmail(options: GmailSendOptions) {
    return getGoogleWorkspaceService().sendEmail(options);
  },
  sendBulkEmails(recipients: GmailSendOptions[]) {
    return getGoogleWorkspaceService().sendBulkEmails(recipients);
  },
  createEvent(calendarId: string, event: CalendarEvent) {
    return getGoogleWorkspaceService().createEvent(calendarId, event);
  },
  updateEvent(calendarId: string, eventId: string, updates: Partial<CalendarEvent>) {
    return getGoogleWorkspaceService().updateEvent(calendarId, eventId, updates);
  },
  deleteEvent(calendarId: string, eventId: string) {
    return getGoogleWorkspaceService().deleteEvent(calendarId, eventId);
  },
  listEvents(calendarId: string, timeMin: string, timeMax: string) {
    return getGoogleWorkspaceService().listEvents(calendarId, timeMin, timeMax);
  },
  isConfigured() {
    return getGoogleWorkspaceService().isConfigured();
  },
};
