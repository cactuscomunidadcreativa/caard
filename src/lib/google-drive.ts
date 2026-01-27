/**
 * CAARD - Servicio de Google Drive
 * Maneja la integración con Google Drive para almacenamiento de documentos
 */

import { google } from "googleapis";

// Configuración de Google Drive
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

interface DriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
}

interface FileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
  description?: string;
}

interface UploadResult {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  size: string;
}

interface FolderResult {
  id: string;
  name: string;
  webViewLink: string;
}

/**
 * Clase para gestionar operaciones con Google Drive
 */
export class GoogleDriveService {
  private drive: ReturnType<typeof google.drive>;
  private auth: any;

  constructor(config?: DriveConfig) {
    // Usar credenciales de servicio o OAuth
    const credentials = config || {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
    };

    // Configurar autenticación OAuth2
    this.auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    if (credentials.refreshToken) {
      this.auth.setCredentials({
        refresh_token: credentials.refreshToken,
      });
    }

    this.drive = google.drive({ version: "v3", auth: this.auth });
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  async isConfigured(): Promise<boolean> {
    try {
      const response = await this.drive.about.get({
        fields: "user",
      });
      return !!response.data.user;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información del usuario autenticado
   */
  async getUserInfo(): Promise<{ email: string; name: string } | null> {
    try {
      const response = await this.drive.about.get({
        fields: "user",
      });
      const user = response.data.user;
      return user
        ? {
            email: user.emailAddress || "",
            name: user.displayName || "",
          }
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Crea una carpeta en Google Drive
   */
  async createFolder(
    name: string,
    parentId?: string,
    description?: string
  ): Promise<FolderResult> {
    const fileMetadata: any = {
      name,
      mimeType: "application/vnd.google-apps.folder",
      description,
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: "id, name, webViewLink",
    });

    return {
      id: response.data.id || "",
      name: response.data.name || "",
      webViewLink: response.data.webViewLink || "",
    };
  }

  /**
   * Sube un archivo a Google Drive
   */
  async uploadFile(
    fileBuffer: Buffer,
    metadata: FileMetadata
  ): Promise<UploadResult> {
    const { Readable } = await import("stream");

    const response = await this.drive.files.create({
      requestBody: {
        name: metadata.name,
        mimeType: metadata.mimeType,
        parents: metadata.parents,
        description: metadata.description,
      },
      media: {
        mimeType: metadata.mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: "id, name, mimeType, webViewLink, webContentLink, size",
    });

    return {
      id: response.data.id || "",
      name: response.data.name || "",
      mimeType: response.data.mimeType || "",
      webViewLink: response.data.webViewLink || "",
      webContentLink: response.data.webContentLink || "",
      size: response.data.size || "0",
    };
  }

  /**
   * Descarga un archivo de Google Drive
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" }
    );

    return Buffer.from(response.data as ArrayBuffer);
  }

  /**
   * Obtiene metadatos de un archivo
   */
  async getFileMetadata(fileId: string): Promise<any> {
    const response = await this.drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents",
    });

    return response.data;
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(
    folderId: string,
    pageSize: number = 100
  ): Promise<{ files: any[]; nextPageToken?: string }> {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize,
      fields: "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)",
    });

    return {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }

  /**
   * Mueve un archivo a otra carpeta
   */
  async moveFile(fileId: string, newParentId: string): Promise<void> {
    // Obtener padres actuales
    const file = await this.drive.files.get({
      fileId,
      fields: "parents",
    });

    const previousParents = (file.data.parents || []).join(",");

    // Mover el archivo
    await this.drive.files.update({
      fileId,
      addParents: newParentId,
      removeParents: previousParents,
      fields: "id, parents",
    });
  }

  /**
   * Crea la estructura de carpetas para un expediente
   */
  async createCaseFolderStructure(
    caseCode: string,
    folderNames: string[],
    rootFolderId: string
  ): Promise<{ caseFolder: FolderResult; subFolders: Record<string, FolderResult> }> {
    // Crear carpeta principal del caso
    const caseFolder = await this.createFolder(
      caseCode,
      rootFolderId,
      `Expediente ${caseCode}`
    );

    // Crear subcarpetas
    const subFolders: Record<string, FolderResult> = {};

    for (const folderName of folderNames) {
      const folder = await this.createFolder(folderName, caseFolder.id);
      subFolders[folderName] = folder;
    }

    return { caseFolder, subFolders };
  }

  /**
   * Genera URL de autorización OAuth
   */
  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });
  }

  /**
   * Intercambia código de autorización por tokens
   */
  async getTokensFromCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);

    return {
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || "",
      expiryDate: tokens.expiry_date || 0,
    };
  }
}

// Singleton instance
let driveServiceInstance: GoogleDriveService | null = null;

export function getGoogleDriveService(): GoogleDriveService {
  if (!driveServiceInstance) {
    driveServiceInstance = new GoogleDriveService();
  }
  return driveServiceInstance;
}

// Helper para verificar si Google Drive está configurado
export async function isDriveConfigured(): Promise<boolean> {
  const service = getGoogleDriveService();
  return service.isConfigured();
}
