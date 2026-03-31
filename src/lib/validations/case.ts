/**
 * CAARD - Esquemas de validación para Expedientes
 */

import { z } from "zod";

// Validación de teléfono peruano E.164
const phoneRegex = /^\+51[0-9]{9}$/;

// Esquema para participante (demandante/demandado)
export const participantSchema = z.object({
  type: z.enum(["PERSONA_NATURAL", "PERSONA_JURIDICA"]),
  // Persona natural
  nombres: z.string().optional(),
  apellidos: z.string().optional(),
  // Persona jurídica
  razonSocial: z.string().optional(),
  representanteLegal: z.string().optional(),
  // Común
  tipoDocumento: z.enum(["DNI", "CE", "RUC", "PASAPORTE"]),
  numeroDocumento: z.string().min(8, "Documento inválido").max(20),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

export type ParticipantInput = z.infer<typeof participantSchema>;

// Esquema principal para crear expediente
export const createCaseSchema = z.object({
  // Tipo de arbitraje
  arbitrationTypeId: z.string().min(1, "Seleccione tipo de arbitraje"),

  // Información del caso
  title: z.string().min(10, "El título debe tener al menos 10 caracteres").max(200),
  description: z.string().optional(),

  // Cuantía
  hasDefinedAmount: z.boolean(),
  claimAmount: z.number().positive("Monto debe ser positivo").optional(),
  currency: z.enum(["PEN", "USD"]),

  // Materia
  subject: z.string().optional(),

  // Pretensiones
  claims: z.string().optional(),

  // Demandante
  claimant: participantSchema,

  // Demandado
  respondent: participantSchema,

  // Contrato base
  contractDate: z.string().optional(),
  contractDescription: z.string().optional(),

  // Cláusula arbitral
  hasArbitrationClause: z.boolean(),
  arbitrationClauseDescription: z.string().optional(),

  // Aceptación de términos
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos y condiciones",
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar la política de privacidad",
  }),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

// Esquema para actualizar expediente
export const updateCaseSchema = createCaseSchema.partial().omit({
  acceptTerms: true,
  acceptPrivacy: true,
});

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

// Esquema para filtros de búsqueda
export const caseFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  arbitrationTypeId: z.string().optional(),
  year: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export type CaseFilters = z.infer<typeof caseFiltersSchema>;

// Esquema simplificado para creación rápida desde admin/secretaría
export const quickCreateCaseSchema = z.object({
  arbitrationTypeId: z.string().min(1, "Seleccione tipo de arbitraje"),
  title: z.string().min(5, "Título requerido").max(300),
  claimantName: z.string().min(2, "Nombre del demandante requerido"),
  claimantEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  respondentName: z.string().min(2, "Nombre del demandado requerido"),
  respondentEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  currency: z.enum(["PEN", "USD"]).default("PEN"),
  disputeAmount: z.number().positive().optional(),
  tribunalMode: z.enum(["SOLE_ARBITRATOR", "TRIBUNAL_3"]).default("TRIBUNAL_3"),
});

export type QuickCreateCaseInput = z.infer<typeof quickCreateCaseSchema>;
