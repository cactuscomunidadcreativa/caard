/**
 * CAARD - Servicio de Plantillas de Notificación
 * Gestiona la obtención y renderizado de plantillas
 */

import { prisma } from "@/lib/prisma";

// Variables de plantilla
export interface TemplateVariables {
  // Caso
  caseNumber?: string;
  caseName?: string;
  caseId?: string;

  // Partes
  partyName?: string;
  claimantName?: string;
  respondentName?: string;
  arbitratorName?: string;
  lawyerName?: string;

  // Documentos
  documentName?: string;
  documentType?: string;

  // Fechas y plazos
  deadlineDate?: string;
  hearingDate?: string;
  hearingTime?: string;
  laudoDate?: string;
  daysRemaining?: string | number;
  today?: string;

  // Ubicación
  hearingLocation?: string;

  // Pagos
  amount?: string;
  paymentConcept?: string;

  // Centro
  centerName?: string;
  secretaryName?: string;

  // Rechazo
  rejectionReason?: string;

  // Cualquier otra variable personalizada
  [key: string]: string | number | undefined;
}

// Resultado de plantilla renderizada
export interface RenderedTemplate {
  emailSubject?: string;
  emailBody?: string;
  emailHtmlBody?: string;
  smsBody?: string;
  whatsappBody?: string;
}

// Tipo de plantilla
export type TemplateType =
  | "TRASLADO"
  | "NOTIFICACION_ADMISION"
  | "NOTIFICACION_RECHAZO"
  | "NOTIFICACION_AUDIENCIA"
  | "NOTIFICACION_LAUDO"
  | "RECORDATORIO_PLAZO"
  | "REQUERIMIENTO_PAGO"
  | "DESIGNACION_ARBITRO"
  | "SUSPENSION_CASO"
  | "CIERRE_CASO"
  | "OTP"
  | "WELCOME"
  | "GENERAL";

/**
 * Obtiene una plantilla por tipo y código
 */
export async function getTemplate(
  type: TemplateType,
  centerId?: string | null,
  code?: string
): Promise<any | null> {
  try {
    // Primero buscar plantilla específica del centro
    if (centerId) {
      const centerTemplate = await prisma.notificationTemplate.findFirst({
        where: {
          centerId,
          type,
          ...(code && { code }),
          isActive: true,
        },
      });

      if (centerTemplate) {
        return centerTemplate;
      }
    }

    // Si no hay plantilla del centro, buscar plantilla por defecto
    const defaultTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        centerId: null,
        isDefault: true,
        type,
        ...(code && { code }),
        isActive: true,
      },
    });

    return defaultTemplate;
  } catch (error) {
    console.error("Error getting template:", error);
    return null;
  }
}

/**
 * Renderiza una plantilla con las variables proporcionadas
 */
export function renderTemplate(
  template: any,
  variables: TemplateVariables
): RenderedTemplate {
  // Agregar fecha actual si no está presente
  const vars = {
    ...variables,
    today: variables.today || new Date().toLocaleDateString("es-PE"),
  };

  return {
    emailSubject: replaceVariables(template.emailSubject, vars),
    emailBody: replaceVariables(template.emailBody, vars),
    emailHtmlBody: replaceVariables(template.emailHtmlBody, vars),
    smsBody: replaceVariables(template.smsBody, vars),
    whatsappBody: replaceVariables(template.whatsappBody, vars),
  };
}

/**
 * Reemplaza las variables en un texto
 */
function replaceVariables(text: string | null | undefined, variables: TemplateVariables): string | undefined {
  if (!text) return undefined;

  let result = text;

  // Reemplazar todas las variables encontradas
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, String(value));
    }
  });

  // Eliminar variables no reemplazadas (dejarlas vacías)
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  return result;
}

/**
 * Obtiene y renderiza una plantilla en un solo paso
 */
export async function getRenderedTemplate(
  type: TemplateType,
  variables: TemplateVariables,
  centerId?: string | null,
  code?: string
): Promise<RenderedTemplate | null> {
  const template = await getTemplate(type, centerId, code);

  if (!template) {
    // Retornar plantilla por defecto genérica si no hay ninguna
    return getDefaultTemplate(type, variables);
  }

  return renderTemplate(template, variables);
}

/**
 * Genera plantilla por defecto si no hay ninguna en la BD
 */
function getDefaultTemplate(type: TemplateType, variables: TemplateVariables): RenderedTemplate {
  const centerName = variables.centerName || "CAARD";
  const caseNumber = variables.caseNumber || "";
  const partyName = variables.partyName || "Estimado/a usuario";

  const defaults: Record<TemplateType, RenderedTemplate> = {
    TRASLADO: {
      emailSubject: `Traslado de Solicitud - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nSe le notifica el traslado de documentos en el expediente ${caseNumber}.\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Traslado de documentos en expediente ${caseNumber}. Revise su correo.`,
      whatsappBody: `*${centerName}*\n\nSe le notifica el traslado de documentos en el expediente *${caseNumber}*.\n\nPor favor revise su correo electrónico para más detalles.`,
    },
    NOTIFICACION_ADMISION: {
      emailSubject: `Admisión de Solicitud - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nSu solicitud de arbitraje ha sido ADMITIDA.\n\nExpediente: ${caseNumber}\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Solicitud ADMITIDA. Expediente ${caseNumber}`,
      whatsappBody: `*${centerName}*\n\nSu solicitud de arbitraje ha sido *ADMITIDA*.\n\nExpediente: *${caseNumber}*`,
    },
    NOTIFICACION_RECHAZO: {
      emailSubject: `Resolución de Solicitud - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nLamentamos informarle que su solicitud ha sido rechazada.\n\nExpediente: ${caseNumber}\nMotivo: ${variables.rejectionReason || "Ver detalles en el sistema"}\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Solicitud no admitida. Expediente ${caseNumber}. Ver detalles en correo.`,
      whatsappBody: `*${centerName}*\n\nSu solicitud no ha sido admitida.\n\nExpediente: *${caseNumber}*\n\nPor favor revise su correo para más detalles.`,
    },
    NOTIFICACION_AUDIENCIA: {
      emailSubject: `Citación a Audiencia - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nSe le cita a audiencia:\n\nExpediente: ${caseNumber}\nFecha: ${variables.hearingDate || "Por confirmar"}\nHora: ${variables.hearingTime || "Por confirmar"}\nLugar: ${variables.hearingLocation || "Por confirmar"}\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Audiencia ${variables.hearingDate || ""} ${variables.hearingTime || ""}. Exp ${caseNumber}`,
      whatsappBody: `*${centerName}*\n\n*CITACIÓN A AUDIENCIA*\n\nExpediente: *${caseNumber}*\nFecha: ${variables.hearingDate || "Por confirmar"}\nHora: ${variables.hearingTime || "Por confirmar"}\nLugar: ${variables.hearingLocation || "Por confirmar"}`,
    },
    NOTIFICACION_LAUDO: {
      emailSubject: `Notificación de Laudo - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nSe le notifica que se ha emitido el LAUDO en el expediente ${caseNumber}.\n\nPuede consultar el documento en el sistema.\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: LAUDO emitido. Expediente ${caseNumber}. Ver sistema.`,
      whatsappBody: `*${centerName}*\n\nSe ha emitido el *LAUDO* en el expediente *${caseNumber}*.\n\nPuede consultar el documento en el sistema.`,
    },
    RECORDATORIO_PLAZO: {
      emailSubject: `Recordatorio de Plazo - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nLe recordamos que tiene un plazo próximo a vencer:\n\nExpediente: ${caseNumber}\nActo: ${variables.documentName || "Pendiente"}\nFecha límite: ${variables.deadlineDate || "Próximamente"}\nDías restantes: ${variables.daysRemaining || "Pocos"}\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Plazo vence ${variables.deadlineDate || "pronto"}. Exp ${caseNumber}`,
      whatsappBody: `*${centerName}*\n\n⚠️ *RECORDATORIO DE PLAZO*\n\nExpediente: *${caseNumber}*\nFecha límite: ${variables.deadlineDate || "Próximamente"}\nDías restantes: ${variables.daysRemaining || "Pocos"}`,
    },
    REQUERIMIENTO_PAGO: {
      emailSubject: `Requerimiento de Pago - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nSe le requiere el pago de gastos arbitrales:\n\nExpediente: ${caseNumber}\nConcepto: ${variables.paymentConcept || "Gastos arbitrales"}\nMonto: ${variables.amount || "Ver detalle en sistema"}\nFecha límite: ${variables.deadlineDate || "Próximamente"}\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Pago pendiente ${variables.amount || ""}. Exp ${caseNumber}. Vence ${variables.deadlineDate || "pronto"}`,
      whatsappBody: `*${centerName}*\n\n💰 *REQUERIMIENTO DE PAGO*\n\nExpediente: *${caseNumber}*\nMonto: ${variables.amount || "Ver detalle"}\nFecha límite: ${variables.deadlineDate || "Próximamente"}`,
    },
    DESIGNACION_ARBITRO: {
      emailSubject: `Designación de Árbitro - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nSe le informa que se ha designado al árbitro para su caso:\n\nExpediente: ${caseNumber}\nÁrbitro: ${variables.arbitratorName || "Por confirmar"}\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Árbitro designado para exp ${caseNumber}`,
      whatsappBody: `*${centerName}*\n\nSe ha designado árbitro para el expediente *${caseNumber}*.\n\nÁrbitro: ${variables.arbitratorName || "Ver sistema"}`,
    },
    SUSPENSION_CASO: {
      emailSubject: `Suspensión de Procedimiento - Expediente ${caseNumber}`,
      emailBody: `${partyName},\n\nSe le informa que el procedimiento arbitral ha sido SUSPENDIDO.\n\nExpediente: ${caseNumber}\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Procedimiento SUSPENDIDO. Exp ${caseNumber}`,
      whatsappBody: `*${centerName}*\n\nEl procedimiento arbitral ha sido *SUSPENDIDO*.\n\nExpediente: *${caseNumber}*`,
    },
    CIERRE_CASO: {
      emailSubject: `Cierre de Expediente - ${caseNumber}`,
      emailBody: `${partyName},\n\nSe le informa que el expediente ${caseNumber} ha sido CERRADO.\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Expediente ${caseNumber} CERRADO`,
      whatsappBody: `*${centerName}*\n\nEl expediente *${caseNumber}* ha sido *CERRADO*.`,
    },
    OTP: {
      emailSubject: `Código de Verificación - ${centerName}`,
      emailBody: `Su código de verificación es: ${variables.code || "******"}\n\nVálido por 5 minutos.\n\nSi no solicitó este código, ignore este mensaje.`,
      smsBody: `${centerName}: Su código es ${variables.code || "******"}. Válido 5 min.`,
      whatsappBody: `*${centerName}*\n\nSu código de verificación es: *${variables.code || "******"}*\n\nVálido por 5 minutos.`,
    },
    WELCOME: {
      emailSubject: `Bienvenido a ${centerName}`,
      emailBody: `${partyName},\n\nBienvenido al sistema de arbitraje de ${centerName}.\n\nYa puede acceder a la plataforma con su correo electrónico.\n\nAtentamente,\n${centerName}`,
      smsBody: `Bienvenido a ${centerName}. Ya puede acceder al sistema.`,
      whatsappBody: `*${centerName}*\n\n¡Bienvenido!\n\nYa puede acceder al sistema de arbitraje.`,
    },
    GENERAL: {
      emailSubject: `Notificación - ${centerName}`,
      emailBody: `${partyName},\n\nTiene una nueva notificación en el sistema.\n\nAtentamente,\n${centerName}`,
      smsBody: `${centerName}: Nueva notificación. Ver sistema.`,
      whatsappBody: `*${centerName}*\n\nTiene una nueva notificación en el sistema.`,
    },
  };

  return defaults[type] || defaults.GENERAL;
}

/**
 * Crea las plantillas por defecto del sistema
 */
export async function seedDefaultTemplates(): Promise<number> {
  const defaultTemplates = [
    {
      code: "TRASLADO_DEMANDA",
      name: "Traslado de demanda",
      type: "TRASLADO",
      emailSubject: "Traslado de Solicitud de Arbitraje - Expediente {{caseNumber}}",
      emailBody: `Estimado/a {{respondentName}},

Por medio de la presente, le notificamos que se ha presentado una solicitud de arbitraje en su contra por parte de {{claimantName}}.

EXPEDIENTE: {{caseNumber}}
MATERIA: {{caseName}}

De conformidad con el Reglamento de Arbitraje, tiene un plazo de 15 días hábiles contados a partir de la recepción de la presente notificación para presentar su contestación.

Se adjunta copia de la solicitud de arbitraje y sus anexos.

Atentamente,
{{secretaryName}}
Secretaría Arbitral
{{centerName}}`,
      smsBody: "{{centerName}}: Traslado de demanda en exp. {{caseNumber}}. Plazo 15 días. Ver email.",
      whatsappBody: `*{{centerName}}*

📋 *TRASLADO DE DEMANDA*

Se ha presentado solicitud de arbitraje en su contra.

Expediente: *{{caseNumber}}*
Demandante: {{claimantName}}

Plazo para contestar: 15 días hábiles.

Revise su correo para más detalles.`,
      isDefault: true,
      isActive: true,
    },
    {
      code: "ADMISION_SOLICITUD",
      name: "Admisión de solicitud",
      type: "NOTIFICACION_ADMISION",
      emailSubject: "Admisión de Solicitud de Arbitraje - Expediente {{caseNumber}}",
      emailBody: `Estimado/a {{partyName}},

Nos es grato comunicarle que la solicitud de arbitraje presentada en el expediente {{caseNumber}} ha sido ADMITIDA.

EXPEDIENTE: {{caseNumber}}
MATERIA: {{caseName}}

Próximos pasos:
1. Se procederá con la designación del/los árbitro(s)
2. Se le notificará oportunamente sobre el calendario procesal

Para cualquier consulta, puede comunicarse con nuestra Secretaría Arbitral.

Atentamente,
{{secretaryName}}
Secretaría Arbitral
{{centerName}}`,
      smsBody: "{{centerName}}: Solicitud ADMITIDA. Exp. {{caseNumber}}",
      whatsappBody: `*{{centerName}}*

✅ *SOLICITUD ADMITIDA*

Su solicitud de arbitraje ha sido admitida.

Expediente: *{{caseNumber}}*

Próximamente se le notificará sobre la designación del árbitro.`,
      isDefault: true,
      isActive: true,
    },
    {
      code: "CITACION_AUDIENCIA",
      name: "Citación a audiencia",
      type: "NOTIFICACION_AUDIENCIA",
      emailSubject: "Citación a Audiencia - Expediente {{caseNumber}}",
      emailBody: `Estimado/a {{partyName}},

Se le cita a la AUDIENCIA programada para el expediente {{caseNumber}}:

FECHA: {{hearingDate}}
HORA: {{hearingTime}}
LUGAR: {{hearingLocation}}

IMPORTANTE:
- Se ruega puntualidad
- Traer documento de identidad vigente
- El abogado deberá acreditar su representación si no lo ha hecho previamente

La inasistencia injustificada será sancionada conforme al Reglamento.

Atentamente,
{{secretaryName}}
Secretaría Arbitral
{{centerName}}`,
      smsBody: "{{centerName}}: Audiencia {{hearingDate}} {{hearingTime}}. Exp. {{caseNumber}}",
      whatsappBody: `*{{centerName}}*

🗓️ *CITACIÓN A AUDIENCIA*

Expediente: *{{caseNumber}}*
Fecha: *{{hearingDate}}*
Hora: *{{hearingTime}}*
Lugar: {{hearingLocation}}

La inasistencia será sancionada.`,
      isDefault: true,
      isActive: true,
    },
    {
      code: "RECORDATORIO_PLAZO",
      name: "Recordatorio de plazo",
      type: "RECORDATORIO_PLAZO",
      emailSubject: "⚠️ Recordatorio: Plazo próximo a vencer - Expediente {{caseNumber}}",
      emailBody: `Estimado/a {{partyName}},

Le recordamos que tiene un plazo que vence próximamente:

EXPEDIENTE: {{caseNumber}}
MATERIA: {{caseName}}
ACTO PROCESAL: {{documentName}}
FECHA LÍMITE: {{deadlineDate}}
DÍAS RESTANTES: {{daysRemaining}}

Le instamos a cumplir con el plazo establecido para evitar consecuencias procesales.

Atentamente,
{{secretaryName}}
Secretaría Arbitral
{{centerName}}`,
      smsBody: "{{centerName}}: Plazo vence {{deadlineDate}}. Exp. {{caseNumber}}. {{daysRemaining}} días.",
      whatsappBody: `*{{centerName}}*

⚠️ *RECORDATORIO DE PLAZO*

Expediente: *{{caseNumber}}*
Acto: {{documentName}}
Vence: *{{deadlineDate}}*
Días restantes: *{{daysRemaining}}*

Cumpla con el plazo para evitar consecuencias.`,
      isDefault: true,
      isActive: true,
    },
    {
      code: "REQUERIMIENTO_PAGO",
      name: "Requerimiento de pago",
      type: "REQUERIMIENTO_PAGO",
      emailSubject: "Requerimiento de Pago - Expediente {{caseNumber}}",
      emailBody: `Estimado/a {{partyName}},

Por medio de la presente, le requerimos el pago de los gastos arbitrales correspondientes al expediente {{caseNumber}}:

EXPEDIENTE: {{caseNumber}}
CONCEPTO: {{paymentConcept}}
MONTO: {{amount}}
FECHA LÍMITE: {{deadlineDate}}

El incumplimiento en el pago puede resultar en la suspensión del procedimiento arbitral.

Formas de pago:
- Transferencia bancaria (ver datos en el sistema)
- Depósito en cuenta
- Pago en línea a través de la plataforma

Atentamente,
{{secretaryName}}
Secretaría Arbitral
{{centerName}}`,
      smsBody: "{{centerName}}: Pago {{amount}} vence {{deadlineDate}}. Exp. {{caseNumber}}",
      whatsappBody: `*{{centerName}}*

💰 *REQUERIMIENTO DE PAGO*

Expediente: *{{caseNumber}}*
Monto: *{{amount}}*
Vence: *{{deadlineDate}}*

El incumplimiento puede suspender el procedimiento.`,
      isDefault: true,
      isActive: true,
    },
  ];

  let created = 0;

  for (const template of defaultTemplates) {
    try {
      await prisma.notificationTemplate.upsert({
        where: {
          centerId_code: {
            centerId: null as any,
            code: template.code,
          },
        },
        update: {},
        create: {
          ...template,
          centerId: null,
          availableVariables: getVariablesForType(template.type),
        },
      });
      created++;
    } catch (error) {
      // Ignorar errores de duplicados
      console.log(`Template ${template.code} already exists or error:`, error);
    }
  }

  return created;
}

function getVariablesForType(type: string): string[] {
  const common = ["{{caseNumber}}", "{{caseName}}", "{{partyName}}", "{{centerName}}", "{{secretaryName}}", "{{today}}"];

  const typeVars: Record<string, string[]> = {
    TRASLADO: [...common, "{{claimantName}}", "{{respondentName}}", "{{documentName}}"],
    NOTIFICACION_ADMISION: [...common, "{{claimantName}}", "{{respondentName}}"],
    NOTIFICACION_AUDIENCIA: [...common, "{{hearingDate}}", "{{hearingTime}}", "{{hearingLocation}}"],
    RECORDATORIO_PLAZO: [...common, "{{deadlineDate}}", "{{daysRemaining}}", "{{documentName}}"],
    REQUERIMIENTO_PAGO: [...common, "{{amount}}", "{{deadlineDate}}", "{{paymentConcept}}"],
  };

  return typeVars[type] || common;
}
